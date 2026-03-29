const ShippingVoucher = require('../models/ShippingVoucherModel');
const ShippingProvider = require('../models/ShippingProviderModel');
const Order = require('../models/OrderProduct');

const createShippingVoucher = (newVoucher) => {
    return new Promise(async (resolve, reject) => {
        try {
            const {
                name,
                code,
                description,
                type,
                value,
                minPurchase,
                maxDiscount,
                shippingProviders,
                startDate,
                endDate,
                usageLimit,
                userLimit,
                isActive
            } = newVoucher;

            // Validate
            if (!name || !type || !value || !startDate || !endDate) {
                return resolve({
                    status: 'ERR',
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
                });
            }

            if (startDate >= endDate) {
                return resolve({
                    status: 'ERR',
                    message: 'Ngày kết thúc phải sau ngày bắt đầu'
                });
            }

            if (type === 'percentage' && (value < 0 || value > 100)) {
                return resolve({
                    status: 'ERR',
                    message: 'Giá trị phần trăm phải từ 0 đến 100'
                });
            }

            if (type === 'fixed' && value < 0) {
                return resolve({
                    status: 'ERR',
                    message: 'Giá trị giảm phải lớn hơn 0'
                });
            }

            // Kiểm tra code trùng nếu có
            if (code) {
                const checkCode = await ShippingVoucher.findOne({ code: code.trim().toUpperCase() });
                if (checkCode) {
                    return resolve({
                        status: 'ERR',
                        message: 'Mã voucher đã tồn tại'
                    });
                }
            }

            const voucher = await ShippingVoucher.create({
                name,
                code: code ? code.trim().toUpperCase() : undefined, // Sẽ tự động generate nếu không có
                description,
                type,
                value,
                minPurchase: minPurchase || 0,
                maxDiscount: maxDiscount || null,
                shippingProviders: shippingProviders || [],
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                usageLimit: usageLimit || null,
                userLimit: userLimit || 1,
                isActive: isActive !== undefined ? isActive : true
            });

            resolve({
                status: 'OK',
                message: 'Tạo voucher vận chuyển thành công',
                data: voucher
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updateShippingVoucher = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const voucher = await ShippingVoucher.findById(id);
            if (!voucher) {
                return resolve({
                    status: 'ERR',
                    message: 'Voucher không tồn tại'
                });
            }

            // Validate nếu có thay đổi
            if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
                return resolve({
                    status: 'ERR',
                    message: 'Ngày kết thúc phải sau ngày bắt đầu'
                });
            }

            if (data.code && data.code !== voucher.code) {
                const checkCode = await ShippingVoucher.findOne({ 
                    code: data.code.trim().toUpperCase(),
                    _id: { $ne: id }
                });
                if (checkCode) {
                    return resolve({
                        status: 'ERR',
                        message: 'Mã voucher đã tồn tại'
                    });
                }
            }

            // Loại bỏ các field không được phép cập nhật (usageCount, totalDiscountAmount được quản lý tự động)
            const { usageCount, totalDiscountAmount, ...updateData } = data;

            // Chuyển đổi dates nếu có
            if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
            if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
            if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();

            const updatedVoucher = await ShippingVoucher.findByIdAndUpdate(id, updateData, { new: true })
                .populate('shippingProviders', 'name');

            resolve({
                status: 'OK',
                message: 'Cập nhật voucher thành công',
                data: updatedVoucher
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteShippingVoucher = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const voucher = await ShippingVoucher.findById(id);
            if (!voucher) {
                return resolve({
                    status: 'ERR',
                    message: 'Voucher không tồn tại'
                });
            }

            await ShippingVoucher.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa voucher thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllShippingVoucher = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const vouchers = await ShippingVoucher.find()
                .populate('shippingProviders', 'name')
                .sort({ createdAt: -1 });
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: vouchers
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailShippingVoucher = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const voucher = await ShippingVoucher.findById(id)
                .populate('shippingProviders', 'name');
            
            if (!voucher) {
                return resolve({
                    status: 'ERR',
                    message: 'Voucher không tồn tại'
                });
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: voucher
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Validate và tính toán discount cho shipping voucher
const validateShippingVoucher = (code, shippingProviderId, orderTotal, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!code || !code.trim()) {
                return resolve({
                    status: 'ERR',
                    message: 'Vui lòng nhập mã voucher'
                });
            }

            const voucher = await ShippingVoucher.findOne({
                code: code.trim().toUpperCase(),
                isActive: true
            })
            .populate('shippingProviders', 'name')
            .lean();

            if (!voucher) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã voucher không tồn tại hoặc đã bị vô hiệu hóa'
                });
            }

            // Kiểm tra thời gian hiệu lực
            const now = new Date();
            if (now < new Date(voucher.startDate) || now > new Date(voucher.endDate)) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã voucher chưa có hiệu lực hoặc đã hết hạn'
                });
            }

            // Kiểm tra giới hạn sử dụng tổng
            if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã voucher đã hết lượt sử dụng'
                });
            }

            // Kiểm tra nhà vận chuyển (chỉ kiểm tra nếu có shippingProviderId)
            if (shippingProviderId && voucher.shippingProviders && voucher.shippingProviders.length > 0) {
                const providerIds = voucher.shippingProviders.map(p => 
                    typeof p === 'object' ? p._id.toString() : p.toString()
                );
                if (!providerIds.includes(shippingProviderId)) {
                    return resolve({
                        status: 'ERR',
                        message: 'Voucher này không áp dụng cho nhà vận chuyển đã chọn'
                    });
                }
            }

            // Kiểm tra đơn hàng tối thiểu
            if (voucher.minPurchase && orderTotal < voucher.minPurchase) {
                return resolve({
                    status: 'ERR',
                    message: `Đơn hàng tối thiểu ${voucher.minPurchase.toLocaleString()} VNĐ để sử dụng voucher này`
                });
            }

            // Kiểm tra số lần sử dụng của user
            if (userId && voucher.userLimit) {
                const userUsageCount = await Order.countDocuments({
                    user: userId,
                    shippingVoucher: voucher._id,
                    status: { $nin: ['cancelled', 'refunded'] }
                });

                if (userUsageCount >= voucher.userLimit) {
                    return resolve({
                        status: 'ERR',
                        message: `Bạn đã sử dụng hết lượt voucher này (tối đa ${voucher.userLimit} lần)`
                    });
                }
            }

            // Tính toán discount amount (sẽ được tính khi biết shipping fee)
            // Trả về voucher để frontend tính toán
            resolve({
                status: 'OK',
                message: 'Voucher hợp lệ',
                data: {
                    voucher,
                    isValid: true
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Tính toán discount amount cho shipping
const calculateShippingDiscount = (voucher, shippingFee) => {
    if (!voucher || !shippingFee) return 0;

    let discountAmount = 0;

    if (voucher.type === 'free') {
        discountAmount = shippingFee; // Miễn phí toàn bộ
    } else if (voucher.type === 'percentage') {
        discountAmount = (shippingFee * voucher.value) / 100;
        // Áp dụng maxDiscount nếu có
        if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
            discountAmount = voucher.maxDiscount;
        }
    } else if (voucher.type === 'fixed') {
        discountAmount = voucher.value;
        // Không được giảm nhiều hơn shipping fee
        if (discountAmount > shippingFee) {
            discountAmount = shippingFee;
        }
    }

    return Math.round(discountAmount);
};

const getActiveShippingVouchers = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            const vouchers = await ShippingVoucher.find({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                $or: [
                    { usageLimit: null },
                    { $expr: { $lt: ["$usageCount", "$usageLimit"] } }
                ]
            }).populate('shippingProviders', 'name');

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: vouchers
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createShippingVoucher,
    updateShippingVoucher,
    deleteShippingVoucher,
    getAllShippingVoucher,
    getDetailShippingVoucher,
    validateShippingVoucher,
    calculateShippingDiscount,
    getActiveShippingVouchers
};

