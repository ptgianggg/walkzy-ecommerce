const RoleService = require('../services/RoleService');

// Tạo vai trò mới
const createRole = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await RoleService.createRole(req.body, userId);
        const statusCode = result.status === 'OK' ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        console.error('Error in createRole controller:', error);
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server khi tạo vai trò',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Lấy tất cả vai trò
const getAllRoles = async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
        };

        const result = await RoleService.getAllRoles(filters);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Lấy chi tiết vai trò
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID vai trò là bắt buộc'
            });
        }

        const result = await RoleService.getRoleById(id);
        const statusCode = result.status === 'OK' ? 200 : 404;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Cập nhật vai trò
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!id) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID vai trò là bắt buộc'
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await RoleService.updateRole(id, req.body, userId);
        const statusCode = result.status === 'OK' ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Xóa vai trò
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!id) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID vai trò là bắt buộc'
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await RoleService.deleteRole(id, userId);
        const statusCode = result.status === 'OK' ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Xóa nhiều vai trò
const deleteManyRoles = async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.user?.id;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Danh sách ID vai trò là bắt buộc'
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 'ERR',
                message: 'Không có quyền truy cập'
            });
        }

        const result = await RoleService.deleteManyRoles(ids, userId);
        const statusCode = result.status === 'OK' ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
};

// Lấy số lượng user theo vai trò
const getRoleUserCount = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                status: 'ERR',
                message: 'ID vai trò là bắt buộc'
            });
        }

        const result = await RoleService.getRoleUserCount(id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
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

