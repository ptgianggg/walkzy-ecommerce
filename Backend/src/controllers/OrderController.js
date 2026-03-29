
const OrderService = require('../services/OrderService')


const createOrder = async (req, res) => {

  try {
    const { paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, city, phone, shippingMethod, orderItems } = req.body;

    if (
      !paymentMethod ||
      itemsPrice === undefined ||
      shippingPrice === undefined ||
      totalPrice === undefined ||
      !fullName ||
      !address ||
      !city ||
      !phone ||
      !shippingMethod ||
      !orderItems ||
      !Array.isArray(orderItems) ||
      orderItems.length === 0
    ) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'The input is required',
      });

    }
    const result = await OrderService.createOrder(req.body);
    return res.status(200).json(result)

  } catch (e) {
    console.error('Error in createUser:', e);
    return res.status(404).json({
      message: e

    })
  }
}

const getAllOrderDetails = async (req, res) => {
  try {
    const userId = req.params.userId
    const requestingUser = req.user

    if (!userId) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'The userId is required'
      })
    }

    // Security Check: Chỉ Admin hoặc chính chủ mới được xem danh sách đơn
    if (!requestingUser?.isAdmin && requestingUser?.id !== userId) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Bạn không có quyền xem danh sách đơn hàng của người khác'
      })
    }

    const result = await OrderService.getAllOrderDetails(userId);
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || e
    })
  }
}


const getDetailsOrder = async (req, res) => {
  try {
    const orderId = req.params.id
    if (!orderId) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'The orderId is required'
      })
    }
    
    // Validate orderId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(200).json({
        status: 'ERR',
        message: 'Mã đơn hàng không hợp lệ'
      })
    }

    const result = await OrderService.getOrderDetails(orderId);
    
    // Security Check: Kiểm tra quyền sở hữu sau khi lấy data
    if (result.status === 'OK' && result.data) {
        const orderOwnerId = result.data.user?._id?.toString() || result.data.user?.toString();
        const requestingUser = req.user;
        
        if (!requestingUser?.isAdmin && requestingUser?.id !== orderOwnerId) {
             return res.status(403).json({
                status: 'ERROR',
                message: 'Bạn không có quyền xem chi tiết đơn hàng này'
            })
        }
    }

    return res.status(200).json(result)
  } catch (e) {
    console.error('Error in getDetailsOrder:', e);
    return res.status(500).json({
      status: 'ERR',
      message: e.message || e
    })
  }
}

const cancelOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id
    const { orderItems, cancelReason } = req.body;
    const requestingUser = req.user;

    if (!orderId) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'Order ID is required'
      })
    }

    // Pre-fetch check ownership (Tuy hơi chậm thêm 1 query nhưng an toàn)
    const Order = require('../models/OrderProduct');
    const orderToCheck = await Order.findById(orderId);
    if (!orderToCheck) {
        return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }
    
    if (!requestingUser?.isAdmin && orderToCheck.user?.toString() !== requestingUser?.id) {
         return res.status(403).json({
            status: 'ERROR',
            message: 'Bạn không có quyền hủy đơn hàng này'
        })
    }

    const result = await OrderService.cancelOrderDetails(orderId, orderItems || [], cancelReason);
    return res.status(200).json(result)
  } catch (e) {
    console.error('Cancel Order Error:', e);
    return res.status(404).json({
      message: e.message || e
    })
  }
}
// ... (skip getAllOrder)

const getAllOrder = async (req, res) => {
  try {
    const data = await OrderService.getAllOrder();
    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || e
    })
  }
}

// Cancel order với lý do
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id
    const { cancelReason, cancelNote } = req.body
    const cancelledBy = req.user?.id // Lấy từ JWT middleware

    if (!orderId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Order ID is required'
      })
    }

    // Get order data before cancellation for logging
    const Order = require('../models/OrderProduct');
    const oldOrder = await Order.findById(orderId).lean();

    // Kết hợp cancelReason và cancelNote thành một message
    const fullReason = cancelNote
      ? `${cancelReason}\n\nGhi chú: ${cancelNote}`
      : cancelReason

    const result = await OrderService.cancelOrder(orderId, fullReason, cancelledBy)


    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || e
    })
  }
}

// Refund order
const refundOrder = async (req, res) => {
  try {
    const orderId = req.params.id
    const { refundReason, refundAmount, refundTransactionId } = req.body
    const refundedBy = req.user?.id

    if (!orderId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Order ID is required'
      })
    }

    const result = await OrderService.refundOrder(orderId, refundReason, refundAmount, refundTransactionId, refundedBy)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || e
    })
  }
}

// Update tracking
const updateTracking = async (req, res) => {
  try {
    const orderId = req.params.id
    const { shippingCompany, trackingNumber, trackingUrl } = req.body
    const updatedBy = req.user?.id

    if (!orderId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Order ID is required'
      })
    }

    const result = await OrderService.updateTracking(orderId, shippingCompany, trackingNumber, trackingUrl, updatedBy)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || e
    })
  }
}

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id
    const { status, note, shippingStatus } = req.body
    const updatedBy = req.user?.id

    if (!orderId || !status) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Order ID and status are required'
      })
    }

    // Get old order data for logging
    const Order = require('../models/OrderProduct');
    const oldOrder = await Order.findById(orderId).lean();

    const result = await OrderService.updateOrderStatus(orderId, status, note, updatedBy, shippingStatus)


    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || e
    })
  }
}

// Create manual order
const createManualOrder = async (req, res) => {
  try {
    const createdBy = req.user?.id

    if (!createdBy) {
      return res.status(401).json({
        status: 'ERR',
        message: 'Unauthorized'
      })
    }

    const result = await OrderService.createManualOrder(req.body, createdBy)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || e
    })
  }
}

// Customer confirms received order (complete order)
const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user?.id

    if (!orderId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Order ID is required'
      })
    }

    if (!userId) {
      return res.status(401).json({
        status: 'ERR',
        message: 'Unauthorized'
      })
    }

    // Check ownership inside Service or here. Doing here for consistency.
    const Order = require('../models/OrderProduct');
    const orderToCheck = await Order.findById(orderId);
    if (!orderToCheck) {
        return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }
    if (!req.user?.isAdmin && orderToCheck.user?.toString() !== userId) {
        return res.status(403).json({ message: 'Bạn không có quyền hoàn thành đơn hàng này' });
    }

    const result = await OrderService.completeOrder(orderId, userId)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      status: 'ERR',
      message: e.message || 'Error completing order'
    })
  }
}

// Customer pays for an existing order
const payOrder = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Order ID is required'
      })
    }

    const { paidAt, paymentTransactionId } = req.body
    const result = await OrderService.updateOrderPayment(id, { paidAt, paymentTransactionId })
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      status: 'ERR',
      message: e.message || 'Error paying order'
    })
  }
}

module.exports = {
  createOrder,
  getAllOrderDetails,
  getDetailsOrder,
  cancelOrderDetails,
  getAllOrder,
  cancelOrder,
  refundOrder,
  updateTracking,
  updateOrderStatus,
  createManualOrder,
  completeOrder,
  payOrder
}