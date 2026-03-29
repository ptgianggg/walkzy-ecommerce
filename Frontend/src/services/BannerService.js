import axios from "axios"
import { axiosJWT } from "./UserService"

export const createBanner = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/banner/create`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateBanner = async (id, access_token, data) => {
    if (!id) {
        throw new Error('Banner ID is required')
    }
    const url = `${process.env.REACT_APP_API_URL}/banner/update/${id}`
    const res = await axiosJWT.put(
        url,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteBanner = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/banner/delete/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteManyBanner = async (ids, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/banner/delete-many`,
        { ids },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getAllBanner = async (type = null) => {
    const url = type 
        ? `${process.env.REACT_APP_API_URL}/banner/get-all?type=${type}`
        : `${process.env.REACT_APP_API_URL}/banner/get-all`
    const res = await axios.get(url)
    return res.data
}

export const getDetailsBanner = async (id) => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/banner/get-details/${id}`
    )
    return res.data
}

