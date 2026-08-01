const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Order = require('../models/order');
const Product = require('../models/product');

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private/Admin
exports.getOrders = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get the logged-in user's own orders
// @route   GET /api/v1/orders/myorders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })
    .sort('-createdAt')
    .populate({
      path: 'products.product',
      select: 'name price images'
    });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate({
    path: 'user',
    select: 'name email'
  }).populate({
    path: 'products.product',
    select: 'name price'
  });

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is order owner or admin
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this order`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { products, shippingAddress, paymentMethod } = req.body;

  if (!products || products.length === 0) {
    return next(new ErrorResponse('No order items', 400));
  }

  // Stock is decremented atomically per item (findOneAndUpdate with a
  // stock >= quantity filter) inside a transaction, and the whole order is
  // rolled back if anything fails — a referenced product that doesn't
  // exist, or one that's out of stock, previously either crashed with an
  // unhandled TypeError (product.price on a null product) or oversold
  // stock under concurrent requests (nothing ever checked or decremented
  // it at all). This mirrors the stock-oversell guard already built for
  // Bree's Beauty Luxe's Postgres-based catalog, adapted to Mongo's
  // transaction model — same guarantee, different engine.
  const session = await mongoose.startSession();

  try {
    let items;

    await session.withTransaction(async () => {
      items = await Promise.all(
        products.map(async (item) => {
          const product = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true, session }
          );

          if (!product) {
            // Either the product doesn't exist, or there isn't enough
            // stock — same ErrorResponse either way, but check existence
            // separately so the message is accurate.
            const exists = await Product.exists({ _id: item.product }).session(session);
            throw new ErrorResponse(
              exists
                ? `Not enough stock for product ${item.product}`
                : `Product not found with id of ${item.product}`,
              400
            );
          }

          return {
            product: item.product,
            quantity: item.quantity,
            price: product.price
          };
        })
      );
    });

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxPrice = subtotal * 0.15; // 15% tax
    const totalPrice = subtotal + taxPrice;

    const order = await Order.create({
      user: req.user.id,
      products: items,
      shippingAddress,
      paymentMethod,
      subtotal,
      taxPrice,
      totalPrice
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } finally {
    await session.endSession();
  }
});

// @desc    Update order to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  Private
exports.updateOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer.email_address
  };

  const updatedOrder = await order.save();

  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Delete order
// @route   DELETE /api/v1/orders/:id
// @access  Private/Admin
exports.deleteOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
    );
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get sales stats
// @route   GET /api/v1/orders/stats/sales
// @access  Private/Admin
exports.getSalesStats = asyncHandler(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        numOrders: { $sum: 1 },
        totalSales: { $sum: '$totalPrice' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats[0] || { numOrders: 0, totalSales: 0 }
  });
});