const ShippingProvider = require('../models/ShippingProviderModel')
const ShippingRate = require('../models/ShippingRateModel')
const ShippingOrder = require('../models/ShippingOrderModel')
const Order = require('../models/OrderProduct')

// ============ SHIPPING PROVIDER ============
const createShippingProvider = (newProvider) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, code, logo, description, phone, email, website, apiConfig, isActive } = newProvider
            const normalizedCode = code?.trim()?.toUpperCase()
            const activeFlag = typeof isActive === 'boolean' ? isActive : true

            // Kiểm tra code đã tồn tại
            const checkProvider = await ShippingProvider.findOne({ code: normalizedCode || code })
            if (checkProvider) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã nhà vận chuyển đã tồn tại'
                })
            }

            const createdProvider = await ShippingProvider.create({
                name,
                code: normalizedCode || code,
                logo,
                description,
                phone,
                email,
                website,
                apiConfig: apiConfig || {},
                isActive: activeFlag
            })

            resolve({
                status: 'OK',
                message: 'Tạo nhà vận chuyển thành công',
                data: createdProvider
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getAllShippingProviders = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const providers = await ShippingProvider.find().sort({ createdAt: -1 })
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: providers
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getDetailsShippingProvider = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const provider = await ShippingProvider.findById(id)
            if (!provider) {
                return resolve({
                    status: 'ERR',
                    message: 'Nhà vận chuyển không tồn tại'
                })
            }
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: provider
            })
        } catch (e) {
            reject(e)
        }
    })
}

const updateShippingProvider = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const provider = await ShippingProvider.findById(id)
            if (!provider) {
                return resolve({
                    status: 'ERR',
                    message: 'Nhà vận chuyển không tồn tại'
                })
            }

            if (data.code) {
                data.code = data.code.trim().toUpperCase()
            }

            // Kiểm tra code trùng (nếu có thay đổi)
            if (data.code && data.code !== provider.code) {
                const checkCode = await ShippingProvider.findOne({ code: data.code })
                if (checkCode) {
                    return resolve({
                        status: 'ERR',
                        message: 'Mã nhà vận chuyển đã tồn tại'
                    })
                }
            }

            const updatedProvider = await ShippingProvider.findByIdAndUpdate(id, data, { new: true })
            resolve({
                status: 'OK',
                message: 'Cập nhật nhà vận chuyển thành công',
                data: updatedProvider
            })
        } catch (e) {
            reject(e)
        }
    })
}

const deleteShippingProvider = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Kiểm tra có đang được sử dụng trong ShippingRate không (bao gồm danh sách hỗ trợ)
            const ratesUsingProvider = await ShippingRate.find({
                $or: [
                    { provider: id },
                    { supportedProviders: id }
                ]
            })
            if (ratesUsingProvider.length > 0) {
                return resolve({
                    status: 'ERR',
                    message: `Không thể xóa. Có ${ratesUsingProvider.length} bảng phí/phương thức đang sử dụng nhà vận chuyển này`
                })
            }

            await ShippingProvider.findByIdAndDelete(id)
            resolve({
                status: 'OK',
                message: 'Xóa nhà vận chuyển thành công'
            })
        } catch (e) {
            reject(e)
        }
    })
}

// ============ SHIPPING RATE ============
const createShippingRate = (newRate) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { shippingMethod, supportedProviders = [], provider, name, code, rateType, fixedPrice, orderValueTiers, distanceTiers, weightTiers, estimatedDays, freeShippingThreshold, applicableRegions, priority, isActive } = newRate

            const normalizedMethod = (shippingMethod || '').trim().toLowerCase()
            if (!normalizedMethod) {
                return resolve({
                    status: 'ERR',
                    message: 'Phương thức vận chuyển là bắt buộc'
                })
            }

            const resolvedName = (name && name.trim()) || (normalizedMethod ? normalizedMethod.charAt(0).toUpperCase() + normalizedMethod.slice(1) : 'Custom')
            const resolvedCode = (code && code.trim().toUpperCase()) || (normalizedMethod || 'custom').toUpperCase()
            const activeFlag = typeof isActive === 'boolean' ? isActive : true

            // Xác thực danh sách nhà vận chuyển hỗ trợ
            let providerIds = supportedProviders.filter(Boolean)
            if (provider && !providerIds.includes(provider)) {
                providerIds.push(provider) // đảm bảo provider cũ vẫn nằm trong danh sách hỗ trợ
            }
            if (!providerIds || providerIds.length === 0) {
                return resolve({
                    status: 'ERR',
                    message: 'Cần chọn ít nhất 1 nhà vận chuyển hỗ trợ'
                })
            }

            const providerRecords = await ShippingProvider.find({ _id: { $in: providerIds } })
            if (providerRecords.length !== providerIds.length) {
                return resolve({
                    status: 'ERR',
                    message: 'Danh sách nhà vận chuyển hỗ trợ không hợp lệ'
                })
            }

            // Kiểm tra code đã tồn tại cho cùng shippingMethod
            const checkRate = await ShippingRate.findOne({ code: resolvedCode, shippingMethod: normalizedMethod })
            if (checkRate) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã phương thức/bảng phí đã tồn tại cho phương thức này'
                })
            }

            const createdRate = await ShippingRate.create({
                shippingMethod: normalizedMethod,
                supportedProviders: providerIds,
                // legacy field
                provider: providerIds[0],
                name: resolvedName,
                code: resolvedCode,
                rateType: rateType || 'by_order_value',
                fixedPrice: fixedPrice || 0,
                orderValueTiers: orderValueTiers || [],
                distanceTiers: distanceTiers || [],
                weightTiers: weightTiers || [],
                estimatedDays: estimatedDays || { min: 1, max: 3 },
                freeShippingThreshold,
                applicableRegions: applicableRegions || ['all'],
                priority: priority || 0,
                isActive: activeFlag
            })

            resolve({
                status: 'OK',
                message: 'Tạo phương thức vận chuyển thành công',
                data: createdRate
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getAllShippingRates = (providerId = null, shippingMethod = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = {}
            if (providerId) {
                query.$or = [
                    { provider: providerId },
                    { supportedProviders: providerId }
                ]
            }
            if (shippingMethod) {
                query.shippingMethod = shippingMethod
            }
            const rates = await ShippingRate.find(query)
                .populate('provider', 'name code logo')
                .populate('supportedProviders', 'name code logo isActive')
                .sort({ priority: -1, createdAt: -1 })
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: rates
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getDetailsShippingRate = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const rate = await ShippingRate.findById(id)
                .populate('provider', 'name code logo')
                .populate('supportedProviders', 'name code logo isActive')
            if (!rate) {
                return resolve({
                    status: 'ERR',
                    message: 'Phương thức/bảng phí không tồn tại'
                })
            }
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: rate
            })
        } catch (e) {
            reject(e)
        }
    })
}

const updateShippingRate = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (data.shippingMethod) {
                data.shippingMethod = data.shippingMethod.trim().toLowerCase()
            }
            if (data.code) {
                data.code = data.code.trim().toUpperCase()
            }
            const rate = await ShippingRate.findById(id)
            if (!rate) {
                return resolve({
                    status: 'ERR',
                    message: 'Phuong thuc/bang phi khong ton tai'
                })
            }

            // Kiem tra code trung (neu co thay doi) theo shippingMethod
            if (data.code && data.code !== rate.code) {
                const checkCode = await ShippingRate.findOne({
                    code: data.code,
                    shippingMethod: data.shippingMethod || rate.shippingMethod
                })
                if (checkCode) {
                    return resolve({
                        status: 'ERR',
                        message: 'Ma phuong thuc/bang phi da ton tai'
                    })
                }
            }

            // Xac thuc danh sach nha van chuyen ho tro neu co
            if (data.supportedProviders) {
                const providerIds = data.supportedProviders.filter(Boolean)
                const providerRecords = await ShippingProvider.find({ _id: { $in: providerIds } })
                if (providerRecords.length !== providerIds.length) {
                    return resolve({
                        status: 'ERR',
                        message: 'Danh sach nha van chuyen ho tro khong hop le'
                    })
                }
                if (!data.provider && providerIds.length > 0) {
                    data.provider = providerIds[0] // fallback legacy field
                }
            }

            const updatedRate = await ShippingRate.findByIdAndUpdate(id, data, { new: true })
                .populate('provider', 'name code logo')
                .populate('supportedProviders', 'name code logo isActive')
            resolve({
                status: 'OK',
                message: 'Cap nhat phuong thuc van chuyen thanh cong',
                data: updatedRate
            })
        } catch (e) {
            reject(e)
        }
    })
}

const deleteShippingRate = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Kiểm tra có đang được sử dụng trong ShippingOrder không
            const ordersUsingRate = await ShippingOrder.find({ rate: id })
            if (ordersUsingRate.length > 0) {
                return resolve({
                    status: 'ERR',
                    message: `Không thể xóa. Có ${ordersUsingRate.length} đơn hàng đang sử dụng bảng phí này`
                })
            }

            await ShippingRate.findByIdAndDelete(id)
            resolve({
                status: 'OK',
                message: 'Xóa bảng phí thành công'
            })
        } catch (e) {
            reject(e)
        }
    })
}

// Tính phí ship dựa trên giá trị đơn hàng
const calculateShippingFee = (rateId, orderValue, distance = null, weight = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const rate = await ShippingRate.findById(rateId)
            if (!rate || !rate.isActive) {
                return resolve({
                    status: 'ERR',
                    message: 'Bảng phí không tồn tại hoặc đã bị vô hiệu hóa'
                })
            }

            // Kiểm tra miễn phí ship
            if (rate.freeShippingThreshold && orderValue >= rate.freeShippingThreshold) {
                return resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: {
                        fee: 0,
                        isFree: true,
                        estimatedDays: rate.estimatedDays
                    }
                })
            }

            let fee = 0

            // Tính theo loại rate
            if (rate.rateType === 'fixed') {
                fee = rate.fixedPrice || 0
            } else if (rate.rateType === 'by_order_value' && rate.orderValueTiers && rate.orderValueTiers.length > 0) {
                // Tìm tier phù hợp
                const tier = rate.orderValueTiers.find(t => {
                    return orderValue >= t.minValue && (!t.maxValue || orderValue <= t.maxValue)
                })
                fee = tier ? tier.price : rate.fixedPrice || 0
            } else if (rate.rateType === 'by_distance' && distance !== null && rate.distanceTiers && rate.distanceTiers.length > 0) {
                const tier = rate.distanceTiers.find(t => {
                    return distance >= t.minDistance && (!t.maxDistance || distance <= t.maxDistance)
                })
                fee = tier ? tier.price : rate.fixedPrice || 0
            } else if (rate.rateType === 'by_weight' && weight !== null && rate.weightTiers && rate.weightTiers.length > 0) {
                const tier = rate.weightTiers.find(t => {
                    return weight >= t.minWeight && (!t.maxWeight || weight <= t.maxWeight)
                })
                fee = tier ? tier.price : rate.fixedPrice || 0
            } else {
                fee = rate.fixedPrice || 0
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    fee,
                    isFree: false,
                    estimatedDays: rate.estimatedDays
                }
            })
        } catch (e) {
            reject(e)
        }
    })
}

// Chọn provider và tính phí cho từng phương thức (hoặc cho 1 phương thức cụ thể)
const getAvailableShippingRates = (orderValue, city = null, shippingMethod = null, weight = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = { isActive: true }
            const rawMethod = typeof shippingMethod === 'string' ? shippingMethod.trim().toLowerCase() : null

            // Map provider-specific codes to canonical enum used by ShippingRate.shippingMethod
            const mapMethodToEnum = (s) => {
                if (!s) return null
                if (['standard','express','fast','custom'].includes(s)) return s
                if (s.includes('custom')) return 'custom'
                if (s.includes('express') || s.includes('exp') || s.includes('priority')) return 'express'
                if (s.includes('fast') || s.includes('overnight') || s.includes('same') || s.includes('nhanh')) return 'fast'
                if (s.includes('std') || s.includes('standard') || s.includes('eco') || s.includes('economy')) return 'standard'
                return null
            }

            const mappedMethod = mapMethodToEnum(rawMethod)
            
            // Normalize city for matching (e.g., "Thành phố Hồ Chí Minh" -> "HCM", "Thành phố Hà Nội" -> "HN")
            let normalizedCity = city;
            if (city) {
                const c = city.toLowerCase();
                if (c.includes('hồ chí minh') || c.includes('hcm')) normalizedCity = 'HCM';
                else if (c.includes('hà nội') || c.includes('hn')) normalizedCity = 'HN';
                else if (c.includes('đà nẵng')) normalizedCity = 'ĐN';
            }

            if (mappedMethod) {
                query.shippingMethod = mappedMethod
            }

            // Lọc theo khu vực nếu có
            if (city) {
                query.$or = [
                    { applicableRegions: 'all' },
                    { applicableRegions: city },
                    { applicableRegions: normalizedCity }
                ]
            } else {
                // Nếu không có city, vẫn lấy tất cả rates (bao gồm cả 'all')
                // Không cần filter thêm
            }

            // Lấy tất cả rates active, kèm provider hỗ trợ
            const rates = await ShippingRate.find(query)
                .populate('provider', 'name code logo isActive')
                .populate('supportedProviders', 'name code logo isActive')
                .sort({ priority: -1 })

            // Lọc bỏ rate không có provider hỗ trợ nào đang active
            const validRates = rates.filter(rate => {
                const providers = (rate.supportedProviders || []).filter(p => p && p.isActive !== false)
                if (providers.length > 0) return true
                // fallback legacy provider
                return rate.provider && rate.provider.isActive !== false
            })

            if (validRates.length === 0) {
                return resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: []
                })
            }

            // Tính phí cho từng rate + chọn provider active đầu tiên
            const ratesWithFee = await Promise.all(
                validRates.map(async (rate) => {
                    const feeResult = await calculateShippingFee(rate._id, orderValue, null, weight)
                    const activeProviders = (rate.supportedProviders || []).filter(p => p && p.isActive !== false)
                    const chosenProvider = activeProviders[0] || (rate.provider && rate.provider.isActive !== false ? rate.provider : null)

                    return {
                        ...rate.toObject(),
                        provider: chosenProvider, // provider đã được chọn theo ưu tiên active
                        shippingFee: feeResult.status === 'OK' ? feeResult.data.fee : 0,
                        estimatedDays: feeResult.status === 'OK' ? feeResult.data.estimatedDays : { min: 1, max: 3 },
                        isFree: feeResult.status === 'OK' ? feeResult.data.isFree : false
                    }
                })
            )

            // Nếu client yêu cầu 1 phương thức: trả về option tốt nhất (phí thấp nhất, ưu tiên priority)
            if (mappedMethod) {
                const best = ratesWithFee
                    .filter(r => {
                        // So sánh case-insensitive
                        const rateMethod = (r.shippingMethod || '').toLowerCase().trim()
                        return rateMethod === mappedMethod
                    })
                    .sort((a, b) => {
                        if (a.shippingFee !== b.shippingFee) return a.shippingFee - b.shippingFee
                        return (b.priority || 0) - (a.priority || 0)
                    })[0]

                return resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: best ? [best] : []
                })
            }

            // Ngược lại: gom theo shippingMethod, chọn option phí thấp nhất cho mỗi method
            const bestByMethodMap = new Map()
            for (const rate of ratesWithFee) {
                const key = rate.shippingMethod || rate.code
                const existing = bestByMethodMap.get(key)
                if (!existing) {
                    bestByMethodMap.set(key, rate)
                } else {
                    if (rate.shippingFee < existing.shippingFee) {
                        bestByMethodMap.set(key, rate)
                    } else if (rate.shippingFee === existing.shippingFee && (rate.priority || 0) > (existing.priority || 0)) {
                        bestByMethodMap.set(key, rate)
                    }
                }
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: Array.from(bestByMethodMap.values())
            })
        } catch (e) {
            console.error('Error in getAvailableShippingRates:', e)
            reject(e)
        }
    })
}

// ============ SHIPPING ORDER ============
const createShippingOrder = (orderId, shippingData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { providerId, rateId, shippingMethod, shippingAddress, shippingPrice, estimatedDeliveryDate } = shippingData
            const normalizedMethod = shippingMethod ? shippingMethod.toLowerCase() : null

            // Kiem tra order ton tai
            const order = await Order.findById(orderId)
            if (!order) {
                return resolve({
                    status: 'ERR',
                    message: 'Don hang khong ton tai'
                })
            }

            // Kiem tra da co shipping order chua
            const existingShippingOrder = await ShippingOrder.findOne({ order: orderId })
            if (existingShippingOrder) {
                return resolve({
                    status: 'ERR',
                    message: 'Don hang da co van don'
                })
            }

            // Lay rate theo rateId hoac shippingMethod
            let rate = null
            if (rateId) {
                rate = await ShippingRate.findById(rateId).populate('supportedProviders', 'name code logo isActive')
            }
            if (!rate && normalizedMethod) {
                rate = await ShippingRate.findOne({ shippingMethod: normalizedMethod, isActive: true })
                    .populate('supportedProviders', 'name code logo isActive')
                    .sort({ priority: -1, createdAt: -1 })
            }
            
            // FALLBACK 1: Try 'standard' if specific method fails
            if (!rate && normalizedMethod !== 'standard') {
                console.warn(`Shipping Rate not found for method '${normalizedMethod}'. Falling back to 'standard'.`)
                rate = await ShippingRate.findOne({ shippingMethod: 'standard', isActive: true })
                    .populate('supportedProviders', 'name code logo isActive')
                    .sort({ priority: -1, createdAt: -1 })
            }

            // FALLBACK 2: Try ANY active rate if standard fails
            if (!rate) {
                 console.warn(`Shipping Rate 'standard' not found. Falling back to ANY active rate.`)
                 rate = await ShippingRate.findOne({ isActive: true })
                    .populate('supportedProviders', 'name code logo isActive')
                    .sort({ priority: -1, createdAt: -1 })
            }

            if (!rate) {
                return resolve({
                    status: 'ERR',
                    message: 'Khong tim thay phuong thuc van chuyen phu hop (No active Shipping Rate found)'
                })
            }

            // Chon provider tu dong (uu tien providerId neu truyen vao)
            let chosenProvider = null
            if (providerId) {
                chosenProvider = await ShippingProvider.findById(providerId)
            }
            const activeSupported = (rate.supportedProviders || []).filter(p => p && p.isActive !== false)
            if (!chosenProvider && activeSupported.length > 0) {
                // Ưu tiên provider có chữ 'ghn' hoặc 'ghtk' nếu method là standard/fast?
                // Đơn giản là lấy cái đầu tiên active
                chosenProvider = activeSupported[0]
            }
            if (!chosenProvider && rate.provider) {
                const legacyProvider = await ShippingProvider.findById(rate.provider)
                if (legacyProvider && legacyProvider.isActive !== false) {
                    chosenProvider = legacyProvider
                }
            }
            // Fallback: Nếu không tìm thấy provider trong rate, tìm bất kỳ provider nào active
            if (!chosenProvider) {
                 chosenProvider = await ShippingProvider.findOne({ isActive: true })
            }

            if (!chosenProvider) {
                return resolve({
                    status: 'ERR',
                    message: 'Khong co nha van chuyen ho tro dang hoat dong'
                })
            }

            // Tinh estimatedDeliveryDate neu chua co
            let deliveryDate = estimatedDeliveryDate
            if (!deliveryDate && rate.estimatedDays) {
                const minDays = rate.estimatedDays.min || 1
                const maxDays = rate.estimatedDays.max || 3
                const avgDays = Math.ceil((minDays + maxDays) / 2)
                deliveryDate = new Date()
                deliveryDate.setDate(deliveryDate.getDate() + avgDays)
            }

            const shippingOrder = await ShippingOrder.create({
                order: orderId,
                provider: chosenProvider._id,
                rate: rate._id,
                shippingMethod: rate.shippingMethod || normalizedMethod || 'standard',
                shippingAddress: shippingAddress || order.shippingAddress,
                shippingPrice: shippingPrice || order.shippingPrice,
                estimatedDeliveryDate: deliveryDate,

                // 🔥 Thêm này: Sinh mã vận đơn nếu chưa có
                trackingNumber: order.trackingNumber || `WPZ-${Date.now()}`,

                status: 'pending',
                statusHistory: [{
                    status: 'pending',
                    changedAt: new Date(),
                    note: 'Van don duoc tao tu he thong'
                }]
            })
            
            // Dong bo vao order (quan trong de FE hien thi)
            await Order.findByIdAndUpdate(orderId, {
                shippingProvider: chosenProvider._id,
                shippingRate: rate._id,
                shippingMethod: rate.shippingMethod || normalizedMethod || 'standard',
                shippingStatus: 'pending', // Pending pickup
                status: 'processing', // Order status -> processing
                trackingNumber: shippingOrder.trackingNumber, // Sync tracking number to Order
                $push: { 
                    statusHistory: { 
                        status: 'processing', 
                        changedAt: new Date(), 
                        note: `Hệ thống tự động chọn ĐVVC: ${chosenProvider.name}` 
                    } 
                }
            })

            resolve({
                status: 'OK',
                message: 'Tao van don thanh cong',
                data: shippingOrder
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getAllShippingOrders = (filters = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = {}
            if (filters.status) query.status = filters.status
            if (filters.provider) query.provider = filters.provider

            const shippingOrders = await ShippingOrder.find(query)
                .populate('order', 'orderItems totalPrice status user trackingNumber')
                .populate('provider', 'name code logo')
                .populate('rate', 'name code estimatedDays')
                .sort({ createdAt: -1 })

            // 🔥 Thêm đoạn normalize TẠI ĐÂY
            const normalized = shippingOrders.map(s => ({
                ...s.toObject(),
                trackingNumber: s.trackingNumber || s.order?.trackingNumber || null
            }))

            return resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: normalized
            })

        } catch (e) {
            reject(e)
        }
    })
}


const getShippingOrderByOrderId = (orderId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const shippingOrder = await ShippingOrder.findOne({ order: orderId })
                .populate('provider', 'name code logo')
                .populate('rate', 'name code estimatedDays')
                .populate('order', 'orderItems totalPrice status user')

            if (!shippingOrder) {
                return resolve({
                    status: 'ERR',
                    message: 'Vận đơn không tồn tại'
                })
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: shippingOrder
            })
        } catch (e) {
            reject(e)
        }
    })
}

const { isOrderTransitionAllowed, isShippingTransitionAllowed } = require('../constants/orderStatuses')

const updateShippingOrderStatus = (shippingOrderId, newStatus, updatedBy, note = null, trackingNumber = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const shippingOrder = await ShippingOrder.findById(shippingOrderId)
            if (!shippingOrder) {
                return resolve({
                    status: 'ERR',
                    message: 'Vận đơn không tồn tại'
                })
            }

            // Lấy order để kiểm tra trạng thái hiện tại
            const order = await Order.findById(shippingOrder.order)
            if (!order) {
                return resolve({
                    status: 'ERR',
                    message: 'Đơn hàng không tồn tại'
                })
            }

            // Kiểm tra nếu đơn đã hoàn tất thì không cho cập nhật shipping status
            if (order.status === 'completed') {
                return resolve({
                    status: 'ERR',
                    message: 'Đơn hàng đã hoàn tất, không thể cập nhật trạng thái vận chuyển'
                })
            }

            // Validate shipping status transition (forward-only)
            if (!isShippingTransitionAllowed(shippingOrder.status, newStatus)) {
                return resolve({
                    status: 'ERR',
                    message: `Không thể chuyển trạng thái vận chuyển từ "${shippingOrder.status}" → "${newStatus}"`
                })
            }

            const updateData = {
                status: newStatus,
                $push: {
                    statusHistory: {
                        status: newStatus,
                        changedAt: new Date(),
                        changedBy: updatedBy,
                        note: note || ''
                    }
                }
            }

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

            // Mapping shipping status sang order status theo workflow (tự đồng bộ không bỏ bước)
            const progressStatuses = ['picked_up', 'in_transit', 'out_for_delivery']
            const orderStatusHistoryEntries = []
            let nextOrderStatus = normalizeOrderStatus(order.status)
            let transitionError = null
            const orderStatusExtraFields = {}

            const appendHistory = (statusValue, defaultNote) => {
                orderStatusHistoryEntries.push({
                    status: statusValue,
                    changedBy: updatedBy,
                    changedAt: new Date(),
                    note: note || defaultNote || ''
                })
            }

            const attemptOrderStatusChange = (targetStatus, defaultNote) => {
                if (transitionError || !targetStatus) return
                if (nextOrderStatus === targetStatus) return
                if (!isOrderTransitionAllowed(nextOrderStatus, targetStatus)) {
                    transitionError = `Không thể cập nhật trạng thái đơn từ "${nextOrderStatus}" → "${targetStatus}" do giới hạn luồng trạng thái`
                    return
                }
                nextOrderStatus = targetStatus
                appendHistory(targetStatus, defaultNote)
            }

            const lockedShippedStatuses = ['shipped', 'delivered', 'completed', 'returned', 'failed', 'refunded', 'return_requested', 'cancelled']
            const ensureShippedState = () => {
                if (!lockedShippedStatuses.includes(nextOrderStatus)) {
                    attemptOrderStatusChange('shipped', 'Đã bàn giao cho đơn vị vận chuyển')
                }
            }

            // Đưa đơn hàng sang trạng thái "shipped" ngay khi vận chuyển rời kho
            if (progressStatuses.includes(newStatus)) {
                ensureShippedState()
            }

            if (newStatus === 'delivered') {
                updateData.actualDeliveryDate = new Date()
                ensureShippedState()
                attemptOrderStatusChange('delivered', 'Đã giao hàng')
                if (nextOrderStatus === 'delivered') {
                    orderStatusExtraFields.isDelivered = true
                    orderStatusExtraFields.deliveredAt = new Date()
                }
            } else if (newStatus === 'failed') {
                ensureShippedState()
                attemptOrderStatusChange('failed', 'Giao hàng thất bại')
            } else if (newStatus === 'cancelled') {
                attemptOrderStatusChange('cancelled', 'Đơn hàng đã bị hủy')
            } else if (newStatus === 'returned') {
                ensureShippedState()
                attemptOrderStatusChange('returned', 'Trả hàng thành công')
            }

            if (transitionError) {
                return resolve({
                    status: 'ERR',
                    message: transitionError
                })
            }

            // Thu gom tất cả cập nhật cho Order model
            const finalOrderUpdate = { 
                shippingStatus: newStatus,
                ...orderStatusExtraFields
            }
            if (trackingNumber) {
                finalOrderUpdate.trackingNumber = trackingNumber
                updateData.trackingNumber = trackingNumber
            }

            // Lưu trạng thái đơn (giữ luồng hợp lệ: shipped → delivered/failed/returned)
            if (nextOrderStatus !== order.status) {
                finalOrderUpdate.status = nextOrderStatus
            }
            if (orderStatusHistoryEntries.length > 0) {
                finalOrderUpdate.$push = {
                    statusHistory: orderStatusHistoryEntries.length === 1
                        ? orderStatusHistoryEntries[0]
                        : { $each: orderStatusHistoryEntries }
                }
            }

            if (Object.keys(finalOrderUpdate).length > 0) {
                await Order.findByIdAndUpdate(shippingOrder.order, finalOrderUpdate)
            }

            // Cập nhật shipping order
            const updatedShippingOrder = await ShippingOrder.findByIdAndUpdate(
                shippingOrderId,
                updateData,
                { new: true }
            )
                .populate('provider', 'name code logo')
                .populate('rate', 'name code estimatedDays')
                .populate('order', 'orderItems totalPrice status user')

            resolve({
                status: 'OK',
                message: 'Cập nhật trạng thái vận chuyển thành công',
                data: updatedShippingOrder
            })

           
        } catch (e) {
            reject(e)
        }
    })
}

const updateShippingOrder = (shippingOrderId, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const shippingOrder = await ShippingOrder.findByIdAndUpdate(
                shippingOrderId,
                data,
                { new: true }
            )
                .populate('provider', 'name code logo')
                .populate('rate', 'name code estimatedDays')
                .populate('order', 'orderItems totalPrice status user')

            if (!shippingOrder) {
                return resolve({
                    status: 'ERR',
                    message: 'Vận đơn không tồn tại'
                })
            }

            resolve({
                status: 'OK',
                message: 'Cập nhật vận đơn thành công',
                data: shippingOrder
            })
        } catch (e) {
            reject(e)
        }
    })
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
    // Helper chọn option tốt nhất cho một phương thức (trả về 1 record trong mảng data)
    chooseBestShippingOption: (orderValue, city, shippingMethod, weight = null) => getAvailableShippingRates(orderValue, city, shippingMethod, weight),

    // Shipping Order
    createShippingOrder,
    getAllShippingOrders,
    getShippingOrderByOrderId,
    updateShippingOrderStatus,
    updateShippingOrder
}
