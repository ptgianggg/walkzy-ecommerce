const CollectionService = require('../services/CollectionService');

const createCollection = async (req, res) => {
    try {
        const result = await CollectionService.createCollection(req.body);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const updateCollection = async (req, res) => {
    try {
        const collectionId = req.params.id;
        const data = req.body;
        if (!collectionId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The collectionId is required'
            });
        }
        const result = await CollectionService.updateCollection(collectionId, data);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const deleteCollection = async (req, res) => {
    try {
        const collectionId = req.params.id;
        if (!collectionId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The collectionId is required'
            });
        }
        const result = await CollectionService.deleteCollection(collectionId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getAllCollection = async (req, res) => {
    try {
        const result = await CollectionService.getAllCollection();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getDetailCollection = async (req, res) => {
    try {
        const collectionId = req.params.id;
        if (!collectionId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The collectionId is required'
            });
        }
        const result = await CollectionService.getDetailCollection(collectionId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getCollectionBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The slug is required'
            });
        }
        const result = await CollectionService.getCollectionBySlug(slug);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

module.exports = {
    createCollection,
    updateCollection,
    deleteCollection,
    getAllCollection,
    getDetailCollection,
    getCollectionBySlug
};

