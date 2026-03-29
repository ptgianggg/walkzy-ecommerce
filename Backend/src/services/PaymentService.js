const crypto = require("crypto");
const axios = require("axios");

// MoMo Payment Service - QR Code Payment
const createMoMoPayment = async (orderData) => {
    return new Promise(async (resolve, reject) => {
        try {
            // MoMo test credentials
            const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
            const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
            const secretKey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
            
            // MoMo API endpoint (test environment)
            const momoApiUrl = process.env.MOMO_API_URL || "https://test-payment.momo.vn/v2/gateway/api/create";
            
            // Generate requestId
            const requestId = partnerCode + new Date().getTime();
            // Use orderId from orderData if provided, otherwise generate from requestId
            const orderId = orderData.orderId || requestId;
            
            // Order info
            const orderInfo = orderData.orderInfo || "pay with MoMo";
            const amount = orderData.amount.toString();
            
            // URLs
            const redirectUrl = orderData.redirectUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/momo/return`;
            const ipnUrl = orderData.ipnUrl || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/payment/momo/ipn`;
            
            // Request type for QR code payment
            const requestType = "captureWallet";
            const extraData = ""; // pass empty value if your merchant does not have stores
            
            // Create raw signature for QR code payment
            // Format: accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
            
            console.log("--------------------RAW SIGNATURE----------------");
            console.log(rawSignature);
            
            // Create signature using HMAC SHA256
            const signature = crypto
                .createHmac("sha256", secretKey)
                .update(rawSignature)
                .digest("hex");
            
            console.log("--------------------SIGNATURE----------------");
            console.log(signature);
            
            // Request body for QR code payment
            const requestBody = {
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: "vi"
            };
            
            console.log("--------------------REQUEST BODY----------------");
            console.log(JSON.stringify(requestBody, null, 2));
            
            // Call MoMo API
            const response = await axios.post(momoApiUrl, requestBody, {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 30000
            });
            
            console.log("MoMo API Response:", JSON.stringify(response.data, null, 2));
            
            if (response.data && response.data.payUrl) {
                resolve({
                    status: "OK",
                    data: {
                        payUrl: response.data.payUrl,
                        orderId: orderId,
                        requestId: requestId,
                        qrCodeUrl: response.data.qrCodeUrl || null
                    }
                });
            } else {
                reject({
                    status: "ERR",
                    message: response.data?.message || "Không thể tạo link thanh toán MoMo",
                    errorCode: response.data?.resultCode,
                    subErrors: response.data?.subErrors
                });
            }
        } catch (error) {
            console.error("MoMo Payment Error:", error);
            
            // Log chi tiết lỗi từ MoMo
            if (error.response?.data) {
                console.error("MoMo Error Response:", JSON.stringify(error.response.data, null, 2));
                if (error.response.data.subErrors) {
                    console.error("MoMo Sub Errors:", JSON.stringify(error.response.data.subErrors, null, 2));
                }
            }
            
            reject({
                status: "ERR",
                message: error.response?.data?.message || error.message || "Có lỗi xảy ra khi tạo thanh toán MoMo",
                errorCode: error.response?.data?.resultCode,
                subErrors: error.response?.data?.subErrors
            });
        }
    });
};

// Verify MoMo payment result
const verifyMoMoPayment = async (queryData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
            const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
            const secretKey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
            
            const {
                partnerCode: queryPartnerCode,
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message: momoMessage,
                payType,
                responseTime,
                extraData,
                signature: querySignature
            } = queryData;
            
            // Create raw signature for verification
            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${momoMessage}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
            
            // Create signature
            const signature = crypto
                .createHmac("sha256", secretKey)
                .update(rawSignature)
                .digest("hex");
            
            // Verify signature
            if (signature !== querySignature) {
                return reject({
                    status: "ERR",
                    message: "Chữ ký không hợp lệ"
                });
            }
            
            // Check result code
            // resultCode = 0: Success
            // resultCode != 0: Failed
            if (resultCode === 0 || resultCode === "0") {
                resolve({
                    status: "OK",
                    data: {
                        orderId,
                        transId,
                        amount,
                        message: momoMessage
                    }
                });
            } else {
                reject({
                    status: "ERR",
                    message: momoMessage || "Thanh toán thất bại"
                });
            }
        } catch (error) {
            console.error("MoMo Verification Error:", error);
            reject({
                status: "ERR",
                message: error.message || "Có lỗi xảy ra khi xác thực thanh toán MoMo"
            });
        }
    });
};

module.exports = {
    createMoMoPayment,
    verifyMoMoPayment
};
