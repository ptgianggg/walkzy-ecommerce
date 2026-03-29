const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ['slider', 'mini_banner', 'popup', 'announcement'],
            required: true
        },
        image: { type: String }, // Không bắt buộc cho announcement
        imageMobile: { type: String }, // Ảnh cho mobile (optional)
        link: { type: String }, // Link khi click vào banner
        title: { type: String }, // Không bắt buộc cho announcement
        description: { type: String }, // Không bắt buộc cho announcement
        // Cho popup
        showOnPages: [{ type: String }], // ['home', 'product', 'cart']
        // Cho announcement
        text: { type: String }, // Text cho announcement bar
        backgroundColor: { type: String },
        textColor: { type: String },
        // Cho mini_banner (homepage banner) - layout tự động
        layout: { 
            type: String, 
            enum: ['single', 'double', 'triple', 'grid'], // 1, 2, 3, 4 ảnh
            default: 'single' 
        },
        // Thứ tự hiển thị
        order: { type: Number, default: 0 },
        // Trạng thái
        isActive: { type: Boolean, default: true },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    {
        timestamps: true,
    }
);

// Validation: image bắt buộc cho tất cả loại trừ announcement
bannerSchema.pre('validate', function(next) {
    if (this.type !== 'announcement' && !this.image) {
        this.invalidate('image', 'Hình ảnh là bắt buộc cho loại banner này');
    }
    if (this.type === 'announcement' && !this.text) {
        this.invalidate('text', 'Nội dung text là bắt buộc cho thanh chạy chữ');
    }
    next();
});

const Banner = mongoose.model('Banner', bannerSchema);
module.exports = Banner;

