const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllLivestock, getLivestockById, createLivestock, updateLivestock, deleteLivestock,
  assignPengurus, updateAssignment, removeAssignment,
} = require('../controllers/livestockController');

router.use(authenticate, authorize('petani', 'admin'));

router.get('/', getAllLivestock);
router.get('/:id', getLivestockById);
router.post('/', createLivestock);
router.put('/:id', updateLivestock);
router.delete('/:id', deleteLivestock);
router.post('/:id/pengurus', assignPengurus);
router.put('/:id/pengurus/:idPengurus', updateAssignment);
router.delete('/:id/pengurus/:idPengurus', removeAssignment);

module.exports = router;
