const db = require('../config/db');

// GET /api/livestock
const getAllLivestock = async (req, res) => {
  try {
    let query = `
      SELECT t.*, u.nama AS nama_petani
      FROM ternak t
      JOIN users u ON t.id_user = u.id_user
    `;
    const params = [];

    if (req.user.role === 'petani') {
      query += ` WHERE t.id_user = ?`;
      params.push(req.user.id);
    }

    const { kategori } = req.query;
    if (kategori) {
      query += params.length > 0 ? ` AND t.kategori_ternak = ?` : ` WHERE t.kategori_ternak = ?`;
      params.push(kategori);
    }

    query += ` ORDER BY t.created_at DESC`;
    const [livestock] = await db.query(query, params);
    return res.status(200).json({ success: true, data: livestock, total: livestock.length });
  } catch (error) {
    console.error('GetAllLivestock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/livestock/:id
const getLivestockById = async (req, res) => {
  try {
    const [livestock] = await db.query(
      `SELECT t.*, u.nama AS nama_petani, u.no_telepon AS telepon_petani
       FROM ternak t
       JOIN users u ON t.id_user = u.id_user
       WHERE t.id_ternak = ?`,
      [req.params.id]
    );

    if (livestock.length === 0) {
      return res.status(404).json({ success: false, message: 'Data ternak tidak ditemukan.' });
    }

    // Get pengurus records
    const [pengurus] = await db.query(
      `SELECT pt.*, p.nama_pengurus, p.no_telepon_pengurus
       FROM pengurus_ternak pt
       JOIN pengurus p ON pt.id_pengurus = p.id_pengurus
       WHERE pt.id_ternak = ?
       ORDER BY pt.waktu_kontrol DESC`,
      [req.params.id]
    );

    livestock[0].pengurus_records = pengurus;
    return res.status(200).json({ success: true, data: livestock[0] });
  } catch (error) {
    console.error('GetLivestockById error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/livestock
const createLivestock = async (req, res) => {
  try {
    const { nama_ternak, nomor_ternak, kategori_ternak, usia_ternak, berat_ternak, harga_ternak, keterangan } = req.body;

    if (!nama_ternak || !kategori_ternak) {
      return res.status(400).json({ success: false, message: 'Nama dan kategori ternak wajib diisi.' });
    }

    const validKategori = ['kambing', 'sapi', 'lainnya'];
    if (!validKategori.includes(kategori_ternak)) {
      return res.status(400).json({ success: false, message: 'Kategori ternak tidak valid.' });
    }

    const [result] = await db.query(
      'INSERT INTO ternak (id_user, nama_ternak, nomor_ternak, kategori_ternak, usia_ternak, berat_ternak, harga_ternak, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, nama_ternak, nomor_ternak || null, kategori_ternak,
       parseInt(usia_ternak) || null, parseFloat(berat_ternak) || null,
       parseFloat(harga_ternak) || null, keterangan || null]
    );

    return res.status(201).json({ success: true, message: 'Data ternak berhasil ditambahkan.', id: result.insertId });
  } catch (error) {
    console.error('CreateLivestock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// PUT /api/livestock/:id
const updateLivestock = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_ternak, nomor_ternak, kategori_ternak, usia_ternak, berat_ternak, harga_ternak, keterangan } = req.body;

    const [livestock] = await db.query('SELECT * FROM ternak WHERE id_ternak = ?', [id]);
    if (livestock.length === 0) {
      return res.status(404).json({ success: false, message: 'Data ternak tidak ditemukan.' });
    }

    if (req.user.role === 'petani' && livestock[0].id_user !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak mengedit data ini.' });
    }

    await db.query(
      'UPDATE ternak SET nama_ternak = ?, nomor_ternak = ?, kategori_ternak = ?, usia_ternak = ?, berat_ternak = ?, harga_ternak = ?, keterangan = ? WHERE id_ternak = ?',
      [nama_ternak || livestock[0].nama_ternak, nomor_ternak ?? livestock[0].nomor_ternak,
       kategori_ternak || livestock[0].kategori_ternak, parseInt(usia_ternak) ?? livestock[0].usia_ternak,
       parseFloat(berat_ternak) ?? livestock[0].berat_ternak, parseFloat(harga_ternak) ?? livestock[0].harga_ternak,
       keterangan ?? livestock[0].keterangan, id]
    );

    return res.status(200).json({ success: true, message: 'Data ternak berhasil diperbarui.' });
  } catch (error) {
    console.error('UpdateLivestock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/livestock/:id
const deleteLivestock = async (req, res) => {
  try {
    const { id } = req.params;

    const [livestock] = await db.query('SELECT * FROM ternak WHERE id_ternak = ?', [id]);
    if (livestock.length === 0) {
      return res.status(404).json({ success: false, message: 'Data ternak tidak ditemukan.' });
    }

    if (req.user.role === 'petani' && livestock[0].id_user !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak menghapus data ini.' });
    }

    await db.query('DELETE FROM ternak WHERE id_ternak = ?', [id]);
    return res.status(200).json({ success: true, message: 'Data ternak berhasil dihapus.' });
  } catch (error) {
    console.error('DeleteLivestock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/livestock/:id/control - add control record
const addControlRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { waktu_kontrol, waktu_kontrol_berikutnya, status_kontrol, catatan } = req.body;

    const [livestock] = await db.query('SELECT * FROM ternak WHERE id_ternak = ?', [id]);
    if (livestock.length === 0) {
      return res.status(404).json({ success: false, message: 'Data ternak tidak ditemukan.' });
    }

    // Get pengurus record for this user
    const [pengurus] = await db.query('SELECT id_pengurus FROM pengurus WHERE id_user = ?', [req.user.id]);
    if (pengurus.length === 0) {
      return res.status(400).json({ success: false, message: 'Data pengurus tidak ditemukan.' });
    }

    await db.query(
      'INSERT INTO pengurus_ternak (id_pengurus, id_ternak, waktu_kontrol, waktu_kontrol_berikutnya, status_kontrol, catatan) VALUES (?, ?, ?, ?, ?, ?)',
      [pengurus[0].id_pengurus, id, waktu_kontrol || new Date(), waktu_kontrol_berikutnya || null, status_kontrol || 'Sehat', catatan || null]
    );

    return res.status(201).json({ success: true, message: 'Catatan kontrol berhasil ditambahkan.' });
  } catch (error) {
    console.error('AddControlRecord error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

module.exports = { getAllLivestock, getLivestockById, createLivestock, updateLivestock, deleteLivestock, addControlRecord };
