const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllProducts, getAllProductsManage, getProductById,
  createProduct, updateProduct, deleteProduct, getCategories, updateStock
} = require('../controllers/productController');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Hanya file gambar yang diizinkan!'));
  }
});

router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/manage', authenticate, authorize('petani', 'admin'), getAllProductsManage);
router.get('/:id', getProductById);
router.post('/', authenticate, authorize('petani', 'admin'), upload.single('gambar'), createProduct);
router.put('/:id', authenticate, authorize('petani', 'admin'), upload.single('gambar'), updateProduct);
router.patch('/:id/stok', authenticate, authorize('petani', 'admin'), updateStock);
router.delete('/:id', authenticate, authorize('petani', 'admin'), deleteProduct);

module.exports = router;
