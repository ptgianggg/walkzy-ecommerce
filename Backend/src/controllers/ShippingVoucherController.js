const ShippingVoucherService = require('../services/ShippingVoucherService');
const { authMiddleWare } = require('../middleware/authMiddleware');

const createShippingVoucher = async (req, res) => {
    try {
        const result = await ShippingVoucherService.createShippingVoucher(req.body);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi tạo voucher vận chuyển'
        });
    }
};

const updateShippingVoucher = async (req, res) => {
    try {
        const voucherId = req.params.id;
        if (!voucherId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Voucher ID is required'
            });
        }
        const result = await ShippingVoucherService.updateShippingVoucher(voucherId, req.body);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi cập nhật voucher vận chuyển'
        });
    }
};

const deleteShippingVoucher = async (req, res) => {
    try {
        const voucherId = req.params.id;
        if (!voucherId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Voucher ID is required'
            });
        }
        const result = await ShippingVoucherService.deleteShippingVoucher(voucherId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi xóa voucher vận chuyển'
        });
    }
};

const getAllShippingVoucher = async (req, res) => {
    try {
        const result = await ShippingVoucherService.getAllShippingVoucher();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy danh sách voucher'
        });
    }
};

const getDetailShippingVoucher = async (req, res) => {
    try {
        const voucherId = req.params.id;
        if (!voucherId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Voucher ID is required'
            });
        }
        const result = await ShippingVoucherService.getDetailShippingVoucher(voucherId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy chi tiết voucher'
        });
    }
};

const validateShippingVoucher = async (req, res) => {
    try {
        const { code, shippingProviderId, orderTotal, userId } = req.body;
        
        if (!code || orderTotal === undefined) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Thiếu thông tin bắt buộc (mã voucher hoặc tổng tiền)'
            });
        }

        const result = await ShippingVoucherService.validateShippingVoucher(
            code,
            shippingProviderId,
            orderTotal,
            userId
        );
        
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi validate voucher'
        });
    }
};

const getActiveShippingVouchers = async (req, res) => {
    try {
        const result = await ShippingVoucherService.getActiveShippingVouchers();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy danh sách voucher hoạt động'
        });
    }
};

module.exports = {
    createShippingVoucher,
    updateShippingVoucher,
    deleteShippingVoucher,
    getAllShippingVoucher,
    getDetailShippingVoucher,
    validateShippingVoucher,
    getActiveShippingVouchers
};

