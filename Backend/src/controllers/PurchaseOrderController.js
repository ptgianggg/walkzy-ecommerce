const PurchaseOrderService = require('../services/PurchaseOrderService');

const createPurchaseOrder = async (req, res) => {
    try {
        const { supplier, warehouse, items, orderDate, expectedDate, notes } = req.body;
        const createdBy = req.user?.id;

        if (!supplier || !warehouse || !items || items.length === 0) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        const response = await PurchaseOrderService.createPurchaseOrder({
            supplier,
            warehouse,
            items,
            orderDate,
            expectedDate,
            notes,
            createdBy
        });
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const updatePurchaseOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const data = req.body;
        const response = await PurchaseOrderService.updatePurchaseOrder(orderId, data);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const confirmPurchaseOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const confirmedBy = req.user?.id;
        const response = await PurchaseOrderService.confirmPurchaseOrder(orderId, confirmedBy);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const receivePurchaseOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const receivedBy = req.user?.id;
        const response = await PurchaseOrderService.receivePurchaseOrder(orderId, receivedBy);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getAllPurchaseOrder = async (req, res) => {
    try {
        const filters = {
            supplier: req.query.supplier,
            warehouse: req.query.warehouse,
            status: req.query.status
        };
        const response = await PurchaseOrderService.getAllPurchaseOrder(filters);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getDetailsPurchaseOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const response = await PurchaseOrderService.getDetailsPurchaseOrder(orderId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const deletePurchaseOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const response = await PurchaseOrderService.deletePurchaseOrder(orderId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

module.exports = {
    createPurchaseOrder,
    updatePurchaseOrder,
    confirmPurchaseOrder,
    receivePurchaseOrder,
    getAllPurchaseOrder,
    getDetailsPurchaseOrder,
    deletePurchaseOrder
};

