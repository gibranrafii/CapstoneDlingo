const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/users - admin only
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id_user, username, nama, email, no_telepon, role, no_rekening, nama_bank, created_at FROM `user` ORDER BY created_at DESC'
    );
    return res.status(200).json({ success: true, data: users, total: users.length });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id_user, username, nama, email, no_telepon, role, no_rekening, nama_bank, created_at FROM `user` WHERE id_user = ?',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, data: users[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/users - admin creates user (especially petani)
const createUser = async (req, res) => {
  try {
    const { username, nama, email, password, no_telepon, role, no_rekening, nama_bank, alamat } = req.body;

    if (!username || !nama || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    }

    if (!['admin', 'petani', 'pembeli'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role harus admin, petani, atau pembeli.' });
    }

    const [existing] = await db.query('SELECT id_user FROM `user` WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email atau username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO `user` (username, password, nama, email, no_telepon, role, no_rekening, nama_bank) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, nama, email, no_telepon || null, role, no_rekening || null, nama_bank || null]
    );

    const newUserId = result.insertId;

    if (role === 'pembeli') {
      await db.query(
        'INSERT INTO pembeli (id_user, nama_pembeli, alamat_pembeli, no_telepon_pembeli, email_pembeli) VALUES (?, ?, ?, ?, ?)',
        [newUserId, nama, alamat || '', no_telepon || '', email]
      );
    }

    return res.status(201).json({ success: true, message: 'User berhasil dibuat.', id: newUserId });
  } catch (error) {
    console.error('CreateUser error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/users/:id - admin only
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, no_telepon, role, no_rekening, nama_bank, password } = req.body;

    const [users] = await db.query('SELECT * FROM `user` WHERE id_user = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    if (role && !['admin', 'petani', 'pembeli'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role harus admin, petani, atau pembeli.' });
    }
    if (email && email !== users[0].email) {
      const [dup] = await db.query('SELECT id_user FROM `user` WHERE email = ? AND id_user <> ?', [email, id]);
      if (dup.length > 0) {
        return res.status(409).json({ success: false, message: 'Email sudah digunakan.' });
      }
    }

    let hashedPassword = users[0].password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await db.query(
      'UPDATE `user` SET nama = ?, email = ?, no_telepon = ?, role = ?, no_rekening = ?, nama_bank = ?, password = ? WHERE id_user = ?',
      [nama || users[0].nama, email || users[0].email, no_telepon || users[0].no_telepon,
       role || users[0].role, no_rekening || users[0].no_rekening, nama_bank || users[0].nama_bank,
       hashedPassword, id]
    );

    return res.status(200).json({ success: true, message: 'User berhasil diperbarui.' });
  } catch (error) {
    console.error('UpdateUser error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/users/:id - admin only
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri.' });
    }

    const [users] = await db.query('SELECT id_user FROM `user` WHERE id_user = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    await db.query('DELETE FROM `user` WHERE id_user = ?', [id]);
    return res.status(200).json({ success: true, message: 'User berhasil dihapus.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ success: false, message: 'User memiliki riwayat pesanan dan tidak dapat dihapus.' });
    }
    console.error('DeleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const stats = {};

    if (req.user.role === 'admin') {
      const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM `user`');
      const [[{ total_petani }]] = await db.query("SELECT COUNT(*) as total_petani FROM `user` WHERE role = 'petani'");
      const [[{ total_pembeli }]] = await db.query("SELECT COUNT(*) as total_pembeli FROM `user` WHERE role = 'pembeli'");
      const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM product');
      const [[{ total_orders }]] = await db.query('SELECT COUNT(*) as total_orders FROM pesanan');
      const [[{ total_revenue }]] = await db.query("SELECT COALESCE(SUM(total_harga), 0) as total_revenue FROM pesanan WHERE status != 'dibatalkan'");
      const [[{ total_ternak }]] = await db.query('SELECT COUNT(*) as total_ternak FROM ternak');
      const [[{ total_pengurus }]] = await db.query('SELECT COUNT(*) as total_pengurus FROM pengurus');

      Object.assign(stats, { total_users, total_petani, total_pembeli, total_products, total_orders, total_revenue, total_ternak, total_pengurus });
    } else if (req.user.role === 'petani') {
      const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM product WHERE id_user = ?', [req.user.id]);
      const [[{ low_stock }]] = await db.query('SELECT COUNT(*) as low_stock FROM product WHERE id_user = ? AND stok < 10', [req.user.id]);
      const [[{ total_ternak }]] = await db.query('SELECT COUNT(*) as total_ternak FROM ternak WHERE id_user = ?', [req.user.id]);
      const [[{ total_pengurus }]] = await db.query('SELECT COUNT(*) as total_pengurus FROM pengurus WHERE id_user = ?', [req.user.id]);
      const [[{ total_orders }]] = await db.query(
        `SELECT COUNT(DISTINCT ps.id_pesanan) as total_orders
         FROM pesanan ps
         JOIN detail_pesanan dp ON ps.id_pesanan = dp.id_pesanan
         JOIN product pr ON dp.id_produk = pr.id_produk
         WHERE pr.id_user = ?`, [req.user.id]
      );
      const [[{ pending_orders }]] = await db.query(
        `SELECT COUNT(DISTINCT ps.id_pesanan) as pending_orders
         FROM pesanan ps
         JOIN detail_pesanan dp ON ps.id_pesanan = dp.id_pesanan
         JOIN product pr ON dp.id_produk = pr.id_produk
         WHERE pr.id_user = ? AND ps.status = 'menunggu'`, [req.user.id]
      );

      Object.assign(stats, { total_products, low_stock, total_ternak, total_pengurus, total_orders, pending_orders });
    } else if (req.user.role === 'pembeli') {
      const [pembeliRows] = await db.query('SELECT id_pembeli FROM pembeli WHERE id_user = ?', [req.user.id]);
      if (pembeliRows.length > 0) {
        const id_pembeli = pembeliRows[0].id_pembeli;
        const [[{ total_orders }]] = await db.query('SELECT COUNT(*) as total_orders FROM pesanan WHERE id_pembeli = ?', [id_pembeli]);
        const [[{ pending_orders }]] = await db.query("SELECT COUNT(*) as pending_orders FROM pesanan WHERE id_pembeli = ? AND status = 'menunggu'", [id_pembeli]);
        const [[{ total_spent }]] = await db.query("SELECT COALESCE(SUM(total_harga), 0) as total_spent FROM pesanan WHERE id_pembeli = ? AND status != 'dibatalkan'", [id_pembeli]);
        Object.assign(stats, { total_orders, pending_orders, total_spent });
      }
    }

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('GetDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getDashboardStats };
