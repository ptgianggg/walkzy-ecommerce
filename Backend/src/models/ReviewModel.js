const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        // User đánh giá
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        
        // Sản phẩm được đánh giá
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        
        // Đơn hàng liên quan
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        
        // Số sao (1-5)
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        
        // Nội dung đánh giá (không bắt buộc)
        content: {
            type: String,
            default: ''
        },
        
        // Ảnh review (tối đa 6 ảnh)
        images: [{
            type: String
        }],
        
        // Video review (tùy chọn)
        video: {
            type: String
        },
        
        // Tags đánh giá nhanh (Đúng mô tả, Đóng gói đẹp, Giao hàng nhanh)
        tags: [{
            type: String,
            enum: ['Đúng mô tả', 'Đóng gói đẹp', 'Giao hàng nhanh']
        }],
        
        // Thuộc tính sản phẩm đã mua (variation)
        variation: {
            size: { type: String },
            color: { type: String },
            material: { type: String },
            sku: { type: String }
        },
        
        // Trạng thái review (để admin có thể ẩn review xấu)
        isActive: {
            type: Boolean,
            default: true
        },
        
        // Cần kiểm duyệt (phát hiện từ khóa xấu)
        needsModeration: {
            type: Boolean,
            default: false
        },
        
        // Admin có thể reply review (Shop reply)
        adminReply: {
            content: { type: String },
            repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            repliedAt: { type: Date }
        }
    },
    {
        timestamps: true
    }
);

// Index để đảm bảo 1 user chỉ đánh giá 1 lần cho 1 sản phẩm trong 1 đơn hàng
// Và có thể filter theo variation
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// Index để query reviews của sản phẩm
reviewSchema.index({ product: 1, isActive: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

