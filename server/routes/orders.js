const express = require('express');
const router = express.Router();
const {
  getOrders,
  getMyOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getSalesStats
} = require('../controllers/orders');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Order = require('../models/order');

router.use(protect);

router
  .route('/')
  .get(
    authorize('admin'),
    advancedResults(Order, 'user products.product'),
    getOrders
  )
  .post(createOrder);

router.route('/myorders').get(getMyOrders);

router
  .route('/:id')
  .get(getOrder)
  .put(authorize('admin'), updateOrder)
  .delete(authorize('admin'), deleteOrder);

router.route('/stats/sales').get(authorize('admin'), getSalesStats);

module.exports = router;