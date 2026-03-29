const Collection = require('../models/CollectionModel');

const createCollection = (newCollection) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, slug, description, image, isTrending, startDate, endDate } = newCollection;
            
            const collectionSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
            
            const checkCollection = await Collection.findOne({
                $or: [{ name }, { slug: collectionSlug }]
            });
            
            if (checkCollection !== null) {
                resolve({
                    status: 'ERR',
                    message: 'Tên hoặc slug bộ sưu tập đã tồn tại'
                });
                return;
            }

            const collection = await Collection.create({
                name,
                slug: collectionSlug,
                description,
                image,
                isTrending: isTrending || false,
                startDate,
                endDate
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: collection
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updateCollection = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkCollection = await Collection.findById(id);
            if (checkCollection === null) {
                resolve({
                    status: 'ERR',
                    message: 'Bộ sưu tập không tồn tại'
                });
                return;
            }

            if (data.slug) {
                const existingSlug = await Collection.findOne({ 
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

            const updatedCollection = await Collection.findByIdAndUpdate(id, data, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedCollection
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteCollection = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkCollection = await Collection.findById(id);
            if (checkCollection === null) {
                resolve({
                    status: 'ERR',
                    message: 'Bộ sưu tập không tồn tại'
                });
                return;
            }

            await Collection.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa bộ sưu tập thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllCollection = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Tối ưu: chỉ select fields cần thiết và sort để tăng tốc
            const allCollection = await Collection.find({ isActive: { $ne: false } })
                .select('name slug image description isActive isTrending startDate endDate')
                .sort({ createdAt: -1 })
                .lean(); // Dùng lean() để tăng tốc, trả về plain object thay vì Mongoose document
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allCollection
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailCollection = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const collection = await Collection.findById(id);
            if (collection === null) {
                resolve({
                    status: 'ERR',
                    message: 'Bộ sưu tập không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: collection
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getCollectionBySlug = (slug) => {
    return new Promise(async (resolve, reject) => {
        try {
            const collection = await Collection.findOne({ slug, isActive: { $ne: false } });
            if (collection === null) {
                resolve({
                    status: 'ERR',
                    message: 'Bộ sưu tập không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: collection
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createCollection,
    updateCollection,
    deleteCollection,
    getAllCollection,
    getDetailCollection,
    getCollectionBySlug
};

