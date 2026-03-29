const ShippingService = require('../services/ShippingService')

// ============ SHIPPING PROVIDER ============
const createShippingProvider = async (req, res) => {
    try {
        const result = await ShippingService.createShippingProvider(req.body)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi tạo nhà vận chuyển'
        })
    }
}

const getAllShippingProviders = async (req, res) => {
    try {
        const result = await ShippingService.getAllShippingProviders()
        return res.status(200).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy danh sách nhà vận chuyển'
        })
    }
}

const getDetailsShippingProvider = async (req, res) => {
    try {
        const { id } = req.params
        const result = await ShippingService.getDetailsShippingProvider(id)
        return res.status(result.status === 'OK' ? 200 : 404).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy chi tiết nhà vận chuyển'
        })
    }
}

const updateShippingProvider = async (req, res) => {
    try {
        const { id } = req.params
        const result = await ShippingService.updateShippingProvider(id, req.body)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi cập nhật nhà vận chuyển'
        })
    }
}

const deleteShippingProvider = async (req, res) => {
    try {
        const { id } = req.params
        const result = await ShippingService.deleteShippingProvider(id)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi xóa nhà vận chuyển'
        })
    }
}

// ============ SHIPPING RATE ============
const createShippingRate = async (req, res) => {
    try {
        const result = await ShippingService.createShippingRate(req.body)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi tạo bảng phí'
        })
    }
}

const getAllShippingRates = async (req, res) => {
    try {
        const { providerId, shippingMethod } = req.query
        const result = await ShippingService.getAllShippingRates(providerId || null, shippingMethod ? shippingMethod.toLowerCase() : null)
        return res.status(200).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy danh sách bảng phí'
        })
    }
}

const getDetailsShippingRate = async (req, res) => {
    try {
        const { id } = req.params
        const result = await ShippingService.getDetailsShippingRate(id)
        return res.status(result.status === 'OK' ? 200 : 404).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy chi tiết bảng phí'
        })
    }
}

const updateShippingRate = async (req, res) => {
    try {
        const { id } = req.params
        const result = await ShippingService.updateShippingRate(id, req.body)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi cập nhật bảng phí'
        })
    }
}

const deleteShippingRate = async (req, res) => {
    try {
        const { id } = req.params
        const result = await ShippingService.deleteShippingRate(id)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi xóa bảng phí'
        })
    }
}

const calculateShippingFee = async (req, res) => {
    try {
        const { rateId, orderValue, distance, weight } = req.body
        if (!rateId || orderValue === undefined) {
            return res.status(400).json({
                status: 'ERR',
                message: 'rateId và orderValue là bắt buộc'
            })
        }
        const result = await ShippingService.calculateShippingFee(rateId, orderValue, distance, weight)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi tính phí vận chuyển'
        })
    }
}

const getAvailableShippingRates = async (req, res) => {
    try {
        const { orderValue, city, shippingMethod, weight } = req.query
        if (!orderValue) {
            return res.status(400).json({
                status: 'ERR',
                message: 'orderValue là bắt buộc'
            })
        }
        console.log('Getting available shipping rates:', { orderValue: Number(orderValue), city, shippingMethod, weight })
        const result = await ShippingService.getAvailableShippingRates(Number(orderValue), city, shippingMethod, weight ? Number(weight) : null)
        console.log('Shipping rates result:', { status: result.status, count: result.data?.length || 0 })
        return res.status(200).json(result)
    } catch (e) {
        console.error('Error in getAvailableShippingRates controller:', e)
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy danh sách phương thức vận chuyển'
        })
    }
}

// ============ SHIPPING ORDER ============
const createShippingOrder = async (req, res) => {
    try {
        const { orderId } = req.params
        const result = await ShippingService.createShippingOrder(orderId, req.body)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi tạo vận đơn'
        })
    }
}

const getAllShippingOrders = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            provider: req.query.provider
        }
        const result = await ShippingService.getAllShippingOrders(filters)
        return res.status(200).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy danh sách vận đơn'
        })
    }
}

const getShippingOrderByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params
        const result = await ShippingService.getShippingOrderByOrderId(orderId)
        return res.status(result.status === 'OK' ? 200 : 404).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi lấy vận đơn'
        })
    }
}

const updateShippingOrderStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status, note, trackingNumber } = req.body
        const updatedBy = req.user?.id

        if (!status) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Status là bắt buộc'
            })
        }

        const result = await ShippingService.updateShippingOrderStatus(id, status, updatedBy, note, trackingNumber)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi cập nhật trạng thái vận chuyển'
        })
    }
}

const updateShippingOrder = async (req, res) => {
    try {
        const { id } = req.params
        const result = await ShippingService.updateShippingOrder(id, req.body)
        return res.status(result.status === 'OK' ? 200 : 400).json(result)
    } catch (e) {
        return res.status(404).json({
            status: 'ERR',
            message: e.message || 'Lỗi khi cập nhật vận đơn'
        })
    }
}

module.exports = {
    // Provider
    createShippingProvider,
    getAllShippingProviders,
    getDetailsShippingProvider,
    updateShippingProvider,
    deleteShippingProvider,

    // Rate
    createShippingRate,
    getAllShippingRates,
    getDetailsShippingRate,
    updateShippingRate,
    deleteShippingRate,
    calculateShippingFee,
    getAvailableShippingRates,

    // Shipping Order
    createShippingOrder,
    getAllShippingOrders,
    getShippingOrderByOrderId,
    updateShippingOrderStatus,
    updateShippingOrder
}

