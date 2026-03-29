const BrandService = require('../services/BrandService');

const createBrand = async (req, res) => {
    try {
        const result = await BrandService.createBrand(req.body);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const updateBrand = async (req, res) => {
    try {
        const brandId = req.params.id;
        const data = req.body;
        if (!brandId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The brandId is required'
            });
        }
        const result = await BrandService.updateBrand(brandId, data);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const deleteBrand = async (req, res) => {
    try {
        const brandId = req.params.id;
        if (!brandId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The brandId is required'
            });
        }
        const result = await BrandService.deleteBrand(brandId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getAllBrand = async (req, res) => {
    try {
        const result = await BrandService.getAllBrand();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getDetailBrand = async (req, res) => {
    try {
        const brandId = req.params.id;
        if (!brandId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The brandId is required'
            });
        }
        const result = await BrandService.getDetailBrand(brandId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

module.exports = {
    createBrand,
    updateBrand,
    deleteBrand,
    getAllBrand,
    getDetailBrand
};

