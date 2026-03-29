const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const { authUserMiddleWare, authMiddleWare, optionalAuthMiddleware } = require('../middleware/authMiddleware');

// User routes
router.post('/create', authUserMiddleWare, ReviewController.createReview);
router.put('/update/:reviewId', authUserMiddleWare, ReviewController.updateReview);
router.get('/product/:productId', optionalAuthMiddleware, ReviewController.getProductReviews); // Public - ai cũng xem được reviews, nhưng lấy user nếu có token
router.get('/my-reviews', authUserMiddleWare, ReviewController.getUserReviews);
router.get('/can-review/:orderId', authUserMiddleWare, ReviewController.canReviewOrder);

// Admin routes
router.get('/all', authMiddleWare, ReviewController.getAllReviews);
router.get('/statistics', authMiddleWare, ReviewController.getReviewStatistics);
router.put('/toggle/:reviewId', authMiddleWare, ReviewController.toggleReviewStatus);
router.post('/reply/:reviewId', authMiddleWare, ReviewController.replyReview);
router.put('/approve/:reviewId', authMiddleWare, ReviewController.approveReview);

module.exports = router;

