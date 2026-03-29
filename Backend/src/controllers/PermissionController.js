const PermissionService = require('../services/PermissionService');

// Tạo quyền mới
const createPermission = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await PermissionService.createPermission(req.body, userId);
        const statusCode = result.status === 'OK' ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Lấy tất cả quyền
const getAllPermissions = async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            module: req.query.module,
            action: req.query.action,
            isSensitive: req.query.isSensitive !== undefined ? req.query.isSensitive === 'true' : undefined,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
        };

        const result = await PermissionService.getAllPermissions(filters);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Lấy quyền theo module
const getPermissionsByModule = async (req, res) => {
    try {
        const { module } = req.params;
        if (!module) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Module là bắt buộc'
            });
        }

        const result = await PermissionService.getPermissionsByModule(module);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Lấy chi tiết quyền
const getPermissionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID quyền là bắt buộc'
            });
        }

        const result = await PermissionService.getPermissionById(id);
        const statusCode = result.status === 'OK' ? 200 : 404;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Cập nhật quyền
const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!id) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID quyền là bắt buộc'
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await PermissionService.updatePermission(id, req.body, userId);
        const statusCode = result.status === 'OK' ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Xóa quyền
const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!id) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID quyền là bắt buộc'
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await PermissionService.deletePermission(id, userId);
        const statusCode = result.status === 'OK' ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Xóa nhiều quyền
const deleteManyPermissions = async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.user?.id;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Danh sách ID quyền là bắt buộc'
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await PermissionService.deleteManyPermissions(ids, userId);
        const statusCode = result.status === 'OK' ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Lấy danh sách modules
const getModules = async (req, res) => {
    try {
        const result = await PermissionService.getModules();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Khởi tạo quyền mặc định
const initializeDefaultPermissions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await PermissionService.initializeDefaultPermissions(userId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
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

