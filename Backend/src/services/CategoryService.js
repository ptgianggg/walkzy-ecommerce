const Category = require('../models/CategoryModel');

const normalizeCategoryDocs = (categories) => {
    if (!Array.isArray(categories)) return [];
    return categories
        .map(cat => ({
            _id: cat._id ? cat._id.toString() : null,
            name: cat.name || '',
            slug: cat.slug || '',
            description: cat.description || '',
            image: cat.image || null,
            isActive: cat.isActive !== false,
            parentCategory: cat.parentCategory ? cat.parentCategory.toString() : null
        }))
        .filter(cat => !!cat._id);
};

const buildCategoryTreeFromList = (categories) => {
    const nodeMap = new Map();
    const tree = [];

    categories.forEach(cat => {
        nodeMap.set(cat._id, { ...cat, children: [] });
    });

    nodeMap.forEach(node => {
        if (node.parentCategory && nodeMap.has(node.parentCategory)) {
            nodeMap.get(node.parentCategory).children.push(node);
        } else {
            tree.push(node);
        }
    });

    const sortNodes = (nodes) => {
        nodes.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        nodes.forEach(child => {
            if (Array.isArray(child.children) && child.children.length > 0) {
                sortNodes(child.children);
            }
        });
    };

    sortNodes(tree);
    return tree;
};

const createCategory = (newCategory) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, slug, description, image, parentCategory } = newCategory;
            
            // Tự động tạo slug nếu không có
            const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
            
            const checkCategory = await Category.findOne({
                $or: [{ name }, { slug: categorySlug }]
            });
            
            if (checkCategory !== null) {
                resolve({
                    status: 'ERR',
                    message: 'Tên hoặc slug danh mục đã tồn tại'
                });
                return;
            }

            const category = await Category.create({
                name,
                slug: categorySlug,
                description,
                image,
                parentCategory: parentCategory || null
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: category
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updateCategory = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkCategory = await Category.findById(id);
            if (checkCategory === null) {
                resolve({
                    status: 'ERR',
                    message: 'Danh mục không tồn tại'
                });
                return;
            }

            // Nếu có slug mới, kiểm tra trùng
            if (data.slug) {
                const existingSlug = await Category.findOne({ 
                    slug: data.slug, 
                    _id: { $ne: id } 
                });
                if (existingSlug) {
                    resolve({
                        status: 'ERR',
                        message: 'Slug đã tồn tại'
                    });
                    return;
                }
            }

            const updatedCategory = await Category.findByIdAndUpdate(id, data, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedCategory
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteCategory = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkCategory = await Category.findById(id);
            if (checkCategory === null) {
                resolve({
                    status: 'ERR',
                    message: 'Danh mục không tồn tại'
                });
                return;
            }

            await Category.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa danh mục thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteManyCategory = (ids) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                resolve({
                    status: 'ERR',
                    message: 'Danh sách ID không hợp lệ'
                });
                return;
            }

            await Category.deleteMany({ _id: { $in: ids } });
            resolve({
                status: 'OK',
                message: `Xóa ${ids.length} danh mục thành công`
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllCategory = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Tối ưu: chỉ select fields cần thiết và sort để tăng tốc
            const allCategory = await Category.find({ isActive: { $ne: false } })
                .select('name slug image description isActive parentCategory')
                .populate('parentCategory', 'name slug')
                .sort({ createdAt: -1 })
                .lean(); // Dùng lean() để tăng tốc, trả về plain object thay vì Mongoose document
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allCategory
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getCategoryTree = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const rawCategories = await Category.find({ isActive: { $ne: false } })
                .select('name slug image description isActive parentCategory createdAt')
                .sort({ createdAt: -1 })
                .lean();

            const normalized = normalizeCategoryDocs(rawCategories);
            const tree = buildCategoryTreeFromList(normalized);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    tree,
                    flat: normalized
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getParentCategories = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Only return root categories (parentCategory == null)
            const parents = await Category.find({ parentCategory: null, isActive: { $ne: false } })
                .select('name slug image description isActive')
                .sort({ createdAt: -1 })
                .lean();
            resolve({ status: 'OK', message: 'SUCCESS', data: parents });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailCategory = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const category = await Category.findById(id).populate('parentCategory');
            if (category === null) {
                resolve({
                    status: 'ERR',
                    message: 'Danh mục không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: category
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    deleteManyCategory,
    getAllCategory,
    getCategoryTree,
    getParentCategories,
    getDetailCategory
};
