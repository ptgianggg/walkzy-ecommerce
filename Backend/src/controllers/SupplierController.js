const SupplierService = require('../services/SupplierService');

const createSupplier = async (req, res) => {
    try {
        const { 
            name, code, address, city, district, ward, email, phone, 
            contactPerson, taxCode, bankAccount, notes, isActive 
        } = req.body;
        
        if (!name || !address || !email) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Địa chỉ, Email)'
            });
        }

        const response = await SupplierService.createSupplier({
            name, code, address, city, district, ward, email, phone,
            contactPerson, taxCode, bankAccount, notes, isActive
        });
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const supplierId = req.params.id;
        const data = req.body;
        const response = await SupplierService.updateSupplier(supplierId, data);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplierId = req.params.id;
        const response = await SupplierService.deleteSupplier(supplierId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getAllSupplier = async (req, res) => {
    try {
        const response = await SupplierService.getAllSupplier();
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getDetailsSupplier = async (req, res) => {
    try {
        const supplierId = req.params.id;
        const response = await SupplierService.getDetailsSupplier(supplierId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

const getActiveSuppliers = async (req, res) => {
    try {
        const response = await SupplierService.getActiveSuppliers();
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e
        });
    }
};

module.exports = {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getAllSupplier,
    getDetailsSupplier,
    getActiveSuppliers
};

