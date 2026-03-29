const express = require('express');
const router = express.Router();
const ShippingVoucherController = require('../controllers/ShippingVoucherController');
const { authMiddleWare } = require('../middleware/authMiddleware');

// Admin routes (cần authentication)
router.post('/create', authMiddleWare, ShippingVoucherController.createShippingVoucher);
router.put('/update/:id', authMiddleWare, ShippingVoucherController.updateShippingVoucher);
router.delete('/delete/:id', authMiddleWare, ShippingVoucherController.deleteShippingVoucher);
router.get('/get-all', authMiddleWare, ShippingVoucherController.getAllShippingVoucher);
router.get('/get-details/:id', authMiddleWare, ShippingVoucherController.getDetailShippingVoucher);

// Public route để validate voucher (không cần auth, nhưng cần userId nếu có)
router.get('/get-active', ShippingVoucherController.getActiveShippingVouchers);
router.post('/validate', ShippingVoucherController.validateShippingVoucher);

module.exports = router;

