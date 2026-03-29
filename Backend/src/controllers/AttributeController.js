const AttributeService = require('../services/AttributeService');

const createAttribute = async (req, res) => {
    try {
        const result = await AttributeService.createAttribute(req.body);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const updateAttribute = async (req, res) => {
    try {
        const attributeId = req.params.id;
        const data = req.body;
        if (!attributeId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The attributeId is required'
            });
        }
        const result = await AttributeService.updateAttribute(attributeId, data);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const deleteAttribute = async (req, res) => {
    try {
        const attributeId = req.params.id;
        if (!attributeId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The attributeId is required'
            });
        }
        const result = await AttributeService.deleteAttribute(attributeId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getAllAttribute = async (req, res) => {
    try {
        const { type, categoryId } = req.query;
        const result = await AttributeService.getAllAttribute(type, categoryId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getDetailAttribute = async (req, res) => {
    try {
        const attributeId = req.params.id;
        if (!attributeId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The attributeId is required'
            });
        }
        const result = await AttributeService.getDetailAttribute(attributeId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const deleteManyAttribute = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Danh sách ID là bắt buộc'
            });
        }
        const result = await AttributeService.deleteManyAttribute(ids);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

module.exports = {
    createAttribute,
    updateAttribute,
    deleteAttribute,
    getAllAttribute,
    getDetailAttribute,
    deleteManyAttribute
};

