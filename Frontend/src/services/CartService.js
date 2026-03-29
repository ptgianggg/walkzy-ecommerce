import { axiosJWT } from "./UserService"

export const getCart = async (id, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/cart/get-cart/${id}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const addToCart = async (data, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/cart/add-to-cart`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const updateCartItem = async (data, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/cart/update-cart-item`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const deleteCartItem = async (data, access_token) => {
    // Using POST for delete if body is needed, or change to DELETE method if backend supports query params/body
    // Backend controller uses req.body for deleteCartItem so POST is safer if not fully RESTful or if axio delete body issues arise
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/cart/delete-cart-item`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const syncCart = async (data, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/cart/sync-cart`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}
