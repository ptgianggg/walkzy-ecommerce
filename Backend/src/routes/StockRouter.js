const express = require('express');
const router = express.Router();
const StockController = require('../controllers/StockController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create-or-update', authMiddleWare, StockController.createOrUpdateStock);
router.post('/adjust', authMiddleWare, StockController.adjustStock);
router.post('/reserve', authMiddleWare, StockController.reserveStock);
router.post('/unreserve', authMiddleWare, StockController.unreserveStock);
router.get('/get-all', authMiddleWare, StockController.getAllStock);
router.get('/get-details/:id', authMiddleWare, StockController.getDetailStock);
router.get('/history', authMiddleWare, StockController.getStockHistory);
router.get('/low-stock', authMiddleWare, StockController.getLowStockProducts);
router.get('/get-by-product', authMiddleWare, StockController.getStockByProductAndVariation);

module.exports = router;

