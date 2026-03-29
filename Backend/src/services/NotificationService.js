const Notification = require('../models/NotificationModel');
const User = require('../models/UserModel');

const createNotification = (notificationData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const notification = await Notification.create(notificationData);
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: notification
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllNotifications = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const notifications = await Notification.find({ user: userId })
                .populate('promotion', 'name code value type')
                .sort({ createdAt: -1 });
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: notifications
            });
        } catch (e) {
            reject(e);
        }
    });
};

const markAsRead = (notificationId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, user: userId },
                { isRead: true },
                { new: true }
            );
            
            if (!notification) {
                return resolve({
                    status: 'ERR',
                    message: 'Notification not found'
                });
            }
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: notification
            });
        } catch (e) {
            reject(e);
        }
    });
};

const markAllAsRead = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            await Notification.updateMany(
                { user: userId, isRead: false },
                { isRead: true }
            );
            
            resolve({
                status: 'OK',
                message: 'SUCCESS'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getUnreadCount = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const count = await Notification.countDocuments({
                user: userId,
                isRead: false
            });
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: count
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Gửi thông báo cho tất cả users khi tạo promotion
const notifyAllUsersAboutPromotion = async (promotion) => {
    try {
        const users = await User.find({ isActive: true });
        
        // Tạo message dựa trên loại promotion
        let message = promotion.description || '';
        if (!message) {
            if (promotion.code) {
                message = `Mã giảm giá ${promotion.code} - Giảm ${promotion.value}${promotion.type === 'percentage' ? '%' : ' VNĐ'}`;
            } else {
                // Tạo message dựa trên type
                const typeMessages = {
                    'percentage': `Giảm ${promotion.value}% cho đơn hàng`,
                    'fixed': `Giảm ${promotion.value.toLocaleString()} VNĐ cho đơn hàng`,
                    'buy1get1': 'Mua 1 tặng 1',
                    'buy2discount': `Mua 2 giảm giá`,
                    'combo': 'Combo sản phẩm đặc biệt',
                    'flash_sale': 'Flash Sale - Giảm giá sốc',
                    'voucher_new_user': `Voucher cho user mới - Giảm ${promotion.value}${promotion.type === 'percentage' ? '%' : ' VNĐ'}`,
                    'voucher_shop_wide': `Voucher toàn shop - Giảm ${promotion.value}${promotion.type === 'percentage' ? '%' : ' VNĐ'}`
                };
                message = typeMessages[promotion.type] || `Khuyến mãi ${promotion.name}`;
            }
        }
        
        const notifications = users.map(user => ({
            user: user._id,
            type: 'promotion',
            title: `🎉 Khuyến mãi mới: ${promotion.name}`,
            message: message,
            link: `/product?promotion=${promotion._id}`,
            promotion: promotion._id
        }));
        
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
        
        return {
            status: 'OK',
            message: 'SUCCESS',
            notifiedUsers: users.length
        };
    } catch (e) {
        throw e;
    }
};

// Notify users who subscribed for restock of a specific product variation
const RestockSubscription = require('../models/RestockSubscriptionModel');
const EmailService = require('./EmailService');

const notifyRestockSubscribers = async (productId, variation, product) => {
    try {
        // Find subscriptions matching product and variation (sku or color+size+material)
        const query = { product: productId, isNotified: false };
        const subs = await RestockSubscription.find(query).populate('user', 'name email');

        const matched = subs.filter(s => {
            if (s.variation && s.variation.sku && variation.sku) {
                return s.variation.sku === variation.sku;
            }
            // Match by color/size/material laxly
            const sameColor = !s.variation.color || !variation.color || s.variation.color === variation.color;
            const sameSize = !s.variation.size || !variation.size || s.variation.size === variation.size;
            const sameMaterial = !s.variation.material || !variation.material || s.variation.material === variation.material;
            return sameColor && sameSize && sameMaterial;
        });

        if (matched.length === 0) return { status: 'OK', message: 'No subscribers' };

        // Create notification + send email for each
        const notifications = matched.map(sub => ({
            user: sub.user._id,
            type: 'system',
            title: `Sản phẩm ${product.name} đã có hàng`,
            message: `Size ${variation.size || ''} - Màu ${variation.color || ''} đã có hàng. Xem ngay.`,
            link: `/product-details/${product._id}`
        }));

        // Insert notifications
        await Notification.insertMany(notifications);

        // Send email if user has email and EmailService supports a generic notification
        for (const sub of matched) {
            try {
                if (sub.user && sub.user.email) {
                    const subject = `Sản phẩm bạn yêu thích đã có hàng`;
                    const htmlContent = `Sản phẩm <strong>${product.name}</strong> (${variation.color || ''} / ${variation.size || ''}) đã có hàng. <a href="${process.env.REACT_APP_URL || 'http://localhost:3000'}/product-details/${product._id}">Xem sản phẩm</a>`;
                    await EmailService.sendGenericNotificationEmail(sub.user.email, subject, htmlContent).catch(e => console.warn('Email send warn', e));
                }
            } catch (e) {
                console.warn('Failed sending restock email to', sub.user?.email, e.message || e);
            }
        }

        // Mark subscriptions as notified
        await RestockSubscription.updateMany(
            { _id: { $in: matched.map(m => m._id) } },
            { isNotified: true }
        );

        return { status: 'OK', message: 'Notified subscribers', count: matched.length };
    } catch (e) {
        throw e;
    }
};

module.exports = {
    createNotification,
    getAllNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    notifyAllUsersAboutPromotion,
    notifyRestockSubscribers
};

