
import { axiosJWT } from "./UserService"
// export const createProduct = async (data) => {
//     const res = await axios.post(`${process.env.REACT_APP_API_URL}/product/create`, data)
//     return res.data
// }
//http://localhost:3001/api/order/get-order-details/691c50e92d0df98e27016bdf
export const createOrder = async (data, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/order/create`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getOrderByUserId = async (id, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/order/get-all-order/${id}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}


export const getDetailsOrder = async (id, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/order/get-details-order/${id}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}
export const cancelOrder = async (id, access_token, orderItems, cancelReason = '') => {
    const payload = {
        orderItems: Array.isArray(orderItems) ? orderItems : [orderItems],
        cancelReason
    }

    console.log('=== Cancel Order Request ===');
    console.log('Order ID:', id);
    console.log('Payload:', payload);
    console.log('=============================');

    const res = await axiosJWT.delete(`${process.env.REACT_APP_API_URL}/order/cancel-order/${id}`,
        {
            data: payload,
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getAllOrder = async (access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/order/get-all-order`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

// Admin functions
export const cancelOrderAdmin = async (id, cancelReason, access_token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/order/cancel/${id}`,
        { cancelReason },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const refundOrderAdmin = async (id, refundReason, refundAmount, refundTransactionId, access_token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/order/refund/${id}`,
        { refundReason, refundAmount, refundTransactionId },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateTracking = async (id, shippingCompany, trackingNumber, trackingUrl, access_token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/order/tracking/${id}`,
        { shippingCompany, trackingNumber, trackingUrl },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateOrderStatus = async (id, status, note, access_token, shippingStatus) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/order/status/${id}`,
        { status, note, shippingStatus },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const createManualOrder = async (orderData, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/order/manual`,
        orderData,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const completeOrder = async (orderId, access_token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/order/complete/${orderId}`,
        {},
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}




export const payOrder = async (id, access_token, data) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/order/pay-order/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}
