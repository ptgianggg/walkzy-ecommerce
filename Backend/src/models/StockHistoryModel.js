const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema(
    {
        stock: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stock',
            required: true
        },
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
        // Loại giao dịch
        type: {
            type: String,
            enum: ['import', 'export', 'adjustment', 'transfer', 'reserve', 'unreserve'],
            required: true
        },
        // Số lượng thay đổi (dương = nhập, âm = xuất)
        quantity: {
            type: Number,
            required: true
        },
        // Số lượng trước khi thay đổi
        previousQuantity: {
            type: Number,
            required: true
        },
        // Số lượng sau khi thay đổi
        newQuantity: {
            type: Number,
            required: true
        },
        // Lý do thay đổi
        reason: {
            type: String,
            required: true
        },
        // Người thực hiện
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Liên kết với đơn hàng (nếu là export từ đơn hàng)
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        // Ghi chú
        notes: {
            type: String
        },
        // Variation info (để dễ tìm kiếm)
        variation: {
            size: { type: String },
            color: { type: String },
            material: { type: String },
            sku: { type: String }
        }
    },
    {
        timestamps: true,
    }
);

// Index để tìm kiếm nhanh
stockHistorySchema.index({ stock: 1, createdAt: -1 });
stockHistorySchema.index({ product: 1, createdAt: -1 });
stockHistorySchema.index({ warehouse: 1, createdAt: -1 });
stockHistorySchema.index({ type: 1, createdAt: -1 });
stockHistorySchema.index({ order: 1 });

const StockHistory = mongoose.model('StockHistory', stockHistorySchema);

module.exports = StockHistory;

