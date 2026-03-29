const VoucherService = require('../services/VoucherService');
const { authUserMiddleWare } = require('../middleware/authMiddleware');

const validateVoucher = async (req, res) => {
    try {
        const { code, orderItems, totalPrice } = req.body;
        const userId = req.user?.id || null;
        
        if (!code) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Voucher code is required'
            });
        }

        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Order items are required'
            });
        }

        if (totalPrice === undefined || totalPrice === null) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Total price is required'
            });
        }

        const result = await VoucherService.validateVoucher(code, orderItems, totalPrice, userId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error validating voucher'
        });
    }
};

module.exports = {
    validateVoucher
};

