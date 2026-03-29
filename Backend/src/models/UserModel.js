const mongoose = require('mongoose')
const userSchema = new mongoose.Schema(
    {
        name:{type:String},
        email:{type:String,required:true,unique:true},
        password:{type:String},
        googleId:{type:String,unique:true,sparse:true},
        isAdmin:{type:Boolean,default:false, required:true},
        
        // Roles mở rộng (giữ lại để tương thích)
        role: {
            type: String,
            enum: ['customer', 'admin', 'manager', 'sale_staff', 'shipper'],
            default: 'customer'
        },
        
        // Liên kết với Role model (ưu tiên sử dụng)
        roleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null
        },
        
        // Trạng thái tài khoản
        isActive: { type: Boolean, default: true },
        isLocked: { type: Boolean, default: false },
        lockedAt: { type: Date },
        lockReason: { type: String },
        
        phone:{type:Number },
        address:{type:String},
        avatar:{type:String},
        city: {type:String},
        province: {type:String},
        district: {type:String},
        ward: {type:String},
        
        // Thống kê
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        lastOrderDate: { type: Date },
        
    },
    {
        timestamps:true
    }
);

// Validate password chỉ bắt buộc nếu không có googleId
userSchema.pre('validate', function(next) {
    if (!this.googleId && !this.password) {
        this.invalidate('password', 'Password is required for non-Google users');
    }
    next();
});
const User=mongoose.model("User",userSchema);
module.exports=User;