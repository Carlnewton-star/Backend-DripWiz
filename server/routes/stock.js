const express = require('express');
const router = express.Router();
const {
    recordMovement,
    getMovements,
    getLowStockAlerts
} = require('../controllers/stock');
const { protect, authorize } = require('../middleware/auth');

router.get('/movements', protect, authorize('admin'), getMovements);
router.get('/low-stock', protect, authorize('admin'), getLowStockAlerts);
router.post('/movements', protect, authorize('admin'), recordMovement);

module.exports = router;
