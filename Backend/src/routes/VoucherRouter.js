const express = require('express');
const router = express.Router();
const VoucherController = require('../controllers/VoucherController');
const { authUserMiddleWare } = require('../middleware/authMiddleware');

router.post('/validate', authUserMiddleWare, VoucherController.validateVoucher);

module.exports = router;

