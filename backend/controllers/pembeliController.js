const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/pembeli?search= - petani/admin (menu Pembeli)
const getAllPembeli = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT pb.*, u.username,
             (SELECT COUNT(*) FROM pesanan ps WHERE ps.id_pembeli = pb.id_pembeli) AS total_pesanan
      FROM pembeli pb JOIN \`user\` u ON pb.id_user = u.id_user
    `;
    const params = [];
    if (search) {
      query += ' WHERE pb.nama_pembeli LIKE ? OR pb.email_pembeli LIKE ? OR pb.no_telepon_pembeli LIKE ?';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    query += ' ORDER BY pb.created_at DESC';
    const [rows] = await db.query(query, params);
    return res.status(200).json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('GetAllPembeli error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/pembeli/:id
const getPembeliById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT pb.*, u.username FROM pembeli pb JOIN `user` u ON pb.id_user = u.id_user WHERE pb.id_pembeli = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pembeli tidak ditemukan.' });
    }
    const [orders] = await db.query(
      'SELECT id_pesanan, tanggal_pesan, total_harga, status FROM pesanan WHERE id_pembeli = ? ORDER BY tanggal_pesan DESC',
      [req.params.id]
    );
    rows[0].pesanan = orders;
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('GetPembeliById error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/pembeli - tambah pembeli sekaligus akun loginnya
const createPembeli = async (req, res) => {
  const { username, password, nama_pembeli, alamat_pembeli, no_telepon_pembeli, email_pembeli } = req.body;
  if (!username || !password || !nama_pembeli || !email_pembeli) {
    return res.status(400).json({ success: false, message: 'Username, password, nama, dan email wajib diisi.' });
  }

  const conn = await db.getConnection();
  try {
    const [existing] = await conn.query('SELECT id_user FROM `user` WHERE email = ? OR username = ?', [email_pembeli, username]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email atau username sudah digunakan.' });
    }

    await conn.beginTransaction();
    const [u] = await conn.query(
      'INSERT INTO `user` (username, password, nama, email, no_telepon, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, await bcrypt.hash(password, 10), nama_pembeli, email_pembeli, no_telepon_pembeli || null, 'pembeli']
    );
    const [p] = await conn.query(
      'INSERT INTO pembeli (id_user, nama_pembeli, alamat_pembeli, no_telepon_pembeli, email_pembeli) VALUES (?, ?, ?, ?, ?)',
      [u.insertId, nama_pembeli, alamat_pembeli || null, no_telepon_pembeli || null, email_pembeli]
    );
    await conn.commit();
    return res.status(201).json({ success: true, message: 'Pembeli berhasil ditambahkan.', id: p.insertId });
  } catch (error) {
    await conn.rollback();
    console.error('CreatePembeli error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  } finally {
    conn.release();
  }
};

// PUT /api/pembeli/:id
const updatePembeli = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pembeli WHERE id_pembeli = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pembeli tidak ditemukan.' });
    }
    const cur = rows[0];
    const { nama_pembeli, alamat_pembeli, no_telepon_pembeli, email_pembeli } = req.body;

    await db.query(
      'UPDATE pembeli SET nama_pembeli = ?, alamat_pembeli = ?, no_telepon_pembeli = ?, email_pembeli = ? WHERE id_pembeli = ?',
      [nama_pembeli || cur.nama_pembeli, alamat_pembeli ?? cur.alamat_pembeli,
       no_telepon_pembeli ?? cur.no_telepon_pembeli, email_pembeli || cur.email_pembeli, req.params.id]
    );
    return res.status(200).json({ success: true, message: 'Data pembeli berhasil diperbarui.' });
  } catch (error) {
    console.error('UpdatePembeli error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/pembeli/:id - hanya jika belum punya pesanan (FK pesanan tanpa cascade)
const deletePembeli = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_user FROM pembeli WHERE id_pembeli = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pembeli tidak ditemukan.' });
    }
    const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM pesanan WHERE id_pembeli = ?', [req.params.id]);
    if (n > 0) {
      return res.status(409).json({ success: false, message: 'Pembeli memiliki riwayat pesanan dan tidak dapat dihapus.' });
    }
    // Hapus akun user; baris pembeli ikut terhapus (ON DELETE CASCADE)
    await db.query('DELETE FROM `user` WHERE id_user = ?', [rows[0].id_user]);
    return res.status(200).json({ success: true, message: 'Pembeli berhasil dihapus.' });
  } catch (error) {
    console.error('DeletePembeli error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getAllPembeli, getPembeliById, createPembeli, updatePembeli, deletePembeli };
