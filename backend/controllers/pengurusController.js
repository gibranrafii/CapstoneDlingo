const db = require('../config/db');

// Pengurus = pekerja yang dipekerjakan petani (pengurus.id_user = petani pemilik).
const findOwned = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM pengurus WHERE id_pengurus = ?', [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ success: false, message: 'Pengurus tidak ditemukan.' });
    return null;
  }
  if (req.user.role === 'petani' && rows[0].id_user !== req.user.id) {
    res.status(403).json({ success: false, message: 'Anda tidak berhak atas data pengurus ini.' });
    return null;
  }
  return rows[0];
};

// GET /api/pengurus?search=
const getAllPengurus = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT p.*,
             (SELECT COUNT(*) FROM pengurus_ternak pt
              WHERE pt.id_pengurus = p.id_pengurus AND pt.status_kontrak = 'aktif') AS ternak_aktif
      FROM pengurus p
    `;
    const where = [];
    const params = [];
    if (req.user.role === 'petani') {
      where.push('p.id_user = ?');
      params.push(req.user.id);
    }
    if (search) {
      where.push('(p.nama_pengurus LIKE ? OR p.email_pengurus LIKE ? OR p.no_telepon_pengurus LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY p.created_at DESC';

    const [rows] = await db.query(query, params);
    return res.status(200).json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('GetAllPengurus error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/pengurus/:id - beserta ternak yang diurus
const getPengurusById = async (req, res) => {
  try {
    const pengurus = await findOwned(req, res);
    if (!pengurus) return;
    const [ternak] = await db.query(
      `SELECT pt.waktu_kontrak_awal, pt.waktu_kontrak_akhir, pt.status_kontrak,
              t.id_ternak, t.nama_ternak, t.nomor_ternak, t.kategori_ternak
       FROM pengurus_ternak pt JOIN ternak t ON pt.id_ternak = t.id_ternak
       WHERE pt.id_pengurus = ? ORDER BY pt.waktu_kontrak_awal DESC`,
      [pengurus.id_pengurus]
    );
    pengurus.ternak = ternak;
    return res.status(200).json({ success: true, data: pengurus });
  } catch (error) {
    console.error('GetPengurusById error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/pengurus
const createPengurus = async (req, res) => {
  try {
    const { nama_pengurus, no_telepon_pengurus, email_pengurus, alamat_pengurus } = req.body;
    if (!nama_pengurus) {
      return res.status(400).json({ success: false, message: 'Nama pengurus wajib diisi.' });
    }
    // Admin harus menyebut petani pemilik lewat id_user; petani otomatis dirinya sendiri.
    const owner = req.user.role === 'admin' ? req.body.id_user : req.user.id;
    if (!owner) {
      return res.status(400).json({ success: false, message: 'id_user petani pemilik wajib diisi.' });
    }
    const [u] = await db.query("SELECT id_user FROM `user` WHERE id_user = ? AND role = 'petani'", [owner]);
    if (u.length === 0) {
      return res.status(404).json({ success: false, message: 'Petani pemilik tidak ditemukan.' });
    }

    const [result] = await db.query(
      'INSERT INTO pengurus (id_user, nama_pengurus, no_telepon_pengurus, email_pengurus, alamat_pengurus) VALUES (?, ?, ?, ?, ?)',
      [owner, nama_pengurus, no_telepon_pengurus || null, email_pengurus || null, alamat_pengurus || null]
    );
    return res.status(201).json({ success: true, message: 'Pengurus berhasil ditambahkan.', id: result.insertId });
  } catch (error) {
    console.error('CreatePengurus error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/pengurus/:id
const updatePengurus = async (req, res) => {
  try {
    const cur = await findOwned(req, res);
    if (!cur) return;
    const b = req.body;
    await db.query(
      'UPDATE pengurus SET nama_pengurus = ?, no_telepon_pengurus = ?, email_pengurus = ?, alamat_pengurus = ? WHERE id_pengurus = ?',
      [b.nama_pengurus || cur.nama_pengurus, b.no_telepon_pengurus ?? cur.no_telepon_pengurus,
       b.email_pengurus ?? cur.email_pengurus, b.alamat_pengurus ?? cur.alamat_pengurus, cur.id_pengurus]
    );
    return res.status(200).json({ success: true, message: 'Data pengurus berhasil diperbarui.' });
  } catch (error) {
    console.error('UpdatePengurus error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/pengurus/:id (penugasan ikut terhapus via CASCADE)
const deletePengurus = async (req, res) => {
  try {
    const cur = await findOwned(req, res);
    if (!cur) return;
    await db.query('DELETE FROM pengurus WHERE id_pengurus = ?', [cur.id_pengurus]);
    return res.status(200).json({ success: true, message: 'Pengurus berhasil dihapus.' });
  } catch (error) {
    console.error('DeletePengurus error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getAllPengurus, getPengurusById, createPengurus, updatePengurus, deletePengurus };
