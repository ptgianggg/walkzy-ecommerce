const { Permission, MODULES, ACTIONS } = require('../models/PermissionModel');
const Role = require('../models/RoleModel');

// Tạo quyền mới
const createPermission = (permissionData, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, code, description, module, action, isSensitive } = permissionData;

            // Kiểm tra code đã tồn tại chưa
            const existingPermission = await Permission.findOne({ code: code.toUpperCase() });
            if (existingPermission) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã quyền đã tồn tại'
                });
            }

            // Kiểm tra module.action đã tồn tại chưa
            const existingModuleAction = await Permission.findOne({
                module,
                action,
                isActive: true
            });
            if (existingModuleAction) {
                return resolve({
                    status: 'ERR',
                    message: `Quyền ${module}.${action} đã tồn tại`
                });
            }

            const newPermission = await Permission.create({
                name,
                code: code.toUpperCase(),
                description,
                module,
                action,
                isSensitive: isSensitive || false,
                createdBy: userId,
                updatedBy: userId
            });

            const permissionWithCreator = await Permission.findById(newPermission._id)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');

            resolve({
                status: 'OK',
                message: 'Tạo quyền thành công',
                data: permissionWithCreator
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Lấy tất cả quyền
const getAllPermissions = (filters = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { search, module, action, isSensitive, isActive } = filters;
            const query = {};

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            if (module) {
                query.module = module;
            }

            if (action) {
                query.action = action;
            }

            if (isSensitive !== undefined) {
                query.isSensitive = isSensitive;
            }

            if (isActive !== undefined) {
                query.isActive = isActive;
            }

            const permissions = await Permission.find(query)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .sort({ module: 1, action: 1 });

            resolve({
                status: 'OK',
                message: 'Lấy danh sách quyền thành công',
                data: permissions
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Lấy quyền theo module
const getPermissionsByModule = (module) => {
    return new Promise(async (resolve, reject) => {
        try {
            const permissions = await Permission.find({
                module,
                isActive: true
            }).sort({ action: 1 });

            resolve({
                status: 'OK',
                message: 'Lấy danh sách quyền theo module thành công',
                data: permissions
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Lấy chi tiết quyền
const getPermissionById = (permissionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const permission = await Permission.findById(permissionId)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');

            if (!permission) {
                return resolve({
                    status: 'ERR',
                    message: 'Quyền không tồn tại'
                });
            }

            resolve({
                status: 'OK',
                message: 'Lấy chi tiết quyền thành công',
                data: permission
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Cập nhật quyền
const updatePermission = (permissionId, permissionData, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const permission = await Permission.findById(permissionId);
            if (!permission) {
                return resolve({
                    status: 'ERR',
                    message: 'Quyền không tồn tại'
                });
            }

            const { name, code, description, module, action, isSensitive, isActive } = permissionData;

            // Kiểm tra code trùng (trừ chính nó)
            if (code && code.toUpperCase() !== permission.code) {
                const existingPermission = await Permission.findOne({ code: code.toUpperCase() });
                if (existingPermission) {
                    return resolve({
                        status: 'ERR',
                        message: 'Mã quyền đã tồn tại'
                    });
                }
                permission.code = code.toUpperCase();
            }

            // Kiểm tra module.action trùng (trừ chính nó)
            if ((module || action) && (module !== permission.module || action !== permission.action)) {
                const finalModule = module || permission.module;
                const finalAction = action || permission.action;
                const existingModuleAction = await Permission.findOne({
                    module: finalModule,
                    action: finalAction,
                    isActive: true,
                    _id: { $ne: permissionId }
                });
                if (existingModuleAction) {
                    return resolve({
                        status: 'ERR',
                        message: `Quyền ${finalModule}.${finalAction} đã tồn tại`
                    });
                }
            }

            if (name) permission.name = name;
            if (description !== undefined) permission.description = description;
            if (module) permission.module = module;
            if (action) permission.action = action;
            if (isSensitive !== undefined) permission.isSensitive = isSensitive;
            if (isActive !== undefined) permission.isActive = isActive;

            permission.updatedBy = userId;
            await permission.save();

            const updatedPermission = await Permission.findById(permissionId)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');

            resolve({
                status: 'OK',
                message: 'Cập nhật quyền thành công',
                data: updatedPermission
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Xóa quyền
const deletePermission = (permissionId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const permission = await Permission.findById(permissionId);
            if (!permission) {
                return resolve({
                    status: 'ERR',
                    message: 'Quyền không tồn tại'
                });
            }

            // Kiểm tra xem có vai trò nào đang sử dụng quyền này không
            const rolesWithPermission = await Role.countDocuments({
                permissions: permissionId
            });
            if (rolesWithPermission > 0) {
                return resolve({
                    status: 'ERR',
                    message: `Không thể xóa quyền. Có ${rolesWithPermission} vai trò đang sử dụng quyền này`
                });
            }

            await Permission.findByIdAndDelete(permissionId);

            resolve({
                status: 'OK',
                message: 'Xóa quyền thành công'
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Xóa nhiều quyền
const deleteManyPermissions = (permissionIds, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
                return resolve({
                    status: 'ERR',
                    message: 'Danh sách ID quyền không hợp lệ'
                });
            }

            const permissions = await Permission.find({ _id: { $in: permissionIds } });
            
            // Kiểm tra các permissions không tồn tại
            const foundIds = permissions.map(p => p._id.toString());
            const notFoundIds = permissionIds.filter(id => !foundIds.includes(id));
            
            if (notFoundIds.length > 0) {
                return resolve({
                    status: 'ERR',
                    message: `Một số quyền không tồn tại: ${notFoundIds.join(', ')}`
                });
            }

            // Kiểm tra permissions đang được sử dụng
            const rolesWithPermissions = await Role.find({
                permissions: { $in: permissionIds }
            });

            const permissionUsageCount = {};
            rolesWithPermissions.forEach(role => {
                if (role.permissions && Array.isArray(role.permissions)) {
                    role.permissions.forEach(permId => {
                        const permIdStr = permId.toString();
                        if (permissionIds.includes(permIdStr)) {
                            permissionUsageCount[permIdStr] = (permissionUsageCount[permIdStr] || 0) + 1;
                        }
                    });
                }
            });

            const usedPermissions = permissions.filter(p => permissionUsageCount[p._id.toString()] > 0);
            if (usedPermissions.length > 0) {
                const usedNames = usedPermissions.map(p => {
                    const count = permissionUsageCount[p._id.toString()];
                    return `${p.name} (${count} vai trò)`;
                }).join(', ');
                return resolve({
                    status: 'ERR',
                    message: `Không thể xóa các quyền đang được sử dụng: ${usedNames}`
                });
            }

            // Xóa các permissions
            await Permission.deleteMany({ _id: { $in: permissionIds } });

            resolve({
                status: 'OK',
                message: `Xóa ${permissions.length} quyền thành công`
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Lấy danh sách modules chuẩn
const getModules = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Trả về danh sách modules chuẩn từ model
            const moduleLabels = {
                'user': 'Người dùng',
                'product': 'Sản phẩm',
                'order': 'Đơn hàng',
                'category': 'Danh mục',
                'brand': 'Thương hiệu',
                'collection': 'Bộ sưu tập',
                'promotion': 'Khuyến mãi',
                'banner': 'Banner/Thông báo',
                'attribute': 'Thuộc tính',
                'analytics': 'Thống kê',
                'review': 'Đánh giá',
                'notification': 'Thông báo',
                'voucher': 'Mã giảm giá',
                'chat': 'Chat',
                'shipping': 'Vận chuyển',
                'warehouse': 'Kho hàng',
                'stock': 'Tồn kho',
                'supplier': 'Nhà cung cấp',
                'purchase-order': 'Đơn mua hàng',
                'support-request': 'Hỗ trợ/Khiếu nại',
                'settings': 'Cài đặt hệ thống',
                'role': 'Vai trò',
                'permission': 'Quyền'
            };

            const modules = MODULES.map(code => ({
                code,
                label: moduleLabels[code] || code
            }));

            resolve({
                status: 'OK',
                message: 'Lấy danh sách modules thành công',
                data: modules
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Khởi tạo quyền mặc định - đầy đủ cho tất cả modules
const initializeDefaultPermissions = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Định nghĩa quyền nhạy cảm cho mỗi module
            const sensitiveActions = {
                'user': ['delete', 'manage'],
                'product': ['delete', 'manage'],
                'order': ['delete', 'manage'],
                'category': ['delete', 'manage'],
                'brand': ['delete', 'manage'],
                'collection': ['delete', 'manage'],
                'promotion': ['delete', 'manage'],
                'banner': ['delete', 'manage'],
                'attribute': ['delete', 'manage'],
                'analytics': [],
                'review': ['delete', 'manage'],
                'notification': ['delete', 'manage'],
                'voucher': ['delete', 'manage'],
                'chat': ['delete', 'manage'],
                'shipping': ['delete', 'manage'],
                'warehouse': ['delete', 'manage'],
                'stock': ['delete', 'manage'],
                'supplier': ['delete', 'manage'],
                'purchase-order': ['delete', 'manage'],
                'support-request': ['delete', 'manage'],
                'settings': ['update', 'manage'],
                'role': ['create', 'update', 'delete', 'manage'],
                'permission': ['create', 'update', 'delete', 'manage']
            };

            // Tên module tiếng Việt
            const moduleNames = {
                'user': 'Người dùng',
                'product': 'Sản phẩm',
                'order': 'Đơn hàng',
                'category': 'Danh mục',
                'brand': 'Thương hiệu',
                'collection': 'Bộ sưu tập',
                'promotion': 'Khuyến mãi',
                'banner': 'Banner',
                'attribute': 'Thuộc tính',
                'analytics': 'Thống kê',
                'review': 'Đánh giá',
                'notification': 'Thông báo',
                'voucher': 'Mã giảm giá',
                'chat': 'Chat',
                'shipping': 'Vận chuyển',
                'warehouse': 'Kho hàng',
                'stock': 'Tồn kho',
                'supplier': 'Nhà cung cấp',
                'purchase-order': 'Đơn mua hàng',
                'support-request': 'Hỗ trợ/Khiếu nại',
                'settings': 'Cài đặt hệ thống',
                'role': 'Vai trò',
                'permission': 'Quyền'
            };

            // Tên action tiếng Việt
            const actionNames = {
                'create': 'Tạo',
                'read': 'Xem',
                'update': 'Cập nhật',
                'delete': 'Xóa',
                'manage': 'Quản lý',
                'export': 'Xuất',
                'import': 'Nhập'
            };

            const defaultPermissions = [];

            // Tạo quyền cho tất cả modules
            MODULES.forEach(module => {
                const moduleName = moduleNames[module] || module;
                const sensitiveActionsForModule = sensitiveActions[module] || [];

                ACTIONS.forEach(action => {
                    // Bỏ qua một số action không phù hợp với một số module
                    if (module === 'analytics' && ['create', 'update', 'delete'].includes(action)) {
                        return; // Analytics chỉ có read, export
                    }
                    if (module === 'settings' && action === 'create') {
                        return; // Settings không có create
                    }

                    const actionName = actionNames[action] || action;
                    const code = `${module.toUpperCase()}_${action.toUpperCase()}`;
                    const name = `${actionName} ${moduleName}`;
                    const isSensitive = sensitiveActionsForModule.includes(action);

                    defaultPermissions.push({
                        name,
                        code,
                        module,
                        action,
                        isSensitive,
                        description: `${actionName} ${moduleName.toLowerCase()}`
                    });
                });
            });

            const createdPermissions = [];
            for (const perm of defaultPermissions) {
                const existing = await Permission.findOne({ code: perm.code });
                if (!existing) {
                    const newPerm = await Permission.create({
                        ...perm,
                        createdBy: userId,
                        updatedBy: userId
                    });
                    createdPermissions.push(newPerm);
                }
            }

            resolve({
                status: 'OK',
                message: `Đã khởi tạo ${createdPermissions.length} quyền mặc định`,
                data: createdPermissions
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    createPermission,
    getAllPermissions,
    getPermissionsByModule,
    getPermissionById,
    updatePermission,
    deletePermission,
    deleteManyPermissions,
    getModules,
    initializeDefaultPermissions
};

