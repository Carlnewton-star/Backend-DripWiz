const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getSalesStats
} = require('../controllers/orders');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Order = require('../models/Order');

router.use(protect);

router
  .route('/')
  .get(
    authorize('admin'),
    advancedResults(Order, 'user products.product'),
    getOrders
  )
  .post(createOrder);

router
  .route('/:id')
  .get(getOrder)
  .put(authorize('admin'), updateOrder)
  .delete(authorize('admin'), deleteOrder);

router.route('/stats/sales').get(authorize('admin'), getSalesStats);

module.exports = router;