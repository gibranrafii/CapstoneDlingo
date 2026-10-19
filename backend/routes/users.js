const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, getDashboardStats } = require('../controllers/userController');

router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.post('/', authenticate, authorize('admin'), createUser);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;
