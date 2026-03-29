const express = require('express');
const router = express.Router();
const BannerController = require('../controllers/BannerController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, BannerController.createBanner);
router.put('/update/:id', authMiddleWare, BannerController.updateBanner);
router.delete('/delete/:id', authMiddleWare, BannerController.deleteBanner);
router.post('/delete-many', authMiddleWare, BannerController.deleteMany);
router.get('/get-all', BannerController.getAllBanner);
router.get('/get-details/:id', BannerController.getDetailBanner);

module.exports = router;

