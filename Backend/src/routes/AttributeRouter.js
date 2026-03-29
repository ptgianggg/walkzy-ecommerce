const express = require('express');
const router = express.Router();
const AttributeController = require('../controllers/AttributeController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, AttributeController.createAttribute);
router.put('/update/:id', authMiddleWare, AttributeController.updateAttribute);
router.delete('/delete/:id', authMiddleWare, AttributeController.deleteAttribute);
router.post('/delete-many', authMiddleWare, AttributeController.deleteManyAttribute);
router.get('/get-all', AttributeController.getAllAttribute);
router.get('/get-details/:id', AttributeController.getDetailAttribute);

module.exports = router;

