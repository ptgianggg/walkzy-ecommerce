const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');

dotenv.config();

// Middleware kiểm tra quyền cụ thể
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            // Kiểm tra token
            if (!req.headers.token) {
                return res.status(401).json({
                    message: 'Token không tồn tại',
                    status: 'ERROR'
                });
            }

            let token;
            if (req.headers.token.includes(' ')) {
                token = req.headers.token.split(' ')[1];
            } else {
                token = req.headers.token;
            }

            if (!token) {
                return res.status(401).json({
                    message: 'Token không hợp lệ',
                    status: 'ERROR'
                });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
            const userId = decoded.id;

            // Lấy thông tin user với role và permissions
            const user = await User.findById(userId)
                .populate({
                    path: 'roleId',
                    populate: {
                        path: 'permissions',
                        select: 'code module action'
                    }
                });

            if (!user) {
                return res.status(401).json({
                    message: 'Người dùng không tồn tại',
                    status: 'ERROR'
                });
            }

            // Super admin có tất cả quyền
            if (user.isAdmin) {
                req.user = {
                    id: user._id,
                    isAdmin: true,
                    role: user.roleId
                };
                return next();
            }

            // Kiểm tra role
            if (!user.roleId) {
                return res.status(403).json({
                    message: 'Bạn không có vai trò được gán',
                    status: 'ERROR'
                });
            }

            // Kiểm tra quyền
            const role = user.roleId;
            if (!role || !role.isActive) {
                return res.status(403).json({
                    message: 'Vai trò của bạn không hoạt động',
                    status: 'ERROR'
                });
            }
            
            const permissions = role.permissions || [];

            // Kiểm tra quyền cụ thể hoặc quyền manage (toàn quyền)
            const hasPermission = permissions.some(perm => {
                if (!perm.isActive) return false;
                const permCode = `${perm.module}.${perm.action}`;
                const permFullCode = perm.code; // VD: USER_CREATE
                const [requiredModule, requiredAction] = requiredPermission.split('.');
                
                // So sánh theo format module.action hoặc code
                return permCode === requiredPermission || 
                       permCode === `${requiredModule}.manage` ||
                       permFullCode === `${requiredModule.toUpperCase()}_${requiredAction.toUpperCase()}`;
            });

            if (!hasPermission) {
                return res.status(403).json({
                    message: 'Bạn không có quyền thực hiện hành động này',
                    status: 'ERROR'
                });
            }

            req.user = {
                id: user._id,
                isAdmin: user.isAdmin,
                role: role
            };
            next();
        } catch (error) {
            return res.status(401).json({
                message: 'Lỗi xác thực: ' + error.message,
                status: 'ERROR'
            });
        }
    };
};

// Middleware kiểm tra một trong nhiều quyền
const checkAnyPermission = (...requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.headers.token) {
                return res.status(401).json({
                    message: 'Token không tồn tại',
                    status: 'ERROR'
                });
            }

            let token;
            if (req.headers.token.includes(' ')) {
                token = req.headers.token.split(' ')[1];
            } else {
                token = req.headers.token;
            }

            if (!token) {
                return res.status(401).json({
                    message: 'Token không hợp lệ',
                    status: 'ERROR'
                });
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
            const userId = decoded.id;

            const user = await User.findById(userId)
                .populate({
                    path: 'roleId',
                    populate: {
                        path: 'permissions',
                        select: 'code module action'
                    }
                });

            if (!user) {
                return res.status(401).json({
                    message: 'Người dùng không tồn tại',
                    status: 'ERROR'
                });
            }

            if (user.isAdmin) {
                req.user = {
                    id: user._id,
                    isAdmin: true,
                    role: user.roleId
                };
                return next();
            }

            if (!user.roleId) {
                return res.status(403).json({
                    message: 'Bạn không có vai trò được gán',
                    status: 'ERROR'
                });
            }

            const role = user.roleId;
            const permissions = role.permissions || [];

            // Kiểm tra xem có ít nhất một quyền trong danh sách không
            const hasAnyPermission = requiredPermissions.some(requiredPerm => {
                const [module, action] = requiredPerm.split('.');
                return permissions.some(perm => {
                    const permCode = `${perm.module}.${perm.action}`;
                    return permCode === requiredPerm || 
                           permCode === `${module}.manage`;
                });
            });

            if (!hasAnyPermission) {
                return res.status(403).json({
                    message: 'Bạn không có quyền thực hiện hành động này',
                    status: 'ERROR'
                });
            }

            req.user = {
                id: user._id,
                isAdmin: user.isAdmin,
                role: role
            };
            next();
        } catch (error) {
            return res.status(401).json({
                message: 'Lỗi xác thực: ' + error.message,
                status: 'ERROR'
            });
        }
    };
};

module.exports = {
    checkPermission,
    checkAnyPermission
};

