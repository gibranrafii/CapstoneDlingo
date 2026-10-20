const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// GET /api/products - public, all products
const getAllProducts = async (req, res) => {
  try {
    const { search, kategori, min_harga, max_harga, petani_id, sort = 'created_at', order = 'DESC' } = req.query;

    let query = `
      SELECT p.*, u.nama AS nama_petani, u.no_rekening, u.nama_bank, u.no_telepon AS telepon_petani
      FROM product p
      JOIN `user` u ON p.id_user = u.id_user
      WHERE p.stok > 0
    `;
    const params = [];

    if (search) {
      query += ` AND (p.nama_produk LIKE ? OR p.deskripsi LIKE ? OR p.kategori LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (kategori) {
      query += ` AND p.kategori = ?`;
      params.push(kategori);
    }
    if (min_harga) {
      query += ` AND p.harga >= ?`;
      params.push(min_harga);
    }
    if (max_harga) {
      query += ` AND p.harga <= ?`;
      params.push(max_harga);
    }
    if (petani_id) {
      query += ` AND p.id_user = ?`;
      params.push(petani_id);
    }

    const allowedSorts = ['created_at', 'harga', 'nama_produk', 'stok'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY p.${sortCol} ${sortOrder}`;

    const [products] = await db.query(query, params);
    return res.status(200).json({ success: true, data: products, total: products.length });
  } catch (error) {
    console.error('GetAllProducts error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// GET /api/products/all - for petani/admin (includes out of stock)
const getAllProductsManage = async (req, res) => {
  try {
    let query = `
      SELECT p.*, u.nama AS nama_petani
      FROM product p
      JOIN `user` u ON p.id_user = u.id_user
    `;
    const params = [];

    // Petani only sees their own products
    if (req.user.role === 'petani') {
      query += ` WHERE p.id_user = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY p.created_at DESC`;
    const [products] = await db.query(query, params);
    return res.status(200).json({ success: true, data: products, total: products.length });
  } catch (error) {
    console.error('GetAllProductsManage error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, u.nama AS nama_petani, u.no_rekening, u.nama_bank, u.no_telepon AS telepon_petani, u.email AS email_petani
       FROM product p
       JOIN `user` u ON p.id_user = u.id_user
       WHERE p.id_produk = ?`,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, data: products[0] });
  } catch (error) {
    console.error('GetProductById error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/products - petani only
const createProduct = async (req, res) => {
  try {
    const { nama_produk, deskripsi, harga, satuan, kategori, stok } = req.body;

    if (!nama_produk || !harga) {
      return res.status(400).json({ success: false, message: 'Nama produk dan harga wajib diisi.' });
    }

    if (parseFloat(harga) < 0 || parseInt(stok || 0) < 0) {
      return res.status(400).json({ success: false, message: 'Harga dan stok tidak boleh negatif.' });
    }

    const gambar = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO product (id_user, nama_produk, deskripsi, harga, satuan, kategori, stok, gambar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, nama_produk, deskripsi || '', parseFloat(harga), satuan || 'kg', kategori || 'Lainnya', parseInt(stok) || 0, gambar]
    );

    return res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan.', id: result.insertId });
  } catch (error) {
    console.error('CreateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// PUT /api/products/:id - petani (own) or admin
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_produk, deskripsi, harga, satuan, kategori, stok } = req.body;

    // Check ownership
    const [products] = await db.query('SELECT * FROM product WHERE id_produk = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    if (req.user.role === 'petani' && products[0].id_user !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak mengedit produk ini.' });
    }

    const gambar = req.file ? `/uploads/${req.file.filename}` : products[0].gambar;

    await db.query(
      'UPDATE product SET nama_produk = ?, deskripsi = ?, harga = ?, satuan = ?, kategori = ?, stok = ?, gambar = ? WHERE id_produk = ?',
      [nama_produk || products[0].nama_produk, deskripsi ?? products[0].deskripsi,
       parseFloat(harga) || products[0].harga, satuan || products[0].satuan,
       kategori || products[0].kategori, stok === undefined || stok === '' ? products[0].stok : parseInt(stok), gambar, id]
    );

    return res.status(200).json({ success: true, message: 'Produk berhasil diperbarui.' });
  } catch (error) {
    console.error('UpdateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query('SELECT * FROM product WHERE id_produk = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    if (req.user.role === 'petani' && products[0].id_user !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak menghapus produk ini.' });
    }

    // Delete image file if exists
    if (products[0].gambar) {
      const imgPath = path.join(__dirname, '..', 'public', products[0].gambar);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await db.query('DELETE FROM product WHERE id_produk = ?', [id]);
    return res.status(200).json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ success: false, message: 'Produk sudah pernah dipesan dan tidak dapat dihapus. Set stok ke 0 sebagai gantinya.' });
    }
    console.error('DeleteProduct error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/products/categories - get unique categories
const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT kategori FROM product WHERE kategori IS NOT NULL ORDER BY kategori');
    return res.status(200).json({ success: true, data: rows.map(r => r.kategori) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PATCH /api/products/:id/stok - petani memperbarui stok mandiri (FR-05)
// body: { stok } untuk set nilai absolut, atau { tambah } untuk +/- relatif
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stok, tambah } = req.body;

    const [products] = await db.query('SELECT * FROM product WHERE id_produk = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }
    if (req.user.role === 'petani' && products[0].id_user !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak mengubah stok produk ini.' });
    }

    let newStok;
    if (stok !== undefined) newStok = parseInt(stok);
    else if (tambah !== undefined) newStok = products[0].stok + parseInt(tambah);
    else return res.status(400).json({ success: false, message: 'Isi "stok" atau "tambah".' });

    if (Number.isNaN(newStok) || newStok < 0) {
      return res.status(400).json({ success: false, message: 'Stok tidak valid (harus bilangan >= 0).' });
    }

    await db.query('UPDATE product SET stok = ? WHERE id_produk = ?', [newStok, id]);
    return res.status(200).json({ success: true, message: 'Stok berhasil diperbarui.', stok: newStok });
  } catch (error) {
    console.error('UpdateStock error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { updateStock, getAllProducts, getAllProductsManage, getProductById, createProduct, updateProduct, deleteProduct, getCategories };
