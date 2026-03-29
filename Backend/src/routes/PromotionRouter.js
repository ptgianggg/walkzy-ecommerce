const express = require('express');
const router = express.Router();
const PromotionController = require('../controllers/PromotionController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, PromotionController.createPromotion);
router.put('/update/:id', authMiddleWare, PromotionController.updatePromotion);
router.delete('/delete/:id', authMiddleWare, PromotionController.deletePromotion);
router.get('/get-all', PromotionController.getAllPromotion);
router.get('/get-active', PromotionController.getActivePromotions);
router.get('/get-details/:id', PromotionController.getDetailPromotion);

module.exports = router;

