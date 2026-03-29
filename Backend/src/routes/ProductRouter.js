const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authMiddleWare, authUserMiddleWare, authTokenMiddleWare, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');


router.post('/create', optionalAuthMiddleware, ProductController.createProduct)
router.put('/update/:id', authMiddleWare, ProductController.updateProduct)
router.get('/get-details/:id', ProductController.getDetailProduct)
router.delete('/delete/:id', authMiddleWare, ProductController.deleteProduct)
router.get('/get-all', optionalAuthMiddleware, ProductController.getAllProduct)
router.get('/search', ProductController.searchProducts)
router.get('/search-ai', ProductController.searchProductsWithAI)
router.get('/search-products', ProductController.searchProductsWithAIClean)
router.get('/search-autocomplete', ProductController.searchProductsAutocomplete)
router.get('/search-suggestions', ProductController.getSearchSuggestions)
router.post('/delete-many', authMiddleWare, ProductController.deleteMany)
router.post('/ai-description', optionalAuthMiddleware, ProductController.generateProductAIDescription)
router.get('/get-all-type', ProductController.getAllType)
router.get('/featured', ProductController.getFeaturedProducts)
router.get('/new', ProductController.getNewProducts)
router.get('/best-selling', ProductController.getBestSellingProducts)
router.get('/most-favorite', ProductController.getMostFavoriteProducts)
router.get('/flash-sale', ProductController.getFlashSaleProducts)
router.get('/collection/:slug', ProductController.getProductsByCollection)
router.get('/category/:id', ProductController.getProductsByCategory)
router.get('/favorite/me', authTokenMiddleWare, ProductController.getFavoriteProducts)
router.post('/:id/favorite', authTokenMiddleWare, ProductController.addFavorite)
router.delete('/:id/favorite', authTokenMiddleWare, ProductController.removeFavorite)
router.post('/search-by-image', upload.single('image'), ProductController.searchProductsByImage)





module.exports = router;
