const AnalyticsService = require('../services/AnalyticsService');

const getRevenueStatistics = async (req, res) => {
    try {
        const { period = 'day' } = req.query;
        const result = await AnalyticsService.getRevenueStatistics(period);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting revenue statistics'
        });
    }
};

const getBestSellingProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const result = await AnalyticsService.getBestSellingProducts(parseInt(limit));
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting best selling products'
        });
    }
};

const getCancellationRate = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const result = await AnalyticsService.getCancellationRate(period);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting cancellation rate'
        });
    }
};

const getNewCustomersStatistics = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const result = await AnalyticsService.getNewCustomersStatistics(period);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting new customers statistics'
        });
    }
};

const getInventoryStatistics = async (req, res) => {
    try {
        const result = await AnalyticsService.getInventoryStatistics();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting inventory statistics'
        });
    }
};

const getOrderTimeHeatmap = async (req, res) => {
    try {
        const result = await AnalyticsService.getOrderTimeHeatmap();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting order time heatmap'
        });
    }
};

const getDashboardOverview = async (req, res) => {
    try {
        const result = await AnalyticsService.getDashboardOverview();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting dashboard overview'
        });
    }
};

const getTopProvincesByOrders = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const result = await AnalyticsService.getTopProvincesByOrders(parseInt(limit));
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting top provinces by orders'
        });
    }
};

const getTopBrandsByOrders = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const result = await AnalyticsService.getTopBrandsByOrders(parseInt(limit));
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting top brands by orders'
        });
    }
};

const getTopCategoriesByOrders = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const result = await AnalyticsService.getTopCategoriesByOrders(parseInt(limit));
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Error getting top categories by orders'
        });
    }
};

const getAIAnalyticsInsights = async (req, res) => {
    try {
        const mode = req.query.mode || 'detailed';
        const result = await AnalyticsService.getAIAnalyticsInsights(mode);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(500).json({
            status: 'ERR',
            message: e.message || 'Error generating AI analytics insights'
        });
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
    getAIAnalyticsInsights,
    getTopBrandsByOrders,
    getTopCategoriesByOrders
};

