import { axiosJWT } from "./UserService"

export const createReview = async (data, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/review/create`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getProductReviews = async (productId, page = 1, limit = 10, rating = null) => {
    // Validate ID trước khi gọi API
    if (!productId) {
        throw new Error('Product ID is required');
    }
    
    const trimmedId = String(productId).trim();
    
    if (!trimmedId || trimmedId === 'undefined' || trimmedId === 'null') {
        throw new Error('Invalid product ID');
    }
    
    let url = `${process.env.REACT_APP_API_URL}/review/product/${encodeURIComponent(trimmedId)}?page=${page}&limit=${limit}`
    if (rating) {
        url += `&rating=${rating}`
    }
    const res = await axiosJWT.get(url)
    return res.data
}

export const getUserReviews = async (access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/review/my-reviews`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const canReviewOrder = async (orderId, access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/review/can-review/${orderId}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

// Admin functions
export const getAllReviews = async (page, limit, filters, access_token) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(filters.rating && { rating: filters.rating.toString() }),
        ...(filters.search && { search: filters.search }),
        ...(filters.needsModeration && { needsModeration: filters.needsModeration }),
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.userId && { userId: filters.userId })
    });
    
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/review/all?${params}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getReviewStatistics = async (access_token) => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/review/statistics`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const toggleReviewStatus = async (reviewId, isActive, access_token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/review/toggle/${reviewId}`, 
        { isActive },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const replyReview = async (reviewId, content, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/review/reply/${reviewId}`, 
        { content },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const approveReview = async (reviewId, access_token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/review/approve/${reviewId}`, 
        {},
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateReview = async (reviewId, data, access_token) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/review/update/${reviewId}`, 
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

