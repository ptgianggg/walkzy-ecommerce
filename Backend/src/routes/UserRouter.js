const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authMiddleWare, authUserMiddleWare } = require('../middleware/authMiddleware');
const { loginGoogle } = require('../controllers/UserController');


router.post('/sign-up', userController.createUser)
router.post('/sign-in', userController.loginUser)
router.post('/log-out', userController.logoutUser)
router.put('/update-user/:id', authUserMiddleWare, userController.updateUser)
router.delete('/delete-user/:id', authMiddleWare, userController.deleteUser)
router.get('/getAll', authMiddleWare, userController.getAllUser)
router.get('/get-details/:id', authUserMiddleWare, userController.getDetailsUser)
router.post('/refresh-token', userController.refreshToken)
router.post('/delete-many', authMiddleWare, userController.deleteMany)
router.post('/login-google', userController.loginGoogle);

// Admin routes
router.put('/lock/:id', authMiddleWare, userController.lockUser)
router.put('/unlock/:id', authMiddleWare, userController.unlockUser)
router.put('/role/:id', authMiddleWare, userController.updateUserRole)
router.put('/role-id/:id', authMiddleWare, userController.updateUserRoleId)
router.get('/statistics', authMiddleWare, userController.getUserStatistics)
router.get('/order-history/:id', authMiddleWare, userController.getUserOrderHistory)
router.get('/permissions/:id', authMiddleWare, userController.getUserPermissions)

module.exports = router;
