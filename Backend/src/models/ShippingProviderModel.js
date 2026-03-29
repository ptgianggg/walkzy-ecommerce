const mongoose = require('mongoose')

const shippingProviderSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true }, // Tên nhà vận chuyển: GHTK, GHN, Viettel Post, etc.
        code: { type: String, required: true, unique: true }, // Mã code: GHTK, GHN, VTP, etc.
        logo: { type: String }, // Logo URL
        description: { type: String },
        phone: { type: String },
        email: { type: String },
        website: { type: String },
        isActive: { type: Boolean, default: true },
        // Cấu hình API (nếu có tích hợp)
        apiConfig: {
            apiKey: { type: String },
            apiUrl: { type: String },
            shopId: { type: String }
        }
    },
    {
        timestamps: true
    }
)

const ShippingProvider = mongoose.model('ShippingProvider', shippingProviderSchema)
module.exports = ShippingProvider

