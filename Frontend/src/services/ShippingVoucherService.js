import axios from "axios"
import { axiosJWT } from "./UserService"

export const createShippingVoucher = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/shipping-voucher/create`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateShippingVoucher = async (id, access_token, data) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/shipping-voucher/update/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteShippingVoucher = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/shipping-voucher/delete/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getAllShippingVoucher = async (access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/shipping-voucher/get-all`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getDetailsShippingVoucher = async (id, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/shipping-voucher/get-details/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const validateShippingVoucher = async (code, shippingProviderId, orderTotal, userId = null) => {
    const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/shipping-voucher/validate`,
        {
            code,
            shippingProviderId,
            orderTotal,
            userId
        }
    )
    return res.data
}

export const getActiveShippingVouchers = async () => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/shipping-voucher/get-active`
    )
    return res.data
}
