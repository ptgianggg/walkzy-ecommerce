const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/CollectionController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, CollectionController.createCollection);
router.put('/update/:id', authMiddleWare, CollectionController.updateCollection);
router.delete('/delete/:id', authMiddleWare, CollectionController.deleteCollection);
router.get('/get-all', CollectionController.getAllCollection);
router.get('/get-details/:id', CollectionController.getDetailCollection);
router.get('/get-by-slug/:slug', CollectionController.getCollectionBySlug);

module.exports = router;

