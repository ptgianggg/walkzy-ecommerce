const Brand = require('../models/BrandModel');

const createBrand = (newBrand) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, slug, description, logo, website } = newBrand;
            
            const brandSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
            
            const checkBrand = await Brand.findOne({
                $or: [{ name }, { slug: brandSlug }]
            });
            
            if (checkBrand !== null) {
                resolve({
                    status: 'ERR',
                    message: 'Tên hoặc slug thương hiệu đã tồn tại'
                });
                return;
            }

            const brand = await Brand.create({
                name,
                slug: brandSlug,
                description,
                logo,
                website
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: brand
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updateBrand = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkBrand = await Brand.findById(id);
            if (checkBrand === null) {
                resolve({
                    status: 'ERR',
                    message: 'Thương hiệu không tồn tại'
                });
                return;
            }

            // Kiểm tra trùng tên nếu có thay đổi tên
            if (data.name && data.name !== checkBrand.name) {
                const existingBrand = await Brand.findOne({ 
                    name: data.name, 
                    _id: { $ne: id } 
                });
                if (existingBrand) {
                    resolve({
                        status: 'ERR',
                        message: 'Tên thương hiệu đã tồn tại'
                    });
                    return;
                }
            }

            // Kiểm tra trùng slug nếu có thay đổi slug
            if (data.slug) {
                const existingSlug = await Brand.findOne({ 
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

            const updatedBrand = await Brand.findByIdAndUpdate(id, data, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedBrand
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteBrand = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkBrand = await Brand.findById(id);
            if (checkBrand === null) {
                resolve({
                    status: 'ERR',
                    message: 'Thương hiệu không tồn tại'
                });
                return;
            }

            await Brand.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa thương hiệu thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllBrand = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allBrand = await Brand.find();
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allBrand
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailBrand = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const brand = await Brand.findById(id);
            if (brand === null) {
                resolve({
                    status: 'ERR',
                    message: 'Thương hiệu không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: brand
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createBrand,
    updateBrand,
    deleteBrand,
    getAllBrand,
    getDetailBrand
};

