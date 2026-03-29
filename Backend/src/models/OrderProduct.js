const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    orderItems: [
        {
            name: { type: String, required: true },
            amount: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            discount: { type: Number },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            // Thêm variation info nếu có
            variation: {
                size: { type: String },
                color: { type: String },
                material: { type: String },
                sku: { type: String }
            }
        },
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        province: { type: String },
        district: { type: String },
        ward: { type: String },
        phone: { type: Number, required: true },
    },
    paymentMethod: { type: String, required: true },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    voucherDiscount: { type: Number, default: 0 },
    voucherCode: { type: String },
    promotion: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' }, // Tham chiếu đến promotion đã sử dụng
    // Shipping voucher
    shippingVoucher: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingVoucher' },
    shippingVoucherCode: { type: String },
    shippingVoucherDiscount: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Trạng thái đơn hàng
    status: {
        type: String,
        enum: ['pending_payment', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'returned'],
        default: 'pending'
    },

    // Thanh toán
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paymentTransactionId: { type: String }, // ID giao dịch thanh toán
    paymentExpiredAt: { type: Date }, // Thời hạn thanh toán (24h)

    // Giao hàng
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    // Hủy đơn
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelReason: { type: String }, // Lý do hủy
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Ai hủy (user hoặc admin)

    // Hoàn tiền
    isRefunded: { type: Boolean, default: false },
    refundedAt: { type: Date },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundTransactionId: { type: String },

    // Shipping method info
    shippingProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingProvider' }, // Nhà vận chuyển
    shippingRate: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingRate' }, // Bảng phí đã chọn
    shippingMethod: { type: String, enum: ['standard', 'express', 'fast', 'custom'] }, // Phương thức user chọn, BE chọn hãng

    // Tracking
    shippingCompany: { type: String }, // Đơn vị vận chuyển (deprecated, dùng shippingProvider)
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    
    // Status van chuyen rieng biet (dong bo voi ShippingOrder)
    shippingStatus: {
        type: String,
        enum: ['pending', 'picked_up', 'shipping', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'],
        default: null
    },

    // Đơn thủ công
    isManualOrder: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin tạo đơn thủ công

    // Log thay đổi trạng thái
    statusHistory: [{
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String }
    }],

    // Ghi chú đơn hàng
    notes: { type: String },

},
    {
        timestamps: true,
    }
);

// Middleware để tự động thêm vào statusHistory khi status thay đổi
orderSchema.pre('save', function (next) {
    if (this.isModified('status') && !this.isNew) {
        if (!this.statusHistory) {
            this.statusHistory = [];
        }
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            note: this.notes || ''
        });
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order
