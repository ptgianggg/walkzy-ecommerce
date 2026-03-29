
const { response } = require('express')
const ProductService = require('../services/ProductService')
const GeminiVisionService = require('../services/GeminiVisionService')
const ProductAISuggestionService = require('../services/ProductAISuggestionService')


const createProduct = async (req, res) => {

  try {
    const normalizeBoolean = (value, defaultValue = false) => {
      if (value === undefined || value === null) return defaultValue;
      return value === true || value === 'true' || value === 1 || value === '1';
    };

    const { name, image, images, type, countInStock, price, rating, description, discount, hasVariations, variations } = req.body;

    // Validate các trường bắt buộc
    if (!name || !price) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Tên và giá sản phẩm là bắt buộc',
      });
    }

    // Validate category: must provide a subcategory (child category)
    const Category = require('../models/CategoryModel');
    const categoryId = req.body.category;
    if (!categoryId) {
      return res.status(400).json({ status: 'ERR', message: 'Danh mục con (category) là bắt buộc' });
    }

    const foundCategory = await Category.findById(categoryId).lean();
    if (!foundCategory) {
      return res.status(400).json({ status: 'ERR', message: 'Danh mục được chọn không tồn tại' });
    }

    if (!foundCategory.parentCategory) {
      return res.status(400).json({ status: 'ERR', message: 'Sản phẩm phải được tạo trong danh mục con' });
    }

    // Nếu không có variations, cần có image và countInStock
    if (!hasVariations && (!image && (!images || images.length === 0))) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Sản phẩm cần có ít nhất một hình ảnh',
      });
    }

    // Nếu không có variations, cần có countInStock
    if (!hasVariations && (countInStock === undefined || countInStock === null)) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Sản phẩm không có variations cần có số lượng tồn kho',
      });
    }

    // Đồng bộ trạng thái sản phẩm và flag variations
    req.body.isActive = normalizeBoolean(req.body.isActive, true);
    req.body.hasVariations = normalizeBoolean(req.body.hasVariations, false);

    const result = await ProductService.createProduct(req.body);
    return res.status(200).json(result)

  } catch (e) {
    console.error('Error in createProduct:', e);
    return res.status(404).json({
      status: 'ERR',
      message: e.message || 'Lỗi khi tạo sản phẩm'
    })
  }
}

const updateProduct = async (req, res) => {

  try {
    const normalizeBoolean = (value, defaultValue = false) => {
      if (value === undefined || value === null) return defaultValue;
      return value === true || value === 'true' || value === 1 || value === '1';
    };

    const productId = req.params.id
    const data = req.body
    if (!productId) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'The productId is required'
      })
    }

    // Get old product data for logging
    const Product = require('../models/ProductModel');
    const oldProduct = await Product.findById(productId).lean();

    // Đồng bộ trạng thái để tránh lưu sai kiểu
    if (data.hasOwnProperty('isActive')) {
      data.isActive = normalizeBoolean(data.isActive, oldProduct?.isActive ?? true);
    }
    if (data.hasOwnProperty('hasVariations')) {
      data.hasVariations = normalizeBoolean(data.hasVariations, oldProduct?.hasVariations ?? false);
    }

    const result = await ProductService.updateProduct(productId, data);
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}
const getDetailProduct = async (req, res) => {

  try {
    const productId = req.params.id

    if (!productId) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'The productId is required'
      })
    }

    const result = await ProductService.getDetailProduct(productId);

    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}
const deleteProduct = async (req, res) => {

  try {
    const productId = req.params.id

    if (!productId) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'The productId is required'
      })
    }

    // Get product data before deletion for logging
    const Product = require('../models/ProductModel');
    const productToDelete = await Product.findById(productId).lean();

    const result = await ProductService.deleteProduct(productId);
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}

const deleteMany = async (req, res) => {
  console.log('req', req.body)

  try {
    const ids = req.body.ids

    if (!ids) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'The ids is required'
      })
    }

    // Get products data before deletion for logging
    const Product = require('../models/ProductModel');
    const productsToDelete = await Product.find({ _id: { $in: ids } }).lean();

    const result = await ProductService.deleteManyProduct(ids);
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}

const generateProductAIDescription = async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await ProductAISuggestionService.generateProductDescription(payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in generateProductAIDescription:', error);
    return res.status(500).json({
      status: 'ERR',
      message: error.message || 'Khong the tao goi y mo ta san pham'
    });
  }
};




const getAllProduct = async (req, res) => {
  try {
    const { limit, page, sort, filter, includeInactive: includeInactiveQuery } = req.query
    const requestedIncludeInactive = ['true', '1', 'yes', 'on'].includes(String(includeInactiveQuery || '').toLowerCase());
    const includeInactive = req.user?.isAdmin === true 
  ? requestedIncludeInactive 
  : false;

    
    // Xử lý filter: có thể là string hoặc array
    // Khi gọi filter=name&filter=value, Express sẽ parse thành array ['name', 'value']
    let filterArray = filter;
    if (filter && !Array.isArray(filter)) {
      // Nếu filter là string, giữ nguyên (có thể là single value)
      filterArray = filter;
    } else if (Array.isArray(filter) && filter.length >= 2) {
      // Nếu filter là array, sử dụng trực tiếp
      filterArray = filter;
    }
    
    const result = await ProductService.getAllProduct(
      Number(limit) || null,
      Number(page) || 0,
      sort,
      filterArray,
      { includeInactive }
    )
    return res.status(200).json(result)
  } catch (e) {
    console.error('Error in getAllProduct controller:', e);
    return res.status(500).json({
      status: 'ERR',
      message: e.message || 'Error getting products'
    })
  }
}

const searchProducts = async (req, res) => {
  try {
    const { keyword, limit = 10 } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(200).json({
        status: 'OK',
        message: 'SUCCESS',
        data: [],
        total: 0
      });
    }

    // Sử dụng getAllProduct với filter name
    const filter = ['name', keyword.trim()];
    console.log(`[SearchProducts] Searching for keyword: "${keyword.trim()}"`);
    
    const result = await ProductService.getAllProduct(Number(limit) || 10, 0, null, filter);
    
    console.log(`[SearchProducts] Found ${result?.data?.length || 0} products`);
    
    // Đảm bảo result có format đúng và data là array
    if (result && result.data && Array.isArray(result.data)) {
      // Sanitize products để đảm bảo có name và image
      const sanitizedData = result.data
        .filter(product => {
          const isValid = product && product._id;
          if (!isValid) {
            console.log(`[SearchProducts] Filtered out invalid product:`, product);
          }
          return isValid;
        })
        .map(product => {
          const sanitized = {
            ...product,
            name: product.name || 'Sản phẩm không tên',
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null)
          };
          
          if (!sanitized.name || sanitized.name === 'Sản phẩm không tên') {
            console.log(`[SearchProducts] Product missing name:`, product._id);
          }
          if (!sanitized.image) {
            console.log(`[SearchProducts] Product missing image:`, product._id, product.name);
          }
          
          return sanitized;
        });
      
      console.log(`[SearchProducts] Returning ${sanitizedData.length} sanitized products`);
      
      return res.status(200).json({
        ...result,
        data: sanitizedData,
        total: sanitizedData.length
      });
    }
    
    console.log(`[SearchProducts] No valid result, returning empty array`);
    return res.status(200).json(result || { status: 'OK', message: 'SUCCESS', data: [], total: 0 });
  } catch (e) {
    console.error('[SearchProducts] Error in searchProducts controller:', e);
    console.error('[SearchProducts] Error stack:', e.stack);
    return res.status(500).json({
      status: 'ERR',
      message: e.message || 'Error searching products'
    });
  }
}

const searchProductsWithAI = async (req, res) => {
  try {
    const { keyword, limit = 10 } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(200).json({
        status: 'OK',
        message: 'SUCCESS',
        data: [],
        total: 0
      });
    }

    const result = await ProductService.searchProductsWithAI(keyword.trim(), Number(limit) || 10);
    
    return res.status(200).json(result);
  } catch (e) {
    console.error('Error in searchProductsWithAI:', e);
    return res.status(500).json({
      status: 'ERR',
      message: e.message || 'Error searching products with AI'
    });
  }
}

// Endpoint mới: /search-products - tìm kiếm với AI normalization (ẩn khỏi user)
const searchProductsWithAIClean = async (req, res) => {
  try {
    const { keyword, limit = 20 } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(200).json({
        status: 'OK',
        message: 'SUCCESS',
        data: [],
        total: 0,
        relatedKeywords: []
      });
    }

    const result = await ProductService.searchProducts(keyword.trim(), Number(limit) || 20);
    
    return res.status(200).json(result);
  } catch (e) {
    console.error('Error in searchProductsWithAIClean:', e);
    return res.status(500).json({
      status: 'ERR',
      message: e.message || 'Error searching products',
      data: [],
      total: 0,
      relatedKeywords: []
    });
  }
}

// Endpoint autocomplete nhanh - không dùng AI, chỉ tìm trong name và slug
const searchProductsAutocomplete = async (req, res) => {
  try {
    const { keyword, limit = 4 } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(200).json({
        status: 'OK',
        message: 'SUCCESS',
        data: [],
        total: 0
      });
    }

    const result = await ProductService.searchProductsAutocomplete(keyword.trim(), Number(limit) || 4);
    
    return res.status(200).json(result);
  } catch (e) {
    console.error('Error in searchProductsAutocomplete:', e);
    return res.status(500).json({
      status: 'ERR',
      message: e.message || 'Error searching products autocomplete',
      data: [],
      total: 0
    });
  }
}

const getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Validate input
    if (!query || query.trim().length === 0) {
      return res.status(200).json({
        originalQuery: '',
        normalizedQuery: '',
        suggestions: []
      });
    }

    const SearchSuggestionService = require('../services/SearchSuggestionService');
    const result = await SearchSuggestionService.getSearchSuggestions(query.trim());
    
    // Trả về JSON thuần, không wrap trong status/message
    return res.status(200).json(result);
  } catch (e) {
    console.error('Error in getSearchSuggestions:', e);
    return res.status(500).json({
      originalQuery: req.query.query || '',
      normalizedQuery: '',
      suggestions: []
    });
  }
}



const getAllType = async (req, res) => {

  try {
    const result = await ProductService.getAllType()
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}

const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await ProductService.getFeaturedProducts(parseInt(limit));
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

const getNewProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await ProductService.getNewProducts(parseInt(limit));
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

const getBestSellingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await ProductService.getBestSellingProducts(parseInt(limit));
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

const getProductsByCollection = async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 10 } = req.query;
    const result = await ProductService.getProductsByCollection(slug, parseInt(limit));
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

const getMostFavoriteProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await ProductService.getMostFavoriteProducts(parseInt(limit));
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

const addFavorite = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user?.id || req.user?._id;

    if (!productId || !userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'productId và userId là bắt buộc'
      });
    }

    const result = await ProductService.addFavorite(productId, userId);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user?.id || req.user?._id;

    if (!productId || !userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'productId và userId là bắt buộc'
      });
    }

    const result = await ProductService.removeFavorite(productId, userId);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

const getFlashSaleProducts = async (req, res) => {
  try {
    const { limit = 10, categories } = req.query;
    const result = await ProductService.getFlashSaleProducts(parseInt(limit), categories || null);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, page = 0, sort } = req.query;
    
    if (!id) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Category ID is required'
      });
    }
    
    // Parse sort parameter
    let sortParam = null;
    if (sort) {
      // Handle sort format: "sort=-1&sort=createdAt" or "sort=1&sort=price"
      const sortArray = Array.isArray(sort) ? sort : [sort];
      if (sortArray.length === 2) {
        sortParam = sortArray[0] === '-1' || sortArray[0] === '-1' 
          ? `-${sortArray[1]}` 
          : sortArray[1];
      } else if (sortArray.length === 1) {
        sortParam = sortArray[0];
      }
    }
    
    const result = await ProductService.getProductsByCategory(
      id, 
      parseInt(limit), 
      parseInt(page), 
      sortParam
    );
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

/**
 * Tìm kiếm sản phẩm bằng hình ảnh
 * Upload ảnh → Phân tích bằng Gemini Vision → Tìm sản phẩm tương tự (dựa trên relevance)
 */
const searchProductsByImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Vui lòng upload một file ảnh.'
      });
    }

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    console.log('[SearchByImage] Starting image analysis...');

    // AI phân tích ảnh → trả về mô tả có cấu trúc
    let descriptionData;
    try {
      descriptionData = await GeminiVisionService.analyzeImageForProductSearch(
        imageBuffer,
        mimeType
      );
      console.log('[SearchByImage] Image description data:', descriptionData);
    } catch (geminiError) {
      console.error('[SearchByImage] Gemini API error:', geminiError.message);
      return res.status(400).json({
        status: 'ERR',
        message: geminiError.message || 'Không thể phân tích ảnh. Vui lòng thử lại.'
      });
    }

    // Lấy searchDescription (chỉ phần 1 và 2) để tìm kiếm
    const searchDescription = descriptionData.searchDescription || descriptionData.fullDescription || '';
    
    // Tìm sản phẩm tương tự dựa trên mô tả search (chỉ phần 1 và 2)
    console.log('[SearchByImage] Searching similar products with:', searchDescription);
    const result = await ProductService.searchProductsByImageDescription(
      searchDescription,
      limit
    );

    console.log('[SearchByImage] Found', result.data.length, 'similar products');

    // Trả về mô tả sạch (chỉ phần 1 và 2) cho thanh tìm kiếm
    const cleanSearchText = searchDescription;

    return res.status(200).json({
      status: result.status,
      message: result.message,
      imageDescription: descriptionData.fullDescription, // Mô tả đầy đủ (để hiển thị)
      searchText: cleanSearchText, // Mô tả sạch cho thanh tìm kiếm (chỉ phần 1 và 2)
      productType: descriptionData.productType,
      importantAttributes: descriptionData.importantAttributes,
      secondaryAttributes: descriptionData.secondaryAttributes,
      data: result.data,
      total: result.total
    });
  } catch (error) {
    console.error('[SearchByImage] Error:', error);
    console.error('[SearchByImage] Error stack:', error.stack);
    return res.status(500).json({
      status: 'ERR',
      message: error.message || 'Lỗi khi tìm kiếm bằng ảnh'
    });
  }
};




const getFavoriteProducts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ status: 'ERR', message: 'User must be logged in' });
    }
    const { limit, page } = req.query;
    const result = await ProductService.getFavoriteProducts(userId, Number(limit) || 50, Number(page) || 0);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(404).json({ message: e });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getDetailProduct,
  deleteProduct,
  getAllProduct,
  deleteMany,
  getAllType,
  getFeaturedProducts,
  getNewProducts,
  getBestSellingProducts,
  getProductsByCollection,
  getMostFavoriteProducts,
  getFlashSaleProducts,
  getProductsByCategory,
  addFavorite,
  removeFavorite,
  searchProducts,
  searchProductsWithAI,
  searchProductsWithAIClean,
  searchProductsAutocomplete,
  getSearchSuggestions,
  searchProductsByImage,
  generateProductAIDescription,
  getFavoriteProducts
}
