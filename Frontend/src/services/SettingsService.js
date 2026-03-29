import axios from 'axios';
import { axiosJWT } from './UserService';

axios.defaults.baseURL = process.env.REACT_APP_API_URL;
axios.defaults.withCredentials = true;

export const getSettings = async (access_token) => {
    try {
        const res = await axiosJWT.get(
            `${process.env.REACT_APP_API_URL}/settings`,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error getting settings:', error);
        throw error;
    }
};

export const updateSettings = async (data, access_token) => {
    try {
        const res = await axiosJWT.put(
            `${process.env.REACT_APP_API_URL}/settings`,
            data,
            {
                headers: {
                    token: `Bearer ${access_token}`,
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
};

// Public API - không cần authentication
export const getSettingsPublic = async () => {
    try {
        const res = await axios.get(
            `${process.env.REACT_APP_API_URL}/settings/public`
        );
        return res.data;
    } catch (error) {
        console.error('Error getting public settings:', error);
        throw error;
    }
};

