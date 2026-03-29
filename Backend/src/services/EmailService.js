const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const https = require('https');
const http = require('http');
const { URL } = require('url');

dotenv.config();

const sendEmailCreateOrder = async (email, orderData) => {
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_ACCOUNT,
                pass: process.env.MAIL_PASSWORD,
            },
        });

        const { orderItems, orderId, totalPrice, itemsPrice, shippingPrice, voucherDiscount, voucherCode, shippingAddress, paymentMethod, createdAt } = orderData;

        // Format date
        const orderDate = createdAt ? new Date(createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : new Date().toLocaleDateString('vi-VN');

        // Format payment method
        const paymentMethodText = paymentMethod === 'paypal' 
            ? 'Thanh toán bằng PayPal' 
            : 'Thanh toán tiền mặt khi nhận hàng';

        // Format price
        const formatPrice = (price) => {
            return new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
            }).format(price);
        };

        const buildCandidateImageUrls = (imageUrl) => {
            if (!imageUrl || typeof imageUrl !== 'string') return [];
            if (/^https?:\/\//i.test(imageUrl)) return [imageUrl];
            if (imageUrl.startsWith('//')) return [`https:${imageUrl}`];

            const bases = [
                process.env.BACKEND_URL,
                process.env.FRONTEND_URL,
                process.env.REACT_APP_URL,
                'http://localhost:3001',
                'http://localhost:3000'
            ]
                .filter(Boolean)
                .map((base) => base.replace(/\/+$/, ''));

            const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
            return bases.map((base) => `${base}${path}`);
        };

        const downloadImage = (url) => {
            return new Promise((resolve, reject) => {
                try {
                    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
                        reject(new Error('Invalid URL format'));
                        return;
                    }
                    const parsedUrl = new URL(url);
                    const protocol = parsedUrl.protocol === 'https:' ? https : http;
                    const request = protocol.get(url, {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    }, (response) => {
                        if (response.statusCode !== 200) {
                            reject(new Error(`Failed to download: ${response.statusCode}`));
                            return;
                        }
                        const chunks = [];
                        response.on('data', (chunk) => chunks.push(chunk));
                        response.on('end', () => resolve(Buffer.concat(chunks)));
                        response.on('error', reject);
                    });
                    request.on('error', reject);
                } catch (error) {
                    reject(error);
                }
            });
        };

        const attachments = [];
        let productsHtml = '';
        
        for (let index = 0; index < orderItems.length; index++) {
            const item = orderItems[index];
            const variationText = item.variation 
                ? `${item.variation.color ? `Màu: ${item.variation.color}` : ''}${item.variation.size ? ` | Size: ${item.variation.size}` : ''}`
                : '';
            
            const imageCid = `product-image-${index}`;
            const candidateImageUrls = buildCandidateImageUrls(item.image);
            let imageSrc;

            let downloaded = false;
            for (const url of candidateImageUrls) {
                try {
                    const imageBuffer = await downloadImage(url);
                    attachments.push({
                        filename: `product-${index}.jpg`,
                        content: imageBuffer,
                        cid: imageCid
                    });
                    imageSrc = `cid:${imageCid}`;
                    downloaded = true;
                    break;
                } catch (error) {}
            }
            if (!downloaded) {
                const svgPlaceholder = `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="10" fill="#999" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`;
                imageSrc = `data:image/svg+xml;base64,${Buffer.from(svgPlaceholder).toString('base64')}`;
            }
            
            productsHtml += `
                <tr style="border-bottom: 1px solid #e8e8e8;">
                    <td style="padding: 16px; text-align: center;">
                        <img src="${imageSrc}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e8e8e8; display: block;" />
                    </td>
                    <td style="padding: 16px;">
                        <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 4px; font-size: 15px;">${item.name}</div>
                        ${variationText ? `<div style="color: #666; font-size: 13px; margin-top: 4px;">${variationText}</div>` : ''}
                    </td>
                    <td style="padding: 16px; text-align: center; color: #666;">${item.amount}</td>
                    <td style="padding: 16px; text-align: right; font-weight: 600; color: #1a1a1a;">${formatPrice(item.price)}</td>
                    <td style="padding: 16px; text-align: right; font-weight: 700; color: #ee4d2d; font-size: 15px;">${formatPrice(item.price * item.amount)}</td>
                </tr>
            `;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #1a94ff 0%, #0d7ae6 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">
                            ${orderData.isPaymentSuccess ? '🎉 Đặt hàng thành công!' : '🛒 Đơn hàng đã được nhận'}
                        </h1>
                    </div>
                    <div style="padding: 24px 20px; background-color: #fafafa; border-bottom: 1px solid #e8e8e8;">
                        <p>Mã đơn hàng: <strong>${orderId ? orderId.slice(-8).toUpperCase() : 'N/A'}</strong></p>
                        <p>Ngày đặt: ${orderDate}</p>
                    </div>
                    <div style="padding: 20px; border-bottom: 1px solid #e8e8e8;">
                        <h3>📍 Địa chỉ giao hàng</h3>
                        <p>${shippingAddress?.fullName}<br/>${shippingAddress?.address} ${shippingAddress?.city}<br/>ĐT: ${shippingAddress?.phone}</p>
                    </div>
                    <div style="padding: 20px; border-bottom: 1px solid #e8e8e8;">
                        <h3>💳 Phương thức thanh toán</h3>
                        <p>${paymentMethodText}</p>
                    </div>
                    <div style="padding: 20px;">
                        <h3>Sản phẩm</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${productsHtml}
                        </table>
                    </div>
                    <div style="padding: 20px; background-color: #fafafa; border-top: 2px solid #e8e8e8;">
                        <p>Tạm tính: ${formatPrice(itemsPrice || 0)}</p>
                        <p>Phí ship: ${formatPrice(shippingPrice || 0)}</p>
                        ${voucherDiscount > 0 ? `<p>Giảm giá: -${formatPrice(voucherDiscount)}</p>` : ''}
                        <h3>Tổng cộng: <span style="color: #ee4d2d;">${formatPrice(totalPrice || 0)}</span></h3>
                    </div>
                    <div style="padding: 24px 20px; text-align: center;">
                        <a href="${process.env.REACT_APP_URL || 'http://localhost:3000'}/my-order" style="background: #1a94ff; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 8px;">Xem đơn hàng</a>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: `"WALKZY Shop" <${process.env.MAIL_ACCOUNT}>`,
            to: email,
            subject: orderData.isPaymentSuccess 
                ? `🎉 Đặt hàng thành công - Mã đơn: ${orderId ? orderId.slice(-8).toUpperCase() : ''}`
                : `🛒 Đơn hàng đã được nhận - Mã đơn: ${orderId ? orderId.slice(-8).toUpperCase() : ''}`,
            html: htmlContent,
            attachments: attachments,
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

const sendPromotionEmail = async (email, promotionName, code, value, type, description, endDate) => {
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_ACCOUNT,
                pass: process.env.MAIL_PASSWORD,
            },
        });
        const discountText = type === 'percentage' ? `Giảm ${value}%` : `Giảm ${value.toLocaleString()} VNĐ`;
        const htmlContent = `<div style="font-family: Arial, sans-serif;"><h2>🎉 Khuyến mãi mới: ${promotionName}</h2><p>${description}</p><p>Mã: <strong>${code}</strong> (${discountText})</p></div>`;
        await transporter.sendMail({ from: process.env.MAIL_ACCOUNT, to: email, subject: `🎁 Khuyến mãi mới từ WALKZY`, html: htmlContent });
        return { success: true };
    } catch (error) { throw error; }
};

const sendGenericNotificationEmail = async (email, subject, htmlContent) => {
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_ACCOUNT,
                pass: process.env.MAIL_PASSWORD,
            },
        });
        await transporter.sendMail({ from: process.env.MAIL_ACCOUNT, to: email, subject: subject, html: htmlContent });
        return { success: true };
    } catch (error) { throw error; }
};

const sendEmailAwaitingPayment = async (email, orderData) => {
    try {
        let transporter = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: process.env.MAIL_ACCOUNT, pass: process.env.MAIL_PASSWORD } });
        const { orderId, totalPrice, paymentExpiredAt } = orderData;
        const expiryDate = new Date(paymentExpiredAt).toLocaleString('vi-VN');
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 8px;">
                <h2 style="color: #ee4d2d;">⏳ Chờ thanh toán</h2>
                <p>Đơn hàng <strong>#${orderId.slice(-8).toUpperCase()}</strong> đang chờ thanh toán.</p>
                <p>Tổng tiền: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</strong></p>
                <p>Hạn thanh toán: <strong>${expiryDate}</strong></p>
                <p><i>Sau thời gian này đơn hàng sẽ tự động bị hủy.</i></p>
                <div style="text-align: center; margin: 20px;">
                    <a href="${process.env.REACT_APP_URL || 'http://localhost:3000'}/my-order" style="background: #ee4d2d; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Thanh toán ngay</a>
                </div>
            </div>`;
        await transporter.sendMail({ from: `"WALKZY Shop" <${process.env.MAIL_ACCOUNT}>`, to: email, subject: `⏳ Đơn hàng #${orderId.slice(-8).toUpperCase()} chờ thanh toán`, html: htmlContent });
        return { success: true };
    } catch (error) { throw error; }
};

const sendEmailPaymentSuccess = async (email, orderData) => {
    return await sendEmailCreateOrder(email, { ...orderData, isPaymentSuccess: true });
};

const sendEmailOrderExpired = async (email, orderData) => {
    try {
        let transporter = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: process.env.MAIL_ACCOUNT, pass: process.env.MAIL_PASSWORD } });
        const { orderId } = orderData;
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 8px;">
                <h2 style="color: #666;">🚫 Đơn hàng đã bị hủy</h2>
                <p>Đơn hàng <strong>#${orderId.slice(-8).toUpperCase()}</strong> đã bị hủy do quá thời gian thanh toán.</p>
                <p>Lý do: PAYMENT_TIMEOUT</p>
            </div>`;
        await transporter.sendMail({ from: `"WALKZY Shop" <${process.env.MAIL_ACCOUNT}>`, to: email, subject: `🚫 Đơn hàng #${orderId.slice(-8).toUpperCase()} đã bị hủy`, html: htmlContent });
        return { success: true };
    } catch (error) { throw error; }
};

module.exports = {
    sendEmailCreateOrder,
    sendPromotionEmail,
    sendGenericNotificationEmail,
    sendEmailAwaitingPayment,
    sendEmailPaymentSuccess,
    sendEmailOrderExpired
}
