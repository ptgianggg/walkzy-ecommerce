const mongoose = require('mongoose')

const shippingOrderSchema = new mongoose.Schema(
    {
        order: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Order', 
            required: true,
            unique: true
        },
        provider: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'ShippingProvider', 
            required: true 
        },
        rate: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'ShippingRate', 
            required: true 
        },
        // Phương thức vận chuyển (standard/express/fast/custom)
        shippingMethod: { 
            type: String, 
            enum: ['standard', 'express', 'fast', 'custom'], 
            default: 'standard' 
        },
        
        // Thông tin vận đơn
        trackingNumber: { type: String, unique: true, sparse: true },
        trackingUrl: { type: String },
        
        // Trạng thái vận chuyển
        status: {
            type: String,
            enum: [
                'pending',           // Chờ xử lý
                'picked_up',         // Đã lấy hàng
                'in_transit',        // Đang vận chuyển
                'out_for_delivery',  // Đang giao hàng
                'delivered',         // Đã giao hàng
                'failed',            // Giao hàng thất bại
                'returned',          // Đã trả hàng
                'cancelled'           // Đã hủy
            ],
            default: 'pending'
        },
        
        // Thời gian dự kiến
        estimatedDeliveryDate: { type: Date },
        actualDeliveryDate: { type: Date },
        
        // Địa chỉ giao hàng
        shippingAddress: {
            fullName: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            district: { type: String },
            ward: { type: String },
            phone: { type: String, required: true }
        },
        
        // Phí ship
        shippingPrice: { type: Number, required: true },
        
        // Lịch sử trạng thái
        statusHistory: [{
            status: { type: String, required: true },
            changedAt: { type: Date, default: Date.now },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            note: { type: String },
            location: { type: String } // Vị trí hiện tại
        }],
        
        // Ghi chú
        notes: { type: String },
        
        // Thông tin người nhận
        recipientName: { type: String },
        recipientPhone: { type: String },
        deliveryNote: { type: String } // Ghi chú giao hàng
    },
    {
        timestamps: true
    }
)

// Middleware để tự động thêm vào statusHistory
shippingOrderSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        if (!this.statusHistory) {
            this.statusHistory = []
        }
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            note: this.notes || ''
        })
    }
    next()
})

const ShippingOrder = mongoose.model('ShippingOrder', shippingOrderSchema)
module.exports = ShippingOrder

