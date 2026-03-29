const Review = require('../models/ReviewModel');
const Order = require('../models/OrderProduct');
const Product = require('../models/ProductModel');

// Tạo review mới
const createReview = (reviewData, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { product, order, rating, content, images, video, tags, variation } = reviewData;

            // Validate input
            if (!product || !order || !rating) {
                return resolve({
                    status: 'ERR',
                    message: 'Thiếu thông tin bắt buộc (product, order, rating)'
                });
            }

            if (rating < 1 || rating > 5) {
                return resolve({
                    status: 'ERR',
                    message: 'Rating phải từ 1 đến 5 sao'
                });
            }

            // Validate images (tối đa 6 ảnh)
            if (images && images.length > 6) {
                return resolve({
                    status: 'ERR',
                    message: 'Tối đa 6 ảnh được phép'
                });
            }

            // Validate tags
            const validTags = ['Đúng mô tả', 'Đóng gói đẹp', 'Giao hàng nhanh'];
            if (tags && Array.isArray(tags)) {
                const invalidTags = tags.filter(tag => !validTags.includes(tag));
                if (invalidTags.length > 0) {
                    return resolve({
                        status: 'ERR',
                        message: 'Tags không hợp lệ'
                    });
                }
            }

            // Kiểm tra đơn hàng có tồn tại và thuộc về user này không
            const orderData = await Order.findById(order);
            if (!orderData) {
                return resolve({
                    status: 'ERR',
                    message: 'Đơn hàng không tồn tại'
                });
            }

            if (orderData.user.toString() !== userId.toString()) {
                return resolve({
                    status: 'ERR',
                    message: 'Bạn không có quyền đánh giá đơn hàng này'
                });
            }

            // QUAN TRỌNG: Không cho phép đánh giá nếu đơn hàng đã hủy
            if (orderData.status === 'cancelled' || orderData.isCancelled) {
                return resolve({
                    status: 'ERR',
                    message: 'Không thể đánh giá đơn hàng đã hủy'
                });
            }

            // QUAN TRỌNG: Chỉ cho phép đánh giá khi order status = 'delivered' hoặc 'completed'
            if (orderData.status !== 'delivered' && orderData.status !== 'completed') {
                return resolve({
                    status: 'ERR',
                    message: 'Chỉ có thể đánh giá khi đơn hàng đã được giao (Delivered). Trạng thái hiện tại: ' + orderData.status
                });
            }

            // Kiểm tra sản phẩm có trong đơn hàng không
            const orderItem = orderData.orderItems.find(
                item => item.product.toString() === product.toString()
            );

            if (!orderItem) {
                return resolve({
                    status: 'ERR',
                    message: 'Sản phẩm không có trong đơn hàng này'
                });
            }

            // Kiểm tra đã đánh giá chưa (1 user chỉ được đánh giá 1 lần cho 1 sản phẩm trong 1 đơn hàng)
            const existingReview = await Review.findOne({
                user: userId,
                product: product,
                order: order
            });

            if (existingReview) {
                return resolve({
                    status: 'ERR',
                    message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi'
                });
            }

            // Kiểm tra từ khóa xấu (chỉ để đánh dấu, không ẩn review)
            const needsModeration = detectBadKeywords(content || '');

            // Tạo review - luôn hiển thị ngay, không cần kiểm duyệt
            const newReview = await Review.create({
                user: userId,
                product: product,
                order: order,
                rating: rating,
                content: content || '',
                images: images || [],
                video: video || null,
                tags: tags || [],
                variation: variation || orderItem.variation || {},
                needsModeration: needsModeration,
                isActive: true // Luôn hiển thị ngay, không cần kiểm duyệt
            });

            // Cập nhật rating trung bình của sản phẩm
            await updateProductRating(product);

            // Tăng số lượng đã bán của sản phẩm
            await Product.findByIdAndUpdate(product, {
                $inc: { selled: 1 }
            });

            resolve({
                status: 'OK',
                message: 'Đánh giá thành công',
                data: newReview
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Cập nhật rating trung bình của sản phẩm
const updateProductRating = async (productId) => {
    try {
        const reviews = await Review.find({
            product: productId,
            isActive: true
        });

        if (reviews.length === 0) {
            await Product.findByIdAndUpdate(productId, { rating: 0 });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);

        await Product.findByIdAndUpdate(productId, {
            rating: parseFloat(averageRating)
        });
    } catch (e) {
        console.error('Error updating product rating:', e);
    }
};

// Lấy reviews của sản phẩm
const getProductReviews = (productId, page = 1, limit = 10, filter = {}, userId = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const mongoose = require('mongoose');
            const skip = (page - 1) * limit;
            
            // Đảm bảo productId là ObjectId
            const productObjectId = mongoose.Types.ObjectId.isValid(productId) 
                ? new mongoose.Types.ObjectId(productId) 
                : productId;
            
            // Xây dựng query cơ bản
            const query = {
                product: productObjectId
            };
            
            // Thêm filter rating nếu có
            if (filter.rating) {
                query.rating = parseInt(filter.rating);
            }
            
            // Nếu không có userId, chỉ hiển thị reviews đang active
            if (!userId) {
                query.isActive = true;
            } else {
                // Cho phép xem reviews active hoặc reviews của chính user đó (dù bị ẩn)
                // Sử dụng $or để kết hợp điều kiện
                const orConditions = [
                    { isActive: true },
                    { user: userId, isActive: false }
                ];
                query.$or = orConditions;
            }

            // Debug: Log query để kiểm tra
            console.log('getProductReviews query:', JSON.stringify(query, null, 2));
            
            const reviews = await Review.find(query)
                .populate('user', 'name avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Review.countDocuments(query);
            
            // Debug: Log kết quả
            console.log(`Found ${reviews.length} reviews, total: ${total} for productId: ${productId}`);

            // Tính toán thống kê rating - chỉ tính reviews active
            const ratingStats = await Review.aggregate([
                {
                    $match: {
                        product: productObjectId,
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: -1 }
                }
            ]);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    reviews,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    },
                    ratingStats
                }
            });
        } catch (e) {
            console.error('Error in getProductReviews:', e);
            reject(e);
        }
    });
};

// Lấy reviews của user
const getUserReviews = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const reviews = await Review.find({ user: userId })
                .populate('product', 'name image')
                .populate('order', 'status')
                .sort({ createdAt: -1 });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: reviews
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Kiểm tra user có thể đánh giá đơn hàng không
const canReviewOrder = (orderId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.findById(orderId);
            
            if (!order) {
                return resolve({
                    status: 'ERR',
                    message: 'Đơn hàng không tồn tại',
                    canReview: false
                });
            }

            if (order.user.toString() !== userId.toString()) {
                return resolve({
                    status: 'ERR',
                    message: 'Bạn không có quyền xem đơn hàng này',
                    canReview: false
                });
            }

            // Không cho phép đánh giá nếu đơn hàng đã hủy
            if (order.status === 'cancelled' || order.isCancelled) {
                return resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: {
                        canReview: false,
                        orderStatus: order.status,
                        reviewedProducts: [],
                        unreviewedItems: [],
                        message: 'Không thể đánh giá đơn hàng đã hủy'
                    }
                });
            }

            // Chỉ cho phép đánh giá khi status = delivered hoặc completed
            const canReview = order.status === 'delivered' || order.status === 'completed';

            // Lấy danh sách sản phẩm đã đánh giá
            const reviewedProducts = await Review.find({
                user: userId,
                order: orderId
            }).select('product');

            const reviewedProductIds = reviewedProducts.map(r => r.product.toString());

            // Lấy danh sách sản phẩm trong đơn chưa đánh giá
            const unreviewedItems = order.orderItems.filter(
                item => !reviewedProductIds.includes(item.product.toString())
            );

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    canReview,
                    orderStatus: order.status,
                    reviewedProducts: reviewedProductIds,
                    unreviewedItems: unreviewedItems.map(item => ({
                        productId: item.product.toString(),
                        product: item.product.toString(),
                        productName: item.name,
                        image: item.image,
                        variation: item.variation || {}
                    })),
                    allItemsReviewed: unreviewedItems.length === 0 && canReview,
                    hasUnreviewedItems: unreviewedItems.length > 0,
                    message: !canReview 
                        ? `Chỉ có thể đánh giá khi đơn hàng đã được giao. Trạng thái hiện tại: ${order.status}` 
                        : unreviewedItems.length === 0 
                            ? 'Bạn đã đánh giá tất cả sản phẩm trong đơn hàng này'
                            : null
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Admin: Ẩn/hiện review
const toggleReviewStatus = (reviewId, isActive) => {
    return new Promise(async (resolve, reject) => {
        try {
            const review = await Review.findById(reviewId);
            if (!review) {
                return resolve({
                    status: 'ERR',
                    message: 'Review không tồn tại'
                });
            }

            review.isActive = isActive;
            await review.save();

            // Cập nhật lại rating của sản phẩm
            await updateProductRating(review.product);

            resolve({
                status: 'OK',
                message: isActive ? 'Hiển thị review thành công' : 'Ẩn review thành công',
                data: review
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Admin: Reply review
const replyReview = (reviewId, replyContent, adminId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const review = await Review.findById(reviewId);
            if (!review) {
                return resolve({
                    status: 'ERR',
                    message: 'Review không tồn tại'
                });
            }

            review.adminReply = {
                content: replyContent,
                repliedBy: adminId,
                repliedAt: new Date()
            };

            await review.save();

            resolve({
                status: 'OK',
                message: 'Trả lời review thành công',
                data: review
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Admin: Lấy tất cả reviews với filter
const getAllReviews = (filters = {}, page = 1, limit = 20) => {
    return new Promise(async (resolve, reject) => {
        try {
            const skip = (page - 1) * limit;
            const query = {};

            // Filter theo trạng thái
            if (filters.isActive !== undefined) {
                query.isActive = filters.isActive === 'true';
            }

            // Filter theo rating
            if (filters.rating) {
                query.rating = parseInt(filters.rating);
            }



            // Filter theo sản phẩm
            if (filters.productId) {
                query.product = filters.productId;
            }

            // Filter theo user
            if (filters.userId) {
                query.user = filters.userId;
            }

            // Filter theo từ khóa trong content
            if (filters.search) {
                query.content = { $regex: filters.search, $options: 'i' };
            }

            // Filter reviews cần kiểm duyệt
            if (filters.needsModeration === 'true') {
                query.needsModeration = true;
            }

            // Filter onlyWithImages: require images field to be non-empty
            if (filters.onlyWithImages === 'true' || filters.onlyWithImages === true) {
                query.images = { $exists: true, $ne: [] };
            }

            const reviews = await Review.find(query)
                .populate('user', 'name email avatar')
                .populate('product', 'name image')
                .populate('order', 'status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Review.countDocuments(query);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    reviews,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Phát hiện từ khóa xấu trong review
const detectBadKeywords = (content) => {
    const badKeywords = [
        'lừa đảo', 'lừa đảo', 'lua dao',
        'hàng giả', 'hang gia', 'fake',
        'dịch vụ tệ', 'dich vu te', 'service bad',
        'scam', 'fraud', 'cheat',
        'không uy tín', 'khong uy tin',
        'tệ', 'xấu', 'dở'
    ];

    if (!content) return false;

    const lowerContent = content.toLowerCase();
    return badKeywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
};


// Admin: Thống kê reviews
const getReviewStatistics = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const totalReviews = await Review.countDocuments();
            const activeReviews = await Review.countDocuments({ isActive: true });
            const hiddenReviews = await Review.countDocuments({ isActive: false });
            const needsModeration = await Review.countDocuments({ needsModeration: true });

            // Thống kê theo rating
            const ratingStats = await Review.aggregate([
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: -1 }
                }
            ]);

            // Reviews có ảnh
            const reviewsWithImages = await Review.countDocuments({
                images: { $exists: true, $ne: [] }
            });

            // Reviews có admin reply
            const reviewsWithReply = await Review.countDocuments({
                'adminReply.content': { $exists: true, $ne: '' }
            });

            // Reviews trong 30 ngày gần nhất
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentReviews = await Review.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    total: totalReviews,
                    active: activeReviews,
                    hidden: hiddenReviews,
                    needsModeration: needsModeration,
                    withImages: reviewsWithImages,
                    withReply: reviewsWithReply,
                    recent: recentReviews,
                    ratingDistribution: ratingStats
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Admin: Duyệt review (approve moderation)
const approveReview = (reviewId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const review = await Review.findById(reviewId);
            if (!review) {
                return resolve({
                    status: 'ERR',
                    message: 'Review không tồn tại'
                });
            }

            review.needsModeration = false;
            review.isActive = true;
            await review.save();

            // Cập nhật lại rating của sản phẩm sau khi duyệt
            await updateProductRating(review.product);

            resolve({
                status: 'OK',
                message: 'Duyệt review thành công',
                data: review
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Cập nhật review (chỉ cho phép trong 15 ngày)
const updateReview = (reviewId, reviewData, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { rating, content, images, video, tags } = reviewData;

            const review = await Review.findById(reviewId);
            if (!review) {
                return resolve({
                    status: 'ERR',
                    message: 'Review không tồn tại'
                });
            }

            // Kiểm tra quyền
            if (review.user.toString() !== userId.toString()) {
                return resolve({
                    status: 'ERR',
                    message: 'Bạn không có quyền sửa review này'
                });
            }

            // Kiểm tra 15 ngày
            const daysSinceCreation = Math.floor((new Date() - review.createdAt) / (1000 * 60 * 60 * 24));
            if (daysSinceCreation > 15) {
                return resolve({
                    status: 'ERR',
                    message: 'Không thể sửa đánh giá sau 15 ngày'
                });
            }

            // Validate rating
            if (rating !== undefined) {
                if (rating < 1 || rating > 5) {
                    return resolve({
                        status: 'ERR',
                        message: 'Rating phải từ 1 đến 5 sao'
                    });
                }
                review.rating = rating;
            }

            // Validate images (tối đa 6 ảnh)
            if (images !== undefined) {
                if (images.length > 6) {
                    return resolve({
                        status: 'ERR',
                        message: 'Tối đa 6 ảnh được phép'
                    });
                }
                review.images = images;
            }

            // Validate tags
            if (tags !== undefined) {
                const validTags = ['Đúng mô tả', 'Đóng gói đẹp', 'Giao hàng nhanh'];
                if (Array.isArray(tags)) {
                    const invalidTags = tags.filter(tag => !validTags.includes(tag));
                    if (invalidTags.length > 0) {
                        return resolve({
                            status: 'ERR',
                            message: 'Tags không hợp lệ'
                        });
                    }
                    review.tags = tags;
                }
            }

            if (content !== undefined) review.content = content || '';
            if (video !== undefined) review.video = video || null;

            // Kiểm tra từ khóa xấu
            review.needsModeration = detectBadKeywords(review.content || '');

            review.updatedAt = new Date();
            await review.save();

            // Cập nhật lại rating của sản phẩm
            await updateProductRating(review.product);

            resolve({
                status: 'OK',
                message: 'Cập nhật đánh giá thành công',
                data: review
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createReview,
    updateReview,
    getProductReviews,
    getUserReviews,
    canReviewOrder,
    toggleReviewStatus,
    replyReview,
    updateProductRating,
    getAllReviews,
    getReviewStatistics,
    detectBadKeywords,
    approveReview
};

