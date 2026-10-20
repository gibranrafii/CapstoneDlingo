const db = require('../config/db');

const STATUSES = ['menunggu', 'dikonfirmasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Apakah order ini boleh diakses user? (pembeli: milik sendiri, petani: memuat produknya, admin: semua)
const canAccess = async (user, order) => {
  if (user.role === 'admin') return true;
  if (user.role === 'pembeli') {
    const [rows] = await db.query('SELECT id_pembeli FROM pembeli WHERE id_user = ?', [user.id]);
    return rows.length > 0 && rows[0].id_pembeli === order.id_pembeli;
  }
  const [rows] = await db.query(
    `SELECT 1 FROM detail_pesanan dp JOIN product pr ON dp.id_produk = pr.id_produk
     WHERE dp.id_pesanan = ? AND pr.id_user = ? LIMIT 1`,
    [order.id_pesanan, user.id]
  );
  return rows.length > 0;
};

// GET /api/orders?status=
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT DISTINCT ps.*, pb.nama_pembeli, pb.no_telepon_pembeli
      FROM pesanan ps
      JOIN pembeli pb ON ps.id_pembeli = pb.id_pembeli
    `;
    const where = [];
    const params = [];

    if (req.user.role === 'pembeli') {
      where.push('pb.id_user = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'petani') {
      query += ' JOIN detail_pesanan dp ON dp.id_pesanan = ps.id_pesanan JOIN product pr ON dp.id_produk = pr.id_produk';
      where.push('pr.id_user = ?');
      params.push(req.user.id);
    }
    if (status) {
      where.push('ps.status = ?');
      params.push(status);
    }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY ps.tanggal_pesan DESC';

    const [orders] = await db.query(query, params);
    return res.status(200).json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    console.error('GetOrders error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/orders/:id - termasuk info pembayaran petani (FR-07)
const getOrderById = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT ps.*, pb.nama_pembeli, pb.no_telepon_pembeli, pb.email_pembeli
       FROM pesanan ps JOIN pembeli pb ON ps.id_pembeli = pb.id_pembeli
       WHERE ps.id_pesanan = ?`,
      [req.params.id]
    );
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }
    const order = orders[0];

    if (!(await canAccess(req.user, order))) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const [items] = await db.query(
      `SELECT dp.*, pr.nama_produk, pr.gambar, pr.satuan,
              u.nama AS nama_petani, u.no_rekening, u.nama_bank, u.no_telepon AS telepon_petani
       FROM detail_pesanan dp
       JOIN product pr ON dp.id_produk = pr.id_produk
       JOIN \`user\` u ON pr.id_user = u.id_user
       WHERE dp.id_pesanan = ?`,
      [order.id_pesanan]
    );
    order.items = items;

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('GetOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/orders
// pembeli: memesan untuk dirinya. petani/admin ("Tambah Pesanan"): wajib kirim id_pembeli.
const createOrder = async (req, res) => {
  const { items, alamat_kirim, alamat_pengiriman, catatan, id_pembeli: bodyPembeli } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Daftar item pesanan kosong.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let id_pembeli;
    if (req.user.role === 'pembeli') {
      const [rows] = await conn.query('SELECT id_pembeli, alamat_pembeli FROM pembeli WHERE id_user = ?', [req.user.id]);
      if (rows.length === 0) throw new HttpError(400, 'Data pembeli tidak ditemukan.');
      id_pembeli = rows[0].id_pembeli;
    } else {
      if (!bodyPembeli) throw new HttpError(400, 'id_pembeli wajib diisi.');
      const [rows] = await conn.query('SELECT id_pembeli FROM pembeli WHERE id_pembeli = ?', [bodyPembeli]);
      if (rows.length === 0) throw new HttpError(404, 'Pembeli tidak ditemukan.');
      id_pembeli = rows[0].id_pembeli;
    }

    // Gabungkan item duplikat agar PK (id_pesanan, id_produk) tidak bentrok
    const qty = new Map();
    for (const it of items) {
      const jumlah = parseInt(it.jumlah);
      if (!it.id_produk || !(jumlah > 0)) throw new HttpError(400, 'Setiap item butuh id_produk dan jumlah > 0.');
      qty.set(Number(it.id_produk), (qty.get(Number(it.id_produk)) || 0) + jumlah);
    }

    let totalHarga = 0;
    const lines = [];
    for (const [id_produk, jumlah] of qty) {
      const [products] = await conn.query('SELECT * FROM product WHERE id_produk = ? FOR UPDATE', [id_produk]);
      if (products.length === 0) throw new HttpError(400, `Produk ID ${id_produk} tidak ditemukan.`);
      const product = products[0];
      if (req.user.role === 'petani' && product.id_user !== req.user.id) {
        throw new HttpError(403, `Produk "${product.nama_produk}" bukan milik Anda.`);
      }
      if (product.stok < jumlah) {
        throw new HttpError(400, `Stok produk "${product.nama_produk}" tidak mencukupi. Tersedia: ${product.stok}`);
      }
      const subtotal = Number(product.harga) * jumlah;
      totalHarga += subtotal;
      lines.push({ id_produk, jumlah, harga_satuan: product.harga, subtotal });
    }

    const [orderResult] = await conn.query(
      'INSERT INTO pesanan (id_pembeli, total_harga, alamat_kirim, catatan, status) VALUES (?, ?, ?, ?, ?)',
      [id_pembeli, totalHarga, alamat_kirim || alamat_pengiriman || null, catatan || null, 'menunggu']
    );
    const id_pesanan = orderResult.insertId;

    for (const l of lines) {
      await conn.query(
        'INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)',
        [id_pesanan, l.id_produk, l.jumlah, l.harga_satuan, l.subtotal]
      );
      await conn.query('UPDATE product SET stok = stok - ? WHERE id_produk = ?', [l.jumlah, l.id_produk]);
    }

    await conn.commit();
    return res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat!', id_pesanan, total_harga: totalHarga });
  } catch (error) {
    await conn.rollback();
    if (error instanceof HttpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('CreateOrder error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  } finally {
    conn.release();
  }
};

// PUT /api/orders/:id/status - petani (pesanan produknya) atau admin
// Pembatalan mengembalikan stok; pesanan selesai/dibatalkan tidak bisa diubah lagi.
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Status tidak valid. Pilihan: ${STATUSES.join(', ')}.` });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query('SELECT * FROM pesanan WHERE id_pesanan = ? FOR UPDATE', [req.params.id]);
    if (orders.length === 0) throw new HttpError(404, 'Pesanan tidak ditemukan.');
    const order = orders[0];

    if (!(await canAccess(req.user, order))) throw new HttpError(403, 'Akses ditolak.');
    if (['selesai', 'dibatalkan'].includes(order.status)) {
      throw new HttpError(400, `Pesanan sudah ${order.status} dan tidak dapat diubah.`);
    }

    if (status === 'dibatalkan') {
      await conn.query(
        `UPDATE product pr JOIN detail_pesanan dp ON dp.id_produk = pr.id_produk
         SET pr.stok = pr.stok + dp.jumlah WHERE dp.id_pesanan = ?`,
        [order.id_pesanan]
      );
    }
    await conn.query('UPDATE pesanan SET status = ? WHERE id_pesanan = ?', [status, order.id_pesanan]);

    await conn.commit();
    return res.status(200).json({ success: true, message: `Status pesanan diperbarui menjadi "${status}".` });
  } catch (error) {
    await conn.rollback();
    if (error instanceof HttpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('UpdateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  } finally {
    conn.release();
  }
};

module.exports = { getOrders, getOrderById, createOrder, updateOrderStatus };
