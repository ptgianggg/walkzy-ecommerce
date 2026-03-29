const StockService = require('../services/StockService');

const createOrUpdateStock = async (req, res) => {
    try {
        const data = req.body;
        const response = await StockService.createOrUpdateStock(data);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const adjustStock = async (req, res) => {
    try {
        const { stockId, quantity, reason, type, notes, orderId } = req.body;
        const userId = req.user?.id;
        
        if (!stockId || quantity === undefined || !reason || !type) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        const response = await StockService.adjustStock(stockId, quantity, reason, type, userId, notes, orderId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const reserveStock = async (req, res) => {
    try {
        const { stockId, quantity, orderId } = req.body;
        const userId = req.user?.id;
        
        if (!stockId || !quantity || !orderId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        const response = await StockService.reserveStock(stockId, quantity, orderId, userId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const unreserveStock = async (req, res) => {
    try {
        const { stockId, quantity, orderId } = req.body;
        const userId = req.user?.id;
        
        if (!stockId || !quantity || !orderId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        const response = await StockService.unreserveStock(stockId, quantity, orderId, userId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getAllStock = async (req, res) => {
    try {
        const filters = {
            productId: req.query.productId,
            warehouseId: req.query.warehouseId,
            lowStock: req.query.lowStock,
            search: req.query.search
        };
        const response = await StockService.getAllStock(filters);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getDetailStock = async (req, res) => {
    try {
        const stockId = req.params.id;
        const response = await StockService.getDetailStock(stockId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getStockHistory = async (req, res) => {
    try {
        const filters = {
            stockId: req.query.stockId,
            productId: req.query.productId,
            warehouseId: req.query.warehouseId,
            type: req.query.type,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: req.query.limit
        };
        const response = await StockService.getStockHistory(filters);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getLowStockProducts = async (req, res) => {
    try {
        const warehouseId = req.query.warehouseId;
        const response = await StockService.getLowStockProducts(warehouseId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getStockByProductAndVariation = async (req, res) => {
    try {
        const { productId, warehouseId, variation } = req.query;
        if (!productId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Vui lòng cung cấp productId'
            });
        }
        const response = await StockService.getStockByProductAndVariation(
            productId,
            warehouseId,
            variation ? JSON.parse(variation) : null
        );
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

module.exports = {
    createOrUpdateStock,
    adjustStock,
    reserveStock,
    unreserveStock,
    getAllStock,
    getDetailStock,
    getStockHistory,
    getLowStockProducts,
    getStockByProductAndVariation
};

