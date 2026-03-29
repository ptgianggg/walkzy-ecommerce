import axios from "axios"


axios.defaults.baseURL = process.env.REACT_APP_API_URL;
axios.defaults.withCredentials = true;

export const axiosJWT = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    withCredentials: true
})


axiosJWT.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh nếu request có flag skipAuthRefresh
        if (originalRequest.skipAuthRefresh) {
            // Không log error cho skipAuthRefresh requests
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // If the current tab stored a refresh token (per-session), send it in the body to avoid relying on cookie
                const sessionModule = await import('../utils/sessionToken');
                const storedRefresh = sessionModule.getRefreshToken();

                const body = storedRefresh ? { refreshToken: storedRefresh } : {};

                const res = await axios.post(
                    `${process.env.REACT_APP_API_URL}/user/refresh-token`,
                    body,
                    { withCredentials: true }
                );

                const newAccessToken = res.data.access_token;

                // Lưu access_token mới vào sessionStorage (session-aware helper)
                if (newAccessToken) {
                    sessionModule.setAccessToken(newAccessToken);
                }

                originalRequest.headers["token"] = `Bearer ${newAccessToken}`;

                return axiosJWT(originalRequest);
            } catch (refreshError) {
                // Xóa token khi refresh thất bại
                sessionStorage.removeItem('access_token');
                try {
                    const sessionModule = await import('../utils/sessionToken');
                    sessionModule.removeRefreshToken();
                } catch (e) {
                    // ignore
                }

                // Không tự động redirect, để user tự quyết định
                // Chỉ redirect nếu đang ở trang cần authentication
                if (window.location.pathname.startsWith('/system/admin') || 
                    window.location.pathname.startsWith('/profile-user')) {
                    window.location.href = "/sign-in";
                }
                // Không log error để tránh spam console
                return Promise.reject(refreshError);
            }
        }
        
        // Không log 401 errors để tránh spam console
        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }
        
        return Promise.reject(error);
    }
);


export const loginUser = async (data) => {
    const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/sign-in`,
        data,
        { withCredentials: true }
    );
    return res.data
}

export const signupUser = async (data) => {
    const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/sign-up`,
        data
    );
    return res.data
}

export const getDetailsUser = async (id, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/user/get-details/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteUser = async (id, data, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/user/delete-user/${id}`, data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}



export const getAllUser = async (access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/user/getAll/`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}



export const refreshToken = async () => {
    const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/refresh-token`,
        {},
        { withCredentials: true }
    );
    return res.data
}

export const logoutUser = async () => {
    const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/log-out`,
        {},
        { withCredentials: true }
    );
    return res.data
}

export const updateUser = async (id, data, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/user/update-user/${id}`,
        data,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const deleteManyUser = async (data, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/user/delete-many`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}


export const loginGoogle = async (tokenData) => {
    const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/login-google`,
        tokenData,
        { withCredentials: true }
    );
    return res.data;
}

// Admin functions
export const lockUser = async (id, lockReason, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/user/lock/${id}`,
        { lockReason },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const unlockUser = async (id, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/user/unlock/${id}`,
        {},
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateUserRole = async (id, role, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/user/role/${id}`,
        { role },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getUserStatistics = async (access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/user/statistics`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getUserOrderHistory = async (id, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/user/order-history/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const getUserPermissions = async (id, access_token) => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/user/permissions/${id}`,
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const updateUserRoleId = async (id, roleId, access_token) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/user/role-id/${id}`,
        { roleId },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    )
    return res.data
}

export const generateQr = async () => {
    const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/qr/generate`
    );
    return res.data;
}

