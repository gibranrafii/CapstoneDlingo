const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, nama, email, password, no_telepon, role = 'pembeli', no_rekening, nama_bank, alamat } = req.body;

    if (!username || !nama || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, nama, email, dan password wajib diisi.' });
    }

    // Check existing user
    const [existing] = await db.query('SELECT id_user FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email atau username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const validRoles = ['pembeli', 'petani'];
    const assignedRole = validRoles.includes(role) ? role : 'pembeli';

    const [result] = await db.query(
      'INSERT INTO users (username, password, nama, email, no_telepon, role, no_rekening, nama_bank) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, nama, email, no_telepon || null, assignedRole, no_rekening || null, nama_bank || null]
    );

    const newUserId = result.insertId;

    // If pembeli, create pembeli record
    if (assignedRole === 'pembeli') {
      await db.query(
        'INSERT INTO pembeli (id_user, nama_pembeli, alamat_pembeli, no_telepon_pembeli, email_pembeli) VALUES (?, ?, ?, ?, ?)',
        [newUserId, nama, alamat || '', no_telepon || '', email]
      );
    }

    // If petani, create pengurus record
    if (assignedRole === 'petani') {
      await db.query(
        'INSERT INTO pengurus (id_user, nama_pengurus, no_telepon_pengurus, email_pengurus, alamat_pengurus) VALUES (?, ?, ?, ?, ?)',
        [newUserId, nama, no_telepon || '', email, alamat || '']
      );
    }

    return res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan login.' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id_user, username: user.username, role: user.role, nama: user.nama },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userResponse = {
      id_user: user.id_user,
      username: user.username,
      nama: user.nama,
      email: user.email,
      role: user.role,
      no_telepon: user.no_telepon,
      no_rekening: user.no_rekening,
      nama_bank: user.nama_bank,
    };

    return res.status(200).json({ success: true, message: 'Login berhasil!', token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id_user, username, nama, email, no_telepon, role, no_rekening, nama_bank, foto_profil, created_at FROM users WHERE id_user = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, user: users[0] });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { nama, no_telepon, no_rekening, nama_bank, alamat } = req.body;
    const userId = req.user.id;

    await db.query(
      'UPDATE users SET nama = ?, no_telepon = ?, no_rekening = ?, nama_bank = ? WHERE id_user = ?',
      [nama, no_telepon, no_rekening, nama_bank, userId]
    );

    // Update related table
    if (req.user.role === 'pembeli') {
      await db.query(
        'UPDATE pembeli SET nama_pembeli = ?, no_telepon_pembeli = ?, alamat_pembeli = ? WHERE id_user = ?',
        [nama, no_telepon, alamat, userId]
      );
    } else if (req.user.role === 'petani') {
      await db.query(
        'UPDATE pengurus SET nama_pengurus = ?, no_telepon_pengurus = ?, alamat_pengurus = ? WHERE id_user = ?',
        [nama, no_telepon, alamat, userId]
      );
    }

    return res.status(200).json({ success: true, message: 'Profil berhasil diperbarui.' });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { register, login, getMe, updateProfile };
