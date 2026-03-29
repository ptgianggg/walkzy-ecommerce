const express = require('express');
const router = express.Router();
const PurchaseOrderController = require('../controllers/PurchaseOrderController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, PurchaseOrderController.createPurchaseOrder);
router.put('/update/:id', authMiddleWare, PurchaseOrderController.updatePurchaseOrder);
router.post('/confirm/:id', authMiddleWare, PurchaseOrderController.confirmPurchaseOrder);
router.post('/receive/:id', authMiddleWare, PurchaseOrderController.receivePurchaseOrder);
router.get('/get-all', authMiddleWare, PurchaseOrderController.getAllPurchaseOrder);
router.get('/get-details/:id', authMiddleWare, PurchaseOrderController.getDetailsPurchaseOrder);
router.delete('/delete/:id', authMiddleWare, PurchaseOrderController.deletePurchaseOrder);

module.exports = router;

