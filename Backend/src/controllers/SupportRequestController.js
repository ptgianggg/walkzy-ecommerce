const SupportRequestService = require('../services/SupportRequestService');

/**
 * Kiểm tra đơn hàng có thể trả hàng không
 */
const checkCanReturn = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        if (!orderId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Order ID là bắt buộc'
            });
        }
        
        const result = await SupportRequestService.canReturnOrder(orderId);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in checkCanReturn:', error);
        return res.status(404).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi kiểm tra'
        });
    }
};

/**
 * Tạo yêu cầu hỗ trợ mới
 */
const createSupportRequest = async (req, res) => {
    try {
        const { orderId, requestType, reason, description, images } = req.body;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }
        
        if (!orderId || !requestType || !reason || !description) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Thiếu thông tin bắt buộc'
            });
        }
        
        // Kiểm tra có thể trả hàng không
        const canReturn = await SupportRequestService.canReturnOrder(orderId);
        if (!canReturn.canReturn) {
            return res.status(400).json({
                status: 'ERR',
                message: canReturn.message || 'Không thể tạo yêu cầu trả hàng'
            });
        }
        
        const data = {
            orderId,
            userId,
            requestType,
            reason,
            description,
            images: images || []
        };
        
        const result = await SupportRequestService.createSupportRequest(data);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in createSupportRequest:', error);
        return res.status(404).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi tạo yêu cầu hỗ trợ'
        });
    }
};

/**
 * Lấy danh sách yêu cầu hỗ trợ (admin)
 */
const getAllSupportRequests = async (req, res) => {
    try {
        const {
            status,
            requestType,
            userId,
            orderId,
            limit = 50,
            page = 1
        } = req.query;
        
        const filters = {
            ...(status && { status }),
            ...(requestType && { requestType }),
            ...(userId && { userId }),
            ...(orderId && { orderId })
        };
        
        const result = await SupportRequestService.getAllSupportRequests(
            filters,
            parseInt(limit),
            parseInt(page)
        );
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in getAllSupportRequests:', error);
        return res.status(404).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi lấy danh sách yêu cầu hỗ trợ'
        });
    }
};

/**
 * Lấy yêu cầu hỗ trợ theo ID
 */
const getSupportRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID yêu cầu hỗ trợ là bắt buộc'
            });
        }
        
        const result = await SupportRequestService.getSupportRequestById(id);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in getSupportRequestById:', error);
        return res.status(404).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi lấy thông tin yêu cầu hỗ trợ'
        });
    }
};

/**
 * Lấy yêu cầu hỗ trợ của user
 */
const getSupportRequestsByUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { limit = 50, page = 1 } = req.query;
        
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }
        
        const result = await SupportRequestService.getSupportRequestsByUser(
            userId,
            parseInt(limit),
            parseInt(page)
        );
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in getSupportRequestsByUser:', error);
        return res.status(404).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi lấy danh sách yêu cầu hỗ trợ'
        });
    }
};

/**
 * Cập nhật trạng thái yêu cầu hỗ trợ (admin)
 */
const updateSupportRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote, returnInstructions } = req.body;
        const handledBy = req.user?.id;
        
        if (!id || !status) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID và trạng thái là bắt buộc'
            });
        }
        
        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Trạng thái không hợp lệ'
            });
        }
        
        const result = await SupportRequestService.updateSupportRequestStatus(
            id,
            status,
            adminNote,
            returnInstructions,
            handledBy
        );
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in updateSupportRequestStatus:', error);
        return res.status(404).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi cập nhật trạng thái'
        });
    }
};

/**
 * Hoàn tiền và cập nhật stock (admin)
 */
const completeRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { productCondition } = req.body; // 'NEW' hoặc 'DEFECTIVE'
        const handledBy = req.user?.id;
        
        if (!id || !productCondition) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID và tình trạng hàng là bắt buộc'
            });
        }
        
        if (!['NEW', 'DEFECTIVE', 'DAMAGED_IN_TRANSIT'].includes(productCondition)) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Tình trạng hàng không hợp lệ (NEW, DEFECTIVE, hoặc DAMAGED_IN_TRANSIT)'
            });
        }
        
        const result = await SupportRequestService.completeRefund(
            id,
            productCondition,
            handledBy
        );
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in completeRefund:', error);
        return res.status(404).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi hoàn tiền'
        });
    }
};

module.exports = {
    checkCanReturn,
    createSupportRequest,
    getAllSupportRequests,
    getSupportRequestById,
    getSupportRequestsByUser,
    updateSupportRequestStatus,
    completeRefund
};

