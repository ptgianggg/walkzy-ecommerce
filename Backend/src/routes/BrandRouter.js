const express = require('express');
const router = express.Router();
const BrandController = require('../controllers/BrandController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, BrandController.createBrand);
router.put('/update/:id', authMiddleWare, BrandController.updateBrand);
router.delete('/delete/:id', authMiddleWare, BrandController.deleteBrand);
router.get('/get-all', BrandController.getAllBrand);
router.get('/get-details/:id', BrandController.getDetailBrand);

module.exports = router;

