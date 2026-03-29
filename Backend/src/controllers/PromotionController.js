const PromotionService = require('../services/PromotionService');

const createPromotion = async (req, res) => {
    try {
        const result = await PromotionService.createPromotion(req.body);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const updatePromotion = async (req, res) => {
    try {
        const promotionId = req.params.id;
        const data = req.body;
        if (!promotionId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The promotionId is required'
            });
        }
        
        // Get old promotion data for logging
        const Promotion = require('../models/PromotionModel');
        const oldPromotion = await Promotion.findById(promotionId).lean();
        
        const result = await PromotionService.updatePromotion(promotionId, data);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const deletePromotion = async (req, res) => {
    try {
        const promotionId = req.params.id;
        if (!promotionId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The promotionId is required'
            });
        }
        
        // Get promotion data before deletion for logging
        const Promotion = require('../models/PromotionModel');
        const promotionToDelete = await Promotion.findById(promotionId).lean();
        
        const result = await PromotionService.deletePromotion(promotionId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getAllPromotion = async (req, res) => {
    try {
        const result = await PromotionService.getAllPromotion();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getDetailPromotion = async (req, res) => {
    try {
        const promotionId = req.params.id;
        if (!promotionId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The promotionId is required'
            });
        }
        const result = await PromotionService.getDetailPromotion(promotionId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getActivePromotions = async (req, res) => {
    try {
        const result = await PromotionService.getActivePromotions();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

module.exports = {
    createPromotion,
    updatePromotion,
    deletePromotion,
    getAllPromotion,
    getDetailPromotion,
    getActivePromotions
};

