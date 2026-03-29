const WarehouseService = require('../services/WarehouseService');

const createWarehouse = async (req, res) => {
    try {
        const { name, code, address, city, district, ward, phone, email, manager, description, isActive, isDefault } = req.body;
        if (!name || !address || !city) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên kho, Địa chỉ, Thành phố)'
            });
        }
        const response = await WarehouseService.createWarehouse({
            name, code, address, city, district, ward, phone, email, manager, description, isActive, isDefault
        });
        return res.status(200).json(response);
    } catch (e) {
        console.error('Error creating warehouse:', e);
        return res.status(200).json({
            status: 'ERR',
            message: e?.message || 'Có lỗi xảy ra khi tạo kho hàng'
        });
    }
};

const updateWarehouse = async (req, res) => {
    try {
        const warehouseId = req.params.id;
        const data = req.body;
        const response = await WarehouseService.updateWarehouse(warehouseId, data);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const deleteWarehouse = async (req, res) => {
    try {
        const warehouseId = req.params.id;
        const response = await WarehouseService.deleteWarehouse(warehouseId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getAllWarehouse = async (req, res) => {
    try {
        const response = await WarehouseService.getAllWarehouse();
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getDetailWarehouse = async (req, res) => {
    try {
        const warehouseId = req.params.id;
        const response = await WarehouseService.getDetailWarehouse(warehouseId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getDefaultWarehouse = async (req, res) => {
    try {
        const response = await WarehouseService.getDefaultWarehouse();
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

module.exports = {
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getAllWarehouse,
    getDetailWarehouse,
    getDefaultWarehouse
};

