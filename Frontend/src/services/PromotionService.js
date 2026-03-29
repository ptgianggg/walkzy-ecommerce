import axios from "axios"
import { axiosJWT } from "./UserService"

export const createPromotion = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/promotion/create`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updatePromotion = async (id, access_token, data) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/promotion/update/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deletePromotion = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/promotion/delete/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getAllPromotion = async () => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/promotion/get-all`
    )
    return res.data
}

export const getActivePromotions = async () => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/promotion/get-active`
    )
    return res.data
}

export const getDetailsPromotion = async (id) => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/promotion/get-details/${id}`
    )
    return res.data
}

