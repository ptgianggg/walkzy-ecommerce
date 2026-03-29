const express = require('express');
const router = express.Router();
const SupportRequestController = require('../controllers/SupportRequestController');
const { authMiddleWare, authUserMiddleWare } = require('../middleware/authMiddleware');

// User routes
router.get('/check-return/:orderId', authUserMiddleWare, SupportRequestController.checkCanReturn);
router.post('/create', authUserMiddleWare, SupportRequestController.createSupportRequest);
router.get('/user', authUserMiddleWare, SupportRequestController.getSupportRequestsByUser);
router.get('/:id', authUserMiddleWare, SupportRequestController.getSupportRequestById);

// Admin routes
router.get('/admin/list', authMiddleWare, SupportRequestController.getAllSupportRequests);
router.put('/admin/:id/status', authMiddleWare, SupportRequestController.updateSupportRequestStatus);
router.post('/admin/:id/complete-refund', authMiddleWare, SupportRequestController.completeRefund);

module.exports = router;

