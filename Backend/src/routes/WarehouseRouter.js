const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/WarehouseController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', authMiddleWare, WarehouseController.createWarehouse);
router.put('/update/:id', authMiddleWare, WarehouseController.updateWarehouse);
router.delete('/delete/:id', authMiddleWare, WarehouseController.deleteWarehouse);
router.get('/get-all', authMiddleWare, WarehouseController.getAllWarehouse);
router.get('/get-details/:id', authMiddleWare, WarehouseController.getDetailWarehouse);
router.get('/get-default', authMiddleWare, WarehouseController.getDefaultWarehouse);

module.exports = router;

