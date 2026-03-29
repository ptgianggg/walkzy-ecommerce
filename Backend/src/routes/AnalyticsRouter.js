const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/AnalyticsController');
const { authMiddleWare } = require('../middleware/authMiddleware');

// All analytics routes require admin authentication
router.get('/admin/ai-analytics', authMiddleWare, AnalyticsController.getAIAnalyticsInsights);
router.get('/revenue', authMiddleWare, AnalyticsController.getRevenueStatistics);
router.get('/best-selling', authMiddleWare, AnalyticsController.getBestSellingProducts);
router.get('/cancellation-rate', authMiddleWare, AnalyticsController.getCancellationRate);
router.get('/new-customers', authMiddleWare, AnalyticsController.getNewCustomersStatistics);
router.get('/inventory', authMiddleWare, AnalyticsController.getInventoryStatistics);
router.get('/order-heatmap', authMiddleWare, AnalyticsController.getOrderTimeHeatmap);
router.get('/overview', authMiddleWare, AnalyticsController.getDashboardOverview);
router.get('/top-provinces', authMiddleWare, AnalyticsController.getTopProvincesByOrders);
router.get('/top-brands', authMiddleWare, AnalyticsController.getTopBrandsByOrders);
router.get('/top-categories', authMiddleWare, AnalyticsController.getTopCategoriesByOrders);

module.exports = router;

