import axios from "axios"
import { axiosJWT } from "./UserService"
import { getAccessToken } from '../utils/sessionToken'

// API base: ưu tiên env, luôn đảm bảo có tiền tố /api
const RAW_API_BASE = process.env.REACT_APP_API_URL || ""
const NORMALIZED_API_BASE = RAW_API_BASE
    ? (() => {
        const trimmed = RAW_API_BASE.replace(/\/$/, "")
        return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`
      })()
    : ""

const buildUrl = (path) => (NORMALIZED_API_BASE ? `${NORMALIZED_API_BASE}${path}` : `/api${path}`)

export const getAllProduct = async (search, limit, access_token) => {
    // Ưu tiên token truyền vào, fallback token mới nhất trong sessionStorage để đảm bảo quyền admin
    const { getAccessToken } = await import('../utils/sessionToken');
    const storedToken = (() => {
        try {
            const raw = getAccessToken();
            return raw || null;
        } catch (e) {
            return null;
        }
    })();
    const token = access_token || storedToken || null;
    const client = token ? axiosJWT : axios;
    const headers = token ? { token: `Bearer ${token}` } : undefined;

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (token) params.append('includeInactive', 'true'); // admin cần thấy cả sản phẩm tạm dừng

    if (search?.length > 0) {
        const encodedSearch = search.trim();
        params.append('filter', 'name');
        params.append('filter', encodedSearch);
    }

    const queryString = params.toString();
    const url = buildUrl(queryString ? `/product/get-all?${queryString}` : `/product/get-all`);
    const res = await client.get(url, headers ? { headers } : undefined);
    return res.data;
}

export const searchProducts = async (keyword, limit = 10) => {
    if (!keyword || keyword.trim().length === 0) {
        return {
            status: 'OK',
            message: 'SUCCESS',
            data: [],
            total: 0
        };
    }
    
    try {
        const encodedKeyword = encodeURIComponent(keyword.trim());
        const res = await axios.get(buildUrl(`/product/search?keyword=${encodedKeyword}&limit=${limit}`));
        return res.data;
    } catch (error) {
        console.error('Search products error:', error);
        return {
            status: 'ERR',
            message: 'Error searching products',
            data: [],
            total: 0
        };
    }
}

export const searchProductsWithAI = async (keyword, limit = 10) => {
    if (!keyword || keyword.trim().length === 0) {
        return {
            status: 'OK',
            message: 'SUCCESS',
            data: [],
            total: 0,
            originalKeyword: keyword,
            normalizedKeyword: keyword,
            relatedKeywords: []
        };
    }
    
    try {
        const encodedKeyword = encodeURIComponent(keyword.trim());
        const res = await axios.get(buildUrl(`/product/search-ai?keyword=${encodedKeyword}&limit=${limit}`));
        return res.data;
    } catch (error) {
        console.error('Search products with AI error:', error);
        // Fallback về search thông thường nếu AI fail
        return await searchProducts(keyword, limit);
    }
}

// Tìm kiếm sản phẩm với AI normalization (ẩn khỏi user) - endpoint mới
export const searchProductsClean = async (keyword, limit = 20) => {
    if (!keyword || keyword.trim().length === 0) {
        return {
            status: 'OK',
            message: 'SUCCESS',
            data: [],
            total: 0,
            relatedKeywords: []
        };
    }
    
    try {
        const encodedKeyword = encodeURIComponent(keyword.trim());
        const res = await axios.get(buildUrl(`/product/search-products?keyword=${encodedKeyword}&limit=${limit}`));
        return res.data;
    } catch (error) {
        console.error('Search products clean error:', error);
        // Fallback về search thông thường nếu AI fail
        return await searchProducts(keyword, limit);
    }
}

// Tìm kiếm autocomplete nhanh - không dùng AI, chỉ tìm trong name và slug
export const searchProductsAutocomplete = async (keyword, limit = 4) => {
    if (!keyword || keyword.trim().length === 0) {
        return {
            status: 'OK',
            message: 'SUCCESS',
            data: [],
            total: 0
        };
    }
    
    try {
        const encodedKeyword = encodeURIComponent(keyword.trim());
        const res = await axios.get(buildUrl(`/product/search-autocomplete?keyword=${encodedKeyword}&limit=${limit}`));
        return res.data;
    } catch (error) {
        console.error('Search products autocomplete error:', error);
        return {
            status: 'ERR',
            message: 'Error searching products autocomplete',
            data: [],
            total: 0
        };
    }
}

export const getProductType = async (type,page,limit) => {
    if (type ) {
       const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get-all?filter=type&filter=${type}&limit=${limit}&page=${page}`)
        return res.data 
    }
     
   
}




export const createProduct = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/product/create`, data)
    return res.data
}
export const getDetailsProduct = async (id) => {
    // Validate ID trước khi gọi API
    if (!id) {
        throw new Error('Product ID is required');
    }
    
    const trimmedId = String(id).trim();
    
    if (!trimmedId || trimmedId === 'undefined' || trimmedId === 'null') {
        throw new Error('Invalid product ID');
    }
    
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get-details/${encodeURIComponent(trimmedId)}`)
    return res.data
}

export const updateProduct = async (id, access_token, data) => {
    const res = await axiosJWT.put(`${process.env.REACT_APP_API_URL}/product/update/${id}`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}
export const deleteProduct = async (id, access_token) => {
    const res = await axiosJWT.delete(`${process.env.REACT_APP_API_URL}/product/delete/${id}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const deleteManyProduct = async (data, access_token) => {
    const res = await axiosJWT.post(`${process.env.REACT_APP_API_URL}/product/delete-many`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getAllTypeProduct = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get-all-type` )
    return res.data
}

export const getFeaturedProducts = async (limit = 10) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/featured?limit=${limit}`)
    return res.data
}

export const getNewProducts = async (limit = 10) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/new?limit=${limit}`)
    return res.data
}

export const getBestSellingProducts = async (limit = 10) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/best-selling?limit=${limit}`)
    return res.data
}

export const getMostFavoriteProducts = async (limit = 10) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/most-favorite?limit=${limit}`)
    return res.data
}

const resolveAccessToken = (token) => {
    if (token) return token;
    try {
        const raw = getAccessToken();
        return raw || null;
    } catch (e) {
        return null;
    }
};

export const addFavorite = async (id, access_token) => {
    const token = resolveAccessToken(access_token);
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/product/${id}/favorite`,
        {},
        token
            ? {
                  headers: {
                      token: `Bearer ${token}`,
                  },
              }
            : undefined
    );
    return res.data;
};

export const removeFavorite = async (id, access_token) => {
    const token = resolveAccessToken(access_token);
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/product/${id}/favorite`,
        token
            ? {
                  headers: {
                      token: `Bearer ${token}`,
                  },
              }
            : undefined
    );
    return res.data;
};

export const getProductsByCollection = async (slug, limit = 10) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/collection/${slug}?limit=${limit}`)
    return res.data
}

export const getFlashSaleProducts = async (limit = 10, categories = []) => {
    let url = `${process.env.REACT_APP_API_URL}/product/flash-sale?limit=${limit}`;
    if (categories && categories.length) {
        // Normalize categories: accept array of ids or category objects
        const categoriesArr = Array.isArray(categories)
            ? categories.map(c => {
                if (!c && c !== 0) return '';
                if (typeof c === 'object') return (c._id || c.id || '');
                return String(c);
            }).map(s => s && String(s).trim()).filter(Boolean)
            : String(categories).split(',').map(s => s.trim()).filter(Boolean);
        if (categoriesArr.length) {
            const categoriesParam = categoriesArr.join(',');
            console.debug('[ProductService] getFlashSaleProducts categories:', categoriesArr);
            url += `&categories=${encodeURIComponent(categoriesParam)}`;
        }
    }
    console.debug('[ProductService] Fetching flash sale URL:', url);
    const res = await axios.get(url);
    return res.data;
} 

export const getProductsByCategory = async (categoryId, limit = 20, page = 0, sort = null) => {
    if (!categoryId) {
        return {
            status: 'OK',
            message: 'SUCCESS',
            data: [],
            total: 0,
            pageCurrent: 1,
            totalPage: 1
        };
    }

    // Build URL with query parameters
    let url = `${process.env.REACT_APP_API_URL}/product/category/${categoryId}?limit=${limit}&page=${page}`;
    
    // Add sort if provided
    if (sort) {
        const sortParts = sort.startsWith('-') ? [sort.substring(1), '-1'] : [sort, '1'];
        url += `&sort=${sortParts[1]}&sort=${sortParts[0]}`;
    }
    
    try {
        const res = await axios.get(url);
        return res.data;
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return {
            status: 'ERR',
            message: 'Error fetching products',
            data: [],
            total: 0,
            pageCurrent: 1,
            totalPage: 1
        };
    }
}

export const getSearchSuggestions = async (query) => {
    if (!query || query.trim().length === 0) {
        return {
            originalQuery: '',
            normalizedQuery: '',
            suggestions: []
        };
    }
    
    try {
        const encodedQuery = encodeURIComponent(query.trim());
        const res = await axios.get(buildUrl(`/product/search-suggestions?query=${encodedQuery}`));
        return res.data;
    } catch (error) {
        console.error('Get search suggestions error:', error);
        return {
            originalQuery: query,
            normalizedQuery: query,
            suggestions: []
        };
    }
}

// Tìm kiếm sản phẩm bằng hình ảnh
export const generateProductDescriptionAI = async (payload, access_token) => {
    try {
        const res = await axios.post(buildUrl(`/product/ai-description`), payload, {
            headers: access_token ? { token: `Bearer ${access_token}` } : {}
        });
        return res.data;
    } catch (error) {
        console.error('Generate product AI description error:', error);
        return {
            status: 'ERR',
            message: error.response?.data?.message || 'Lỗi khi gợi ý mô tả AI'
        };
    }
}

export const searchProductsByImage = async (imageFile, limit = 20) => {
    if (!imageFile) {
        return {
            status: 'ERR',
            message: 'Vui lòng chọn một file ảnh',
            data: [],
            total: 0
        };
    }

    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const res = await axios.post(buildUrl(`/product/search-by-image?limit=${limit}`), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return res.data;
    } catch (error) {
        console.error('Search products by image error:', error);
        return {
            status: 'ERR',
            message: error.response?.data?.message || 'Lỗi khi tìm kiếm sản phẩm bằng ảnh',
            data: [],
            total: 0
        };
    }
}

