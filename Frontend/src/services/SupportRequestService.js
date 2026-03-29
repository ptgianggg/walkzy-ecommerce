import { axiosJWT } from "./UserService"
import axios from "axios"

/**
 * Tạo yêu cầu hỗ trợ mới
 */
export const createSupportRequest = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/support-request/create`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

/**
 * Lấy danh sách yêu cầu hỗ trợ của user
 */
export const getSupportRequestsByUser = async (access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/support-request/user`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

/**
 * Lấy chi tiết yêu cầu hỗ trợ
 */
export const getSupportRequestById = async (id, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/support-request/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

/**
 * Lấy danh sách yêu cầu hỗ trợ (admin)
 */
export const getAllSupportRequests = async (filters = {}, access_token) => {
    const params = new URLSearchParams({
        ...(filters.status && { status: filters.status }),
        ...(filters.requestType && { requestType: filters.requestType }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.orderId && { orderId: filters.orderId }),
        limit: filters.limit || 50,
        page: filters.page || 1
    });
    
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/support-request/admin/list?${params.toString()}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

/**
 * Kiểm tra đơn hàng có thể trả hàng không
 */
export const checkCanReturn = async (orderId, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/support-request/check-return/${orderId}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

/**
 * Cập nhật trạng thái yêu cầu hỗ trợ (admin)
 */
export const updateSupportRequestStatus = async (id, data, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/support-request/admin/${id}/status`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

/**
 * Hoàn tiền và cập nhật stock (admin)
 */
export const completeRefund = async (id, productCondition, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/support-request/admin/${id}/complete-refund`,
        { productCondition },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

