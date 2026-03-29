const NotificationService = require('../services/NotificationService');
const { authUserMiddleWare } = require('../middleware/authMiddleware');

const getAllNotifications = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'User ID is required'
            });
        }
        const result = await NotificationService.getAllNotifications(userId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }
        const result = await NotificationService.markAsRead(notificationId, userId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }
        const result = await NotificationService.markAllAsRead(userId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      // Guest users simply have zero unread notifications
      return res.status(200).json({ status: 'OK', data: 0 });
    }
    const result = await NotificationService.getUnreadCount(userId);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
    }
};

const subscribeRestock = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ status: 'ERR', message: 'Unauthorized' });

        const { productId, variation } = req.body;
        if (!productId || !variation) {
            return res.status(400).json({ status: 'ERR', message: 'productId and variation are required' });
        }

        const RestockSubscription = require('../models/RestockSubscriptionModel');

        // do not duplicate
        const exists = await RestockSubscription.findOne({
            user: userId,
            product: productId,
            'variation.color': variation.color || '',
            'variation.size': variation.size || '',
            'variation.material': variation.material || '',
            'variation.sku': variation.sku || ''
        });

        if (exists) {
            return res.status(200).json({ status: 'OK', message: 'Bạn đã đăng ký thông báo cho biến thể này' });
        }

        const sub = await RestockSubscription.create({ user: userId, product: productId, variation });
        return res.status(200).json({ status: 'OK', message: 'Đã đăng ký nhận thông báo khi có hàng', data: sub });
    } catch (e) {
        console.error('subscribeRestock error', e);
        return res.status(500).json({ status: 'ERR', message: e.message || 'Server error' });
    }
};

module.exports = {
    getAllNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    subscribeRestock
};

