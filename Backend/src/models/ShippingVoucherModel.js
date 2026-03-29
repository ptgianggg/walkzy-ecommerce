const mongoose = require('mongoose');

const shippingVoucherSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // Tên voucher
        code: { type: String, sparse: true }, // Mã voucher (tùy chọn, tự động generate nếu không có)
        description: { type: String }, // Mô tả ngắn
        type: {
            type: String,
            enum: ['percentage', 'fixed', 'free'], // Giảm theo %, Giảm số tiền, Miễn phí ship
            required: true
        },
        value: { type: Number, required: true }, // Giá trị giảm (% hoặc số tiền VNĐ)
        minPurchase: { type: Number, default: 0 }, // Đơn hàng tối thiểu để áp dụng (VND)
        maxDiscount: { type: Number }, // Giảm tối đa (VND) - chỉ áp dụng cho type: percentage
        // Chọn nhà vận chuyển (có thể chọn nhiều hoặc null = tất cả)
        shippingProviders: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'ShippingProvider' 
        }],
        startDate: { type: Date, required: true }, // Ngày bắt đầu
        endDate: { type: Date, required: true }, // Ngày kết thúc
        usageLimit: { type: Number }, // Giới hạn sử dụng tổng cộng (null = không giới hạn)
        usageCount: { type: Number, default: 0 }, // Số lần đã sử dụng
        userLimit: { type: Number, default: 1 }, // Mỗi user sử dụng tối đa
        isActive: { type: Boolean, default: true }, // Trạng thái Bật/Tắt
        // Thống kê
        totalDiscountAmount: { type: Number, default: 0 }, // Tổng số tiền đã giảm
    },
    {
        timestamps: true,
    }
);

// Index để tìm nhanh
shippingVoucherSchema.index({ code: 1 }, { unique: true, sparse: true });
shippingVoucherSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
shippingVoucherSchema.index({ shippingProviders: 1 });

// Auto-generate code nếu không có
shippingVoucherSchema.pre('save', function(next) {
    if (!this.code && this.isNew) {
        // Tạo code tự động: SHIP-{timestamp}-{random}
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.code = `SHIP-${timestamp}-${random}`;
    }
    next();
});

const ShippingVoucher = mongoose.model('ShippingVoucher', shippingVoucherSchema);
module.exports = ShippingVoucher;

