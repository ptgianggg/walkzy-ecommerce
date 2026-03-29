import axios from "axios"
import { axiosJWT } from "./UserService"

export const createAttribute = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/attribute/create`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateAttribute = async (id, access_token, data) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/attribute/update/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteAttribute = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/attribute/delete/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getAllAttribute = async (type = null, categoryId = null) => {
    let url = `${process.env.REACT_APP_API_URL}/attribute/get-all`
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (categoryId) params.append('categoryId', categoryId)
    if (params.toString()) url += `?${params.toString()}`
    const res = await axios.get(url)
    return res.data
}

export const getDetailsAttribute = async (id) => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/attribute/get-details/${id}`
    )
    return res.data
}

export const deleteManyAttribute = async (ids, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/attribute/delete-many`,
        { ids },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

