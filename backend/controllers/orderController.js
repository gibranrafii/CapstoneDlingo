const db = require('../config/db');

// GET /api/orders - get orders based on role
const getOrders = async (req, res) => {
  try {
    let query = `
      SELECT 
        ps.*,
        pb.nama_pembeli, pb.no_telepon_pembeli, pb.email_pembeli,
        u.nama AS nama_user
      FROM pesanan ps
      JOIN pembeli pb ON ps.id_pembeli = pb.id_pembeli
      JOIN users u ON pb.id_user = u.id_user
    `;
    const params = [];

    if (req.user.role === 'pembeli') {
      const [pembeli] = await db.query('SELECT id_pembeli FROM pembeli WHERE id_user = ?', [req.user.id]);
      if (pembeli.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }
      query += ` WHERE ps.id_pembeli = ?`;
      params.push(pembeli[0].id_pembeli);
    } else if (req.user.role === 'petani') {
      // Petani sees orders that contain their products
      query = `
        SELECT DISTINCT
          ps.*,
          pb.nama_pembeli, pb.no_telepon_pembeli, pb.email_pembeli,
          u.nama AS nama_user
        FROM pesanan ps
        JOIN pembeli pb ON ps.id_pembeli = pb.id_pembeli
        JOIN users u ON pb.id_user = u.id_user
        JOIN detail_pesanan dp ON ps.id_pesanan = dp.id_pesanan
        JOIN product pr ON dp.id_produk = pr.id_produk
        WHERE pr.id_user = ?
      `;
      params.push(req.user.id);
    }
    // Admin sees all

    query += ` ORDER BY ps.created_at DESC`;
    const [orders] = await db.query(query, params);

    // Fetch order items for each order
    for (let order of orders) {
      const [items] = await db.query(
        `SELECT dp.*, pr.nama_produk, pr.gambar, u.nama AS nama_petani
         FROM detail_pesanan dp
         JOIN product pr ON dp.id_produk = pr.id_produk
         JOIN users u ON pr.id_user = u.id_user
         WHERE dp.id_pesanan = ?`,
        [order.id_pesanan]
      );
      order.items = items;
    }

    return res.status(200).json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    console.error('GetOrders error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT ps.*, pb.nama_pembeli, pb.no_telepon_pembeli, pb.email_pembeli, pb.alamat_pembeli
       FROM pesanan ps
       JOIN pembeli pb ON ps.id_pembeli = pb.id_pembeli
       WHERE ps.id_pesanan = ?`,
      [req.params.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const order = orders[0];

    // Access control
    if (req.user.role === 'pembeli') {
      const [pembeli] = await db.query('SELECT id_pembeli FROM pembeli WHERE id_user = ?', [req.user.id]);
      if (pembeli.length === 0 || pembeli[0].id_pembeli !== order.id_pembeli) {
        return res.status(403).json({ success: false, message: 'Akses ditolak.' });
      }
    }

    const [items] = await db.query(
      `SELECT dp.*, pr.nama_produk, pr.gambar, pr.satuan, u.nama AS nama_petani, u.no_rekening, u.nama_bank, u.no_telepon AS telepon_petani
       FROM detail_pesanan dp
       JOIN product pr ON dp.id_produk = pr.id_produk
       JOIN users u ON pr.id_user = u.id_user
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

// POST /api/orders - pembeli only
const createOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { items, alamat_pengiriman, catatan } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang belanja kosong.' });
    }

    // Get pembeli record
    const [pembeliRows] = await conn.query('SELECT id_pembeli FROM pembeli WHERE id_user = ?', [req.user.id]);
    if (pembeliRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Data pembeli tidak ditemukan.' });
    }
    const id_pembeli = pembeliRows[0].id_pembeli;

    let totalHarga = 0;
    const orderItems = [];

    // Validate items and calculate total
    for (const item of items) {
      const [products] = await conn.query('SELECT * FROM product WHERE id_produk = ?', [item.id_produk]);
      if (products.length === 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Produk ID ${item.id_produk} tidak ditemukan.` });
      }

      const product = products[0];
      if (product.stok < item.jumlah) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Stok produk "${product.nama_produk}" tidak mencukupi. Tersedia: ${product.stok}` });
      }

      const subtotal = product.harga * item.jumlah;
      totalHarga += subtotal;
      orderItems.push({ ...item, harga_satuan: product.harga, subtotal });
    }

    // Create order
    const [orderResult] = await conn.query(
      'INSERT INTO pesanan (id_pembeli, total_harga, alamat_pengiriman, catatan, status) VALUES (?, ?, ?, ?, ?)',
      [id_pembeli, totalHarga, alamat_pengiriman || '', catatan || '', 'pending']
    );
    const id_pesanan = orderResult.insertId;

    // Insert detail items and update stock
    for (const item of orderItems) {
      await conn.query(
        'INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)',
        [id_pesanan, item.id_produk, item.jumlah, item.harga_satuan, item.subtotal]
      );
      await conn.query('UPDATE product SET stok = stok - ? WHERE id_produk = ?', [item.jumlah, item.id_produk]);
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat!',
      id_pesanan,
      total_harga: totalHarga,
    });
  } catch (error) {
    await conn.rollback();
    console.error('CreateOrder error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  } finally {
    conn.release();
  }
};

// PUT /api/orders/:id/status - petani or admin
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'dikonfirmasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    const [orders] = await db.query('SELECT * FROM pesanan WHERE id_pesanan = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    await db.query('UPDATE pesanan SET status = ? WHERE id_pesanan = ?', [status, id]);
    return res.status(200).json({ success: true, message: `Status pesanan diperbarui menjadi "${status}".` });
  } catch (error) {
    console.error('UpdateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getOrders, getOrderById, createOrder, updateOrderStatus };
