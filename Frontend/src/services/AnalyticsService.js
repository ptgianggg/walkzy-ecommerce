import { axiosJWT } from "./UserService"

export const getRevenueStatistics = async (period, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/revenue?period=${period}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getBestSellingProducts = async (limit, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/best-selling?limit=${limit}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getCancellationRate = async (period, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/cancellation-rate?period=${period}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getNewCustomersStatistics = async (period, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/new-customers?period=${period}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getInventoryStatistics = async (access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/inventory`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getOrderTimeHeatmap = async (access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/order-heatmap`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getDashboardOverview = async (access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/overview`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getTopProvincesByOrders = async (limit, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/top-provinces?limit=${limit}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getTopBrandsByOrders = async (limit, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/top-brands?limit=${limit}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getTopCategoriesByOrders = async (limit, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/top-categories?limit=${limit}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getAIAnalyticsInsights = async (access_token, mode = 'detailed') => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/analytics/admin/ai-analytics?mode=${mode}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

