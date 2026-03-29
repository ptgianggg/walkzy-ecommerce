const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController')
const { authUserMiddleWare, authMiddleWare } = require('../middleware/authMiddleware');


router.post('/create', authUserMiddleWare, OrderController.createOrder)
router.get('/get-all-order/:userId', authUserMiddleWare, OrderController.getAllOrderDetails)
router.get('/get-details-order/:id', authUserMiddleWare, OrderController.getDetailsOrder)
router.delete('/cancel-order/:id', authUserMiddleWare, OrderController.cancelOrderDetails)
router.get('/get-all-order', authMiddleWare, OrderController.getAllOrder)

// Customer routes
router.put('/complete/:orderId', authUserMiddleWare, OrderController.completeOrder) // Customer confirms received
router.put('/pay-order/:id', authUserMiddleWare, OrderController.payOrder) // Customer pays for pending order

// Admin routes
router.put('/cancel/:id', authMiddleWare, OrderController.cancelOrder)
router.put('/refund/:id', authMiddleWare, OrderController.refundOrder)
router.put('/tracking/:id', authMiddleWare, OrderController.updateTracking)
router.put('/status/:id', authMiddleWare, OrderController.updateOrderStatus)
router.post('/manual', authMiddleWare, OrderController.createManualOrder)

module.exports = router;
