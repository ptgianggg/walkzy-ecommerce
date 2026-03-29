const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        code: {
            type: String,
            unique: true,
            sparse: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        district: {
            type: String
        },
        ward: {
            type: String
        },
        phone: {
            type: String
        },
        email: {
            type: String
        },
        manager: {
            type: String // Tên người quản lý kho
        },
        description: {
            type: String
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDefault: {
            type: Boolean,
            default: false // Kho mặc định
        }
    },
    {
        timestamps: true,
    }
);

// Đảm bảo chỉ có 1 kho mặc định
warehouseSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await mongoose.model('Warehouse').updateMany(
            { _id: { $ne: this._id }, isDefault: true },
            { isDefault: false }
        );
    }
    next();
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;

