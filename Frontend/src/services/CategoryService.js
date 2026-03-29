import axios from "axios"
import { axiosJWT } from "./UserService"

export const createCategory = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/category/create`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateCategory = async (id, access_token, data) => {
    if (!id) {
        throw new Error('Category ID is required')
    }
    const url = `${process.env.REACT_APP_API_URL}/category/update/${id}`
    console.log('Update category URL:', url)
    console.log('Update category data:', data)
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

export const deleteCategory = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/category/delete/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteManyCategory = async (ids, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/category/delete-many`,
        { ids },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getAllCategory = async () => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/category/get-all`
    )
    return res.data
}

export const getCategoryTree = async () => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/category/get-tree`
    )
    return res.data
}

export const getParentCategories = async () => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/category/get-parents`
    )
    return res.data
}

export const getDetailsCategory = async (id) => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/category/get-details/${id}`
    )
    return res.data
}
