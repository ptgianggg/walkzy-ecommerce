const Order = require('../models/OrderProduct');
const Product = require('../models/ProductModel');
const User = require('../models/UserModel');
const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Get revenue statistics by day/week/month
const getRevenueStatistics = (period = 'day') => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            let startDate;
            let groupFormat;

            switch (period) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); // Last 30 days
                    groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                    break;
                case 'week':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84); // Last 12 weeks
                    groupFormat = { 
                        $dateToString: { 
                            format: "%Y-W%V", 
                            date: "$createdAt" 
                        } 
                    };
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1); // Last 12 months
                    groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
                    groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
            }

            const revenueData = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $group: {
                        _id: groupFormat,
                        revenue: { $sum: "$totalPrice" },
                        orderCount: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: revenueData
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get best-selling products
const getBestSellingProducts = (limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const bestSelling = await Order.aggregate([
                {
                    $unwind: "$orderItems"
                },
                {
                    $match: {
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: "$orderItems.product",
                        totalSold: { $sum: "$orderItems.amount" },
                        totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.amount"] } },
                        productName: { $first: "$orderItems.name" },
                        productImage: { $first: "$orderItems.image" }
                    }
                },
                {
                    $sort: { totalSold: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            // Populate product details
            const productIds = bestSelling.map(item => item._id);
            const products = await Product.find({ _id: { $in: productIds } })
                .select('name image price selled');

            const result = bestSelling.map(item => {
                const product = products.find(p => p._id.toString() === item._id.toString());
                return {
                    productId: item._id,
                    productName: item.productName || product?.name || 'Unknown',
                    productImage: item.productImage || product?.image || '',
                    totalSold: item.totalSold,
                    totalRevenue: item.totalRevenue,
                    price: product?.price || 0
                };
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: result
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get order cancellation rate
const getCancellationRate = (period = 'month') => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            let startDate;

            switch (period) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
                    break;
                case 'week':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
            }

            const stats = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        cancelledOrders: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
                            }
                        },
                        refundedOrders: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "refunded"] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            const result = stats[0] || { totalOrders: 0, cancelledOrders: 0, refundedOrders: 0 };
            const cancellationRate = result.totalOrders > 0 
                ? ((result.cancelledOrders + result.refundedOrders) / result.totalOrders * 100).toFixed(2)
                : 0;

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    totalOrders: result.totalOrders,
                    cancelledOrders: result.cancelledOrders,
                    refundedOrders: result.refundedOrders,
                    cancellationRate: parseFloat(cancellationRate)
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get new customers statistics
const getNewCustomersStatistics = (period = 'month') => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            let startDate;
            let groupFormat;

            switch (period) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
                    groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                    break;
                case 'week':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84);
                    groupFormat = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } };
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
                    groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
                    groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
            }

            const newCustomers = await User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: groupFormat,
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            // Get total new customers
            const totalNewCustomers = await User.countDocuments({
                createdAt: { $gte: startDate }
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    timeline: newCustomers,
                    total: totalNewCustomers
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get inventory statistics
const getInventoryStatistics = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const inventoryStats = await Product.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStock: { $sum: "$countInStock" },
                        lowStockProducts: {
                            $sum: {
                                $cond: [{ $lte: ["$countInStock", 10] }, 1, 0]
                            }
                        },
                        outOfStockProducts: {
                            $sum: {
                                $cond: [{ $eq: ["$countInStock", 0] }, 1, 0]
                            }
                        },
                        averageStock: { $avg: "$countInStock" }
                    }
                }
            ]);

            // Get products by stock level
            const stockLevels = await Product.aggregate([
                {
                    $project: {
                        name: 1,
                        countInStock: 1,
                        stockLevel: {
                            $cond: [
                                { $eq: ["$countInStock", 0] }, "out_of_stock",
                                { $cond: [
                                    { $lte: ["$countInStock", 10] }, "low_stock",
                                    { $cond: [
                                        { $lte: ["$countInStock", 50] }, "medium_stock",
                                        "high_stock"
                                    ]}
                                ]}
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$stockLevel",
                        count: { $sum: 1 },
                        totalStock: { $sum: "$countInStock" }
                    }
                }
            ]);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    summary: inventoryStats[0] || {},
                    byLevel: stockLevels
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get order time heatmap (orders by hour of day)
const getOrderTimeHeatmap = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); // Last 30 days

            const heatmapData = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $project: {
                        hour: { $hour: "$createdAt" },
                        dayOfWeek: { $dayOfWeek: "$createdAt" }, // 1 = Sunday, 7 = Saturday
                        orderCount: 1
                    }
                },
                {
                    $group: {
                        _id: {
                            hour: "$hour",
                            dayOfWeek: "$dayOfWeek"
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.dayOfWeek": 1, "_id.hour": 1 }
                }
            ]);

            // Format data for heatmap visualization
            const formattedData = [];
            const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            
            for (let day = 1; day <= 7; day++) {
                for (let hour = 0; hour < 24; hour++) {
                    const dataPoint = heatmapData.find(
                        d => d._id.dayOfWeek === day && d._id.hour === hour
                    );
                    formattedData.push({
                        day: days[day - 1],
                        dayIndex: day,
                        hour: hour,
                        count: dataPoint ? dataPoint.count : 0
                    });
                }
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: formattedData
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get dashboard overview statistics
const getDashboardOverview = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            // Today's stats
            const todayStats = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: todayStart },
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: "$totalPrice" },
                        orders: { $sum: 1 }
                    }
                }
            ]);

            // This week's stats
            const weekStats = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: weekStart },
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: "$totalPrice" },
                        orders: { $sum: 1 }
                    }
                }
            ]);

            // This month's stats
            const monthStats = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthStart },
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: "$totalPrice" },
                        orders: { $sum: 1 }
                    }
                }
            ]);

            // Last month's stats for comparison
            const lastMonthStats = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: lastMonthStart, $lt: monthStart },
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: "$totalPrice" },
                        orders: { $sum: 1 }
                    }
                }
            ]);

            // Total customers
            const totalCustomers = await User.countDocuments();
            const newCustomersToday = await User.countDocuments({
                createdAt: { $gte: todayStart }
            });

            // Pending orders
            const pendingOrders = await Order.countDocuments({
                status: 'pending'
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    today: {
                        revenue: todayStats[0]?.revenue || 0,
                        orders: todayStats[0]?.orders || 0
                    },
                    week: {
                        revenue: weekStats[0]?.revenue || 0,
                        orders: weekStats[0]?.orders || 0
                    },
                    month: {
                        revenue: monthStats[0]?.revenue || 0,
                        orders: monthStats[0]?.orders || 0,
                        lastMonthRevenue: lastMonthStats[0]?.revenue || 0,
                        lastMonthOrders: lastMonthStats[0]?.orders || 0
                    },
                    customers: {
                        total: totalCustomers,
                        newToday: newCustomersToday
                    },
                    pendingOrders: pendingOrders
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get top provinces by orders
const getTopProvincesByOrders = (limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const topProvinces = await Order.aggregate([
                {
                    $match: {
                        status: { $ne: 'cancelled' },
                        isPaid: true,
                        'shippingAddress.city': { $exists: true, $ne: '' }
                    }
                },
                {
                    $group: {
                        _id: '$shippingAddress.city',
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$totalPrice' },
                        totalCustomers: { $addToSet: '$user' }
                    }
                },
                {
                    $project: {
                        province: '$_id',
                        totalOrders: 1,
                        totalRevenue: 1,
                        totalCustomers: { $size: '$totalCustomers' }
                    }
                },
                {
                    $sort: { totalOrders: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: topProvinces
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get top brands by orders
const getTopBrandsByOrders = (limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const topBrands = await Order.aggregate([
                { $unwind: '$orderItems' },
                {
                    $match: {
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'orderItems.product',
                        foreignField: '_id',
                        as: 'prod'
                    }
                },
                { $unwind: '$prod' },
                {
                    $group: {
                        _id: '$prod.brand',
                        totalSold: { $sum: '$orderItems.amount' },
                        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.amount'] } }
                    }
                },
                {
                    $lookup: {
                        from: 'brands',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        brandId: '$_id',
                        brand: '$brand.name',
                        totalSold: 1,
                        totalRevenue: 1
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: limit }
            ]);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: topBrands
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get top categories by orders
const getTopCategoriesByOrders = (limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const topCategories = await Order.aggregate([
                { $unwind: '$orderItems' },
                {
                    $match: {
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'orderItems.product',
                        foreignField: '_id',
                        as: 'prod'
                    }
                },
                { $unwind: '$prod' },
                {
                    $group: {
                        _id: '$prod.category',
                        totalSold: { $sum: '$orderItems.amount' },
                        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.amount'] } }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        categoryId: '$_id',
                        category: '$category.name',
                        totalSold: 1,
                        totalRevenue: 1
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: limit }
            ]);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: topCategories
            });
        } catch (e) {
            reject(e);
        }
    });
};

const parseInsightResponse = (rawText) => {
    if (!rawText || typeof rawText !== 'string') return null;
    try {
        return JSON.parse(rawText);
    } catch (_) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (_) {
                return null;
            }
        }
        return null;
    }
};

const buildFallbackInsights = (metrics, mode = 'detailed') => {
    const {
        todayRevenue = 0,
        monthRevenue = 0,
        growthRate = 0,
        orderToday = 0,
        customerCount = 0,
        cancelRate = 0,
        topProducts = [],
        revenueTimeline = []
    } = metrics;

    const recentTrend = revenueTimeline.slice(-7);
    const trendDirection = growthRate > 5 ? 'tăng' : growthRate < -5 ? 'giảm' : 'ổn định';
    const bestNames = topProducts.slice(0, 3).map((p) => p.productName).filter(Boolean);

    const buildForecast = () => {
        let trend = 'unknown';
        let forecastText = 'Xu hướng chưa rõ ràng.';
        let confidence = 'low';

        if (Number.isFinite(growthRate)) {
            if (growthRate > 3) {
                trend = 'up';
                forecastText = '📈 Doanh thu có thể tăng nhẹ trong 7 ngày tới.';
            } else if (growthRate < -3) {
                trend = 'down';
                forecastText = '📉 Doanh thu có thể giảm nhẹ trong 7 ngày tới.';
            } else {
                trend = 'stable';
                forecastText = '➡ Doanh thu giữ ổn định nếu không có biến động mới.';
            }
            confidence = recentTrend.length >= 3 ? 'medium' : 'low';
        }

        return { forecastText, trend, confidence };
    };

    const fallbackForecast = buildForecast();

    if (mode === 'compact') {
        const keys = [
            {
                icon: growthRate >= 0 ? '📈' : '📉',
                label: `Doanh thu tháng ${growthRate >= 0 ? 'tăng' : 'giảm'} ${growthRate?.toFixed ? growthRate.toFixed(1) : growthRate}%`
            },
            bestNames.length
                ? { icon: '⭐', label: `Top bán chạy: ${bestNames.slice(0, 2).join(', ')}` }
                : { icon: '⭐', label: 'Chưa có sản phẩm nổi bật' }
        ].filter(Boolean);

        const risks = [];
        if (growthRate < 0) {
            risks.push({
                level: Math.abs(growthRate) > 10 ? 'high' : 'medium',
                text: 'Doanh thu giảm so với tháng trước'
            });
        }
        if (cancelRate > 5) {
            risks.push({
                level: cancelRate > 10 ? 'high' : 'medium',
                text: `Tỷ lệ hủy ${cancelRate.toFixed(2)}% vượt ngưỡng`
            });
        }

        const actions = [
            'Chạy ưu đãi ngắn cho nhóm sản phẩm top.',
            'Kiểm tra tồn kho và SLA giao hàng để giảm hủy.',
            'Retarget khách bỏ giỏ/khách cũ 7 ngày.'
        ];

        return {
            summary: `Doanh thu hôm nay ${todayRevenue.toLocaleString('vi-VN')}₫ (${orderToday} đơn); tháng ${monthRevenue.toLocaleString('vi-VN')}₫ (${growthRate?.toFixed ? growthRate.toFixed(1) : growthRate}%). Hủy ${cancelRate.toFixed(2)}%.`,
            keys,
            risks,
            actions,
            forecastText: fallbackForecast.forecastText,
            trend: fallbackForecast.trend,
            confidence: fallbackForecast.confidence
        };
    }

    const summaryLines = [
        `Doanh thu hôm nay: ${todayRevenue.toLocaleString('vi-VN')}₫ (${orderToday} đơn).`,
        `Doanh thu tháng: ${monthRevenue.toLocaleString('vi-VN')}₫ (${growthRate?.toFixed ? growthRate.toFixed(1) : growthRate}% so với tháng trước).`,
        `Khách hàng: ${customerCount}, tỷ lệ hủy ${cancelRate.toFixed(2)}%.`
    ];

    const insights = [
        {
            title: 'Xu hướng doanh thu',
            type: growthRate > 5 ? 'good' : growthRate < -5 ? 'bad' : 'warning',
            detail: `Doanh thu tháng đang ${trendDirection}; cần duy trì/kích hoạt chiến dịch nếu muốn cải thiện.`
        },
        {
            title: 'Sản phẩm chủ lực',
            type: bestNames.length ? 'good' : 'warning',
            detail: bestNames.length ? `Top bán chạy: ${bestNames.join(', ')}.` : 'Chưa ghi nhận sản phẩm bán chạy nổi bật.'
        },
        {
            title: 'Tỷ lệ hủy đơn',
            type: cancelRate > 5 ? 'bad' : 'good',
            detail: `Tỷ lệ hủy ${cancelRate.toFixed(2)}%; ${cancelRate > 5 ? 'cần kiểm tra giao hàng/tồn kho' : 'đang trong mức ổn'}.`
        }
    ];

    const forecast =
        growthRate >= 0
            ? 'Nếu giữ nhịp hiện tại, doanh thu 7 ngày tới có thể đi ngang hoặc nhích nhẹ.'
            : 'Nếu không có thay đổi, doanh thu 7 ngày tới có thể tiếp tục giảm nhẹ.';

    const actions = [
        {
            title: 'Đẩy doanh thu nhanh',
            detail: 'Chạy flash sale/giảm giá nhẹ cho top bán chạy trong 48h tới.'
        },
        {
            title: 'Giảm hủy đơn',
            detail: 'Rà soát tồn kho, thời gian giao hàng; ưu tiên xác nhận đơn mới trong 2h.'
        },
        {
            title: 'Kích hoạt khách mới/quay lại',
            detail: 'Gửi mã giảm giá nhỏ cho khách mới và retarget khách bỏ giỏ 7 ngày qua.'
        }
    ];

    const riskAlerts = [];
    if (growthRate < 0) {
        riskAlerts.push({
            title: 'Doanh thu giảm so với tháng trước',
            severity: Math.abs(growthRate) > 10 ? 'high' : 'medium',
            detail: 'Đà tăng trưởng đang âm; cần kích hoạt chiến dịch thu hút lưu lượng và chuyển đổi.'
        });
    }
    if (cancelRate > 5) {
        riskAlerts.push({
            title: 'Tỷ lệ hủy đơn cao',
            severity: cancelRate > 10 ? 'high' : 'medium',
            detail: `Tỷ lệ hủy ${cancelRate.toFixed(2)}% vượt ngưỡng an toàn; kiểm tra tồn kho, SLA giao hàng.`
        });
    }
    if (topProducts.length === 0) {
        riskAlerts.push({
            title: 'Thiếu sản phẩm chủ lực',
            severity: 'medium',
            detail: 'Chưa có sản phẩm bán chạy nổi bật; cần thử nghiệm ưu đãi để tìm sản phẩm chủ lực.'
        });
    }

    const kpiSuggestions = [
        {
            kpi: 'Tỷ lệ hủy đơn',
            current: `${cancelRate.toFixed(2)}%`,
            target: '≤ 3%',
            comment: 'Giảm hủy giúp giữ doanh thu ròng và cải thiện trải nghiệm khách.'
        },
        {
            kpi: 'Tăng trưởng doanh thu tháng',
            current: `${growthRate?.toFixed ? growthRate.toFixed(1) : growthRate}%`,
            target: '≥ 5%',
            comment: 'Đảm bảo đà tăng trưởng ổn định, tránh lệ thuộc mùa vụ.'
        },
        {
            kpi: 'Số đơn mỗi ngày',
            current: `${orderToday}`,
            target: 'Tăng 10-15%',
            comment: 'Tăng tần suất đơn để tận dụng tồn kho và giảm chi phí cố định.'
        }
    ];

    const detailedForecast = fallbackForecast;

    return {
        summary: summaryLines.join(' '),
        insights,
        forecastText: detailedForecast.forecastText,
        trend: detailedForecast.trend,
        confidence: detailedForecast.confidence,
        actions,
        riskAlerts,
        kpiSuggestions
    };
};

const buildAIAnalyticsPrompt = (metrics) => {
    return `
Bạn là AI Business Analyst của Walkzy. Trả về duy nhất 1 JSON, không thêm bất kỳ văn bản nào khác.
Không bịa số liệu, chỉ phân tích dựa trên dữ liệu cung cấp. Ngắn gọn, rõ ràng, actionable.

Cấu trúc JSON bắt buộc:
{
  "summary": "Tóm tắt ngắn 3–5 dòng các điểm chính nhất.",
  "insights": [
    { "title": "Tên insight", "type": "good | warning | bad", "detail": "Giải thích ngắn gọn, rõ ràng" }
  ],
  "forecast": "Dự đoán xu hướng 7 ngày tới",
  "actions": [
    { "title": "Tên hành động", "detail": "Hướng dẫn ngắn gọn, thực thi ngay" }
  ],
  "riskAlerts": [
    { "title": "Tên rủi ro", "severity": "low | medium | high", "detail": "Mô tả rủi ro dựa trên dữ liệu" }
  ],
  "kpiSuggestions": [
    { "kpi": "Tên KPI", "current": "Giá trị hiện tại", "target": "Mức đề xuất", "comment": "Lý do" }
  ]
}

Dữ liệu:
- Doanh thu hôm nay: ${metrics.todayRevenue}
- Doanh thu tháng này: ${metrics.monthRevenue}
- % tăng giảm so với tháng trước: ${metrics.growthRate}
- Số đơn hôm nay: ${metrics.orderToday}
- Tổng khách hàng: ${metrics.customerCount}
- Tỷ lệ hủy đơn: ${metrics.cancelRate}%
- Sản phẩm bán chạy: ${JSON.stringify(metrics.topProducts || [])}
- Doanh thu từng ngày: ${JSON.stringify(metrics.revenueTimeline || [])}
`.trim();
};

const buildCompactPrompt = (metrics) => {
    return `
Bạn là AI Business Analyst của Walkzy. Chế độ COMPACT VIEW.
Chỉ trả về 1 JSON đúng schema dưới, không thêm văn bản ngoài JSON.
Không bịa số liệu. Câu ngắn, rõ, trọng tâm.

JSON schema:
{
  "summary": "1–2 câu tóm tắt tình hình tổng quan.",
  "keys": [
    { "icon": "📈 | 📉 | ⭐", "label": "Insight ngắn 1 dòng" }
  ],
  "risks": [
    { "level": "high | medium | low", "text": "Cảnh báo ngắn gọn 1 dòng" }
  ],
  "actions": [
    "Hành động 1 dòng giúp cải thiện ngay",
    "Hành động 1 dòng rõ ràng"
  ]
}

Dữ liệu:
- Doanh thu hôm nay: ${metrics.todayRevenue}
- Doanh thu tháng này: ${metrics.monthRevenue}
- % tăng giảm so với tháng trước: ${metrics.growthRate}
- Số đơn hôm nay: ${metrics.orderToday}
- Tổng khách hàng: ${metrics.customerCount}
- Tỷ lệ hủy đơn: ${metrics.cancelRate}%
- Sản phẩm bán chạy: ${JSON.stringify(metrics.topProducts || [])}
- Doanh thu từng ngày: ${JSON.stringify(metrics.revenueTimeline || [])}
`.trim();
};

const getAIAnalyticsInsights = async (mode = 'detailed') => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [todayAgg, monthAgg, lastMonthAgg] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: todayStart },
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: '$totalPrice' },
                        orders: { $sum: 1 }
                    }
                }
            ]),
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthStart },
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: '$totalPrice' },
                        orders: { $sum: 1 }
                    }
                }
            ]),
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: lastMonthStart, $lt: monthStart },
                        status: { $ne: 'cancelled' },
                        isPaid: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: '$totalPrice' },
                        orders: { $sum: 1 }
                    }
                }
            ])
        ]);

        const todayRevenue = todayAgg[0]?.revenue || 0;
        const orderToday = todayAgg[0]?.orders || 0;
        const monthRevenue = monthAgg[0]?.revenue || 0;
        const lastMonthRevenue = lastMonthAgg[0]?.revenue || 0;
        const growthRate = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

        const customerCount = await User.countDocuments();

        const cancelWindowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        const cancelAgg = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: cancelWindowStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                }
            }
        ]);
        const totalOrdersWindow = cancelAgg[0]?.total || 0;
        const cancelledOrders = cancelAgg[0]?.cancelled || 0;
        const cancelRate = totalOrdersWindow > 0 ? (cancelledOrders / totalOrdersWindow) * 100 : 0;

        const topProductsAgg = await Order.aggregate([
            { $unwind: '$orderItems' },
            {
                $match: {
                    status: { $ne: 'cancelled' },
                    isPaid: true,
                    createdAt: { $gte: cancelWindowStart }
                }
            },
            {
                $group: {
                    _id: '$orderItems.product',
                    totalSold: { $sum: '$orderItems.amount' },
                    totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.amount'] } },
                    productName: { $first: '$orderItems.name' },
                    productImage: { $first: '$orderItems.image' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        const revenueTimeline = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14) },
                    status: { $ne: 'cancelled' },
                    isPaid: true
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalPrice' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const metrics = {
            todayRevenue,
            monthRevenue,
            growthRate,
            orderToday,
            customerCount,
            cancelRate,
            topProducts: topProductsAgg.map((p) => ({
                productId: p._id,
                productName: p.productName,
                productImage: p.productImage,
                totalSold: p.totalSold,
                totalRevenue: p.totalRevenue
            })),
            revenueTimeline
        };

        let aiInsights = null;

        if (genAI) {
            try {
                const prompt =
                    mode === 'compact'
                        ? buildCompactPrompt({
                              ...metrics,
                              growthRate: Number.isFinite(growthRate) ? growthRate.toFixed(2) : growthRate
                          })
                        : buildAIAnalyticsPrompt({
                              ...metrics,
                              growthRate: Number.isFinite(growthRate) ? growthRate.toFixed(2) : growthRate
                          });
                const response = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt
                });
                const rawText = response.text || response.response?.text || '';
                const parsed = parseInsightResponse(rawText);
                if (mode === 'compact') {
                    if (parsed && parsed.summary && parsed.keys && parsed.actions) {
                        aiInsights = {
                            summary: parsed.summary,
                            keys: parsed.keys,
                            risks: parsed.risks || [],
                            actions: parsed.actions
                        };
                    }
                } else if (parsed && parsed.summary && parsed.insights && parsed.actions) {
                    aiInsights = {
                        summary: parsed.summary,
                        insights: parsed.insights,
                        forecast: parsed.forecast || '',
                        actions: parsed.actions,
                        riskAlerts: parsed.riskAlerts || [],
                        kpiSuggestions: parsed.kpiSuggestions || []
                    };
                } else if (parsed) {
                    aiInsights = {
                        summary: parsed.summary || '',
                        insights: parsed.trends || parsed.insights || [],
                        forecast: parsed.forecast || '',
                        actions: parsed.actions || [],
                        riskAlerts: parsed.riskAlerts || [],
                        kpiSuggestions: parsed.kpiSuggestions || []
                    };
                }
            } catch (error) {
                console.warn('AI analytics fallback used due to Gemini error:', error.message);
            }
        }

        const fallback = buildFallbackInsights(metrics, mode);
        const finalInsights = aiInsights || fallback;

        return {
            status: 'OK',
            message: 'SUCCESS',
            data: {
                ...finalInsights,
                metrics
            }
        };
    } catch (error) {
        console.error('Error in getAIAnalyticsInsights:', error);
        return {
            status: 'ERR',
            message: error.message || 'Không thể tạo insight AI',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }
};

module.exports = {
    getRevenueStatistics,
    getBestSellingProducts,
    getCancellationRate,
    getNewCustomersStatistics,
    getInventoryStatistics,
    getOrderTimeHeatmap,
    getDashboardOverview,
    getTopProvincesByOrders,
    getTopBrandsByOrders,
    getTopCategoriesByOrders,
    getAIAnalyticsInsights
};

