const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        code: {
            type: String,
            sparse: true,
            trim: true,
            uppercase: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        district: {
            type: String,
            trim: true
        },
        ward: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
        },
        phone: {
            type: String,
            trim: true
        },
        contactPerson: {
            type: String, // Người liên hệ
            trim: true
        },
        taxCode: {
            type: String, // Mã số thuế
            trim: true
        },
        bankAccount: {
            accountNumber: { type: String, trim: true },
            bankName: { type: String, trim: true },
            accountHolder: { type: String, trim: true }
        },
        notes: {
            type: String
        },
        isActive: {
            type: Boolean,
            default: true
        },
        // Thống kê
        totalOrders: {
            type: Number,
            default: 0
        },
        totalValue: {
            type: Number,
            default: 0 // Tổng giá trị đơn hàng
        },
        lastOrderDate: {
            type: Date
        }
    },
    {
        timestamps: true,
    }
);

// Index để tìm kiếm nhanh
supplierSchema.index({ code: 1 }, { unique: true, sparse: true });
supplierSchema.index({ email: 1 });
supplierSchema.index({ name: 1 });
supplierSchema.index({ isActive: 1 });

// Auto-generate code nếu không có
supplierSchema.pre('save', async function(next) {
    if (!this.code) {
        // Tạo mã từ tên (ví dụ: "Công ty ABC" -> "NCC-ABC")
        const nameCode = this.name
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 10)
            .toUpperCase();
        let code = `NCC-${nameCode}`;
        let counter = 1;
        
        // Kiểm tra trùng lặp
        while (await mongoose.model('Supplier').findOne({ code })) {
            code = `NCC-${nameCode}${counter}`;
            counter++;
        }
        this.code = code;
    }
    next();
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;

