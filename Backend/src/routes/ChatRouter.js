const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/ChatController');
const { optionalAuthMiddleware } = require('../middleware/authMiddleware');

// Route chat với AI (có thể dùng không cần auth, nhưng nếu có token thì lấy thông tin user)
router.post('/message', optionalAuthMiddleware, ChatController.chatMessage);

// Route chat với AI (yêu cầu đăng nhập để lấy thông tin user)
router.post('/message/authenticated', optionalAuthMiddleware, ChatController.chatMessage);

// Route lấy FAQ
router.get('/faq', ChatController.getFAQ);

// Route tìm kiếm sản phẩm bằng AI
router.get('/search-products', ChatController.searchProductsAI);

// Route gợi ý sản phẩm bằng AI
router.get('/recommend-products', ChatController.recommendProductsAI);

module.exports = router;

