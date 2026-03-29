const ChatService = require('../services/ChatService');

const chatMessage = async (req, res) => {
    try {
        const { message, conversationHistory = [], attachments = [] } = req.body;
        const userId = req.user?.id || null; // Lấy từ JWT middleware nếu có

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Vui lòng nhập câu hỏi'
            });
        }

        console.log('Processing chat message:', { 
            messageLength: message.length, 
            userId: userId ? 'present' : 'null',
            historyLength: conversationHistory.length 
        });

        const result = await ChatService.processChatMessage(
            message.trim(),
            userId,
            conversationHistory,
            attachments
        );

        return res.status(200).json(result);

    } catch (error) {
        console.error('Error in chatMessage:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi xử lý tin nhắn',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const getFAQ = async (req, res) => {
    try {
        return res.status(200).json({
            status: 'OK',
            message: 'SUCCESS',
            data: ChatService.FAQ_DATABASE
        });
    } catch (error) {
        console.error('Error in getFAQ:', error);
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi lấy FAQ'
        });
    }
};

const searchProductsAI = async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Vui lòng nhập từ khóa tìm kiếm'
            });
        }

        const products = await ChatService.searchProducts(query.trim(), parseInt(limit));

        return res.status(200).json({
            status: 'OK',
            message: 'SUCCESS',
            data: products
        });

    } catch (error) {
        console.error('Error in searchProductsAI:', error);
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi tìm kiếm sản phẩm'
        });
    }
};

const recommendProductsAI = async (req, res) => {
    try {
        const { query, limit = 5 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Vui lòng mô tả nhu cầu của bạn'
            });
        }

        const products = await ChatService.recommendProducts(query.trim(), parseInt(limit));

        return res.status(200).json({
            status: 'OK',
            message: 'SUCCESS',
            data: products
        });

    } catch (error) {
        console.error('Error in recommendProductsAI:', error);
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi khi gợi ý sản phẩm'
        });
    }
};

module.exports = {
    chatMessage,
    getFAQ,
    searchProductsAI,
    recommendProductsAI
};

