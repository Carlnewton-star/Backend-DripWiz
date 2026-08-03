const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Product = require('../models/product');
const StockMovement = require('../models/stockMovement');

exports.recordMovement = asyncHandler(async (req, res, next) => {
  const { productId, type, quantity, note } = req.body;

                                      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                                        return next(new ErrorResponse('a valid productId is required', 400));
                                      }
  if (!['restock', 'adjustment', 'return'].includes(type)) {
    return next(new ErrorResponse('type must be one of: restock, adjustment, return', 400));
  }
  const numericQuantity = Number(quantity);
  if (!Number.isFinite(numericQuantity) || numericQuantity === 0) {
    return next(new ErrorResponse('quantity must be a non-zero number', 400));
  }

                                      const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse('product not found', 404));
  }

                                      const magnitude = Math.abs(numericQuantity);
  const signedQuantity = ['restock', 'return'].includes(type) ? magnitude : -magnitude;
  const newStock = Math.max(0, (product.stock || 0) + signedQuantity);

                                      product.stock = newStock;
  await product.save();

                                      const movement = await StockMovement.create({
                                        product: product._id,
                                        type,
                                        quantity: signedQuantity,
                                        resultingStock: newStock,
                                        note,
                                        recordedBy: req.user.id,
                                      });

                                      res.status(201).json({ success: true, data: { product, movement } });
});

exports.getMovements = asyncHandler(async (req, res, next) => {
  const { productId } = req.query;
  const filter = {};
  if (productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ErrorResponse('invalid productId', 400));
    }
    filter.product = productId;
  }

                                    const movements = await StockMovement.find(filter).sort({ createdAt: -1 }).limit(200);
  res.status(200).json({ success: true, count: movements.length, data: movements });
});

exports.getLowStockAlerts = asyncHandler(async (req, res, next) => {
  const threshold = Number(req.query.threshold) || 10;
  const products = await Product.find({ stock: { $lte: threshold } }).sort({ stock: 1 });
  res.status(200).json({ success: true, count: products.length, data: products });
});
