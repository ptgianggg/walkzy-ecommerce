const ChatService = require('./ChatService');
const vietnameseUtils = require('../utils/vietnameseTextUtils');
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const Brand = require('../models/BrandModel');
const Collection = require('../models/CollectionModel');

/**
 * Hệ thống GỢI Ý TỪ KHÓA TÌM KIẾM (Search Autocomplete) cho website thời trang Walkzy
 * Trả về JSON với danh sách gợi ý từ database thật (Product, Category, Brand, Collection)
 */

// Danh sách các từ khóa bổ sung để tạo gợi ý động (fallback khi không có kết quả từ DB)
const KEYWORD_MODIFIERS = {
  gender: ['nam', 'nữ', 'unisex'],
  purpose: ['đi học', 'đi làm', 'đi chơi', 'chạy bộ', 'đá bóng', 'dự tiệc', 'du lịch', 'thể thao'],
  style: ['thể thao', 'công sở', 'thời trang', 'cao cấp', 'basic', 'sneaker', 'casual'],
  quality: ['rẻ đẹp', 'xịn', 'chính hãng', 'sale', '2025', 'hot', 'trend', 'mới', 'đẹp']
};

/**
 * Chuẩn hóa từ khóa: thêm dấu tiếng Việt, sửa lỗi chính tả
 */
const normalizeQuery = async (query) => {
  if (!query || query.trim().length === 0) {
    return '';
  }

  const trimmedQuery = query.trim().toLowerCase();

  try {
    // Sử dụng ChatService để chuẩn hóa từ khóa với AI
    const { normalized } = await ChatService.normalizeKeywords(trimmedQuery);
    return normalized || trimmedQuery;
  } catch (error) {
    console.error('Error normalizing query with AI, using fallback:', error);
    // Fallback: sử dụng vietnameseUtils
    return vietnameseUtils.normalizeText(trimmedQuery) || trimmedQuery;
  }
};

/**
 * Tìm kiếm từ database: Product, Category, Brand, Collection
 * Tạo các gợi ý kết hợp như "giày đá banh nam", "giày thể thao nam", v.v.
 */
const searchFromDatabase = async (normalizedQuery) => {
  const queryLower = normalizedQuery.toLowerCase().trim();
  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const queryNoDiacritics = vietnameseUtils.removeVietnameseDiacritics(normalizedQuery);
  const escapedQueryNoDiacritics = queryNoDiacritics.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suggestions = [];
  const usedKeywords = new Set();

  try {
    // Tạo regex pattern để match cả có dấu và không dấu
    const regexPattern = escapedQuery;
    const regexPatternNoDiacritics = escapedQueryNoDiacritics;
    
    // Tạo $or condition để tìm cả có dấu và không dấu
    const searchCondition = {
      $or: [
        { name: { $regex: regexPattern, $options: 'i' } },
        { name: { $regex: regexPatternNoDiacritics, $options: 'i' } }
      ]
    };

    // 1. Tìm Products có tên chứa từ khóa (với category và brand)
    const products = await Product.find({
      isActive: true,
      ...searchCondition
    })
      .populate('category', 'name')
      .populate('brand', 'name')
      .select('name category brand')
      .limit(20)
      .lean();

    products.forEach(product => {
      const productName = product.name.trim();
      const productNameLower = productName.toLowerCase();
      const categoryName = product.category?.name?.trim() || '';
      const brandName = product.brand?.name?.trim() || '';

      // Thêm tên sản phẩm gốc
      if (productName && !usedKeywords.has(productNameLower) && suggestions.length < 9) {
        suggestions.push({
          type: 'keyword',
          label: productName,
          keyword: productName,
          source: 'product',
          score: calculateRelevanceScore(productNameLower, queryLower) + 20
        });
        usedKeywords.add(productNameLower);
      }

      // Tạo các gợi ý kết hợp: "từ khóa + category + nam/nữ"
      if (categoryName && productNameLower.includes(queryLower)) {
        // Kiểm tra xem có từ "nam" hoặc "nữ" trong tên không
        const hasGender = productNameLower.includes('nam') || productNameLower.includes('nữ');
        
        if (!hasGender) {
          // Thêm biến thể với "nam"
          const suggestionNam = `${normalizedQuery} ${categoryName.toLowerCase()} nam`;
          const suggestionNamLower = suggestionNam.toLowerCase();
          if (!usedKeywords.has(suggestionNamLower) && suggestions.length < 9) {
            suggestions.push({
              type: 'keyword',
              label: suggestionNam,
              keyword: suggestionNam,
              source: 'product_category',
              score: calculateRelevanceScore(productNameLower, queryLower) + 15
            });
            usedKeywords.add(suggestionNamLower);
          }

          // Thêm biến thể với "nữ"
          const suggestionNu = `${normalizedQuery} ${categoryName.toLowerCase()} nữ`;
          const suggestionNuLower = suggestionNu.toLowerCase();
          if (!usedKeywords.has(suggestionNuLower) && suggestions.length < 9) {
            suggestions.push({
              type: 'keyword',
              label: suggestionNu,
              keyword: suggestionNu,
              source: 'product_category',
              score: calculateRelevanceScore(productNameLower, queryLower) + 15
            });
            usedKeywords.add(suggestionNuLower);
          }
        } else {
          // Nếu đã có giới tính, chỉ thêm category
          const suggestion = `${normalizedQuery} ${categoryName.toLowerCase()}`;
          const suggestionLower = suggestion.toLowerCase();
          if (!usedKeywords.has(suggestionLower) && suggestions.length < 9) {
            suggestions.push({
              type: 'keyword',
              label: suggestion,
              keyword: suggestion,
              source: 'product_category',
              score: calculateRelevanceScore(productNameLower, queryLower) + 15
            });
            usedKeywords.add(suggestionLower);
          }
        }
      }

      // Tạo gợi ý kết hợp với brand: "từ khóa + brand"
      if (brandName && productNameLower.includes(queryLower)) {
        const suggestion = `${normalizedQuery} ${brandName.toLowerCase()}`;
        const suggestionLower = suggestion.toLowerCase();
        if (!usedKeywords.has(suggestionLower) && suggestions.length < 9) {
          suggestions.push({
            type: 'keyword',
            label: suggestion,
            keyword: suggestion,
            source: 'product_brand',
            score: calculateRelevanceScore(productNameLower, queryLower) + 12
          });
          usedKeywords.add(suggestionLower);
        }
      }
    });

    // 2. Tìm Categories có tên chứa từ khóa
    const categories = await Category.find({
      isActive: true,
      ...searchCondition
    })
      .select('name')
      .limit(5)
      .lean();

    categories.forEach(category => {
      const categoryName = category.name.trim();
      const categoryNameLower = categoryName.toLowerCase();
      
      // Thêm category name trực tiếp
      if (categoryName && !usedKeywords.has(categoryNameLower) && suggestions.length < 9) {
        suggestions.push({
          type: 'keyword',
          label: categoryName,
          keyword: categoryName,
          source: 'category',
          score: calculateRelevanceScore(categoryNameLower, queryLower) + 10
        });
        usedKeywords.add(categoryNameLower);
      }

      // Tạo biến thể: "từ khóa + category + nam/nữ"
      if (categoryNameLower !== queryLower) {
        const suggestionNam = `${normalizedQuery} ${categoryNameLower} nam`;
        const suggestionNamLower = suggestionNam.toLowerCase();
        if (!usedKeywords.has(suggestionNamLower) && suggestions.length < 9) {
          suggestions.push({
            type: 'keyword',
            label: suggestionNam,
            keyword: suggestionNam,
            source: 'category',
            score: calculateRelevanceScore(categoryNameLower, queryLower) + 8
          });
          usedKeywords.add(suggestionNamLower);
        }

        const suggestionNu = `${normalizedQuery} ${categoryNameLower} nữ`;
        const suggestionNuLower = suggestionNu.toLowerCase();
        if (!usedKeywords.has(suggestionNuLower) && suggestions.length < 9) {
          suggestions.push({
            type: 'keyword',
            label: suggestionNu,
            keyword: suggestionNu,
            source: 'category',
            score: calculateRelevanceScore(categoryNameLower, queryLower) + 8
          });
          usedKeywords.add(suggestionNuLower);
        }
      }
    });

    // 3. Tìm Brands có tên chứa từ khóa
    const brands = await Brand.find({
      isActive: true,
      ...searchCondition
    })
      .select('name')
      .limit(3)
      .lean();

    brands.forEach(brand => {
      const brandName = brand.name.trim();
      const brandNameLower = brandName.toLowerCase();
      if (brandName && !usedKeywords.has(brandNameLower) && suggestions.length < 9) {
        suggestions.push({
          type: 'keyword',
          label: brandName,
          keyword: brandName,
          source: 'brand',
          score: calculateRelevanceScore(brandNameLower, queryLower) + 10
        });
        usedKeywords.add(brandNameLower);
      }
    });

    // Sắp xếp theo điểm relevance (cao nhất trước)
    suggestions.sort((a, b) => b.score - a.score);

    // Xóa score trước khi trả về
    return suggestions.map(({ score, ...rest }) => rest).slice(0, 9);

  } catch (error) {
    console.error('Error searching from database:', error);
    return [];
  }
};

/**
 * Tính điểm relevance cho từ khóa
 */
const calculateRelevanceScore = (text, query) => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match = điểm cao nhất
  if (textLower === queryLower) {
    return 100;
  }
  // Starts with = điểm cao
  if (textLower.startsWith(queryLower)) {
    return 80;
  }
  // Contains = điểm trung bình
  if (textLower.includes(queryLower)) {
    return 60;
  }
  // Fuzzy match = điểm thấp
  return 40;
};

/**
 * Tạo danh sách gợi ý từ khóa dựa trên từ khóa đã chuẩn hóa và database
 */
const generateSuggestions = async (normalizedQuery) => {
  const suggestions = [];
  const queryLower = normalizedQuery.toLowerCase().trim();
  const usedKeywords = new Set();

  // 1. Luôn có gợi ý "Tìm Shop" đầu tiên
  suggestions.push({
    type: 'shop',
    label: `Tìm Shop "${normalizedQuery}"`,
    keyword: normalizedQuery
  });
  usedKeywords.add(normalizedQuery.toLowerCase());

  // 2. Tìm từ database
  const dbSuggestions = await searchFromDatabase(normalizedQuery);
  
  dbSuggestions.forEach(item => {
    const keywordLower = item.keyword.toLowerCase();
    if (!usedKeywords.has(keywordLower) && suggestions.length < 10) {
      suggestions.push({
        type: item.type,
        label: item.label,
        keyword: item.keyword
      });
      usedKeywords.add(keywordLower);
    }
  });

  // 3. Nếu chưa đủ 5 gợi ý, thêm gợi ý động
  if (suggestions.length < 5) {
    const dynamicSuggestions = generateDynamicSuggestions(normalizedQuery);
    dynamicSuggestions.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (!usedKeywords.has(keywordLower) && suggestions.length < 10) {
        suggestions.push({
          type: 'keyword',
          label: keyword,
          keyword: keyword
        });
        usedKeywords.add(keywordLower);
      }
    });
  }

  // Giới hạn tối đa 10 gợi ý
  return suggestions.slice(0, 10);
};

/**
 * Tạo gợi ý động dựa trên từ khóa
 */
const generateDynamicSuggestions = (normalizedQuery) => {
  const suggestions = [];
  const queryLower = normalizedQuery.toLowerCase().trim();
  const used = new Set();

  // Thêm giới tính (ưu tiên nam, nữ)
  ['nam', 'nữ'].forEach(gender => {
    if (suggestions.length < 9) {
      const keyword = `${normalizedQuery} ${gender}`;
      if (!used.has(keyword.toLowerCase())) {
        suggestions.push(keyword);
        used.add(keyword.toLowerCase());
      }
    }
  });

  // Thêm mục đích (nếu phù hợp)
  if (queryLower.includes('giày') || queryLower.includes('giay') || queryLower.includes('dép') || queryLower.includes('dep')) {
    ['chạy bộ', 'đá bóng', 'thể thao'].forEach(purpose => {
      if (suggestions.length < 9) {
        const keyword = `${normalizedQuery} ${purpose}`;
        if (!used.has(keyword.toLowerCase())) {
          suggestions.push(keyword);
          used.add(keyword.toLowerCase());
        }
      }
    });
  }

  if (queryLower.includes('balo') || queryLower.includes('túi') || queryLower.includes('tui')) {
    ['đi học', 'đi làm', 'du lịch'].forEach(purpose => {
      if (suggestions.length < 9) {
        const keyword = `${normalizedQuery} ${purpose}`;
        if (!used.has(keyword.toLowerCase())) {
          suggestions.push(keyword);
          used.add(keyword.toLowerCase());
        }
      }
    });
  }

  // Thêm phong cách (ưu tiên các style phổ biến)
  ['thể thao', 'sneaker', 'casual'].forEach(style => {
    if (suggestions.length < 9) {
      const keyword = `${normalizedQuery} ${style}`;
      if (!used.has(keyword.toLowerCase())) {
        suggestions.push(keyword);
        used.add(keyword.toLowerCase());
      }
    }
  });

  // Thêm tính chất (ưu tiên hot, sale, đẹp)
  ['hot', 'sale', 'đẹp', '2025'].forEach(quality => {
    if (suggestions.length < 9) {
      const keyword = `${normalizedQuery} ${quality}`;
      if (!used.has(keyword.toLowerCase())) {
        suggestions.push(keyword);
        used.add(keyword.toLowerCase());
      }
    }
  });

  return suggestions.slice(0, 9);
};

/**
 * Service chính: Tạo gợi ý từ khóa tìm kiếm
 * @param {string} currentQuery - Từ khóa người dùng đang nhập
 * @returns {Promise<Object>} - JSON response với suggestions
 */
const getSearchSuggestions = async (currentQuery) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate input
      if (!currentQuery || currentQuery.trim().length === 0) {
        return resolve({
          originalQuery: '',
          normalizedQuery: '',
          suggestions: []
        });
      }

      const originalQuery = currentQuery.trim();
      
      // Chuẩn hóa từ khóa
      const normalizedQuery = await normalizeQuery(originalQuery);

      // Tạo danh sách gợi ý từ database
      const suggestions = await generateSuggestions(normalizedQuery);

      // Trả về JSON theo format yêu cầu
      resolve({
        originalQuery: originalQuery,
        normalizedQuery: normalizedQuery,
        suggestions: suggestions
      });

    } catch (error) {
      console.error('Error in getSearchSuggestions:', error);
      reject(error);
    }
  });
};

module.exports = {
  getSearchSuggestions,
  normalizeQuery,
  generateSuggestions,
  searchFromDatabase
};

