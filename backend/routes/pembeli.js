const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAllPembeli, getPembeliById, createPembeli, updatePembeli, deletePembeli } = require('../controllers/pembeliController');

router.use(authenticate, authorize('petani', 'admin'));

router.get('/', getAllPembeli);
router.get('/:id', getPembeliById);
router.post('/', createPembeli);
router.put('/:id', updatePembeli);
router.delete('/:id', deletePembeli);

module.exports = router;
