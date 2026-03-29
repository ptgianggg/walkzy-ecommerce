const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authUserMiddleWare, optionalAuthMiddleware } = require('../middleware/authMiddleware');

router.get('/get-all/:id', NotificationController.getAllNotifications);
router.put('/mark-read/:id', authUserMiddleWare, NotificationController.markAsRead);
router.put('/mark-all-read', authUserMiddleWare, NotificationController.markAllAsRead);
router.get('/unread-count', optionalAuthMiddleware, NotificationController.getUnreadCount);
router.post('/restock-subscribe', authUserMiddleWare, NotificationController.subscribeRestock);

module.exports = router;

