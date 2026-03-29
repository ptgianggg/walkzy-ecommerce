const PurchaseOrder = require('../models/PurchaseOrderModel');
const Stock = require('../models/StockModel');
const StockHistory = require('../models/StockHistoryModel');
const Product = require('../models/ProductModel');

const createPurchaseOrder = (newOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { supplier, warehouse, items, orderDate, expectedDate, notes, createdBy } = newOrder;

            if (!supplier || !warehouse || !items || items.length === 0 || !createdBy) {
                resolve({
                    status: 'ERR',
                    message: 'Vui lòng điền đầy đủ thông tin'
                });
                return;
            }

            // Validate items
            for (const item of items) {
                if (!item.product || !item.quantity || !item.unitPrice) {
                    resolve({
                        status: 'ERR',
                        message: 'Vui lòng điền đầy đủ thông tin sản phẩm'
                    });
                    return;
                }

                // Kiểm tra sản phẩm tồn tại
                const product = await Product.findById(item.product);
                if (!product) {
                    resolve({
                        status: 'ERR',
                        message: `Sản phẩm ${item.product} không tồn tại`
                    });
                    return;
                }
            }

            const order = await PurchaseOrder.create({
                supplier,
                warehouse,
                items,
                orderDate: orderDate || new Date(),
                expectedDate,
                notes,
                createdBy,
                status: 'pending'
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: order
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updatePurchaseOrder = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkOrder = await PurchaseOrder.findById(id);
            if (checkOrder === null) {
                resolve({
                    status: 'ERR',
                    message: 'Phiếu nhập hàng không tồn tại'
                });
                return;
            }

            // Không cho phép cập nhật nếu đã nhận hàng
            if (checkOrder.status === 'received' || checkOrder.status === 'completed') {
                resolve({
                    status: 'ERR',
                    message: 'Không thể cập nhật phiếu nhập hàng đã nhận'
                });
                return;
            }

            const updatedOrder = await PurchaseOrder.findByIdAndUpdate(id, data, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedOrder
            });
        } catch (e) {
            reject(e);
        }
    });
};

const confirmPurchaseOrder = (id, confirmedBy) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await PurchaseOrder.findById(id);
            if (!order) {
                resolve({
                    status: 'ERR',
                    message: 'Phiếu nhập hàng không tồn tại'
                });
                return;
            }

            if (order.status !== 'pending') {
                resolve({
                    status: 'ERR',
                    message: 'Chỉ có thể xác nhận phiếu nhập hàng ở trạng thái pending'
                });
                return;
            }

            order.status = 'confirmed';
            order.confirmedBy = confirmedBy;
            await order.save();

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: order
            });
        } catch (e) {
            reject(e);
        }
    });
};

const receivePurchaseOrder = async (id, receivedBy) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await PurchaseOrder.findById(id).populate('items.product');
            if (!order) {
                resolve({
                    status: 'ERR',
                    message: 'Phiếu nhập hàng không tồn tại'
                });
                return;
            }

            if (order.status !== 'confirmed' && order.status !== 'pending') {
                resolve({
                    status: 'ERR',
                    message: 'Chỉ có thể nhận hàng từ phiếu nhập hàng đã xác nhận'
                });
                return;
            }

            // Cập nhật tồn kho cho từng sản phẩm
            for (const item of order.items) {
                const product = item.product;
                const variation = item.variation || {};

                // Tìm hoặc tạo stock record
                let stock = await Stock.findOne({
                    product: item.product._id,
                    warehouse: order.warehouse,
                    'variation.size': variation.size || null,
                    'variation.color': variation.color || null,
                    'variation.material': variation.material || null
                });

                if (!stock) {
                    stock = await Stock.create({
                        product: item.product._id,
                        warehouse: order.warehouse,
                        variation: variation,
                        quantity: 0,
                        reservedQuantity: 0
                    });
                }

                // Cập nhật số lượng
                const previousQuantity = stock.quantity;
                stock.quantity += item.quantity;

                // Thêm vào batch tracking
                if (item.batchNumber) {
                    const existingBatch = stock.batches.find(
                        b => b.batchNumber === item.batchNumber
                    );
                    if (existingBatch) {
                        existingBatch.quantity += item.quantity;
                    } else {
                        stock.batches.push({
                            batchNumber: item.batchNumber,
                            quantity: item.quantity,
                            purchaseOrder: order._id,
                            supplier: order.supplier,
                            importDate: new Date(),
                            expiryDate: item.expiryDate,
                            notes: item.notes
                        });
                    }
                } else {
                    // Tạo batch mặc định nếu không có batchNumber
                    stock.batches.push({
                        batchNumber: `BATCH-${Date.now()}`,
                        quantity: item.quantity,
                        purchaseOrder: order._id,
                        supplier: order.supplier,
                        importDate: new Date(),
                        expiryDate: item.expiryDate,
                        notes: item.notes
                    });
                }

                await stock.save();

                // Cập nhật tồn kho sản phẩm
                if (product.hasVariations && variation.size && variation.color) {
                    // Tìm variation trong product
                    const productVariation = product.variations.find(v => 
                        v.size === variation.size &&
                        v.color === variation.color &&
                        v.material === (variation.material || v.material)
                    );
                    if (productVariation) {
                        productVariation.stock += item.quantity;
                    }
                } else {
                    product.countInStock += item.quantity;
                }
                await product.save();

                // Tạo lịch sử nhập kho
                await StockHistory.create({
                    stock: stock._id,
                    product: item.product._id,
                    warehouse: order.warehouse,
                    type: 'import',
                    quantity: item.quantity,
                    previousQuantity: previousQuantity,
                    newQuantity: stock.quantity,
                    reason: `Nhập hàng từ phiếu nhập ${order.orderNumber}`,
                    createdBy: receivedBy,
                    variation: variation,
                    notes: `Từ nhà cung cấp, lô: ${item.batchNumber || 'N/A'}`
                });
            }

            // Cập nhật trạng thái đơn hàng
            order.status = 'received';
            order.receivedBy = receivedBy;
            order.receivedDate = new Date();
            await order.save();

            // Cập nhật thống kê nhà cung cấp
            const Supplier = require('../models/SupplierModel');
            await Supplier.findByIdAndUpdate(order.supplier, {
                $inc: { totalOrders: 1, totalValue: order.finalAmount },
                lastOrderDate: new Date()
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: order
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllPurchaseOrder = (filters = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = {};
            if (filters.supplier) query.supplier = filters.supplier;
            if (filters.warehouse) query.warehouse = filters.warehouse;
            if (filters.status) query.status = filters.status;

            const orders = await PurchaseOrder.find(query)
                .populate('supplier', 'name code email')
                .populate('warehouse', 'name code')
                .populate('createdBy', 'name email')
                .populate('items.product', 'name image')
                .sort({ createdAt: -1 });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: orders
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailsPurchaseOrder = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await PurchaseOrder.findById(id)
                .populate('supplier')
                .populate('warehouse')
                .populate('createdBy', 'name email')
                .populate('confirmedBy', 'name email')
                .populate('receivedBy', 'name email')
                .populate('items.product');

            if (order === null) {
                resolve({
                    status: 'ERR',
                    message: 'Phiếu nhập hàng không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: order
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deletePurchaseOrder = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkOrder = await PurchaseOrder.findById(id);
            if (checkOrder === null) {
                resolve({
                    status: 'ERR',
                    message: 'Phiếu nhập hàng không tồn tại'
                });
                return;
            }

            // Chỉ cho phép xóa nếu chưa nhận hàng
            if (checkOrder.status === 'received' || checkOrder.status === 'completed') {
                resolve({
                    status: 'ERR',
                    message: 'Không thể xóa phiếu nhập hàng đã nhận'
                });
                return;
            }

            await PurchaseOrder.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Xóa phiếu nhập hàng thành công'
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createPurchaseOrder,
    updatePurchaseOrder,
    confirmPurchaseOrder,
    receivePurchaseOrder,
    getAllPurchaseOrder,
    getDetailsPurchaseOrder,
    deletePurchaseOrder
};

