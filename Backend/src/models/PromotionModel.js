const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        code: { type: String, unique: true, sparse: true }, // Mã voucher (optional)
        description: { type: String },
        type: { 
            type: String, 
            enum: ['percentage', 'fixed', 'buy1get1', 'buy2discount', 'combo', 'flash_sale', 'voucher_new_user', 'voucher_shop_wide'],
            required: true 
        },
        // Voucher cho user mới
        isForNewUser: { type: Boolean, default: false },
        // Voucher toàn shop (không giới hạn sản phẩm/category/brand)
        isShopWide: { type: Boolean, default: false },
        value: { type: Number, required: true }, // Giá trị giảm (%, VNĐ, hoặc số lượng)
        minPurchase: { type: Number, default: 0 }, // Giá trị đơn hàng tối thiểu
        maxDiscount: { type: Number }, // Giảm tối đa (cho percentage)
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        // Áp dụng cho sản phẩm cụ thể
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        // Áp dụng cho category cụ thể
        categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
        // Áp dụng cho brand cụ thể
        brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
        // Áp dụng cho size cụ thể (cho variations)
        applicableSizes: [{ type: String }], // ['39', '40', '41']
        // Áp dụng cho màu cụ thể
        applicableColors: [{ type: String }], // ['Đỏ', 'Xanh', 'Đen']
        // Combo products (cho type: combo)
        comboProducts: [{
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, default: 1 }
        }],
        // Flash sale settings
        flashSaleStart: { type: Date },
        flashSaleEnd: { type: Date },
        flashSaleStock: { type: Number }, // Số lượng sản phẩm trong flash sale
        usageLimit: { type: Number }, // Giới hạn số lần sử dụng
        usageCount: { type: Number, default: 0 }, // Số lần đã sử dụng
        userLimit: { type: Number, default: 1 }, // Mỗi user dùng tối đa bao nhiêu lần
    },
    {
        timestamps: true,
    }
);

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;

