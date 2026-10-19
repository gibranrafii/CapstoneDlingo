const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllLivestock, getLivestockById, createLivestock,
  updateLivestock, deleteLivestock, addControlRecord
} = require('../controllers/livestockController');

router.get('/', authenticate, getAllLivestock);
router.get('/:id', authenticate, getLivestockById);
router.post('/', authenticate, authorize('petani', 'admin'), createLivestock);
router.put('/:id', authenticate, authorize('petani', 'admin'), updateLivestock);
router.delete('/:id', authenticate, authorize('petani', 'admin'), deleteLivestock);
router.post('/:id/control', authenticate, authorize('petani', 'admin'), addControlRecord);

module.exports = router;
