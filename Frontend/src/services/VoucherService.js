import { axiosJWT } from "./UserService";

export const validateVoucher = async (code, orderItems, totalPrice, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/voucher/validate`,
        {
            code,
            orderItems,
            totalPrice
        },
        {
            headers: {
                token: `Bearer ${access_token}`,
            }
        }
    );

    return res.data;
};

export const getActiveVouchers = async () => {
    const res = await axiosJWT.get(
        `${process.env.REACT_APP_API_URL}/promotion/get-active`
    );
    return res.data;
};

