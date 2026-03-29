import { axiosJWT } from './UserService'

// ============ SHIPPING PROVIDER ============
export const createShippingProvider = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/shipping/provider`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const getAllShippingProviders = async (access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/shipping/provider`,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const getDetailsShippingProvider = async (id, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/shipping/provider/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const updateShippingProvider = async (id, data, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/shipping/provider/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const deleteShippingProvider = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/shipping/provider/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

// ============ SHIPPING RATE ============
export const createShippingRate = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/shipping/rate`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const getAllShippingRates = async (filters, access_token) => {
    const params = new URLSearchParams()
    if (typeof filters === 'string') {
        params.append('providerId', filters)
    } else if (filters) {
        if (filters.providerId) params.append('providerId', filters.providerId)
        if (filters.shippingMethod) params.append('shippingMethod', filters.shippingMethod)
    }
    const url = `${process.env.REACT_APP_API_URL}/shipping/rate${params.toString() ? `?${params.toString()}` : ''}`
    const res = await axiosJWT.get(url, {
        headers: {
            token: `Bearer ${access_token}`
        }
    })
    return res.data
}

export const getDetailsShippingRate = async (id, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/shipping/rate/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const updateShippingRate = async (id, data, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/shipping/rate/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const deleteShippingRate = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/shipping/rate/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

// ============ SHIPPING CALCULATION (Public) ============
export const calculateShippingFee = async (rateId, orderValue, distance = null, weight = null) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/shipping/calculate-fee`,
        { rateId, orderValue, distance, weight }
    )
    return res.data
}

export const getAvailableShippingRates = async (orderValue, city = null, weight = null) => {
    let url = `${process.env.REACT_APP_API_URL}/shipping/available-rates?orderValue=${orderValue}`
    if (city) url += `&city=${city}`
    if (weight) url += `&weight=${weight}`
    const res = await axiosJWT.get(url)
    return res.data
}

// ============ SHIPPING ORDER ============
export const createShippingOrder = async (orderId, data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/shipping/order/${orderId}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const getAllShippingOrders = async (filters, access_token) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.provider) params.append('provider', filters.provider)
    
    const url = `${process.env.REACT_APP_API_URL}/shipping/order${params.toString() ? '?' + params.toString() : ''}`
    const res = await axiosJWT.get(url, {
        headers: {
            token: `Bearer ${access_token}`
        }
    })
    return res.data
}

export const getShippingOrderByOrderId = async (orderId, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/shipping/order/by-order/${orderId}`,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const updateShippingOrderStatus = async (shippingOrderId, status, note, trackingNumber, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/shipping/order/${shippingOrderId}/status`,
        { status, note, trackingNumber },
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

export const updateShippingOrder = async (shippingOrderId, data, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/shipping/order/${shippingOrderId}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    )
    return res.data
}

