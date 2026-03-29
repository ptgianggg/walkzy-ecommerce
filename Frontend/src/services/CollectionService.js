import axios from "axios"
import { axiosJWT } from "./UserService"

export const createCollection = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/collection/create`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateCollection = async (id, access_token, data) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/collection/update/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteCollection = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/collection/delete/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getAllCollection = async () => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/collection/get-all`
    )
    return res.data
}

export const getDetailsCollection = async (id) => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/collection/get-details/${id}`
    )
    return res.data
}

export const getCollectionBySlug = async (slug) => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/collection/get-by-slug/${slug}`
    )
    return res.data
}

