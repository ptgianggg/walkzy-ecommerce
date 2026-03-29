import axios from 'axios';

export const createOrUpdateStock = async (data, token) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/stock/create-or-update`, data, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const adjustStock = async (data, token) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/stock/adjust`, data, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const reserveStock = async (data, token) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/stock/reserve`, data, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const unreserveStock = async (data, token) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/stock/unreserve`, data, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getAllStock = async (params, token) => {
    const queryString = new URLSearchParams(params).toString();
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/stock/get-all?${queryString}`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getDetailsStock = async (id, token) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/stock/get-details/${id}`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getStockHistory = async (params, token) => {
    const queryString = new URLSearchParams(params).toString();
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/stock/history?${queryString}`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getLowStockProducts = async (warehouseId, token) => {
    const url = warehouseId 
        ? `${process.env.REACT_APP_API_URL}/stock/low-stock?warehouseId=${warehouseId}`
        : `${process.env.REACT_APP_API_URL}/stock/low-stock`;
    const res = await axios.get(url, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

export const getStockByProductAndVariation = async (productId, warehouseId, variation, token) => {
    const params = new URLSearchParams({ productId });
    if (warehouseId) params.append('warehouseId', warehouseId);
    if (variation) params.append('variation', JSON.stringify(variation));
    
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/stock/get-by-product?${params.toString()}`, {
        headers: {
            token: `Bearer ${token}`
        }
    });
    return res.data;
};

