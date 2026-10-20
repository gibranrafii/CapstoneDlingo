const db = require('../config/db');

const KATEGORI = ['sapi', 'kambing'];

const num = (v, fn) => (v === undefined || v === null || v === '' ? null : fn(v));

// Ambil ternak + cek kepemilikan. Mengembalikan null (dan sudah merespons) bila gagal.
const findOwned = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM ternak WHERE id_ternak = ?', [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ success: false, message: 'Data ternak tidak ditemukan.' });
    return null;
  }
  if (req.user.role === 'petani' && rows[0].id_user !== req.user.id) {
    res.status(403).json({ success: false, message: 'Anda tidak berhak atas data ternak ini.' });
    return null;
  }
  return rows[0];
};

// GET /api/ternak?kategori=&search=
const getAllLivestock = async (req, res) => {
  try {
    const { kategori, search } = req.query;
    let query = `SELECT t.*, u.nama AS nama_petani FROM ternak t JOIN \`user\` u ON t.id_user = u.id_user`;
    const where = [];
    const params = [];

    if (req.user.role === 'petani') {
      where.push('t.id_user = ?');
      params.push(req.user.id);
    }
    if (kategori) {
      where.push('t.kategori_ternak = ?');
      params.push(kategori);
    }
    if (search) {
      where.push('(t.nama_ternak LIKE ? OR t.nomor_ternak LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY t.created_at DESC';

    const [livestock] = await db.query(query, params);
    return res.status(200).json({ success: true, data: livestock, total: livestock.length });
  } catch (error) {
    console.error('GetAllLivestock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/ternak/:id - beserta pengurus yang bertugas
const getLivestockById = async (req, res) => {
  try {
    const ternak = await findOwned(req, res);
    if (!ternak) return;

    const [pengurus] = await db.query(
      `SELECT pt.waktu_kontrak_awal, pt.waktu_kontrak_akhir, pt.status_kontrak,
              p.id_pengurus, p.nama_pengurus, p.no_telepon_pengurus
       FROM pengurus_ternak pt JOIN pengurus p ON pt.id_pengurus = p.id_pengurus
       WHERE pt.id_ternak = ? ORDER BY pt.waktu_kontrak_awal DESC`,
      [ternak.id_ternak]
    );
    ternak.pengurus = pengurus;
    return res.status(200).json({ success: true, data: ternak });
  } catch (error) {
    console.error('GetLivestockById error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/ternak
const createLivestock = async (req, res) => {
  try {
    const { nama_ternak, nomor_ternak, kategori_ternak, usia_ternak, berat_ternak, harga_ternak } = req.body;

    if (!nama_ternak || !kategori_ternak) {
      return res.status(400).json({ success: false, message: 'Nama dan kategori ternak wajib diisi.' });
    }
    if (!KATEGORI.includes(kategori_ternak)) {
      return res.status(400).json({ success: false, message: `Kategori ternak harus salah satu dari: ${KATEGORI.join(', ')}.` });
    }

    const [result] = await db.query(
      'INSERT INTO ternak (id_user, nama_ternak, nomor_ternak, kategori_ternak, usia_ternak, berat_ternak, harga_ternak) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, nama_ternak, nomor_ternak || null, kategori_ternak,
       num(usia_ternak, parseInt), num(berat_ternak, parseFloat), num(harga_ternak, parseFloat)]
    );
    return res.status(201).json({ success: true, message: 'Data ternak berhasil ditambahkan.', id: result.insertId });
  } catch (error) {
    console.error('CreateLivestock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/ternak/:id
const updateLivestock = async (req, res) => {
  try {
    const cur = await findOwned(req, res);
    if (!cur) return;
    const b = req.body;

    if (b.kategori_ternak && !KATEGORI.includes(b.kategori_ternak)) {
      return res.status(400).json({ success: false, message: `Kategori ternak harus salah satu dari: ${KATEGORI.join(', ')}.` });
    }

    await db.query(
      'UPDATE ternak SET nama_ternak = ?, nomor_ternak = ?, kategori_ternak = ?, usia_ternak = ?, berat_ternak = ?, harga_ternak = ? WHERE id_ternak = ?',
      [b.nama_ternak || cur.nama_ternak, b.nomor_ternak ?? cur.nomor_ternak, b.kategori_ternak || cur.kategori_ternak,
       b.usia_ternak === undefined ? cur.usia_ternak : num(b.usia_ternak, parseInt),
       b.berat_ternak === undefined ? cur.berat_ternak : num(b.berat_ternak, parseFloat),
       b.harga_ternak === undefined ? cur.harga_ternak : num(b.harga_ternak, parseFloat),
       cur.id_ternak]
    );
    return res.status(200).json({ success: true, message: 'Data ternak berhasil diperbarui.' });
  } catch (error) {
    console.error('UpdateLivestock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/ternak/:id
const deleteLivestock = async (req, res) => {
  try {
    const cur = await findOwned(req, res);
    if (!cur) return;
    await db.query('DELETE FROM ternak WHERE id_ternak = ?', [cur.id_ternak]);
    return res.status(200).json({ success: true, message: 'Data ternak berhasil dihapus.' });
  } catch (error) {
    console.error('DeleteLivestock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/ternak/:id/pengurus - tugaskan pengurus ke ternak (tabel pengurus_ternak)
const assignPengurus = async (req, res) => {
  try {
    const ternak = await findOwned(req, res);
    if (!ternak) return;
    const { id_pengurus, waktu_kontrak_awal, waktu_kontrak_akhir, status_kontrak } = req.body;

    if (!id_pengurus || !waktu_kontrak_awal) {
      return res.status(400).json({ success: false, message: 'id_pengurus dan waktu_kontrak_awal wajib diisi.' });
    }
    const [p] = await db.query('SELECT id_user FROM pengurus WHERE id_pengurus = ?', [id_pengurus]);
    if (p.length === 0 || p[0].id_user !== ternak.id_user) {
      return res.status(404).json({ success: false, message: 'Pengurus tidak ditemukan.' });
    }
    if (waktu_kontrak_akhir && new Date(waktu_kontrak_akhir) < new Date(waktu_kontrak_awal)) {
      return res.status(400).json({ success: false, message: 'Waktu kontrak akhir tidak boleh sebelum awal.' });
    }

    try {
      await db.query(
        'INSERT INTO pengurus_ternak (id_pengurus, id_ternak, waktu_kontrak_awal, waktu_kontrak_akhir, status_kontrak) VALUES (?, ?, ?, ?, ?)',
        [id_pengurus, ternak.id_ternak, waktu_kontrak_awal, waktu_kontrak_akhir || null, status_kontrak || 'aktif']
      );
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Penugasan dengan waktu awal yang sama sudah ada.' });
      }
      throw e;
    }
    return res.status(201).json({ success: true, message: 'Pengurus berhasil ditugaskan.' });
  } catch (error) {
    console.error('AssignPengurus error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/ternak/:id/pengurus/:idPengurus - ubah kontrak (kunci: waktu_kontrak_awal di body)
const updateAssignment = async (req, res) => {
  try {
    const ternak = await findOwned(req, res);
    if (!ternak) return;
    const { waktu_kontrak_awal, waktu_kontrak_akhir, status_kontrak } = req.body;
    if (!waktu_kontrak_awal) {
      return res.status(400).json({ success: false, message: 'waktu_kontrak_awal (kunci penugasan) wajib diisi.' });
    }

    const [r] = await db.query(
      `UPDATE pengurus_ternak
       SET waktu_kontrak_akhir = COALESCE(?, waktu_kontrak_akhir), status_kontrak = COALESCE(?, status_kontrak)
       WHERE id_ternak = ? AND id_pengurus = ? AND waktu_kontrak_awal = ?`,
      [waktu_kontrak_akhir || null, status_kontrak || null, ternak.id_ternak, req.params.idPengurus, waktu_kontrak_awal]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Kontrak penugasan diperbarui.' });
  } catch (error) {
    console.error('UpdateAssignment error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/ternak/:id/pengurus/:idPengurus?waktu_kontrak_awal=
const removeAssignment = async (req, res) => {
  try {
    const ternak = await findOwned(req, res);
    if (!ternak) return;
    const { waktu_kontrak_awal } = req.query;
    if (!waktu_kontrak_awal) {
      return res.status(400).json({ success: false, message: 'Query waktu_kontrak_awal wajib diisi.' });
    }
    const [r] = await db.query(
      'DELETE FROM pengurus_ternak WHERE id_ternak = ? AND id_pengurus = ? AND waktu_kontrak_awal = ?',
      [ternak.id_ternak, req.params.idPengurus, waktu_kontrak_awal]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Penugasan dihapus.' });
  } catch (error) {
    console.error('RemoveAssignment error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = {
  getAllLivestock, getLivestockById, createLivestock, updateLivestock, deleteLivestock,
  assignPengurus, updateAssignment, removeAssignment,
};
