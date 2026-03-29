const PaymentService = require('../services/PaymentService');
const Order = require('../models/OrderProduct');

const createMoMoPayment = async (req, res) => {
    try {
        const { amount, orderInfo, redirectUrl, ipnUrl, orderId, extraData, orderGroupId, autoCapture, lang, partnerName, storeId } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Số tiền thanh toán không hợp lệ'
            });
        }
        
        const orderData = {
            amount: amount,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            orderId: orderId, // Pass orderId to use in payment
            extraData: extraData,
            orderGroupId: orderGroupId,
            autoCapture: autoCapture,
            lang: lang,
            partnerName: partnerName,
            storeId: storeId
        };
        
        // PaymentService.createMoMoPayment trả về Promise, cần await và catch reject
        try {
            const result = await PaymentService.createMoMoPayment(orderData);
            
            if (result && result.status === 'OK') {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result || {
                    status: 'ERR',
                    message: 'Không thể tạo thanh toán MoMo'
                });
            }
        } catch (paymentError) {
            // Nếu PaymentService reject, nó sẽ throw error ở đây
            console.error('PaymentService Error:', paymentError);
            return res.status(400).json({
                status: 'ERR',
                message: paymentError.message || paymentError.status || 'Có lỗi xảy ra khi tạo thanh toán MoMo',
                errorCode: paymentError.errorCode,
                subErrors: paymentError.subErrors
            });
        }
    } catch (error) {
        console.error('Create MoMo Payment Controller Error:', error);
        console.error('Error Stack:', error.stack);
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Có lỗi xảy ra khi tạo thanh toán MoMo'
        });
    }
};

const verifyMoMoPayment = async (req, res) => {
    try {
        const queryData = req.query;
        
        const result = await PaymentService.verifyMoMoPayment(queryData);
        
        if (result.status === 'OK') {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Verify MoMo Payment Error:', error);
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Có lỗi xảy ra khi xác thực thanh toán MoMo'
        });
    }
};

const handleMoMoIPN = async (req, res) => {
    try {
        // IPN (Instant Payment Notification) từ MoMo
        const queryData = req.body;
        
        const result = await PaymentService.verifyMoMoPayment(queryData);
        
        // Trả về kết quả cho MoMo (MoMo sẽ gọi lại nếu không nhận được response)
        // Note: Đơn hàng sẽ được tạo từ frontend sau khi verify payment thành công
        // IPN chỉ để xác nhận với MoMo rằng chúng ta đã nhận được thông báo
        if (result.status === 'OK') {
            // Log để tracking (có thể lưu vào database nếu cần)
            console.log('MoMo IPN Success:', result.data);
            
            return res.status(200).json({
                status: 0, // 0 = success cho MoMo
                message: 'Success'
            });
        } else {
            return res.status(200).json({
                status: 1, // 1 = failed cho MoMo
                message: result.message || 'Failed'
            });
        }
    } catch (error) {
        console.error('MoMo IPN Error:', error);
        return res.status(200).json({
            status: 1,
            message: error.message || 'Failed'
        });
    }
};

module.exports = {
    createMoMoPayment,
    verifyMoMoPayment,
    handleMoMoIPN
};

