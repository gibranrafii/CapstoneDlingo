const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const USER_FIELDS = 'id_user, username, nama, email, no_telepon, role, no_rekening, nama_bank, created_at';

// POST /api/auth/register - registrasi publik (FR-01), selalu sebagai pembeli.
// Akun petani dibuat oleh admin lewat POST /api/users.
const register = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { username, nama, email, password, no_telepon, alamat } = req.body;

    if (!username || !nama || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, nama, email, dan password wajib diisi.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
    }

    const [existing] = await conn.query('SELECT id_user FROM `user` WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email atau username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO `user` (username, password, nama, email, no_telepon, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, nama, email, no_telepon || null, 'pembeli']
    );
    await conn.query(
      'INSERT INTO pembeli (id_user, nama_pembeli, alamat_pembeli, no_telepon_pembeli, email_pembeli) VALUES (?, ?, ?, ?, ?)',
      [result.insertId, nama, alamat || null, no_telepon || null, email]
    );
    await conn.commit();

    return res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan login.' });
  } catch (error) {
    await conn.rollback();
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  } finally {
    conn.release();
  }
};

// POST /api/auth/login - email (atau username) + password
const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/username dan password wajib diisi.' });
    }

    const [users] = await db.query('SELECT * FROM `user` WHERE email = ? OR username = ?', [identifier, identifier]);
    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const user = users[0];
    const token = jwt.sign(
      { id: user.id_user, username: user.username, role: user.role, nama: user.nama },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    delete user.password;
    return res.status(200).json({ success: true, message: 'Login berhasil!', token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [users] = await db.query(`SELECT ${USER_FIELDS} FROM \`user\` WHERE id_user = ?`, [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    const user = users[0];
    if (user.role === 'pembeli') {
      const [rows] = await db.query('SELECT id_pembeli, alamat_pembeli FROM pembeli WHERE id_user = ?', [user.id_user]);
      Object.assign(user, rows[0] || {});
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/auth/profile - ubah data pribadi (halaman Profil)
const updateProfile = async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM `user` WHERE id_user = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    const cur = users[0];
    const { nama, no_telepon, no_rekening, nama_bank, alamat } = req.body;

    await db.query(
      'UPDATE `user` SET nama = ?, no_telepon = ?, no_rekening = ?, nama_bank = ? WHERE id_user = ?',
      [nama || cur.nama, no_telepon ?? cur.no_telepon, no_rekening ?? cur.no_rekening, nama_bank ?? cur.nama_bank, req.user.id]
    );

    if (req.user.role === 'pembeli') {
      await db.query(
        'UPDATE pembeli SET nama_pembeli = COALESCE(?, nama_pembeli), no_telepon_pembeli = COALESCE(?, no_telepon_pembeli), alamat_pembeli = COALESCE(?, alamat_pembeli) WHERE id_user = ?',
        [nama || null, no_telepon ?? null, alamat ?? null, req.user.id]
      );
    }

    return res.status(200).json({ success: true, message: 'Profil berhasil diperbarui.' });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/auth/password - ubah kata sandi
const changePassword = async (req, res) => {
  try {
    const { password_lama, password_baru } = req.body;
    if (!password_lama || !password_baru) {
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
    }
    if (password_baru.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    }

    const [users] = await db.query('SELECT password FROM `user` WHERE id_user = ?', [req.user.id]);
    if (users.length === 0 || !(await bcrypt.compare(password_lama, users[0].password))) {
      return res.status(400).json({ success: false, message: 'Password lama salah.' });
    }

    await db.query('UPDATE `user` SET password = ? WHERE id_user = ?', [await bcrypt.hash(password_baru, 10), req.user.id]);
    return res.status(200).json({ success: true, message: 'Password berhasil diubah.' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
