import { axiosJWT } from './UserService';

export const getAllPermissions = async (access_token, filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.module) params.append('module', filters.module);
        if (filters.action) params.append('action', filters.action);
        if (filters.isSensitive !== undefined) params.append('isSensitive', filters.isSensitive);
        if (filters.isActive !== undefined) params.append('isActive', filters.isActive);

        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/permission/getAll?${params.toString()}`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error getting permissions:', error);
        throw error;
    }
};

export const getPermissionById = async (id, access_token) => {
    try {
        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/permission/get-details/${id}`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error getting permission:', error);
        throw error;
    }
};

export const getPermissionsByModule = async (module, access_token) => {
    try {
        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/permission/get-by-module/${module}`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error getting permissions by module:', error);
        throw error;
    }
};

export const createPermission = async (data, access_token) => {
    try {
        const res = await axiosJWT.post(
            `${process.env.REACT_APP_API_URL}/permission/create`,
            data,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error creating permission:', error);
        throw error;
    }
};

export const updatePermission = async (id, data, access_token) => {
    try {
        const res = await axiosJWT.put(
            `${process.env.REACT_APP_API_URL}/permission/update/${id}`,
            data,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error updating permission:', error);
        throw error;
    }
};

export const deletePermission = async (id, access_token) => {
    try {
        const res = await axiosJWT.delete(
            `${process.env.REACT_APP_API_URL}/permission/delete/${id}`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error deleting permission:', error);
        throw error;
    }
};

export const deleteManyPermissions = async (ids, access_token) => {
    try {
        const res = await axiosJWT.delete(
            `${process.env.REACT_APP_API_URL}/permission/delete-many`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                },
                data: { ids }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error deleting permissions:', error);
        throw error;
    }
};

export const getModules = async (access_token) => {
    try {
        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/permission/modules`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error getting modules:', error);
        throw error;
    }
};

export const initializeDefaultPermissions = async (access_token) => {
    try {
        const res = await axiosJWT.post(
            `${process.env.REACT_APP_API_URL}/permission/initialize-defaults`,
            {},
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error initializing default permissions:', error);
        throw error;
    }
};

