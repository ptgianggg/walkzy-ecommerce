const Supplier = require('../models/SupplierModel');

const createSupplier = (newSupplier) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Kiểm tra email trùng
            const checkEmail = await Supplier.findOne({ email: newSupplier.email });
            if (checkEmail) {
                resolve({
                    status: 'ERR',
                    message: 'Email nhà cung cấp đã tồn tại'
                });
                return;
            }

            // Kiểm tra code trùng (nếu có)
            if (newSupplier.code) {
                const checkCode = await Supplier.findOne({ code: newSupplier.code });
                if (checkCode) {
                    resolve({
                        status: 'ERR',
                        message: 'Mã nhà cung cấp đã tồn tại'
                    });
                    return;
                }
            }

            const supplier = await Supplier.create(newSupplier);
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: supplier
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updateSupplier = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkSupplier = await Supplier.findById(id);
            if (checkSupplier === null) {
                resolve({
                    status: 'ERR',
                    message: 'Nhà cung cấp không tồn tại'
                });
                return;
            }

            // Kiểm tra email trùng (nếu thay đổi)
            if (data.email && data.email !== checkSupplier.email) {
                const checkEmail = await Supplier.findOne({ 
                    email: data.email,
                    _id: { $ne: id }
                });
                if (checkEmail) {
                    resolve({
                        status: 'ERR',
                        message: 'Email nhà cung cấp đã tồn tại'
                    });
                    return;
                }
            }

            // Kiểm tra code trùng (nếu thay đổi)
            if (data.code && data.code !== checkSupplier.code) {
                const checkCode = await Supplier.findOne({ 
                    code: data.code,
                    _id: { $ne: id }
                });
                if (checkCode) {
                    resolve({
                        status: 'ERR',
                        message: 'Mã nhà cung cấp đã tồn tại'
                    });
                    return;
                }
            }

            const updatedSupplier = await Supplier.findByIdAndUpdate(id, data, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedSupplier
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteSupplier = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkSupplier = await Supplier.findById(id);
            if (checkSupplier === null) {
                resolve({
                    status: 'ERR',
                    message: 'Nhà cung cấp không tồn tại'
                });
                return;
            }

            // Kiểm tra xem nhà cung cấp có đang được sử dụng trong đơn nhập hàng không
            const PurchaseOrder = require('../models/PurchaseOrderModel');
            const orderCount = await PurchaseOrder.countDocuments({ supplier: id });
            
            if (orderCount > 0) {
                resolve({
                    status: 'ERR',
                    message: `Không thể xóa nhà cung cấp này vì đang có ${orderCount} phiếu nhập hàng liên quan`
                });
                return;
            }

            await Supplier.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa nhà cung cấp thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllSupplier = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const suppliers = await Supplier.find().sort({ createdAt: -1 });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: suppliers
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailsSupplier = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const supplier = await Supplier.findById(id);
            if (supplier === null) {
                resolve({
                    status: 'ERR',
                    message: 'Nhà cung cấp không tồn tại'
                });
                return;
            }

            // Lấy thống kê đơn hàng
            const PurchaseOrder = require('../models/PurchaseOrderModel');
            const orders = await PurchaseOrder.find({ supplier: id });
            
            const stats = {
                totalOrders: orders.length,
                totalValue: orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0),
                lastOrderDate: orders.length > 0 
                    ? orders.sort((a, b) => b.orderDate - a.orderDate)[0].orderDate 
                    : null
            };

            // Cập nhật thống kê vào supplier
            supplier.totalOrders = stats.totalOrders;
            supplier.totalValue = stats.totalValue;
            supplier.lastOrderDate = stats.lastOrderDate;

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    ...supplier.toObject(),
                    ...stats
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getActiveSuppliers = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const suppliers = await Supplier.find({ isActive: true })
                .sort({ name: 1 });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: suppliers
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getAllSupplier,
    getDetailsSupplier,
    getActiveSuppliers
};

