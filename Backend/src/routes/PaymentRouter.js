const express = require('express');
const router = express.Router();
const dotenv = require("dotenv");
const PaymentController = require('../controllers/PaymentController');
dotenv.config();

// PayPal config
router.get('/config', (req, res) => {
    return res.status(200).json({
        status: 'OK',
        data: process.env.CLIENT_ID
    })
})

// MoMo Payment Routes
router.post('/momo/create', PaymentController.createMoMoPayment);
router.get('/momo/verify', PaymentController.verifyMoMoPayment);
router.post('/momo/ipn', PaymentController.handleMoMoIPN);

module.exports = router;


