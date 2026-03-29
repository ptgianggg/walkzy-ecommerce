const mongoose = require('mongoose')

// Schema cho variations (size, màu, chất liệu)
const variationSchema = new mongoose.Schema({
    size: { type: String }, // '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'
    color: { type: String }, // 'Đỏ', 'Xanh', 'Đen', 'Trắng', etc.
    material: { type: String }, // 'Da', 'Vải', 'Nhựa', etc.
    sku: { type: String, sparse: true }, // Mã SKU (bỏ unique để tránh lỗi, sẽ validate ở service)
    stock: { type: Number, required: true, default: 0 }, // Tồn kho cho biến thể này
    price: { type: Number }, // Giá riêng cho biến thể (nếu khác giá gốc)
    image: { type: String }, // Hình ảnh riêng cho biến thể
    isActive: { type: Boolean, default: true }
}, { _id: true });

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, unique: true, sparse: true },
        images: [{ type: String }], // Nhiều hình ảnh
        image: { type: String, required: true }, // Hình ảnh chính (giữ lại để tương thích)
        type: { type: String }, // Không bắt buộc (đã thay thế bằng category)
        // Quan hệ với Category, Brand, Collection
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
        collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
        // Giá và tồn kho
        originalPrice: { type: Number }, // Giá gốc (nếu không có thì dùng price)
        price: { type: Number, required: true }, // Giá bán (giá sau khi giảm)
        countInStock: { type: Number, required: true, default: 0 }, // Tồn kho tổng (tính từ variations)
        // Thời gian sale
        saleStartDate: { type: Date }, // Thời gian bắt đầu giảm giá
        saleEndDate: { type: Date }, // Thời gian kết thúc giảm giá
        // Variations - quản lý size, màu, chất liệu
        variations: [variationSchema],
        hasVariations: { type: Boolean, default: false }, // Có sử dụng variations không
        // Thông tin khác
        rating: { type: Number, required: true, default: 0 },
        description: { type: String },
        shortDescription: { type: String },
        discount: { type: Number, default: 0 },
        selled: { type: Number, default: 0 },
        views: { type: Number, default: 0 }, // Lượt xem sản phẩm
        baseSKU: { type: String }, // Mã SKU gốc cho sản phẩm
        favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách user đã yêu thích
        favoritesCount: { type: Number, default: 0 }, // Tổng lượt yêu thích
        // SEO
        metaTitle: { type: String },
        metaDescription: { type: String },
        // Trạng thái
        isActive: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        isNewProduct: { type: Boolean, default: false }, // Đổi tên từ isNew để tránh conflict với Mongoose reserved pathname

        // Thông tin vận chuyển (metadata để tính phí ship tự động)
        weight: { type: Number, default: 0 }, // Cân nặng (gram)
        length: { type: Number, default: 0 }, // Chiều dài (cm)
        width: { type: Number, default: 0 },  // Chiều rộng (cm)
        height: { type: Number, default: 0 }, // Chiều cao (cm)
    },
    {
        timestamps: true,
    }
);

// Middleware để tự động tính tồn kho tổng từ variations
productSchema.pre('save', function(next) {
    if (this.hasVariations && this.variations && this.variations.length > 0) {
        this.countInStock = this.variations.reduce((total, variation) => {
            return total + (variation.stock || 0);
        }, 0);
    }
    next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;