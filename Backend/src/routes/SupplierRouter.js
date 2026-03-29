const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/SupplierController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, SupplierController.createSupplier);
router.put('/update/:id', authMiddleWare, SupplierController.updateSupplier);
router.delete('/delete/:id', authMiddleWare, SupplierController.deleteSupplier);
router.get('/get-all', authMiddleWare, SupplierController.getAllSupplier);
router.get('/get-details/:id', authMiddleWare, SupplierController.getDetailsSupplier);
router.get('/get-active', authMiddleWare, SupplierController.getActiveSuppliers);

module.exports = router;

