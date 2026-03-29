import { axiosJWT } from './UserService';

export const getAllRoles = async (access_token, filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.isActive !== undefined) params.append('isActive', filters.isActive);

        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/role/getAll?${params.toString()}`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error getting roles:', error);
        throw error;
    }
};

export const getRoleById = async (id, access_token) => {
    try {
        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/role/get-details/${id}`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error getting role:', error);
        throw error;
    }
};

export const createRole = async (data, access_token) => {
    try {
        const res = await axiosJWT.post(
            `${process.env.REACT_APP_API_URL}/role/create`,
            data,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error creating role:', error);
        throw error;
    }
};

export const updateRole = async (id, data, access_token) => {
    try {
        const res = await axiosJWT.put(
            `${process.env.REACT_APP_API_URL}/role/update/${id}`,
            data,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error updating role:', error);
        throw error;
    }
};

export const deleteRole = async (id, access_token) => {
    try {
        const res = await axiosJWT.delete(
            `${process.env.REACT_APP_API_URL}/role/delete/${id}`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error deleting role:', error);
        throw error;
    }
};

export const deleteManyRoles = async (ids, access_token) => {
    try {
        const res = await axiosJWT.delete(
            `${process.env.REACT_APP_API_URL}/role/delete-many`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                },
                data: { ids }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error deleting roles:', error);
        throw error;
    }
};

export const getRoleUserCount = async (id, access_token) => {
    try {
        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/role/user-count/${id}`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error getting role user count:', error);
        throw error;
    }
};

