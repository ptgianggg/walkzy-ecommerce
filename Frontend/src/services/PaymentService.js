import axios from "axios"


export const getConfig = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/payment/config`)
    return res.data
}

// MoMo Payment
export const createMoMoPayment = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/payment/momo/create`, data)
    return res.data
}

export const verifyMoMoPayment = async (queryParams) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/payment/momo/verify`, {
        params: queryParams
    })
    return res.data
}

