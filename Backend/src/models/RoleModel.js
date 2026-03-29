const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
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
        permissions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        isSystem: {
            type: Boolean,
            default: false // Vai trò hệ thống không thể xóa
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
roleSchema.index({ code: 1 }, { unique: true });
roleSchema.index({ isActive: 1 });

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;

