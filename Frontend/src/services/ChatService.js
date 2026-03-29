import axios from "axios";

// Sử dụng baseURL giống như ProductService
// ProductService dùng: `${process.env.REACT_APP_API_URL}/product/get-all`
// Vậy REACT_APP_API_URL có thể là `http://localhost:3001/api` hoặc empty (dùng proxy)
const API_BASE = process.env.REACT_APP_API_URL || "";

// Gửi tin nhắn chat (hỗ trợ đính kèm)
export const sendChatMessage = async (message, conversationHistory = [], token = null, attachments = []) => {
    try {
        const config = token ? {
            headers: {
                token: `Bearer ${token}`
            }
        } : {};

        // Sử dụng endpoint giống pattern của ProductService
        // Nếu API_BASE rỗng thì dùng relative path (proxy sẽ xử lý)
        // Nếu API_BASE có giá trị thì nó đã chứa base URL (có thể có /api hoặc không)
        const endpoint = API_BASE 
            ? `${API_BASE}/chat/message`
            : "/api/chat/message";

        const res = await axios.post(endpoint, {
            message,
            conversationHistory,
            attachments
        }, config);
        
        return res.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        let errorMessage = 'Có lỗi xảy ra khi gửi tin nhắn';
        
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return {
            status: 'ERR',
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
        };
    }
};

// Lấy danh sách FAQ
export const getFAQ = async () => {
    try {
        const endpoint = API_BASE 
            ? `${API_BASE}/chat/faq`
            : "/api/chat/faq";
        const res = await axios.get(endpoint);
        return res.data;
    } catch (error) {
        console.error('Error getting FAQ:', error);
        return {
            status: 'ERR',
            message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy FAQ'
        };
    }
};

// Tìm kiếm sản phẩm bằng AI
export const searchProductsAI = async (query, limit = 10) => {
    try {
        const endpoint = API_BASE 
            ? `${API_BASE}/chat/search-products`
            : "/api/chat/search-products";
        const res = await axios.get(endpoint, {
            params: { query, limit }
        });
        return res.data;
    } catch (error) {
        console.error('Error searching products:', error);
        return {
            status: 'ERR',
            message: error.response?.data?.message || 'Có lỗi xảy ra khi tìm kiếm sản phẩm'
        };
    }
};

// Gợi ý sản phẩm bằng AI
export const recommendProductsAI = async (query, limit = 5) => {
    try {
        const endpoint = API_BASE 
            ? `${API_BASE}/chat/recommend-products`
            : "/api/chat/recommend-products";
        const res = await axios.get(endpoint, {
            params: { query, limit }
        });
        return res.data;
    } catch (error) {
        console.error('Error recommending products:', error);
        return {
            status: 'ERR',
            message: error.response?.data?.message || 'Có lỗi xảy ra khi gợi ý sản phẩm'
        };
    }
};

