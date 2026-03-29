const Banner = require('../models/BannerModel');

const createBanner = (newBanner) => {
    return new Promise(async (resolve, reject) => {
        try {
            const banner = await Banner.create(newBanner);
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: banner
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updateBanner = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkBanner = await Banner.findById(id);
            if (checkBanner === null) {
                resolve({
                    status: 'ERR',
                    message: 'Banner không tồn tại'
                });
                return;
            }

            const updatedBanner = await Banner.findByIdAndUpdate(id, data, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedBanner
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteBanner = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkBanner = await Banner.findById(id);
            if (checkBanner === null) {
                resolve({
                    status: 'ERR',
                    message: 'Banner không tồn tại'
                });
                return;
            }

            await Banner.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa banner thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteManyBanner = (ids) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                resolve({
                    status: 'ERR',
                    message: 'Danh sách ID không hợp lệ'
                });
                return;
            }

            await Banner.deleteMany({ _id: { $in: ids } });
            resolve({
                status: 'OK',
                message: `Xóa ${ids.length} banner thành công`
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllBanner = (type = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            const query = type ? { type, isActive: true } : { isActive: true };
            
            // Lấy tất cả banner thỏa điều kiện
            let allBanner = await Banner.find(query).sort({ order: 1 });
            
            // Filter banner theo thời gian
            allBanner = allBanner.filter(banner => {
                // Nếu có startDate và endDate, kiểm tra thời gian
                if (banner.startDate || banner.endDate) {
                    const startDate = banner.startDate ? new Date(banner.startDate) : null;
                    const endDate = banner.endDate ? new Date(banner.endDate) : null;
                    
                    // Nếu có startDate và hiện tại < startDate => chưa đến lúc hiển thị
                    if (startDate && now < startDate) {
                        return false;
                    }
                    
                    // Nếu có endDate và hiện tại > endDate => đã hết hạn
                    if (endDate && now > endDate) {
                        return false;
                    }
                }
                
                return true;
            });
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allBanner
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailBanner = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const banner = await Banner.findById(id);
            if (banner === null) {
                resolve({
                    status: 'ERR',
                    message: 'Banner không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: banner
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createBanner,
    updateBanner,
    deleteBanner,
    deleteManyBanner,
    getAllBanner,
    getDetailBanner
};

