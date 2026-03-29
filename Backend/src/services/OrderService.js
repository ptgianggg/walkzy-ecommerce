const Order = require('../models/OrderProduct')
const Product = require('../models/ProductModel')
const Promotion = require('../models/PromotionModel')
const ShippingVoucher = require('../models/ShippingVoucherModel')
const EmailService = require('../services/EmailService')
const NotificationService = require('./NotificationService')
const Notification = require('../models/NotificationModel')
const User = require('../models/UserModel')
const Review = require('../models/ReviewModel')
const ShippingOrder = require('../models/ShippingOrderModel')
const { updateVariationStock, checkVariationStock } = require('../utils/stockHelper')
const ShippingService = require('../services/ShippingService')

// Map various provider-specific or provider-rate codes to the canonical shippingMethod
const mapShippingMethodToEnum = (input) => {
    if (!input && input !== 0) return null
    const s = String(input).trim().toLowerCase()
    const canonical = ['standard', 'express', 'fast', 'custom']
    if (canonical.includes(s)) return s
    if (s.includes('fast')) return 'fast'
    if (s.includes('express')) return 'express'
    if (s.includes('standard')) return 'standard'
    if (s.includes('ghn') || s.includes('ghtk')) return 'standard'
    return 'standard'
}

// Helper tự động hủy đơn hàng chờ thanh toán sau 24 giờ
const autoCancelPendingPaymentOrder = async (orderDoc) => {
    if (orderDoc.status !== 'pending_payment') return false;
    const now = new Date();
    const expiryDate = orderDoc.paymentExpiredAt || new Date(new Date(orderDoc.createdAt).getTime() + 24 * 60 * 60 * 1000);
    if (now > expiryDate) {
        try {
            await Promise.all(
                orderDoc.orderItems.map(async (item) => {
                    const productId = item.product?._id || item.product;
                    if (!productId) return;
                    
                    if (item.variation && (item.variation.color || item.variation.size)) {
                        await updateVariationStock(Product, productId, item.variation, item.amount, 'increase');
                    } else {
                        await Product.findOneAndUpdate({ _id: productId }, { $inc: { countInStock: +item.amount } });
                    }
                })
            );
            const updatedOrder = await Order.findByIdAndUpdate(orderDoc._id, {
                status: 'cancelled',
                cancelReason: 'PAYMENT_TIMEOUT',
                cancelledAt: new Date(),
                $push: {
                    statusHistory: {
                        status: 'cancelled',
                        changedAt: new Date(),
                        note: 'Hệ thống tự động hủy do quá thời gian thanh toán (PAYMENT_TIMEOUT)'
                    }
                }
            }, { new: true }).populate('user', 'email');
            if (updatedOrder && updatedOrder.user && updatedOrder.user.email) {
                await EmailService.sendEmailOrderExpired(updatedOrder.user.email, { orderId: updatedOrder._id.toString() });
            }
            return true;
        } catch (err) { console.error('Auto-cancel error:', err); }
    }
    return false;
};

// Helper tự động hoàn thành đơn hàng sau 7 ngày
const autoCompleteDeliveredOrder = async (orderDoc) => {
    if (orderDoc.status !== 'delivered') return false;
    let receivedDate = orderDoc.deliveredAt;
    if (!receivedDate && orderDoc.statusHistory) {
        const h = orderDoc.statusHistory.filter(sh => sh.status === 'delivered').sort((a,b) => new Date(b.changedAt)-new Date(a.changedAt))[0];
        if (h) receivedDate = h.changedAt;
    }
    if (!receivedDate) receivedDate = orderDoc.updatedAt;
    const diffDays = Math.floor((new Date() - new Date(receivedDate)) / (1000 * 60 * 60 * 24));
    if (diffDays >= 7) {
        try {
            await Order.findByIdAndUpdate(orderDoc._id, {
                status: 'completed',
                $push: { statusHistory: { status: 'completed', changedAt: new Date(), note: 'Tự động hoàn thành sau 7 ngày' } }
            });
            return true;
        } catch (err) { console.error('Auto-complete error:', err); }
    }
    return false;
};

const createOrder = (newOrder) => {
    return new Promise(async (resolve, reject) => {
        const { orderItems, paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, city, phone, user, isPaid, paidAt, email, voucherDiscount, voucherCode, promotionId, shippingMethod, freeshipCode, shippingVoucherId, freeshipDiscount, province, district, ward } = newOrder
        try {
            // Optimistic Locking Strategy: Price Verification & Stock Deduction
            let calculatedItemsPrice = 0;
            const processedItems = []
            
            try {
                for (const item of orderItems) {
                    const product = await Product.findById(item.product)
                    if (!product) throw new Error(`Sản phẩm ${item.name} không tồn tại`)

                    // --- 1. Price Verification Logic ---
                    let expectedFnPrice = product.price; // Default to main product price
                    // Check if variation has custom price override
                    if (item.variation && (item.variation.color || item.variation.size)) {
                         if (product.variations && product.variations.length > 0) {
                            const vari = product.variations.find(v => 
                                (!item.variation.size || v.size === item.variation.size) &&
                                (!item.variation.color || v.color === item.variation.color)
                            );
                            if (vari && vari.price) {
                                expectedFnPrice = vari.price;
                            }
                        }
                    }
                    calculatedItemsPrice += (expectedFnPrice * item.amount);

                    // --- 2. Stock Deduction Logic ---
                    let updateResult;
                    if (item.variation && (item.variation.color || item.variation.size)) {
                         // Check Variation Stock First (Critical for safety)
                         const check = checkVariationStock(product, item.variation, item.amount)
                         if (!check.success) throw new Error(check.message)
                         
                         // Deduct Variation
                         await updateVariationStock(Product, item.product, item.variation, item.amount, 'decrease')
                    } else {
                        // Atomic update for standard product
                        updateResult = await Product.findOneAndUpdate(
                            { _id: item.product, countInStock: { $gte: item.amount } },
                            { 
                                $inc: { 
                                    countInStock: -item.amount, 
                                    selled: (isPaid || paymentMethod === 'later_money') ? +item.amount : 0 
                                } 
                            }
                        )
                        if (!updateResult) {
                            throw new Error(`Sản phẩm ${item.name} không đủ tồn kho (vừa bán hết)`)
                        }
                    }
                     processedItems.push(item)
                }
            } catch (err) {
                // Rollback if any failure occurs
                for (const item of processedItems) {
                     if (item.variation && (item.variation.color || item.variation.size)) {
                        await updateVariationStock(Product, item.product, item.variation, item.amount, 'increase')
                    } else {
                        await Product.findByIdAndUpdate(item.product, { 
                            $inc: { 
                                countInStock: +item.amount, 
                                selled: (isPaid || paymentMethod === 'later_money') ? -item.amount : 0 
                            } 
                        })
                    }
                }
                return resolve({ status: 'ERR', message: err.message })
            }

            // --- 3. Final Price Check ---
            // Allow small margin (1000 VND) for potential float inconsistencies
            if (Math.abs(calculatedItemsPrice - itemsPrice) > 1000) {
                // Rollback everything
                 for (const item of processedItems) {
                     if (item.variation && (item.variation.color || item.variation.size)) {
                        await updateVariationStock(Product, item.product, item.variation, item.amount, 'increase')
                    } else {
                        await Product.findByIdAndUpdate(item.product, { 
                            $inc: { 
                                countInStock: +item.amount, 
                                selled: (isPaid || paymentMethod === 'later_money') ? -item.amount : 0 
                            } 
                        })
                    }
                }
                return resolve({ status: 'ERR', message: 'ERROR: Giá sản phẩm không khớp với hệ thống. Vui lòng thử lại.' })
            }

            const status = isPaid ? 'pending' : (paymentMethod === 'later_money' ? 'pending' : 'pending_payment')
            const orderData = {
                orderItems, paymentMethod, itemsPrice, shippingPrice, totalPrice, user, isPaid, paidAt,
                shippingAddress: { fullName, address, city, phone, province, district, ward },
                paymentMethod, status, voucherDiscount, voucherCode, promotionId,
                shippingVoucher: shippingVoucherId, shippingVoucherCode: freeshipCode, shippingVoucherDiscount: freeshipDiscount,
                shippingMethod: mapShippingMethodToEnum(shippingMethod),
                paymentExpiredAt: (status === 'pending_payment') ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
            }

            const createdOrder = await Order.create(orderData)
            if (createdOrder) {
                if (email) {
                    if (status === 'pending_payment') {
                        await EmailService.sendEmailAwaitingPayment(email, { orderId: createdOrder._id.toString(), totalPrice, paymentExpiredAt: createdOrder.paymentExpiredAt })
                    } else {
                        await EmailService.sendEmailCreateOrder(email, { ...orderData, orderId: createdOrder._id.toString(), createdAt: createdOrder.createdAt, isPaymentSuccess: !!isPaid })
                    }
                }
                // Handle Vouchers
                if (promotionId) await Promotion.findByIdAndUpdate(promotionId, { $inc: { usageCount: 1 } })
                if (shippingVoucherId) await ShippingVoucher.findByIdAndUpdate(shippingVoucherId, { $inc: { usageCount: 1, totalDiscountAmount: freeshipDiscount || 0 } })

                return resolve({ status: 'OK', message: 'SUCCESS', data: createdOrder })
            }
        } catch (e) { reject(e) }
    })
}

const getAllOrderDetails = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orders = await Order.find({ user: id }).sort({ createdAt: -1, updatedAt: -1 })
            if (orders === null) return resolve({ status: 'ERR', message: 'The order is not defined' })
            for (const order of orders) {
                await autoCancelPendingPaymentOrder(order)
                await autoCompleteDeliveredOrder(order)
            }
            const updatedOrders = await Order.find({ user: id }).sort({ createdAt: -1, updatedAt: -1 })
            resolve({ status: 'OK', message: 'SUCCESS', data: updatedOrders })
        } catch (e) { reject(e) }
    })
}

const getOrderDetails = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.findById(id).populate('orderItems.product').populate('promotion').populate('shippingProvider').populate('shippingRate')
            if (order === null) return resolve({ status: 'ERR', message: 'The order is not defined' })
            await autoCancelPendingPaymentOrder(order)
            await autoCompleteDeliveredOrder(order)
            const updatedOrder = await Order.findById(id).populate('orderItems.product').populate('user').populate('promotion').populate('shippingProvider').populate('shippingRate')
            resolve({ status: 'OK', message: 'SUCCESS', data: updatedOrder })
        } catch (e) { reject(e) }
    })
}

const cancelOrderDetails = (id, data, reason) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.findById(id)
            if (!order) return resolve({ status: 'ERR', message: 'The order is not defined' })
            // Revert stock
            await Promise.all(data.map(async (item) => {
                if (item.variation && (item.variation.color || item.variation.size)) {
                    await updateVariationStock(Product, item.product || item.productId, item.variation, item.amount, 'increase')
                } else {
                    await Product.findByIdAndUpdate(item.product || item.productId, { $inc: { countInStock: +item.amount, selled: order.isPaid || order.paymentMethod === 'later_money' ? -item.amount : 0 } })
                }
            }))
            const updatedOrder = await Order.findByIdAndUpdate(id, { status: 'cancelled', cancelReason: reason, isCancelled: true, cancelledAt: new Date() }, { new: true })
            resolve({ status: 'OK', message: 'SUCCESS', data: updatedOrder })
        } catch (e) { reject(e) }
    })
}

const getAllOrder = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allOrder = await Order.find()
                .sort({ createdAt: -1, updatedAt: -1 })
                .populate('user')
                .populate('shippingProvider')
                .populate('shippingRate')
            resolve({ status: 'OK', message: 'SUCCESS', data: allOrder })
        } catch (e) { reject(e) }
    })
}

const cancelOrder = (id, reason, cancelledBy) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.findById(id)
            if (!order) return resolve({ status: 'ERR', message: 'The order is not defined' })
            // Revert stock
            await Promise.all(order.orderItems.map(async (item) => {
                if (item.variation && (item.variation.color || item.variation.size)) {
                    await updateVariationStock(Product, item.product, item.variation, item.amount, 'increase')
                } else {
                    await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: +item.amount, selled: order.isPaid || order.paymentMethod === 'later_money' ? -item.amount : 0 } })
                }
            }))
            const updatedOrder = await Order.findByIdAndUpdate(id, {
                status: 'cancelled', cancelReason: reason, isCancelled: true, cancelledAt: new Date(),
                $push: { statusHistory: { status: 'cancelled', changedAt: new Date(), changedBy: cancelledBy, note: reason } }
            }, { new: true })
            resolve({ status: 'OK', message: 'SUCCESS', data: updatedOrder })
        } catch (e) { reject(e) }
    })
}

const updateOrderPayment = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkOrder = await Order.findById(id).populate('user')
            if (!checkOrder) return resolve({ status: 'ERR', message: 'Order not found' })
            
            // Increase sold
            await Promise.all(checkOrder.orderItems.map(async (item) => {
                await Product.findByIdAndUpdate(item.product, { $inc: { selled: +item.amount } })
            }))

            // 1. Cập nhật trạng thái thành CONFIRMED (đã thanh toán)
            const updatedOrder = await Order.findByIdAndUpdate(id, {
                isPaid: true, 
                paidAt: data.paidAt || new Date(), 
                paymentTransactionId: data.paymentTransactionId,
                status: 'confirmed', // Chuyển sang CONFIRMED thay vì pending
                paymentExpiredAt: null,
                $push: { 
                    statusHistory: { 
                        status: 'confirmed', 
                        changedAt: new Date(), 
                        note: 'Thanh toán thành công. Đơn hàng đã được xác nhận.' 
                    } 
                }
            }, { new: true })

            // 2. Tự động chọn nhà vận chuyển
            try {
                // Luôn cố gắng tạo vận đơn khi đơn được xác nhận (ShippingService sẽ check duplicate)
                const shippingRes = await ShippingService.createShippingOrder(updatedOrder._id, {
                    shippingMethod: updatedOrder.shippingMethod,
                    shippingAddress: updatedOrder.shippingAddress
                })

                if (shippingRes.status === 'OK') {
                    // Nếu chọn thành công, ShippingService đã update status thành 'processing' và shippingStatus thành 'pending'
                    // Ta không cần update thủ công nữa để tránh xung đột
                    console.log(`Auto shipping selected: ${shippingRes.data?.trackingNumber}`)
                } else if (shippingRes.message !== 'Don hang da co van don') {
                    console.error('Auto shipping selection failed:', shippingRes.message)
                }
            } catch (shippingErr) {
                console.error('Auto shipping selection error:', shippingErr)
            }

            // Re-fetch to ensure we return fully populated data (status, provider, etc.)
            const processOrderResult = await Order.findById(id)
                .populate('shippingProvider')
                .populate('shippingRate')
                .populate('user')

            if (checkOrder.user && checkOrder.user.email) {
                await EmailService.sendEmailPaymentSuccess(checkOrder.user.email, {
                    orderItems: checkOrder.orderItems, orderId: checkOrder._id.toString(), totalPrice: checkOrder.totalPrice,
                    itemsPrice: checkOrder.itemsPrice, shippingPrice: checkOrder.shippingPrice, shippingAddress: checkOrder.shippingAddress,
                    paymentMethod: checkOrder.paymentMethod, createdAt: checkOrder.createdAt
                })
            }
            resolve({ status: 'OK', message: 'SUCCESS', data: processOrderResult })
        } catch (e) { reject(e) }
    })
}

const updateOrderStatus = (id, status, note, updatedBy, shippingStatus) => {
    return new Promise(async (resolve, reject) => {
        try {
            const normalizeOrderStatus = (value) => {
                const map = {
                    waiting_pickup: 'processing',
                    picked_up: 'shipped',
                    shipping: 'shipped',
                    in_transit: 'shipped',
                    out_for_delivery: 'shipped',
                    delivering: 'shipped'
                }
                return map[value] || value
            }
            const normalizedStatus = normalizeOrderStatus(status)
            const updateData = { status: normalizedStatus }
            if (shippingStatus !== undefined) {
                updateData.shippingStatus = shippingStatus
            }

            // Cập nhật trạng thái
            let result = await Order.findByIdAndUpdate(id, {
                ...updateData,
                $push: { statusHistory: { status: normalizedStatus, changedAt: new Date(), changedBy: updatedBy, note } }
            }, { new: true })

            // Nếu Admin chuyển trạng thái sang PROCESSING -> Trigger tìm nhà vận chuyển
            if (normalizedStatus === 'processing') {
                 try {
                    const shippingRes = await ShippingService.createShippingOrder(result._id, {
                        shippingMethod: result.shippingMethod,
                        shippingAddress: result.shippingAddress
                    })

                    if (shippingRes.status === 'OK') {
                        // Re-fetch updated data (ShippingService đã update status thành processing và shippingStatus thành pending)
                        result = await Order.findById(id).populate('shippingProvider').populate('shippingRate')
                    } else if (shippingRes.message !== 'Don hang da co van don') {
                         console.error('Auto shipping selection failed:', shippingRes.message)
                    }
                } catch (shippingErr) {
                    console.error('Auto shipping selection error inside updateOrderStatus:', shippingErr)
                }
            }

            resolve({ status: 'OK', message: 'SUCCESS', data: result })
        } catch (e) { reject(e) }
    })
}

const completeOrder = (id, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkOrder = await Order.findById(id)
            if (!checkOrder) return resolve({ status: 'ERR', message: 'Order not found' })
            const result = await Order.findByIdAndUpdate(id, {
                status: 'completed', $push: { statusHistory: { status: 'completed', changedAt: new Date(), note: 'Khách hàng xác nhận đã nhận hàng' } }
            }, { new: true })
            resolve({ status: 'OK', message: 'SUCCESS', data: result })
        } catch (e) { reject(e) }
    })
}

const refundOrder = (id, reason, amount, tid, by) => {
    return new Promise(async (resolve, reject) => {
        try {
            const updatedOrder = await Order.findByIdAndUpdate(id, {
                status: 'refunded', isRefunded: true, refundAmount: amount, refundTransactionId: tid,
                $push: { statusHistory: { status: 'refunded', changedAt: new Date(), changedBy: by, note: reason } }
            }, { new: true })
            resolve({ status: 'OK', message: 'SUCCESS', data: updatedOrder })
        } catch (e) { reject(e) }
    })
}

const updateTracking = (id, company, num, url, by) => {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await Order.findByIdAndUpdate(id, {
                trackingNumber: num, shippingCompany: company, trackingUrl: url,
                $push: { statusHistory: { status: 'shipping', changedAt: new Date(), changedBy: by, note: `Cập nhật tracking: ${company} - ${num}` } }
            }, { new: true })
            resolve({ status: 'OK', message: 'SUCCESS', data: res })
        } catch (e) { reject(e) }
    })
}

const createManualOrder = (data, by) => {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await createOrder({ ...data })
            resolve(res)
        } catch (e) { reject(e) }
    })
}

module.exports = {
    createOrder, getAllOrderDetails, getOrderDetails, cancelOrderDetails, getAllOrder,
    cancelOrder, refundOrder, updateTracking, updateOrderStatus, createManualOrder,
    completeOrder, updateOrderPayment
}
