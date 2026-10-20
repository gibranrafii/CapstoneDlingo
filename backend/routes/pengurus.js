const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAllPengurus, getPengurusById, createPengurus, updatePengurus, deletePengurus } = require('../controllers/pengurusController');

router.use(authenticate, authorize('petani', 'admin'));

router.get('/', getAllPengurus);
router.get('/:id', getPengurusById);
router.post('/', createPengurus);
router.put('/:id', updatePengurus);
router.delete('/:id', deletePengurus);

module.exports = router;
