const CategoryService = require('../services/CategoryService');

const createCategory = async (req, res) => {
    try {
        // If parentCategory is provided, ensure it is a root category
        if (req.body.parentCategory) {
            const Category = require('../models/CategoryModel');
            const parent = await Category.findById(req.body.parentCategory).lean();
            if (!parent) {
                return res.status(400).json({ status: 'ERR', message: 'Danh mục cha không tồn tại' });
            }
            if (parent.parentCategory) {
                return res.status(400).json({ status: 'ERR', message: 'Danh mục cha phải là danh mục gốc (không được là danh mục con)' });
            }
        }

        const result = await CategoryService.createCategory(req.body);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const data = req.body;
        
        console.log('Update category request:', { categoryId, data });
        
        if (!categoryId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The categoryId is required'
            });
        }
        
        // Loại bỏ các trường rỗng hoặc undefined
        const cleanData = {};
        if (data.name !== undefined && data.name !== null && data.name !== '') {
            cleanData.name = data.name;
        }
        if (data.slug !== undefined && data.slug !== null && data.slug !== '') {
            cleanData.slug = data.slug;
        }
        if (data.description !== undefined && data.description !== null) {
            cleanData.description = data.description;
        }
        if (data.image !== undefined && data.image !== null && data.image !== '') {
            cleanData.image = data.image;
        }
        if (data.parentCategory !== undefined && data.parentCategory !== null && data.parentCategory !== '') {
            cleanData.parentCategory = data.parentCategory;
        }
        
        // Nếu parentCategory được gửi, validate rằng nó là danh mục gốc
        if (cleanData.parentCategory) {
            const Category = require('../models/CategoryModel');
            if (String(cleanData.parentCategory) === String(categoryId)) {
                return res.status(400).json({ status: 'ERR', message: 'Không thể đặt chính danh mục làm cha của nó' });
            }
            const parent = await Category.findById(cleanData.parentCategory).lean();
            if (!parent) {
                return res.status(400).json({ status: 'ERR', message: 'Danh mục cha không tồn tại' });
            }
            if (parent.parentCategory) {
                return res.status(400).json({ status: 'ERR', message: 'Danh mục cha phải là danh mục gốc (không được là danh mục con)' });
            }
        }

        const result = await CategoryService.updateCategory(categoryId, cleanData);
        return res.status(200).json(result);
    } catch (e) {
        console.error('Update category error:', e);
        return res.status(500).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi cập nhật danh mục' 
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        if (!categoryId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The categoryId is required'
            });
        }
        const result = await CategoryService.deleteCategory(categoryId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getAllCategory = async (req, res) => {
    try {
        const result = await CategoryService.getAllCategory();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getCategoryTree = async (req, res) => {
    try {
        const result = await CategoryService.getCategoryTree();
        return res.status(200).json(result);
    } catch (e) {
        console.error('getCategoryTree error:', e);
        return res.status(500).json({ status: 'ERR', message: e.message || 'Lỗi khi lấy cây danh mục' });
    }
};

const getDetailCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        if (!categoryId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The categoryId is required'
            });
        }
        const result = await CategoryService.getDetailCategory(categoryId);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(404).json({ message: e });
    }
};

const getParentCategories = async (req, res) => {
    try {
        const result = await CategoryService.getParentCategories();
        return res.status(200).json(result);
    } catch (e) {
        console.error('getParentCategories error:', e);
        return res.status(500).json({ status: 'ERR', message: e.message || 'Lỗi khi lấy danh mục cha' });
    }
};

const deleteMany = async (req, res) => {
    try {
        const ids = req.body.ids;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Danh sách ID không hợp lệ'
            });
        }
        const result = await CategoryService.deleteManyCategory(ids);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(500).json({ 
            status: 'ERR',
            message: e.message || 'Lỗi khi xóa nhiều danh mục' 
        });
    }
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    deleteMany,
    getAllCategory,
    getCategoryTree,
    getDetailCategory,
    getParentCategories
};
