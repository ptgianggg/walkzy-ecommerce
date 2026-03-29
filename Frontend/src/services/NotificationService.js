import axios from "axios";
import { axiosJWT } from "./UserService";

export const getAllNotifications = async (userId) => {
    if (!userId) {
        return { data: [] };
    }
    
    try {
        const res = await axios.get(
            `${process.env.REACT_APP_API_URL}/notification/get-all/${userId}`
        );
        return res.data;
    } catch (error) {
        // Nếu lỗi 401, trả về empty array
        if (error?.response?.status === 401) {
            return { data: [] };
        }
        console.error('Get all notifications error:', error);
        return { data: [] };
    }
};

export const markAsRead = async (notificationId, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/notification/mark-read/${notificationId}`,
        {},
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    );
    return res.data;
};

export const markAllAsRead = async (access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/notification/mark-all-read`,
        {},
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    );
    return res.data;
};

export const getUnreadCount = async (access_token) => {
    // Skip API call when no valid token
    if (!access_token || access_token.trim() === '') {
        return { data: 0 };
    }
    
    try {
        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/notification/unread-count`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                },
                validateStatus: (status) => {
                    return (status >= 200 && status < 300) || status === 401;
                }
            }
        );
        
        // Nếu lỗi 401, trả về data mặc định
        if (res.status === 401) {
            return { data: 0 };
        }
        
        return res.data;
    } catch (error) {
        // Swallow errors (especially 401) to avoid noisy logs/polls
        // Chỉ log lỗi không phải 401
        if (error?.response?.status !== 401) {
            console.error('Get unread count error:', error);
        }
        return { data: 0 };
    }
};

export const subscribeRestock = async (productId, variation, access_token) => {
    if (!access_token) {
        throw new Error('Unauthorized');
    }

    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/notification/restock-subscribe`,
        { productId, variation },
        {
            headers: {
                token: `Bearer ${access_token}`
            }
        }
    );

    return res.data;
};
