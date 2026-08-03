// Manual stock movement ledger (restock/adjustment/return). Order
// creation already decrements Product.stock atomically inside a
// transaction (see controllers/orders.js) - this ledger is the audit
// trail for admin-initiated changes, not a replacement for that guard.
const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['restock', 'adjustment', 'return'], required: true },
  quantity: { type: Number, required: true },
  resultingStock: { type: Number, required: true },
  note: { type: String },
  recordedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
}, { timestamps: true });

stockMovementSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
