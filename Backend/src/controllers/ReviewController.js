const ReviewService = require('../services/ReviewService');

const createReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }

        const result = await ReviewService.createReview(req.body, userId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error creating review'
        });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, rating } = req.query;
        const userId = req.user?.id; // Lấy userId nếu đã đăng nhập

        const filter = {};
        if (rating) {
            filter.rating = parseInt(rating);
        }

        const result = await ReviewService.getProductReviews(
            productId,
            parseInt(page),
            parseInt(limit),
            filter,
            userId
        );
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting product reviews'
        });
    }
};

const getUserReviews = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }

        const result = await ReviewService.getUserReviews(userId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting user reviews'
        });
    }
};

const canReviewOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }

        const result = await ReviewService.canReviewOrder(orderId, userId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error checking review permission'
        });
    }
};

// Admin functions
const toggleReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { isActive } = req.body;

        const result = await ReviewService.toggleReviewStatus(reviewId, isActive);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error toggling review status'
        });
    }
};

const replyReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { content } = req.body;
        const adminId = req.user?.id;

        if (!adminId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }

        const result = await ReviewService.replyReview(reviewId, content, adminId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error replying to review'
        });
    }
};

// Admin: Get all reviews
const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, isActive, rating, productId, userId, search, needsModeration, onlyWithImages } = req.query;
        
        const filters = {
            isActive,
            rating,
            productId,
            userId,
            search,
            needsModeration,
            onlyWithImages
        };

        const result = await ReviewService.getAllReviews(filters, parseInt(page), parseInt(limit));
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting all reviews'
        });
    }
};

// Admin: Get review statistics
const getReviewStatistics = async (req, res) => {
    try {
        const result = await ReviewService.getReviewStatistics();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting review statistics'
        });
    }
};

// Admin: Approve review (clear moderation flag)
const approveReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const result = await ReviewService.approveReview(reviewId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error approving review'
        });
    }
};

// Update review (chỉ trong 15 ngày)
const updateReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Unauthorized'
            });
        }

        const { reviewId } = req.params;
        const result = await ReviewService.updateReview(reviewId, req.body, userId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error updating review'
        });
    }
};

module.exports = {
    createReview,
    updateReview,
    getProductReviews,
    getUserReviews,
    canReviewOrder,
    toggleReviewStatus,
    replyReview,
    getAllReviews,
    getReviewStatistics,
    approveReview
};

