const express = require('express')
const ShippingController = require('../controllers/ShippingController')
const { authUserMiddleWare, authAdminMiddleWare } = require('../middleware/authMiddleware')

const router = express.Router()

// ============ SHIPPING PROVIDER (Admin only) ============
router.post('/provider', authAdminMiddleWare, ShippingController.createShippingProvider)
router.get('/provider', authAdminMiddleWare, ShippingController.getAllShippingProviders)
router.get('/provider/:id', authAdminMiddleWare, ShippingController.getDetailsShippingProvider)
router.put('/provider/:id', authAdminMiddleWare, ShippingController.updateShippingProvider)
router.delete('/provider/:id', authAdminMiddleWare, ShippingController.deleteShippingProvider)

// ============ SHIPPING RATE (Admin only) ============
router.post('/rate', authAdminMiddleWare, ShippingController.createShippingRate)
router.get('/rate', authAdminMiddleWare, ShippingController.getAllShippingRates)
router.get('/rate/:id', authAdminMiddleWare, ShippingController.getDetailsShippingRate)
router.put('/rate/:id', authAdminMiddleWare, ShippingController.updateShippingRate)
router.delete('/rate/:id', authAdminMiddleWare, ShippingController.deleteShippingRate)

// ============ SHIPPING CALCULATION (Public/User) ============
router.post('/calculate-fee', ShippingController.calculateShippingFee)
router.get('/available-rates', ShippingController.getAvailableShippingRates)

// ============ SHIPPING ORDER ============
router.post('/order/:orderId', authAdminMiddleWare, ShippingController.createShippingOrder)
router.get('/order', authAdminMiddleWare, ShippingController.getAllShippingOrders)
router.get('/order/by-order/:orderId', authUserMiddleWare, ShippingController.getShippingOrderByOrderId)
router.put('/order/:id/status', authAdminMiddleWare, ShippingController.updateShippingOrderStatus)
router.put('/order/:id', authAdminMiddleWare, ShippingController.updateShippingOrder)

module.exports = router

