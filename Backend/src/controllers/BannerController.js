const BannerService = require('../services/BannerService');

const createBanner = async (req, res) => {
    try {
        const result = await BannerService.createBanner(req.body);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const updateBanner = async (req, res) => {
    try {
        const bannerId = req.params.id;
        const data = req.body;
        if (!bannerId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The bannerId is required'
            });
        }
        const result = await BannerService.updateBanner(bannerId, data);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const deleteBanner = async (req, res) => {
    try {
        const bannerId = req.params.id;
        if (!bannerId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The bannerId is required'
            });
        }
        const result = await BannerService.deleteBanner(bannerId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getAllBanner = async (req, res) => {
    try {
        const { type } = req.query;
        const result = await BannerService.getAllBanner(type);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getDetailBanner = async (req, res) => {
    try {
        const bannerId = req.params.id;
        if (!bannerId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The bannerId is required'
            });
        }
        const result = await BannerService.getDetailBanner(bannerId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const deleteMany = async (req, res) => {
    try {
        const ids = req.body.ids;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Danh sách ID không hợp lệ'
            });
        }
        const result = await BannerService.deleteManyBanner(ids);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(500).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi xóa nhiều banner' 
        });
    }
};

module.exports = {
    createBanner,
    updateBanner,
    deleteBanner,
    deleteMany,
    getAllBanner,
    getDetailBanner
};

