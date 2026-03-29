const Stock = require('../models/StockModel');
const StockHistory = require('../models/StockHistoryModel');
const Product = require('../models/ProductModel');
const Warehouse = require('../models/WarehouseModel');

// Tạo hoặc cập nhật stock
const createOrUpdateStock = (stockData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { product, warehouse, variation, quantity, reservedQuantity, lowStockThreshold, location, notes } = stockData;
            
            // Tìm stock hiện tại
            const query = {
                product,
                warehouse,
                ...(variation && {
                    'variation.size': variation.size || null,
                    'variation.color': variation.color || null,
                    'variation.material': variation.material || null
                })
            };
            
            let stock = await Stock.findOne(query);
            
            if (stock) {
                // Cập nhật stock
                if (quantity !== undefined) stock.quantity = quantity;
                if (reservedQuantity !== undefined) stock.reservedQuantity = reservedQuantity;
                if (lowStockThreshold !== undefined) stock.lowStockThreshold = lowStockThreshold;
                if (location !== undefined) stock.location = location;
                if (notes !== undefined) stock.notes = notes;
                if (variation) stock.variation = { ...stock.variation, ...variation };
                
                await stock.save();
            } else {
                // Tạo mới stock
                stock = await Stock.create({
                    product,
                    warehouse,
                    variation: variation || {},
                    quantity: quantity || 0,
                    reservedQuantity: reservedQuantity || 0,
                    lowStockThreshold: lowStockThreshold || 10,
                    location,
                    notes
                });
            }
            
            // Populate để trả về đầy đủ thông tin
            await stock.populate('product', 'name image');
            await stock.populate('warehouse', 'name code');
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: stock
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Điều chỉnh tồn kho (nhập/xuất)
const adjustStock = (stockId, quantity, reason, type, userId, notes, orderId = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const stock = await Stock.findById(stockId);
            if (!stock) {
                resolve({
                    status: 'ERR',
                    message: 'Tồn kho không tồn tại'
                });
                return;
            }

            const previousQuantity = stock.quantity;
            let newQuantity = previousQuantity;

            if (type === 'import') {
                newQuantity = previousQuantity + Math.abs(quantity);
            } else if (type === 'export') {
                newQuantity = Math.max(0, previousQuantity - Math.abs(quantity));
            } else if (type === 'adjustment') {
                newQuantity = quantity; // Điều chỉnh trực tiếp
            } else {
                resolve({
                    status: 'ERR',
                    message: 'Loại giao dịch không hợp lệ'
                });
                return;
            }

            // Cập nhật stock
            stock.quantity = newQuantity;
            await stock.save();

            // Tạo lịch sử
            const history = await StockHistory.create({
                stock: stockId,
                product: stock.product,
                warehouse: stock.warehouse,
                type,
                quantity: type === 'adjustment' ? (newQuantity - previousQuantity) : (type === 'import' ? Math.abs(quantity) : -Math.abs(quantity)),
                previousQuantity,
                newQuantity,
                reason,
                createdBy: userId,
                order: orderId,
                notes,
                variation: stock.variation
            });

            // Cập nhật tồn kho tổng của product (nếu cần)
            await updateProductTotalStock(stock.product);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    stock,
                    history
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Reserve stock (đặt trước khi xuất)
const reserveStock = (stockId, quantity, orderId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const stock = await Stock.findById(stockId);
            if (!stock) {
                resolve({
                    status: 'ERR',
                    message: 'Tồn kho không tồn tại'
                });
                return;
            }

            if (stock.availableQuantity < quantity) {
                resolve({
                    status: 'ERR',
                    message: `Không đủ hàng. Còn ${stock.availableQuantity} sản phẩm`
                });
                return;
            }

            const previousReserved = stock.reservedQuantity;
            stock.reservedQuantity += quantity;
            await stock.save();

            // Tạo lịch sử
            await StockHistory.create({
                stock: stockId,
                product: stock.product,
                warehouse: stock.warehouse,
                type: 'reserve',
                quantity,
                previousQuantity: stock.quantity,
                newQuantity: stock.quantity,
                reason: `Đặt trước cho đơn hàng ${orderId}`,
                createdBy: userId,
                order: orderId,
                variation: stock.variation
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: stock
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Unreserve stock (hủy đặt trước)
const unreserveStock = (stockId, quantity, orderId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const stock = await Stock.findById(stockId);
            if (!stock) {
                resolve({
                    status: 'ERR',
                    message: 'Tồn kho không tồn tại'
                });
                return;
            }

            stock.reservedQuantity = Math.max(0, stock.reservedQuantity - quantity);
            await stock.save();

            // Tạo lịch sử
            await StockHistory.create({
                stock: stockId,
                product: stock.product,
                warehouse: stock.warehouse,
                type: 'unreserve',
                quantity: -quantity,
                previousQuantity: stock.quantity,
                newQuantity: stock.quantity,
                reason: `Hủy đặt trước cho đơn hàng ${orderId}`,
                createdBy: userId,
                order: orderId,
                variation: stock.variation
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: stock
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Lấy tất cả stock
const getAllStock = (filters = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { productId, warehouseId, lowStock, search } = filters;
            const query = {};

            if (productId) query.product = productId;
            if (warehouseId) query.warehouse = warehouseId;
            if (lowStock === 'true') {
                query.$expr = {
                    $lte: ['$availableQuantity', '$lowStockThreshold']
                };
            }

            let stocks = await Stock.find(query)
                .populate('product', 'name image slug')
                .populate('warehouse', 'name code')
                .sort({ createdAt: -1 });

            // Filter by search (tên sản phẩm)
            if (search) {
                stocks = stocks.filter(s => 
                    s.product?.name?.toLowerCase().includes(search.toLowerCase())
                );
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: stocks
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Lấy chi tiết stock
const getDetailStock = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const stock = await Stock.findById(id)
                .populate('product', 'name image slug')
                .populate('warehouse', 'name code address');
            
            if (!stock) {
                resolve({
                    status: 'ERR',
                    message: 'Tồn kho không tồn tại'
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: stock
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Lấy lịch sử stock
const getStockHistory = (filters = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { stockId, productId, warehouseId, type, startDate, endDate, limit = 100 } = filters;
            const query = {};

            if (stockId) query.stock = stockId;
            if (productId) query.product = productId;
            if (warehouseId) query.warehouse = warehouseId;
            if (type) query.type = type;
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const history = await StockHistory.find(query)
                .populate('product', 'name image')
                .populate('warehouse', 'name code')
                .populate('createdBy', 'name email')
                .populate('order', 'orderCode')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: history
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Lấy sản phẩm sắp hết hàng
const getLowStockProducts = (warehouseId = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = {
                $expr: {
                    $lte: ['$availableQuantity', '$lowStockThreshold']
                }
            };
            
            if (warehouseId) query.warehouse = warehouseId;

            const stocks = await Stock.find(query)
                .populate('product', 'name image slug')
                .populate('warehouse', 'name code')
                .sort({ availableQuantity: 1 });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: stocks
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Cập nhật tồn kho tổng của product
const updateProductTotalStock = async (productId) => {
    try {
        const stocks = await Stock.find({ product: productId });
        const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
        
        await Product.findByIdAndUpdate(productId, { countInStock: totalStock });
    } catch (e) {
        console.error('Error updating product total stock:', e);
    }
};

// Lấy stock theo product và variation
const getStockByProductAndVariation = (productId, warehouseId, variation) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = {
                product: productId,
                warehouse: warehouseId || (await require('./WarehouseService').getDefaultWarehouse()).data?._id
            };

            if (variation) {
                query['variation.size'] = variation.size || null;
                query['variation.color'] = variation.color || null;
                query['variation.material'] = variation.material || null;
            }

            const stock = await Stock.findOne(query)
                .populate('product', 'name image')
                .populate('warehouse', 'name code');

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: stock
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createOrUpdateStock,
    adjustStock,
    reserveStock,
    unreserveStock,
    getAllStock,
    getDetailStock,
    getStockHistory,
    getLowStockProducts,
    updateProductTotalStock,
    getStockByProductAndVariation
};

