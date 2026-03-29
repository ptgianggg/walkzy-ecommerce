const Warehouse = require('../models/WarehouseModel');

const createWarehouse = (newWarehouse) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Kiểm tra tên kho trùng lặp
            if (newWarehouse.name) {
                const checkName = await Warehouse.findOne({ name: newWarehouse.name });
                if (checkName) {
                    resolve({
                        status: 'ERR',
                        message: 'Tên kho hàng đã tồn tại'
                    });
                    return;
                }
            }

            // Kiểm tra mã kho trùng lặp (nếu có)
            if (newWarehouse.code) {
                const checkCode = await Warehouse.findOne({ code: newWarehouse.code });
                if (checkCode) {
                    resolve({
                        status: 'ERR',
                        message: 'Mã kho hàng đã tồn tại'
                    });
                    return;
                }
            }

            // Nếu đây là kho mặc định, đảm bảo không có kho mặc định khác
            if (newWarehouse.isDefault) {
                await Warehouse.updateMany({ isDefault: true }, { isDefault: false });
            }
            
            const warehouse = await Warehouse.create(newWarehouse);
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: warehouse
            });
        } catch (e) {
            // Xử lý lỗi MongoDB
            if (e.code === 11000) {
                // Duplicate key error
                const field = Object.keys(e.keyPattern)[0];
                resolve({
                    status: 'ERR',
                    message: `${field === 'name' ? 'Tên kho' : 'Mã kho'} hàng đã tồn tại`
                });
            } else if (e.name === 'ValidationError') {
                // Validation error
                const errors = Object.values(e.errors).map(err => err.message).join(', ');
                resolve({
                    status: 'ERR',
                    message: errors || 'Dữ liệu không hợp lệ'
                });
            } else {
                reject(e);
            }
        }
    });
};

const updateWarehouse = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkWarehouse = await Warehouse.findById(id);
            if (checkWarehouse === null) {
                resolve({
                    status: 'ERR',
                    message: 'Kho hàng không tồn tại'
                });
                return;
            }

            // Nếu đang set kho này thành mặc định, bỏ mặc định của các kho khác
            if (data.isDefault) {
                await Warehouse.updateMany({ _id: { $ne: id }, isDefault: true }, { isDefault: false });
            }

            const updatedWarehouse = await Warehouse.findByIdAndUpdate(id, data, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedWarehouse
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteWarehouse = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkWarehouse = await Warehouse.findById(id);
            if (checkWarehouse === null) {
                resolve({
                    status: 'ERR',
                    message: 'Kho hàng không tồn tại'
                });
                return;
            }

            // Kiểm tra xem kho có đang được sử dụng không
            const Stock = require('../models/StockModel');
            const stockCount = await Stock.countDocuments({ warehouse: id });
            
            if (stockCount > 0) {
                resolve({
                    status: 'ERR',
                    message: `Không thể xóa kho này vì đang có ${stockCount} sản phẩm trong kho`
                });
                return;
            }

            await Warehouse.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa kho hàng thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllWarehouse = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allWarehouse = await Warehouse.find().sort({ isDefault: -1, createdAt: -1 });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allWarehouse
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailWarehouse = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const warehouse = await Warehouse.findById(id);
            if (warehouse === null) {
                resolve({
                    status: 'ERR',
                    message: 'Kho hàng không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: warehouse
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDefaultWarehouse = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let warehouse = await Warehouse.findOne({ isDefault: true });
            
            // Nếu không có kho mặc định, lấy kho đầu tiên
            if (!warehouse) {
                warehouse = await Warehouse.findOne({ isActive: true });
            }
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: warehouse
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getAllWarehouse,
    getDetailWarehouse,
    getDefaultWarehouse
};

