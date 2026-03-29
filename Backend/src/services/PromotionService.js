const Promotion = require('../models/PromotionModel');

const createPromotion = (newPromotion) => {
    return new Promise(async (resolve, reject) => {
        try {
            const promotion = await Promotion.create(newPromotion);
            
            // Gửi thông báo cho tất cả users khi tạo khuyến mãi (luôn gửi, không cần code)
            try {
                const NotificationService = require('./NotificationService');
                await NotificationService.notifyAllUsersAboutPromotion(promotion);
                
                // Gửi email cho tất cả users nếu có code
                if (promotion.code) {
                    const EmailService = require('./EmailService');
                    const User = require('../models/UserModel');
                    const users = await User.find({ isActive: true, email: { $exists: true, $ne: '' } });
                    
                    for (const user of users) {
                        try {
                            await EmailService.sendPromotionEmail(
                                user.email,
                                promotion.name,
                                promotion.code,
                                promotion.value,
                                promotion.type,
                                promotion.description,
                                promotion.endDate
                            );
                        } catch (emailError) {
                            console.error(`Error sending email to ${user.email}:`, emailError);
                        }
                    }
                }
            } catch (notifyError) {
                console.error('Error sending notifications:', notifyError);
                // Không reject nếu lỗi gửi thông báo, vì promotion đã được tạo thành công
            }
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: promotion
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updatePromotion = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkPromotion = await Promotion.findById(id);
            if (checkPromotion === null) {
                resolve({
                    status: 'ERR',
                    message: 'Khuyến mãi không tồn tại'
                });
                return;
            }

            // Loại bỏ các field không được phép cập nhật (usageCount được quản lý tự động)
            const { usageCount, ...updateData } = data;

            const updatedPromotion = await Promotion.findByIdAndUpdate(id, updateData, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedPromotion
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deletePromotion = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkPromotion = await Promotion.findById(id);
            if (checkPromotion === null) {
                resolve({
                    status: 'ERR',
                    message: 'Khuyến mãi không tồn tại'
                });
                return;
            }

            await Promotion.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa khuyến mãi thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllPromotion = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allPromotion = await Promotion.find()
                .populate('products', 'name')
                .populate('categories', 'name')
                .populate('brands', 'name')
                .populate('comboProducts.product', 'name');
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allPromotion
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailPromotion = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const promotion = await Promotion.findById(id)
                .populate('products', 'name')
                .populate('categories', 'name')
                .populate('brands', 'name')
                .populate('comboProducts.product', 'name');
            if (promotion === null) {
                resolve({
                    status: 'ERR',
                    message: 'Khuyến mãi không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: promotion
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getActivePromotions = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            const activePromotions = await Promotion.find({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now }
            })
            .populate('products', 'name price')
            .populate('categories', 'name')
            .populate('brands', 'name');
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: activePromotions
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createPromotion,
    updatePromotion,
    deletePromotion,
    getAllPromotion,
    getDetailPromotion,
    getActivePromotions
};

