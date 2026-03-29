const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        // Variation info (nếu sản phẩm có variations)
        variation: {
            size: { type: String },
            color: { type: String },
            material: { type: String },
            sku: { type: String }
        },
        // Số lượng tồn kho
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        // Số lượng đã đặt (đang trong đơn hàng chưa giao)
        reservedQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        // Số lượng có thể bán (quantity - reservedQuantity)
        availableQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        // Cảnh báo khi số lượng <= threshold
        lowStockThreshold: {
            type: Number,
            default: 10 // Mặc định cảnh báo khi <= 10
        },
        // Vị trí trong kho (tùy chọn)
        location: {
            type: String // Ví dụ: "Kệ A-01", "Khu vực B"
        },
        // Ghi chú
        notes: {
            type: String
        },
        // Tồn kho theo lô (batch tracking)
        batches: [{
            batchNumber: {
                type: String,
                required: true,
                trim: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 0
            },
            purchaseOrder: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PurchaseOrder'
            },
            supplier: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Supplier'
            },
            importDate: {
                type: Date,
                default: Date.now
            },
            expiryDate: {
                type: Date // Hạn sử dụng (nếu có)
            },
            notes: {
                type: String
            }
        }]
    },
    {
        timestamps: true,
    }
);

// Index để tìm kiếm nhanh
stockSchema.index({ product: 1, warehouse: 1 });
stockSchema.index({ 'variation.sku': 1 });
stockSchema.index({ quantity: 1 }); // Để tìm sản phẩm sắp hết hàng

// Middleware để tự động tính availableQuantity
stockSchema.pre('save', function(next) {
    this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
    next();
});

// Method để kiểm tra sắp hết hàng
stockSchema.methods.isLowStock = function() {
    return this.availableQuantity <= this.lowStockThreshold;
};

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;

