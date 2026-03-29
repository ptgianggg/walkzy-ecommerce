const mongoose = require('mongoose')

const shippingRateSchema = new mongoose.Schema(
    {
        // Phương thức vận chuyển (user chọn) - backend tự pick provider
        shippingMethod: { 
            type: String, 
            enum: ['standard', 'express', 'fast', 'custom'], 
            required: true 
        },
        // Danh sách nhà vận chuyển hỗ trợ để BE tự chọn
        supportedProviders: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ShippingProvider'
        }],
        // Legacy: provider cũ (một nhà vận chuyển) giữ để tương thích, không bắt buộc nữa
        provider: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'ShippingProvider'
        },
        name: { type: String, required: true }, // Tên bảng phí/phương thức hiển thị nội bộ
        code: { type: String, required: true }, // Mã: FAST, STANDARD, ECONOMY
        description: { type: String },
        
        // Bảng phí theo khoảng cách hoặc giá trị đơn hàng
        rateType: { 
            type: String, 
            enum: ['by_distance', 'by_order_value', 'fixed', 'by_weight'],
            default: 'by_order_value'
        },
        
        // Phí cố định
        fixedPrice: { type: Number, default: 0 },
        
        // Phí theo giá trị đơn hàng (tiers)
        orderValueTiers: [{
            minValue: { type: Number, required: true }, // Giá trị đơn hàng tối thiểu
            maxValue: { type: Number }, // Giá trị đơn hàng tối đa (null = không giới hạn)
            price: { type: Number, required: true } // Phí ship
        }],
        
        // Phí theo khoảng cách (km)
        distanceTiers: [{
            minDistance: { type: Number, required: true },
            maxDistance: { type: Number },
            price: { type: Number, required: true }
        }],
        
        // Phí theo trọng lượng (kg)
        weightTiers: [{
            minWeight: { type: Number, required: true },
            maxWeight: { type: Number },
            price: { type: Number, required: true }
        }],
        
        // Thời gian giao hàng dự kiến (ETA) - số ngày
        estimatedDays: { 
            min: { type: Number, default: 1 }, // Tối thiểu
            max: { type: Number, default: 3 } // Tối đa
        },
        
        // Miễn phí ship nếu đơn hàng >= giá trị này
        freeShippingThreshold: { type: Number, default: null },
        
        // Áp dụng cho khu vực nào
        applicableRegions: [{ type: String }], // ['HCM', 'HN', 'all']
        
        isActive: { type: Boolean, default: true },
        priority: { type: Number, default: 0 } // Độ ưu tiên hiển thị
    },
    {
        timestamps: true
    }
)

// Indexing for performance optimization
shippingRateSchema.index({ shippingMethod: 1, isActive: 1 })
shippingRateSchema.index({ priority: -1 })
shippingRateSchema.index({ applicableRegions: 1 })

const ShippingRate = mongoose.model('ShippingRate', shippingRateSchema)
module.exports = ShippingRate

