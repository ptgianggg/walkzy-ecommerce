const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
    {
        // Mã yêu cầu (tự động tạo)
        requestCode: {
            type: String,
            required: true,
            default: () => `SR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        },
        
        // Mã đơn hàng
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        
        // Khách hàng
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        
        // Loại yêu cầu
        requestType: {
            type: String,
            enum: ['RETURN_REFUND', 'OTHER_COMPLAINT'],
            required: true
        },
        
        // Lý do
        reason: {
            type: String,
            enum: ['WRONG_DESCRIPTION', 'DEFECTIVE_PRODUCT', 'MISSING_ITEMS', 'SHIPPER_ATTITUDE', 'OTHER'],
            required: true
        },
        
        // Ghi chú chi tiết
        description: {
            type: String,
            required: true
        },
        
        // Ảnh chứng minh
        images: {
            type: [String],
            default: []
        },
        
        // Trạng thái
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
            default: 'PENDING'
        },
        
        // Hướng dẫn trả hàng (khi admin chấp nhận)
        returnInstructions: {
            type: String,
            default: ''
        },
        
        // Trạng thái hàng khi nhận về (NEW, DEFECTIVE, hoặc DAMAGED_IN_TRANSIT)
        productCondition: {
            type: String,
            enum: ['NEW', 'DEFECTIVE', 'DAMAGED_IN_TRANSIT'],
            default: null
        },
        
        // Đã hoàn tiền
        isRefunded: {
            type: Boolean,
            default: false
        },
        
        // Ngày hoàn tiền
        refundedAt: {
            type: Date,
            default: null
        },
        
        // Ghi chú nội bộ / phản hồi cho khách
        adminNote: {
            type: String,
            default: ''
        },
        
        // Admin xử lý
        handledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        
        // Ngày xử lý
        handledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Index để tìm kiếm nhanh
supportRequestSchema.index({ orderId: 1, createdAt: -1 });
supportRequestSchema.index({ userId: 1, createdAt: -1 });
supportRequestSchema.index({ status: 1, createdAt: -1 });
supportRequestSchema.index({ requestCode: 1 }, { unique: true });

const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);
module.exports = SupportRequest;

