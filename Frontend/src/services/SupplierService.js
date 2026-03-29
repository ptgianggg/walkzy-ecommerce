import { axiosJWT } from './UserService';

export const createSupplier = async (data, token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/supplier/create`, data, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const updateSupplier = async (id, data, token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/supplier/update/${id}`, data, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const deleteSupplier = async (id, token) => {
    const res = await axiosJWT.delete(`${process.env.REACT_APP_API_URL}/supplier/delete/${id}`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getAllSupplier = async (token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/supplier/get-all`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getDetailsSupplier = async (id, token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/supplier/get-details/${id}`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getActiveSuppliers = async (token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/supplier/get-active`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

