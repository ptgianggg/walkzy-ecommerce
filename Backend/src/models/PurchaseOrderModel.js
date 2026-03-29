const mongoose = require('mongoose');

// Schema cho sản phẩm trong phiếu nhập
const purchaseOrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variation: {
        size: { type: String },
        color: { type: String },
        material: { type: String },
        sku: { type: String }
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    batchNumber: {
        type: String, // Số lô hàng
        trim: true
    },
    expiryDate: {
        type: Date // Hạn sử dụng (nếu có)
    },
    notes: {
        type: String
    }
}, { _id: true });

const purchaseOrderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true
        },
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        items: [purchaseOrderItemSchema],
        // Tổng tiền
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        // Thuế VAT (nếu có)
        tax: {
            type: Number,
            default: 0,
            min: 0
        },
        // Chiết khấu
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        // Tổng thanh toán
        finalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        // Trạng thái
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'received', 'cancelled', 'completed'],
            default: 'pending'
        },
        // Ngày đặt hàng
        orderDate: {
            type: Date,
            default: Date.now
        },
        // Ngày nhận hàng dự kiến
        expectedDate: {
            type: Date
        },
        // Ngày nhận hàng thực tế
        receivedDate: {
            type: Date
        },
        // Người tạo
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Người xác nhận
        confirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        // Người nhận hàng
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        // Ghi chú
        notes: {
            type: String
        },
        // Hóa đơn/Chứng từ
        invoiceNumber: {
            type: String,
            trim: true
        },
        invoiceDate: {
            type: Date
        }
    },
    {
        timestamps: true,
    }
);

// Index để tìm kiếm nhanh
purchaseOrderSchema.index({ orderNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ supplier: 1, createdAt: -1 });
purchaseOrderSchema.index({ warehouse: 1, createdAt: -1 });
purchaseOrderSchema.index({ status: 1, createdAt: -1 });
purchaseOrderSchema.index({ orderDate: -1 });

// Auto-generate orderNumber nếu không có
purchaseOrderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const prefix = `PNH-${year}${month}${day}`;
        
        // Tìm số thứ tự
        const lastOrder = await mongoose.model('PurchaseOrder')
            .findOne({ orderNumber: new RegExp(`^${prefix}`) })
            .sort({ orderNumber: -1 });
        
        let sequence = 1;
        if (lastOrder) {
            const lastSeq = parseInt(lastOrder.orderNumber.slice(-4)) || 0;
            sequence = lastSeq + 1;
        }
        
        this.orderNumber = `${prefix}-${String(sequence).padStart(4, '0')}`;
    }
    
    // Tính tổng tiền từ items
    if (this.items && this.items.length > 0) {
        this.totalAmount = this.items.reduce((sum, item) => {
            item.totalPrice = item.quantity * item.unitPrice;
            return sum + item.totalPrice;
        }, 0);
        
        this.finalAmount = this.totalAmount - (this.discount || 0) + (this.tax || 0);
    }
    
    next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;

