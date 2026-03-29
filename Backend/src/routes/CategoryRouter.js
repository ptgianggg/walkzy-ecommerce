const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, CategoryController.createCategory);
router.put('/update/:id', authMiddleWare, CategoryController.updateCategory);
router.delete('/delete/:id', authMiddleWare, CategoryController.deleteCategory);
router.post('/delete-many', authMiddleWare, CategoryController.deleteMany);
router.get('/get-all', CategoryController.getAllCategory);
router.get('/get-tree', CategoryController.getCategoryTree);
router.get('/get-parents', CategoryController.getParentCategories);
router.get('/get-details/:id', CategoryController.getDetailCategory);

module.exports = router;
