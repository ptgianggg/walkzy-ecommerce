import axios from "axios"
import { axiosJWT } from "./UserService"

export const createBrand = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/brand/create`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateBrand = async (id, access_token, data) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/brand/update/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteBrand = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/brand/delete/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getAllBrand = async () => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/brand/get-all`
    )
    return res.data
}

export const getDetailsBrand = async (id) => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/brand/get-details/${id}`
    )
    return res.data
}

