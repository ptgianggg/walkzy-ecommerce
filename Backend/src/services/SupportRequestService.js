const SupportRequest = require('../models/SupportRequestModel');
const Order = require('../models/OrderProduct');
const Product = require('../models/ProductModel');
const Stock = require('../models/StockModel');
const { updateVariationStock } = require('../utils/stockHelper');

/**
 * Tạo yêu cầu hỗ trợ mới
 */
const createSupportRequest = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const supportRequest = await SupportRequest.create(data);
            resolve({
                status: 'OK',
                message: 'Yêu cầu hỗ trợ đã được tạo thành công',
                data: supportRequest
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Lấy danh sách yêu cầu hỗ trợ (admin)
 */
const getAllSupportRequests = (filters = {}, limit = 50, page = 1) => {
    return new Promise(async (resolve, reject) => {
        try {
            const skip = (page - 1) * limit;
            
            // Build query
            const query = {};
            
            if (filters.status) {
                query.status = filters.status;
            }
            
            if (filters.requestType) {
                query.requestType = filters.requestType;
            }
            
            if (filters.userId) {
                query.userId = filters.userId;
            }
            
            if (filters.orderId) {
                query.orderId = filters.orderId;
            }
            
            // Execute query
            const requests = await SupportRequest.find(query)
                .populate('userId', 'name email phone')
                .populate('orderId')
                .populate('handledBy', 'name email')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();
            
            const total = await SupportRequest.countDocuments(query);
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: requests,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Lấy yêu cầu hỗ trợ theo ID
 */
const getSupportRequestById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const request = await SupportRequest.findById(id)
                .populate('userId', 'name email phone address')
                .populate({
                    path: 'orderId',
                    populate: {
                        path: 'orderItems.product',
                        select: 'name image'
                    }
                })
                .populate('handledBy', 'name email')
                .lean();
            
            if (!request) {
                return resolve({
                    status: 'ERR',
                    message: 'Không tìm thấy yêu cầu hỗ trợ'
                });
            }
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: request
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Lấy yêu cầu hỗ trợ của một user
 */
const getSupportRequestsByUser = (userId, limit = 50, page = 1) => {
    return new Promise(async (resolve, reject) => {
        try {
            const skip = (page - 1) * limit;
            
            const requests = await SupportRequest.find({ userId })
                .populate({
                    path: 'orderId',
                    populate: {
                        path: 'orderItems.product',
                        select: 'name image'
                    }
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();
            
            const total = await SupportRequest.countDocuments({ userId });
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: requests,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Cập nhật trạng thái yêu cầu hỗ trợ (admin)
 */
const updateSupportRequestStatus = (id, status, adminNote, returnInstructions, handledBy) => {
    return new Promise(async (resolve, reject) => {
        try {
            const updateData = {
                status,
                handledBy,
                handledAt: new Date()
            };
            
            if (adminNote) {
                updateData.adminNote = adminNote;
            }
            
            if (returnInstructions) {
                updateData.returnInstructions = returnInstructions;
            }
            
            const request = await SupportRequest.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            )
                .populate('userId', 'name email phone')
                .populate('orderId')
                .populate('handledBy', 'name email')
                .lean();
            
            if (!request) {
                return resolve({
                    status: 'ERR',
                    message: 'Không tìm thấy yêu cầu hỗ trợ'
                });
            }
            
            resolve({
                status: 'OK',
                message: 'Cập nhật trạng thái thành công',
                data: request
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Hoàn tiền và cập nhật stock (admin)
 */
const completeRefund = (id, productCondition, handledBy) => {
    return new Promise(async (resolve, reject) => {
        try {
            const request = await SupportRequest.findById(id)
                .populate('orderId')
                .populate('userId');
            
            if (!request) {
                return resolve({
                    status: 'ERR',
                    message: 'Không tìm thấy yêu cầu hỗ trợ'
                });
            }
            
            if (request.status !== 'APPROVED') {
                return resolve({
                    status: 'ERR',
                    message: 'Chỉ có thể hoàn tiền khi yêu cầu đã được chấp nhận'
                });
            }
            
            const order = request.orderId;
            if (!order) {
                return resolve({
                    status: 'ERR',
                    message: 'Không tìm thấy đơn hàng'
                });
            }
            
            // Cập nhật stock tùy theo tình trạng hàng
            if (productCondition === 'NEW' || productCondition === 'DAMAGED_IN_TRANSIT') {
                const restoreStockResults = await Promise.all(
                    order.orderItems.map(async (item) => {
                        // Kiểm tra xem item có variation không
                        if (item.variation && (item.variation.color || item.variation.size)) {
                            // Hoàn lại stock của variation
                            if (productCondition === 'NEW') {
                                // NEW: tăng stock và giảm selled
                                const result = await updateVariationStock(
                                    Product,
                                    item.product,
                                    item.variation,
                                    item.amount,
                                    'increase' // increase = hoàn lại stock (tăng stock, giảm selled)
                                );
                                return result;
                            } else {
                                // DAMAGED_IN_TRANSIT: chỉ tăng stock, không giảm selled
                                const product = await Product.findById(item.product);
                                if (!product) {
                                    return { success: false, message: 'Sản phẩm không tồn tại' };
                                }

                                // Tìm variation
                                const foundVariation = product.variations.find(v => {
                                    const matchColor = !item.variation.color || v.color === item.variation.color || (!v.color && !item.variation.color);
                                    const matchSize = !item.variation.size || v.size === item.variation.size || (!v.size && !item.variation.size);
                                    return matchColor && matchSize && v.isActive;
                                });

                                if (foundVariation) {
                                    foundVariation.stock += item.amount;
                                    // Cập nhật countInStock tổng
                                    product.countInStock = product.variations.reduce((total, v) => total + (v.stock || 0), 0);
                                    // KHÔNG giảm selled
                                    await product.save();
                                    return { success: true, product, variation: foundVariation };
                                } else {
                                    return { success: false, message: 'Không tìm thấy biến thể sản phẩm' };
                                }
                            }
                        } else {
                            // Không có variation
                            if (productCondition === 'NEW') {
                                // NEW: tăng stock và giảm selled
                                const productData = await Product.findOneAndUpdate(
                                    { _id: item.product },
                                    {
                                        $inc: {
                                            countInStock: +item.amount,
                                            selled: -item.amount
                                        }
                                    },
                                    { new: true }
                                );
                                return {
                                    success: !!productData,
                                    message: productData ? 'OK' : 'Sản phẩm không tồn tại',
                                    product: productData
                                };
                            } else {
                                // DAMAGED_IN_TRANSIT: chỉ tăng stock, không giảm selled
                                const productData = await Product.findOneAndUpdate(
                                    { _id: item.product },
                                    {
                                        $inc: {
                                            countInStock: +item.amount
                                            // KHÔNG giảm selled
                                        }
                                    },
                                    { new: true }
                                );
                                return {
                                    success: !!productData,
                                    message: productData ? 'OK' : 'Sản phẩm không tồn tại',
                                    product: productData
                                };
                            }
                        }
                    })
                );

                // Kiểm tra kết quả
                const errors = restoreStockResults.filter(r => !r.success);
                if (errors.length > 0) {
                    const errorMessages = errors.map(e => e.message || 'Không thể hoàn lại tồn kho').join('; ');
                    console.error('Error restoring stock:', errorMessages);
                    // Vẫn tiếp tục hoàn tiền nhưng log lỗi
                }
            }
            // Nếu hàng lỗi (DEFECTIVE), không cập nhật stock
            
            // Cập nhật request
            request.status = 'COMPLETED';
            request.productCondition = productCondition;
            request.isRefunded = true;
            request.refundedAt = new Date();
            request.handledBy = handledBy;
            await request.save();
            
            // Cập nhật order
            order.isRefunded = true;
            order.refundedAt = new Date();
            order.refundAmount = order.totalPrice;
            order.refundReason = 'Trả hàng theo yêu cầu';
            await order.save();
            
            const updatedRequest = await SupportRequest.findById(id)
                .populate('userId', 'name email phone')
                .populate('orderId')
                .populate('handledBy', 'name email')
                .lean();
            
            resolve({
                status: 'OK',
                message: 'Hoàn tiền thành công',
                data: updatedRequest
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Kiểm tra đơn hàng có thể trả hàng không (trong vòng 7 ngày)
 */
const canReturnOrder = (orderId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.findById(orderId).lean();
            
            if (!order) {
                return resolve({
                    status: 'ERR',
                    message: 'Không tìm thấy đơn hàng',
                    canReturn: false
                });
            }
            
            // Kiểm tra đơn đã được giao hoặc hoàn thành chưa
            if (order.status !== 'delivered' && order.status !== 'completed') {
                return resolve({
                    status: 'OK',
                    canReturn: false,
                    message: 'Chỉ có thể trả hàng khi đơn đã được giao hoặc hoàn thành'
                });
            }
            
            // Lấy ngày nhận hàng
            // Nếu status = 'completed', lấy updatedAt khi chuyển sang completed
            // Nếu status = 'delivered', lấy deliveredAt hoặc updatedAt khi chuyển sang delivered
            let receivedDate = null;
            
            if (order.status === 'completed') {
                // Tìm trong statusHistory ngày chuyển sang completed
                if (order.statusHistory && order.statusHistory.length > 0) {
                    const completedHistory = order.statusHistory
                        .filter(h => h.status === 'completed')
                        .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))[0];
                    if (completedHistory) {
                        receivedDate = completedHistory.changedAt;
                    }
                }
                // Fallback: lấy updatedAt
                if (!receivedDate) {
                    receivedDate = order.updatedAt;
                }
            } else if (order.status === 'delivered') {
                receivedDate = order.deliveredAt || order.updatedAt;
            }
            
            if (!receivedDate) {
                return resolve({
                    status: 'OK',
                    canReturn: false,
                    message: 'Không xác định được ngày nhận hàng'
                });
            }
            
            // Kiểm tra 7 ngày
            const now = new Date();
            const receivedDateObj = new Date(receivedDate);
            const daysDiff = Math.floor((now - receivedDateObj) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 7) {
                return resolve({
                    status: 'OK',
                    canReturn: false,
                    message: `Đã quá 7 ngày kể từ ngày nhận hàng (${daysDiff} ngày)`,
                    daysDiff
                });
            }
            
            // Kiểm tra đã có yêu cầu trả hàng chưa
            const existingRequest = await SupportRequest.findOne({
                orderId: orderId,
                requestType: 'RETURN_REFUND',
                status: { $in: ['PENDING', 'APPROVED'] }
            });
            
            if (existingRequest) {
                return resolve({
                    status: 'OK',
                    canReturn: false,
                    message: 'Đơn hàng đã có yêu cầu trả hàng đang xử lý',
                    existingRequest: existingRequest._id
                });
            }
            
            resolve({
                status: 'OK',
                canReturn: true,
                daysRemaining: 7 - daysDiff,
                message: `Còn ${7 - daysDiff} ngày để yêu cầu trả hàng`
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    createSupportRequest,
    getAllSupportRequests,
    getSupportRequestById,
    getSupportRequestsByUser,
    updateSupportRequestStatus,
    completeRefund,
    canReturnOrder
};

