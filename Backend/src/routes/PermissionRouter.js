const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/PermissionController');
const { authMiddleWare } = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu admin
router.post('/create', authMiddleWare, permissionController.createPermission);
router.get('/getAll', authMiddleWare, permissionController.getAllPermissions);
router.get('/get-by-module/:module', authMiddleWare, permissionController.getPermissionsByModule);
router.get('/get-details/:id', authMiddleWare, permissionController.getPermissionById);
router.put('/update/:id', authMiddleWare, permissionController.updatePermission);
router.delete('/delete/:id', authMiddleWare, permissionController.deletePermission);
router.delete('/delete-many', authMiddleWare, permissionController.deleteManyPermissions);
router.get('/modules', authMiddleWare, permissionController.getModules);
router.post('/initialize-defaults', authMiddleWare, permissionController.initializeDefaultPermissions);

module.exports = router;

