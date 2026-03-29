import { axiosJWT } from './UserService';

export const createWarehouse = async (data, token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/warehouse/create`, data, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const updateWarehouse = async (id, data, token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/warehouse/update/${id}`, data, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const deleteWarehouse = async (id, token) => {
    const res = await axiosJWT.delete(`${process.env.REACT_APP_API_URL}/warehouse/delete/${id}`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getAllWarehouse = async (token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/warehouse/get-all`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getDetailsWarehouse = async (id, token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/warehouse/get-details/${id}`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getDefaultWarehouse = async (token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/warehouse/get-default`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

