const mongoose = require('mongoose');

// Danh sách modules chuẩn
const MODULES = [
    'user',              // Người dùng
    'product',           // Sản phẩm
    'order',             // Đơn hàng
    'category',          // Danh mục
    'brand',             // Thương hiệu
    'collection',        // Bộ sưu tập
    'promotion',         // Khuyến mãi
    'banner',            // Banner/Thông báo
    'attribute',         // Thuộc tính
    'analytics',         // Thống kê
    'review',            // Đánh giá
    'notification',      // Thông báo
    'voucher',           // Mã giảm giá
    'chat',              // Chat
    'shipping',          // Vận chuyển
    'warehouse',         // Kho hàng
    'stock',             // Tồn kho
    'supplier',          // Nhà cung cấp
    'purchase-order',    // Đơn mua hàng
    'support-request',    // Hỗ trợ/Khiếu nại
    'settings',          // Cài đặt hệ thống
    'role',              // Vai trò
    'permission'         // Quyền
];

// Danh sách actions chuẩn
const ACTIONS = [
    'create',    // Tạo
    'read',      // Xem
    'update',    // Cập nhật
    'delete',    // Xóa
    'manage',    // Quản lý (toàn quyền)
    'export',    // Xuất dữ liệu
    'import'     // Nhập dữ liệu
];

const permissionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        module: {
            type: String,
            required: true,
            enum: MODULES
        },
        action: {
            type: String,
            required: true,
            enum: ACTIONS
        },
        isSensitive: {
            type: Boolean,
            default: false // Quyền nhạy cảm (xóa đơn, chỉnh giá, etc.)
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

// Index để tìm kiếm nhanh
permissionSchema.index({ code: 1 }, { unique: true });
permissionSchema.index({ module: 1, action: 1 });
permissionSchema.index({ isActive: 1 });

// Virtual để tạo full permission code
permissionSchema.virtual('fullCode').get(function() {
    return `${this.module}.${this.action}`;
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = {
    Permission,
    MODULES,
    ACTIONS
};

