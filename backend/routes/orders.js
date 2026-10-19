const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getOrders, getOrderById, createOrder, updateOrderStatus } = require('../controllers/orderController');

router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/', authenticate, authorize('pembeli'), createOrder);
router.put('/:id/status', authenticate, authorize('petani', 'admin'), updateOrderStatus);

module.exports = router;
