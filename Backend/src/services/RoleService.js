const Role = require('../models/RoleModel');
const { Permission } = require('../models/PermissionModel');
const User = require('../models/UserModel');

// Tạo vai trò mới
const createRole = (roleData, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, code, description, permissions } = roleData;

            // Validate required fields
            if (!name || !code) {
                return resolve({
                    status: 'ERR',
                    message: 'Tên và mã vai trò là bắt buộc'
                });
            }

            // Kiểm tra code đã tồn tại chưa
            const roleCode = code ? code.toUpperCase().trim() : '';
            if (!roleCode) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã vai trò không hợp lệ'
                });
            }

            const existingRole = await Role.findOne({ code: roleCode });
            if (existingRole) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã vai trò đã tồn tại'
                });
            }

            // Validate permissions nếu có
            if (permissions && permissions.length > 0) {
                try {
                    // Validate ObjectId format
                    const mongoose = require('mongoose');
                    const validPermissionIds = permissions.filter(id => mongoose.Types.ObjectId.isValid(id));
                    
                    if (validPermissionIds.length !== permissions.length) {
                        return resolve({
                            status: 'ERR',
                            message: 'Một số quyền có ID không hợp lệ'
                        });
                    }

                    const validPermissions = await Permission.find({
                        _id: { $in: validPermissionIds },
                        isActive: true
                    });
                    
                    if (validPermissions.length !== validPermissionIds.length) {
                        return resolve({
                            status: 'ERR',
                            message: `Một số quyền không tồn tại hoặc đã bị vô hiệu hóa. Tìm thấy ${validPermissions.length}/${validPermissionIds.length} quyền hợp lệ`
                        });
                    }
                } catch (permError) {
                    console.error('Error validating permissions:', permError);
                    return resolve({
                        status: 'ERR',
                        message: 'Lỗi khi kiểm tra quyền: ' + permError.message
                    });
                }
            }

            const newRole = await Role.create({
                name: name.trim(),
                code: roleCode,
                description: description || '',
                permissions: permissions || [],
                createdBy: userId,
                updatedBy: userId
            });

            const roleWithPermissions = await Role.findById(newRole._id)
                .populate('permissions', 'name code module action')
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');

            resolve({
                status: 'OK',
                message: 'Tạo vai trò thành công',
                data: roleWithPermissions
            });
        } catch (error) {
            console.error('Error creating role:', error);
            // Xử lý lỗi validation của Mongoose
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message).join(', ');
                return resolve({
                    status: 'ERR',
                    message: `Lỗi validation: ${messages}`
                });
            }
            // Xử lý lỗi duplicate key
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[0];
                return resolve({
                    status: 'ERR',
                    message: `${field === 'code' ? 'Mã' : field === 'name' ? 'Tên' : field} vai trò đã tồn tại`
                });
            }
            reject(error);
        }
    });
};

// Lấy tất cả vai trò
const getAllRoles = (filters = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { search, isActive } = filters;
            const query = {};

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            if (isActive !== undefined) {
                query.isActive = isActive;
            }

            const roles = await Role.find(query)
                .populate('permissions', 'name code module action isSensitive')
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .sort({ createdAt: -1 });

            resolve({
                status: 'OK',
                message: 'Lấy danh sách vai trò thành công',
                data: roles
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Lấy chi tiết vai trò
const getRoleById = (roleId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const role = await Role.findById(roleId)
                .populate('permissions', 'name code module action description isSensitive')
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');

            if (!role) {
                return resolve({
                    status: 'ERR',
                    message: 'Vai trò không tồn tại'
                });
            }

            resolve({
                status: 'OK',
                message: 'Lấy chi tiết vai trò thành công',
                data: role
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Cập nhật vai trò
const updateRole = (roleId, roleData, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const role = await Role.findById(roleId);
            if (!role) {
                return resolve({
                    status: 'ERR',
                    message: 'Vai trò không tồn tại'
                });
            }

            // Không cho phép chỉnh sửa vai trò hệ thống
            if (role.isSystem) {
                return resolve({
                    status: 'ERR',
                    message: 'Không thể chỉnh sửa vai trò hệ thống'
                });
            }

            const { name, code, description, permissions } = roleData;

            // Kiểm tra code trùng (trừ chính nó)
            if (code && code.toUpperCase() !== role.code) {
                const existingRole = await Role.findOne({ code: code.toUpperCase() });
                if (existingRole) {
                    return resolve({
                        status: 'ERR',
                        message: 'Mã vai trò đã tồn tại'
                    });
                }
                role.code = code.toUpperCase();
            }

            if (name) role.name = name;
            if (description !== undefined) role.description = description;
            if (permissions) {
                // Validate permissions
                const validPermissions = await Permission.find({
                    _id: { $in: permissions },
                    isActive: true
                });
                if (validPermissions.length !== permissions.length) {
                    return resolve({
                        status: 'ERR',
                        message: 'Một số quyền không hợp lệ'
                    });
                }
                role.permissions = permissions;
            }

            role.updatedBy = userId;
            await role.save();

            const updatedRole = await Role.findById(roleId)
                .populate('permissions', 'name code module action isSensitive')
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');

            resolve({
                status: 'OK',
                message: 'Cập nhật vai trò thành công',
                data: updatedRole
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Xóa vai trò
const deleteRole = (roleId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const role = await Role.findById(roleId);
            if (!role) {
                return resolve({
                    status: 'ERR',
                    message: 'Vai trò không tồn tại'
                });
            }

            // Không cho phép xóa vai trò hệ thống
            if (role.isSystem) {
                return resolve({
                    status: 'ERR',
                    message: 'Không thể xóa vai trò hệ thống'
                });
            }

            // Kiểm tra xem có user nào đang sử dụng vai trò này không
            const usersWithRole = await User.countDocuments({ roleId: roleId });
            if (usersWithRole > 0) {
                return resolve({
                    status: 'ERR',
                    message: `Không thể xóa vai trò. Có ${usersWithRole} người dùng đang sử dụng vai trò này`
                });
            }

            await Role.findByIdAndDelete(roleId);

            resolve({
                status: 'OK',
                message: 'Xóa vai trò thành công'
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Xóa nhiều vai trò
const deleteManyRoles = (roleIds, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                return resolve({
                    status: 'ERR',
                    message: 'Danh sách ID vai trò không hợp lệ'
                });
            }

            const roles = await Role.find({ _id: { $in: roleIds } });
            
            // Kiểm tra các roles không tồn tại
            const foundIds = roles.map(r => r._id.toString());
            const notFoundIds = roleIds.filter(id => !foundIds.includes(id));
            
            if (notFoundIds.length > 0) {
                return resolve({
                    status: 'ERR',
                    message: `Một số vai trò không tồn tại: ${notFoundIds.join(', ')}`
                });
            }

            // Kiểm tra system roles
            const systemRoles = roles.filter(r => r.isSystem);
            if (systemRoles.length > 0) {
                const systemNames = systemRoles.map(r => r.name).join(', ');
                return resolve({
                    status: 'ERR',
                    message: `Không thể xóa vai trò hệ thống: ${systemNames}`
                });
            }

            // Kiểm tra roles đang được sử dụng
            const usersWithRoles = await User.find({ roleId: { $in: roleIds } });
            const roleUsageCount = {};
            usersWithRoles.forEach(user => {
                const roleIdStr = user.roleId?.toString();
                if (roleIdStr) {
                    roleUsageCount[roleIdStr] = (roleUsageCount[roleIdStr] || 0) + 1;
                }
            });

            const usedRoles = roles.filter(r => roleUsageCount[r._id.toString()] > 0);
            if (usedRoles.length > 0) {
                const usedNames = usedRoles.map(r => {
                    const count = roleUsageCount[r._id.toString()];
                    return `${r.name} (${count} người dùng)`;
                }).join(', ');
                return resolve({
                    status: 'ERR',
                    message: `Không thể xóa các vai trò đang được sử dụng: ${usedNames}`
                });
            }

            // Xóa các roles
            await Role.deleteMany({ _id: { $in: roleIds } });

            resolve({
                status: 'OK',
                message: `Xóa ${roles.length} vai trò thành công`
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Lấy số lượng user theo vai trò
const getRoleUserCount = (roleId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const count = await User.countDocuments({ roleId: roleId });
            resolve({
                status: 'OK',
                data: count
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole,
    deleteManyRoles,
    getRoleUserCount
};

