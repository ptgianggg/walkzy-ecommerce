const express = require('express');
const router = express.Router();
const roleController = require('../controllers/RoleController');
const { authMiddleWare } = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu admin
router.post('/create', authMiddleWare, roleController.createRole);
router.get('/getAll', authMiddleWare, roleController.getAllRoles);
router.get('/get-details/:id', authMiddleWare, roleController.getRoleById);
router.put('/update/:id', authMiddleWare, roleController.updateRole);
router.delete('/delete/:id', authMiddleWare, roleController.deleteRole);
router.delete('/delete-many', authMiddleWare, roleController.deleteManyRoles);
router.get('/user-count/:id', authMiddleWare, roleController.getRoleUserCount);

module.exports = router;

