const { GoogleGenAI } = require('@google/genai');
const Product = require("../models/ProductModel");
const Order = require("../models/OrderProduct");
const Category = require("../models/CategoryModel");
const Promotion = require("../models/PromotionModel");
const Brand = require("../models/BrandModel");
const vietnameseUtils = require("../utils/vietnameseTextUtils");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SKIP_GEMINI_FOR_SEARCH = process.env.SKIP_GEMINI_FOR_SEARCH === 'true';
const SKIP_GEMINI_CHAT_RESPONSE = process.env.SKIP_GEMINI_CHAT_RESPONSE === 'true';

if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: Missing GEMINI_API_KEY in .env");
  console.error("⚠️  Vui lòng thêm GEMINI_API_KEY vào file .env");
} else {
  console.log("✅ Gemini API Key đã được cấu hình");
}

// Khởi tạo Gemini AI client với SDK mới
const genAI = GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

/**
 * Loại bỏ các tiền tố tìm kiếm chung để truy vấn sản phẩm sát nghĩa hơn.
 * Ví dụ: "tìm giày", "cần mua dép", "cho mình hỏi balo" -> "giày", "dép", "balo"
 */
const stripSearchStopwords = (text = "") => {
  if (!text) return "";
  const normalized = vietnameseUtils.normalizeText(text); // không dấu, lowercase
  let cleaned = normalized;

  const prefixes = [
    /^tim(kiem)?\s+/,
    /^mua\s+/,
    /^muon\s+/,
    /^can\s+/,
    /^can\s+mua\s+/,
    /^(toi|tui|minh)\s+(muon|can|tim|mua)\s+/,
    /^cho\s+minh\s+(xin\s+)?/,
    /^xin\s+/,
    /^co\s+/,
    /^hoi\s+/
  ];

  prefixes.forEach((regex) => {
    cleaned = cleaned.replace(regex, "");
  });

  return cleaned.trim();
};

/* ============================================================
   🔥 CALL GEMINI API với fallback models
   Ưu tiên: gemini-2.5-flash (model mới nhất, nhanh nhất, hiệu quả nhất)
   Sử dụng package: @google/genai (SDK mới)
   ============================================================ */
async function callGeminiAPI(prompt) {
  if (!genAI) {
    throw new Error("Gemini API key chưa được cấu hình. Vui lòng kiểm tra file .env");
  }

  // Danh sách models để thử (theo thứ tự ưu tiên)
  // Ưu tiên: gemini-2.5-flash (model mới nhất, nhanh nhất, hiệu quả nhất)
  const modelsToTry = [
    'gemini-2.5-flash',      // Model mới nhất - ưu tiên cao nhất
    'gemini-2.0-flash-exp',  // Model experimental mới
    'gemini-1.5-flash',      // Model nhanh và ổn định       // Model ổn định với chất lượng cao
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      // Sử dụng SDK mới @google/genai với cú pháp đúng
      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt
      });
      
      // Try multiple response shapes returned by SDK
      let text = '';
      try {
        text = response.text || response.response?.text || '';
        // some SDK responses include candidates or output[0].content
        if (!text) {
          if (Array.isArray(response?.candidates) && response.candidates[0]) {
            text = response.candidates[0].content || response.candidates[0].text || '';
          }
        }
        if (!text && response?.output && Array.isArray(response.output) && response.output[0]) {
          const out = response.output[0];
          text = out.content || out.text || (out?.message?.content?.text) || '';
        }
      } catch (e) {
        console.warn('callGeminiAPI: failed to parse response object', e.message || e);
      }

      if (text && text.trim().length > 0) {
        console.log(`✅ Sử dụng model: ${modelName}`);
        // log short preview to help debugging without spamming logs
        console.log('callGeminiAPI: preview ->', (text || '').slice(0, 200).replace(/\n/g, ' '));
        return text.trim();
      } else {
        // log full response when no text found to aid debugging
        console.warn(`callGeminiAPI: no text found in response for model ${modelName}. full response:`, JSON.stringify(response).slice(0, 2000));
      }
    } catch (error) {
      // Log chi tiết lỗi để debug
      const errorMsg = error.message || JSON.stringify(error);
      console.warn(`⚠️  Model ${modelName} không khả dụng:`, errorMsg);
      lastError = error;
      // Tiếp tục thử model tiếp theo
      continue;
    }
  }

  // Nếu tất cả models đều fail, throw error
  console.error("❌ Tất cả models đều không khả dụng");
  throw lastError || new Error("Không thể kết nối với Gemini API. Vui lòng kiểm tra API key và kết nối mạng.");
}
/* ============================================================
   📋 LẤY DANH SÁCH CATEGORIES
   ============================================================ */
const getAvailableCategories = async () => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("name slug")
      .lean();
    return categories.map(cat => cat.name);
  } catch {
    return [];
  }
};

/* ============================================================
   🏷️ LẤY DANH SÁCH BRANDS
   ============================================================ */
const getAvailableBrands = async () => {
  try {
    const brands = await Brand.find({ isActive: true })
      .select("name slug")
      .lean();
    return brands.map(brand => brand.name);
  } catch {
    return [];
  }
};

/* ============================================================
   🎁 LẤY THÔNG TIN PROMOTIONS/SALE
   ============================================================ */
const getActivePromotions = async (limit = 10) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
      .populate('products', 'name price image')
      .populate('categories', 'name')
      .populate('brands', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return promotions.map(p => ({
      name: p.name,
      code: p.code,
      type: p.type,
      value: p.value,
      description: p.description,
      endDate: p.endDate,
      minPurchase: p.minPurchase,
      maxDiscount: p.maxDiscount
    }));
  } catch {
    return [];
  }
};

/* ============================================================
   ⭐ LẤY SẢN PHẨM YÊU THÍCH
   ============================================================ */
const getFavoriteProducts = async (limit = 10) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort({ rating: -1, selled: -1 })
      .limit(limit)
      .select("name image price discount rating slug category brand");
    
    return products
      .map((p) => sanitizeProductForResponse(p))
      .filter(Boolean);
  } catch {
    return [];
  }
};

/* ============================================================
   📂 LẤY SẢN PHẨM THEO CATEGORY
   ============================================================ */
const getProductsByCategory = async (categoryName, limit = 10) => {
  try {
    const category = await Category.findOne({ 
      name: { $regex: categoryName, $options: "i" },
      isActive: true 
    });
    
    if (!category) {
      return [];
    }
    
    const products = await Product.find({
      category: category._id,
      isActive: true
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(limit)
      .select("name image price discount rating slug category brand")
      .sort({ rating: -1, selled: -1 });
    
    return sanitizeProducts(products);
  } catch {
    return [];
  }
};

/* ============================================================
   🏢 LẤY SẢN PHẨM THEO BRAND
   ============================================================ */
const getProductsByBrand = async (brandName, limit = 10) => {
  try {
    const brand = await Brand.findOne({ 
      name: { $regex: brandName, $options: "i" },
      isActive: true 
    });
    
    if (!brand) {
      return [];
    }
    
    const products = await Product.find({
      brand: brand._id,
      isActive: true
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(limit)
      .select("name image price discount rating slug category brand")
      .sort({ rating: -1, selled: -1 });
    
    return sanitizeProducts(products);
  } catch {
    return [];
  }
};

// Sinh gợi ý từ khóa dự phòng theo ngành hàng thời trang của Walkzy
const buildFallbackSuggestionKeywords = (userQuery) => {
  const base = (userQuery || "").trim().toLowerCase();
  const normalized = vietnameseUtils.normalizeText(userQuery || "") || base;
  const keywords = new Set();

  // Thêm từ khóa gốc và đã chuẩn hóa
  if (base) keywords.add(base);
  if (normalized && normalized !== base) keywords.add(normalized);

  // Các ngành hàng của Walkzy (đã chuẩn hóa)
  const walkzyCategories = {
    'giày': ['giày nam', 'giày nữ', 'giày sneaker', 'giày thể thao', 'giày chạy bộ'],
    'dép': ['dép nam', 'dép nữ', 'dép quai ngang', 'dép xỏ ngón'],
    'túi xách': ['túi xách nữ', 'túi xách nam', 'túi đeo chéo', 'túi đeo vai'],
    'balo': ['balo nam', 'balo nữ', 'balo du lịch', 'balo laptop', 'balo học sinh'],
    'ví da': ['ví da nam', 'ví da nữ', 'ví cầm tay', 'ví đeo lưng'],
    'kính mắt': ['kính mắt nam', 'kính mắt nữ', 'kính râm', 'kính cận'],
    'thắt lưng': ['thắt lưng nam', 'thắt lưng nữ', 'thắt lưng da', 'dây nịt']
  };

  // Tìm category phù hợp với từ khóa
  const lowerNormalized = normalized.toLowerCase();
  let matchedCategory = null;
  
  for (const [category, related] of Object.entries(walkzyCategories)) {
    if (lowerNormalized.includes(category) || category.includes(lowerNormalized)) {
      matchedCategory = category;
      // Thêm các từ khóa liên quan
      related.forEach(kw => keywords.add(kw));
      break;
    }
  }

  // Nếu không tìm thấy category phù hợp, thêm một số từ khóa chung
  if (!matchedCategory && normalized) {
    keywords.add(normalized);
    // Thêm các biến thể với "nam", "nữ"
    if (normalized.length > 2) {
      keywords.add(`${normalized} nam`);
      keywords.add(`${normalized} nữ`);
    }
  }

  // Đảm bảo có ít nhất từ khóa gốc
  if (keywords.size === 0 && base) {
    keywords.add(base);
  }

  return Array.from(keywords).filter(Boolean).slice(0, 5);
};

// Chu?n h?a d? li?u s?n ph?m tr? v? cho c?c API AI/Chat
const sanitizeProductForResponse = (product) => {
  if (!product || !product._id || !product.name) {
    return null;
  }

  const basePrice = Number(product.originalPrice || product.price || 0);
  const salePrice = Number(product.price || 0);
  if (!(basePrice > 0 || salePrice > 0)) {
    return null;
  }

  const resolvedOriginalPrice = basePrice > 0 ? basePrice : salePrice;
  const resolvedSalePrice = salePrice > 0 ? salePrice : resolvedOriginalPrice;
  const discountPrice = product.discount
    ? Math.max(resolvedSalePrice * (1 - product.discount / 100), 0)
    : resolvedSalePrice;

  return {
    _id: product._id,
    id: product._id,
    name: product.name,
    image: product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null),
    price: resolvedSalePrice,
    originalPrice: resolvedOriginalPrice,
    discount: product.discount || 0,
    discountPrice,
    brand: product.brand
      ? {
          id: product.brand._id || product.brand.id || product.brand,
          name: product.brand.name || product.brand,
          slug: product.brand.slug
        }
      : null,
    rating: product.rating || 0,
    slug: product.slug,
    category: product.category || null
  };
};

const sanitizeProducts = (products = []) =>
  (products || []).map((p) => sanitizeProductForResponse(p)).filter(Boolean);

/* ============================================================
   🔤 CHUẨN HÓA TỪ KHÓA BẰNG AI (Normalize Keywords)
   Sửa lỗi chính tả, thêm dấu, sinh keywords liên quan
   CHỈ TRẢ VỀ TỪ KHÓA - KHÔNG TẠO SẢN PHẨM MỚI
   ============================================================ */
const normalizeKeywords = async (userQuery) => {
  if (SKIP_GEMINI_FOR_SEARCH || !genAI) {
    if (!genAI) {
      console.warn("⚠️  Gemini API không khả dụng, trả về từ khóa gốc");
    }
    if (SKIP_GEMINI_FOR_SEARCH) {
      console.warn("⚠️  SKIP_GEMINI_FOR_SEARCH=true, bỏ qua normalize bằng Gemini");
    }
    const normalized = vietnameseUtils.normalizeText(userQuery) || (userQuery || '').trim().toLowerCase();
    return {
      normalized: normalized,
      relatedKeywords: buildFallbackSuggestionKeywords(userQuery)
    };
  }

  try {
    // Lấy danh sách categories thực tế từ database
    const availableCategories = await getAvailableCategories();
    const categoriesList = availableCategories.length > 0 
      ? availableCategories.join(", ")
      : "giày, dép, túi xách, balo, ví da, kính mắt, thắt lưng, phụ kiện thời trang";

    const prompt = `Bạn là trợ lý tìm kiếm sản phẩm cho cửa hàng thời trang Walkzy.

CÁC NGÀNH HÀNG CỦA WALKZY (chỉ trả về từ khóa thuộc các ngành hàng này):
- Giày dép: giày, dép, sneaker, giày thể thao, giày chạy bộ, giày cao gót, giày búp bê, giày boot, sandals
- Túi xách: túi xách, túi đeo chéo, túi đeo vai, túi mini, túi tote
- Balo: balo, ba lô, balo du lịch, balo laptop, balo học sinh
- Ví da: ví da, ví nam, ví nữ, ví cầm tay, ví đeo lưng
- Kính mắt: kính mắt, kính râm, kính cận, kính thời trang
- Thắt lưng: thắt lưng, dây nịt, thắt lưng da, thắt lưng nam, thắt lưng nữ
- Phụ kiện: phụ kiện thời trang, mũ, nón, khăn, găng tay

NHIỆM VỤ CỦA BẠN:
1. CHỈ TRẢ VỀ TỪ KHÓA (keywords) để truy vấn database, KHÔNG TẠO SẢN PHẨM MỚI
2. Sửa lỗi chính tả: giay → giày, tui xach → túi xách, balo → balo, vi da → ví da, kinh mat → kính mắt, that lung → thắt lưng
3. Nếu từ khóa không dấu → chuyển thành có dấu đúng (giay → giày, dep → dép)
4. Không phân biệt chữ hoa/chữ thường (tất cả chuyển về chữ thường)
5. Sinh ra TỐI ĐA 5 từ khóa liên quan, sát nghĩa với từ khóa gốc
6. Từ khóa phải đại diện đúng cho các ngành hàng có thật trong Walkzy
7. Nếu từ khóa không thuộc ngành hàng nào của Walkzy → vẫn trả về từ khóa đã chuẩn hóa (để backend tìm kiếm và trả về "không tìm thấy")

VÍ DỤ:
- Input: "giay" → Output: {"normalized": "giày", "relatedKeywords": ["giày nam", "giày nữ", "giày sneaker", "giày thể thao", "giày chạy bộ"]}
- Input: "tui xach" → Output: {"normalized": "túi xách", "relatedKeywords": ["túi xách nữ", "túi xách nam", "túi đeo chéo", "túi đeo vai", "túi mini"]}
- Input: "balo" → Output: {"normalized": "balo", "relatedKeywords": ["balo nam", "balo nữ", "balo du lịch", "balo laptop", "balo học sinh"]}
- Input: "vi da" → Output: {"normalized": "ví da", "relatedKeywords": ["ví da nam", "ví da nữ", "ví cầm tay", "ví đeo lưng", "ví nam"]}

QUAN TRỌNG: 
- Chỉ trả về JSON, không giải thích gì thêm
- Format: {"normalized": "từ khóa đã chuẩn hóa", "relatedKeywords": ["từ1", "từ2", "từ3", "từ4", "từ5"]}
- Tất cả từ khóa phải là chữ thường, có dấu đúng
- Không được trả về danh sách rỗng nếu có thể sinh từ khóa

Từ khóa người dùng: "${(userQuery || '').trim()}"`;

    const text = await callGeminiAPI(prompt);
    
    // Parse JSON response
    let parsed;
    try {
      // Thử parse trực tiếp
      parsed = JSON.parse(text.trim());
    } catch (parseError) {
      // Nếu không parse được, thử extract JSON từ text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Không thể parse JSON từ Gemini response");
      }
    }

    // Validate và normalize
    let normalizedKeyword = (parsed.normalized || userQuery || '').trim().toLowerCase();
    // Đảm bảo có dấu đúng nếu có thể
    normalizedKeyword = vietnameseUtils.normalizeText(normalizedKeyword) || normalizedKeyword;
    
    let relatedKeywords = Array.isArray(parsed.relatedKeywords) 
      ? parsed.relatedKeywords
          .slice(0, 5)
          .filter(k => k && k.trim().length > 0)
          .map(k => k.trim().toLowerCase())
          .map(k => vietnameseUtils.normalizeText(k) || k)
      : [];

    // Nếu không có relatedKeywords từ AI, tạo fallback
    if (relatedKeywords.length === 0) {
      relatedKeywords = buildFallbackSuggestionKeywords(userQuery);
    }

    // Đảm bảo không trả về danh sách rỗng
    if (relatedKeywords.length === 0 && normalizedKeyword) {
      relatedKeywords = [normalizedKeyword];
    }

    return {
      normalized: normalizedKeyword,
      relatedKeywords: relatedKeywords.slice(0, 5) // Đảm bảo tối đa 5 từ khóa
    };

  } catch (error) {
    console.error("❌ Error in normalizeKeywords:", error.message);
    // Fallback: trả về từ khóa gốc đã chuẩn hóa
    const normalized = vietnameseUtils.normalizeText(userQuery) || (userQuery || '').trim().toLowerCase();
    const fallbackKeywords = buildFallbackSuggestionKeywords(userQuery);
    return {
      normalized: normalized,
      relatedKeywords: fallbackKeywords.length > 0 ? fallbackKeywords : [normalized]
    };
  }
};

/* ============================================================
   🔍 TÌM KIẾM SẢN PHẨM - Cải thiện với fallback và gợi ý
   Tìm theo name, description, category, brand
   ============================================================ */
const searchProducts = async (query, limit = 10) => {
  try {
    const ProductService = require('./ProductService');
    const searchResult = await ProductService.searchProducts(query, limit);

    const productsFromService = Array.isArray(searchResult?.data)
      ? searchResult.data
      : Array.isArray(searchResult)
        ? searchResult
        : [];

    const sanitizedProducts = sanitizeProducts(productsFromService).slice(0, limit);

    if (!sanitizedProducts.length) {
      console.warn(`[ChatService] No products matched "${query}" via ProductService.searchProducts`);
    }

    return sanitizedProducts;
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return [];
  }
};
/* ============================================================
   🎯 GỢI Ý SẢN PHẨM - Cải thiện để gợi ý đúng theo từ khóa
   ============================================================ */
const recommendProducts = async (userQuery, limit = 5, availableCategories = []) => {
  try {
    // Nếu không có API key, fallback về tìm kiếm đơn giản
    if (!genAI) {
      console.warn("⚠️  Gemini API không khả dụng, sử dụng tìm kiếm đơn giản");
      return await searchProducts(userQuery, limit);
    }

    // Tạo prompt với thông tin về các danh mục sản phẩm hiện có
    const categoriesInfo = availableCategories.length > 0 
      ? `\nCác danh mục sản phẩm hiện có trong cửa hàng: ${availableCategories.join(", ")}`
      : "";

    const prompt = `
Walkzy là cửa hàng thời trang & phụ kiện nam nữ, bao gồm: giày, dép, túi xách, balo, ví da, kính, thắt lưng và các phụ kiện thời trang khác.
${categoriesInfo}

Hãy phân tích câu hỏi sau và liệt kê TỐI ĐA 5 từ khóa tìm kiếm sản phẩm phù hợp. 
QUAN TRỌNG: Chỉ trả về từ khóa liên quan trực tiếp đến câu hỏi, KHÔNG thêm từ khóa mặc định nếu người dùng không đề cập đến.
Trả về dạng: từ1, từ2, từ3...

Câu hỏi: "${userQuery}"
`.trim();

    const text = await callGeminiAPI(prompt);

    const keywords = text
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
      .slice(0, 3);

    if (keywords.length === 0) {
      // Fallback về tìm kiếm đơn giản nếu không có keywords
      return await searchProducts(userQuery, limit);
    }

    const query = {
      $or: keywords.map((k) => ({
        $or: [
          { name: { $regex: k, $options: "i" } },
          { description: { $regex: k, $options: "i" } }
        ]
      }))
    };

    const recommendedProducts = await Product.find({
      ...query,
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(limit)
      .select("name image price discount rating slug category")
      .sort({ rating: -1, selled: -1 });

    return sanitizeProducts(recommendedProducts);
  } catch (error) {
    console.error("❌ Error in recommendProducts:", error.message);
    // Fallback về tìm kiếm đơn giản khi có lỗi
    return await searchProducts(userQuery, limit);
  }
};

/* ============================================================
   📦 USER ORDERS
   ============================================================ */
const getUserOrders = async (userId, limit = 5) => {
  try {
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return orders.map((o) => ({
      id: o._id,
      status: o.status,
      totalPrice: o.totalPrice,
      itemsCount: o.orderItems.length,
      createdAt: o.createdAt
    }));
  } catch {
    return [];
  }
};

/* ============================================================
   ✔ FAQ DATABASE - Quy trình mua sắm đầy đủ
   ============================================================ */
const FAQ_DATABASE = [
  {
    question: "Làm thế nào để mua hàng?",
    answer: "Quy trình mua hàng tại Walkzy:\n1. Xem sản phẩm: Duyệt danh mục hoặc tìm kiếm sản phẩm\n2. Chọn sản phẩm: Click vào sản phẩm để xem chi tiết\n3. Chọn size/màu/chất liệu: Nếu sản phẩm có nhiều biến thể\n4. Thêm vào giỏ hàng: Click nút 'Thêm vào giỏ'\n5. Thanh toán: Vào giỏ hàng → Chọn địa chỉ giao hàng → Chọn phương thức thanh toán → Xác nhận đơn hàng\n6. Theo dõi đơn hàng: Vào 'Đơn hàng của tôi' để xem trạng thái"
  },
  {
    question: "Làm thế nào để chọn size và màu?",
    answer: "Khi xem chi tiết sản phẩm:\n- Nếu sản phẩm có size: Chọn size từ danh sách (36, 37, 38, 39, 40, 41, 42, 43, 44, 45)\n- Nếu sản phẩm có màu: Chọn màu từ danh sách (Đỏ, Xanh, Đen, Trắng...)\n- Nếu sản phẩm có chất liệu: Chọn chất liệu (Da, Vải, Nhựa...)\n- Sau khi chọn xong, số lượng tồn kho sẽ được cập nhật tự động"
  },
  {
    question: "Làm thế nào để thêm vào giỏ hàng?",
    answer: "Sau khi chọn size/màu/chất liệu (nếu có):\n1. Chọn số lượng muốn mua\n2. Click nút 'Thêm vào giỏ hàng'\n3. Sản phẩm sẽ được thêm vào giỏ hàng của bạn\n4. Bạn có thể tiếp tục mua sắm hoặc vào giỏ hàng để thanh toán"
  },
  {
    question: "Làm thế nào để thanh toán?",
    answer: "Sau khi thêm sản phẩm vào giỏ hàng:\n1. Vào giỏ hàng (icon giỏ hàng ở header)\n2. Kiểm tra lại sản phẩm và số lượng\n3. Click 'Thanh toán'\n4. Điền thông tin giao hàng (tên, địa chỉ, số điện thoại)\n5. Chọn phương thức thanh toán (COD, chuyển khoản, thẻ ngân hàng, ví điện tử)\n6. Áp dụng mã giảm giá (nếu có)\n7. Xác nhận đơn hàng"
  },
  {
    question: "Làm thế nào để theo dõi đơn hàng?",
    answer: "Để theo dõi đơn hàng:\n1. Đăng nhập vào tài khoản\n2. Vào 'Đơn hàng của tôi' (menu tài khoản)\n3. Xem danh sách đơn hàng với các trạng thái:\n   - Chờ xác nhận (pending)\n   - Đã xác nhận (confirmed)\n   - Đang xử lý (processing)\n   - Đang giao hàng (shipped)\n   - Đã giao (delivered)\n   - Hoàn thành (completed)\n4. Click vào đơn hàng để xem chi tiết và mã vận đơn"
  },
  {
    question: "Làm thế nào để hủy đơn hàng?",
    answer: "Để hủy đơn hàng:\n1. Vào 'Đơn hàng của tôi'\n2. Tìm đơn hàng muốn hủy (chỉ có thể hủy đơn ở trạng thái 'Chờ xác nhận' hoặc 'Đã xác nhận')\n3. Click 'Hủy đơn hàng'\n4. Nhập lý do hủy\n5. Xác nhận hủy\nLưu ý: Đơn hàng đã được xử lý hoặc đang giao hàng không thể hủy"
  },
  {
    question: "Làm thế nào để đổi trả hàng?",
    answer: "Để đổi trả hàng:\n1. Vào 'Đơn hàng của tôi'\n2. Chọn đơn hàng đã nhận (trạng thái 'Đã giao' hoặc 'Hoàn thành')\n3. Click 'Yêu cầu đổi trả'\n4. Chọn sản phẩm muốn đổi trả\n5. Nhập lý do đổi trả\n6. Gửi yêu cầu\n7. Chờ xác nhận từ bộ phận CSKH\n8. Gửi hàng về địa chỉ được hướng dẫn\nLưu ý: Chỉ đổi trả trong vòng 7 ngày kể từ ngày nhận hàng"
  },
  {
    question: "Phương thức thanh toán nào được hỗ trợ?",
    answer: "Walkzy hỗ trợ các phương thức thanh toán:\n- COD (Thanh toán khi nhận hàng)\n- Chuyển khoản ngân hàng\n- Thẻ ngân hàng (Visa, Mastercard)\n- Ví điện tử (MoMo, ZaloPay, ShopeePay...)\nBạn có thể chọn phương thức phù hợp khi thanh toán"
  },
  {
    question: "Thời gian giao hàng?",
    answer: "Thời gian giao hàng:\n- Nội thành: 1–2 ngày làm việc\n- Ngoại thành: 2–4 ngày làm việc\n- Tỉnh/thành phố khác: 3–7 ngày làm việc\nThời gian có thể thay đổi tùy theo địa chỉ giao hàng và đơn vị vận chuyển"
  },
  {
    question: "Làm thế nào để sử dụng mã giảm giá?",
    answer: "Để sử dụng mã giảm giá:\n1. Khi thanh toán, tìm ô 'Mã giảm giá' hoặc 'Voucher'\n2. Nhập mã giảm giá\n3. Click 'Áp dụng'\n4. Mã hợp lệ sẽ tự động giảm giá vào tổng tiền\n5. Kiểm tra lại tổng tiền sau khi áp dụng mã\nLưu ý: Mỗi mã có điều kiện sử dụng riêng (giá trị đơn tối thiểu, thời gian hiệu lực...)"
  }
];

/* ============================================================
   🤖 XỬ LÝ CHAT
   ============================================================ */
const dedupeProductsById = (list = []) => {
  const map = new Map();
  (list || []).forEach((item) => {
    const id = item?._id?.toString?.() || item?.id?.toString?.();
    if (id && !map.has(id)) {
      map.set(id, item);
    }
  });
  return Array.from(map.values());
};

const classifyIntent = (rawMessage = "") => {
  const text = vietnameseUtils.normalizeText(rawMessage || "") || (rawMessage || "").toLowerCase();

  // Tu khoa san pham (khong dau)
  const hasProductKeyword = /(giay|dep|tui|balo|vi|that lung|kinh|phu kien|sandal|sneaker|boot)/i.test(text);

  // Uu tien hieu 'san pham dang sale/giam gia' la tim san pham, khong chi tra voucher
  const wantsSaleProducts = /(san pham|sp)/i.test(text) && /(sale|giam|flash)/i.test(text);
  if (wantsSaleProducts) {
    return "search_product";
  }

  if (/(don hang|ma don|order|trang thai|dang giao|van chuyen|ship)/i.test(text)) {
    return "check_order";
  }
  if (/(khuyen mai|voucher|giam|sale|flash)/i.test(text)) {
    return "ask_sale";
  }
  if (/(danh muc|category|loai)/i.test(text)) {
    return "ask_category";
  }
  if (/(thuong hieu|brand|hang|nhan)/i.test(text)) {
    return "ask_brand";
  }
  if (/(yeu thich|ban chay|best seller|hot|pho bien)/i.test(text)) {
    return "ask_favorite";
  }
  if (/(doi tra|huy|chinh sach|bao lau|giao hang|thanh toan|huong dan|quy trinh|dat hang|chon size|cach mua|tra hang)/i.test(text)) {
    return "ask_shopping_process";
  }
  if (/faq/i.test(text)) {
    return "faq";
  }
  if (/(goi y|tu van|recommend|suggest|nen mua|phu hop)/i.test(text)) {
    return "recommend_product";
  }
  if (hasProductKeyword || /(tim|co.*khong|mau|xem|kiem)/i.test(text)) {
    return "search_product";
  }

  return "general";
};

const parseBudgetFromMessage = (raw = "") => {
  if (!raw) return null;
  const text = (vietnameseUtils.normalizeText(raw) || raw).toLowerCase();

  // Regex bắt số tiền:
  // 1. Số + đơn vị tiền tệ rõ ràng: 500k, 1 triệu, 200.000 vnđ
  // 2. Số lớn (>10.000) đứng một mình: 500000, 1000000 (mặc định là VND)
  // Loại trừ trường hợp "size 42", "quan 32" bằng cách fillter unit/context
  
  const matches = text.matchAll(/(\d[\d.,]*)\s*(k|ngan|nghin|trieu|tr|m|trieu dong|ngan dong|vnđ|vnd|đ|d)?/gi);
  
  let bestBudget = null;

  for (const match of matches) {
    let numStr = (match[1] || "").trim();
    // Xóa dấu phân cách hàng nghìn
    numStr = numStr.replace(/(?<=\d)[.,](?=\d{3}(\D|$))/g, "");
    if (numStr.includes(",") && !numStr.match(/\d,\d{3}/)) {
      numStr = numStr.replace(",", ".");
    }

    let value = parseFloat(numStr);
    const unit = (match[2] || "").toLowerCase();

    if (isNaN(value)) continue;

    // Check context xung quanh để tránh bắt nhầm size
    // Lấy đoạn text xung quanh match để kiểm tra từ khóa "size", "kich thuoc", "co"
    const index = match.index || 0;
    const prefix = text.slice(Math.max(0, index - 10), index);
    if (/(size|co|kich thuoc|so)\s*$/.test(prefix) && !unit) {
      // Nếu phía trước có chữ "size" và không có đơn vị tiền tệ -> Bỏ qua (đây là size)
      continue;
    }

    let finalValue = value;
    if (unit.includes("trieu") || unit === "tr" || unit === "m") {
      finalValue *= 1_000_000;
    } else if (unit.includes("k") || unit.includes("ngan") || unit.includes("nghin")) {
      finalValue *= 1_000;
    } else if (!unit) {
      // Không đơn vị:
      // Nếu số nhỏ < 10.000 -> Có thể là size hoặc số lượng -> Bỏ qua
      // Trừ khi nó rất lớn (ví dụ nhập 500000)
      if (value < 10000) {
        continue; 
      }
    }

    // Nếu tìm được một số tiền hợp lệ (> 10k), lấy số đó
    if (finalValue > 10000) {
      bestBudget = Math.round(finalValue);
      // Nếu tìm thấy số tiền rõ ràng, break luôn (ưu tiên số đầu tiên hợp lệ)
      break;
    }
  }

  return bestBudget;
};

const parseBodyProfile = (raw = "") => {
  if (!raw) return {};
  // Loại bỏ dòng chứa giá tiền/tiền tệ để tránh bắt nhầm số từ product snippet
  const scrubbed = (raw || "")
    .split(/\n+/)
    .filter((line) => !/(gia|price|vnd|vnđ|đ|₫)/i.test(line))
    .join(" ");

  const text = (vietnameseUtils.normalizeText(scrubbed) || scrubbed).toLowerCase();

  // Chiều cao: hỗ trợ dạng 175, 1m75, 1.75m, 175cm
  let heightCm = null;
  const mMatch = text.match(/(\d{1}\.\d{2})\s*m/);
  const heightMatch = text.match(/(\d{3})\s*cm/) || text.match(/(\d{3})(?!\d)/);
  const mShort = text.match(/(\d)\s*m\s*(\d{2})/); // 1m75

  if (mMatch) {
    heightCm = Math.round(parseFloat(mMatch[1]) * 100);
  } else if (mShort) {
    heightCm = parseInt(mShort[1]) * 100 + parseInt(mShort[2]);
  } else if (heightMatch) {
    heightCm = parseInt(heightMatch[1]);
  }

  // Cân nặng: dạng 70kg, 70
  let weightKg = null;
  const wMatch = text.match(/(\d{2,3})\s*kg/) || text.match(/(\d{2,3})(?!\d)/);
  if (wMatch) {
    weightKg = parseInt(wMatch[1]);
  }

  // Bối cảnh sử dụng
  let context = null;
  if (/cong so|di lam|office|work/.test(text)) context = "office";
  else if (/tiec|party|dam cuoi|su kien/.test(text)) context = "party";
  else if (/du lich|travel|di choi|phuot/.test(text)) context = "travel";
  else if (/the thao|chay bo|gym|tap/.test(text)) context = "sport";

  return { heightCm, weightKg, context };
};

const parseProductSnippet = (raw = "") => {
  if (!raw) return {};
  const blocks = raw.split(/Sản phẩm\s*\d*:|\bSan pham\s*\d*:/i).map((b) => b.trim()).filter(Boolean);
  const products = blocks.map((block) => {
    const nameMatch = block.match(/Tên:\s*(.+)/i);
    const priceMatch = block.match(/Giá:\s*([0-9\.\,]+)/i);
    const brandMatch = block.match(/Thương hiệu:\s*(.+)/i);
    const categoryMatch = block.match(/Danh mục:\s*(.+)/i);
    const linkMatch = block.match(/Link:\s*(.+)/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/[.,]/g, '')) : null;
    return {
      productName: nameMatch ? nameMatch[1].trim() : null,
      productPrice: price || null,
      productBrand: brandMatch ? brandMatch[1].trim() : null,
      productCategory: categoryMatch ? categoryMatch[1].trim() : null,
      productLink: linkMatch ? linkMatch[1].trim() : null,
    };
  }).filter(p => p.productName);

  if (products.length === 0) return {};
  return {
    productName: products[0].productName,
    productPrice: products[0].productPrice,
    productBrand: products[0].productBrand,
    productCategory: products[0].productCategory,
    productLink: products[0].productLink,
    productsList: products
  };
};

const buildSizeSuggestion = ({ heightCm, weightKg }) => {
  if (!heightCm && !weightKg) return null;
  let size = "39-40";
  if ((heightCm && heightCm >= 180) || (weightKg && weightKg >= 85)) size = "43-44";
  else if ((heightCm && heightCm >= 175) || (weightKg && weightKg >= 75)) size = "42-43";
  else if ((heightCm && heightCm >= 168) || (weightKg && weightKg >= 65)) size = "41-42";
  else if ((heightCm && heightCm >= 160) || (weightKg && weightKg >= 55)) size = "40-41";

  const heightText = heightCm ? `${heightCm}cm` : "";
  const weightText = weightKg ? `${weightKg}kg` : "";
  const hw = [heightText, weightText].filter(Boolean).join(" · ");
  return `Gợi ý size: ${size}${hw ? ` (dựa trên ${hw})` : ""}. Nếu đã quen size thương hiệu khác, bạn cho mình biết để so khớp.`;
};

const mergeProfile = (base = {}, updates = {}) => {
  return {
    heightCm: updates.heightCm || base.heightCm || null,
    weightKg: updates.weightKg || base.weightKg || null,
    context: updates.context || base.context || null
  };
};

const extractProfileFromHistory = (history = []) => {
  const profile = {};
  (history || []).forEach((item) => {
    const parsed = parseBodyProfile(item?.content || "");
    Object.assign(profile, mergeProfile(profile, parsed));
  });
  return profile;
};

const formatCurrencyVN = (amount = 0) => `${Number(amount || 0).toLocaleString('vi-VN')}đ`;

const formatCategoryGroups = (categories = []) => {
  if (!Array.isArray(categories) || categories.length === 0) return "";

  const seen = new Set();
  const normalizedList = (categories || [])
    .filter(Boolean)
    .map((name) => name.trim())
    .filter((name) => {
      const key = (vietnameseUtils.normalizeText(name) || name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((name) => ({
      name,
      norm: vietnameseUtils.normalizeText(name || "").toLowerCase(),
    }));

  const groups = [
    {
      title: "Giày dép",
      match: (norm) => /giay|dep|sandal|sneaker|boot|luoi|the thao/.test(norm),
      items: [],
    },
    {
      title: "Túi / Balo",
      match: (norm) => /tui|balo/.test(norm),
      items: [],
    },
    {
      title: "Phụ kiện",
      match: (norm) => /phu kien|that lung|dong ho|mat kinh|vi|bop/.test(norm),
      items: [],
    },
    {
      title: "Khác",
      match: () => true,
      items: [],
    },
  ];

  const used = new Set();

  normalizedList.forEach(({ name, norm }) => {
    const group = groups.find((g) => g.match(norm)) || groups[groups.length - 1];
    if (!used.has(name)) {
      group.items.push(name);
      used.add(name);
    }
  });

  return groups
    .filter((g) => g.items.length > 0)
    .map((g) => `- ${g.title}: ${g.items.sort().join(', ')}`)
    .join('\n');
};

const findMatchingFAQ = (userMessage = "") => {
  const lower = userMessage.toLowerCase();
  return (
    FAQ_DATABASE.find((faq) => {
      const qLower = faq.question.toLowerCase();
      const shortHead = qLower.slice(0, 20);
      return lower.includes(shortHead) || qLower.split(/\s+/).some((word) => word.length > 3 && lower.includes(word));
    }) || null
  );
};

const searchProductsWithNormalization = async (userQuery, limit = 6, budget = null, forceSale = false) => {
  try {
    const ProductService = require('./ProductService');
    const normalizedQuery = vietnameseUtils.normalizeText(userQuery || "");
    const wantsDiscount = forceSale || /(sale|giam|khuyen|uu dai|flash)/i.test(normalizedQuery);
    const cleanedQuery = stripSearchStopwords(userQuery);
    const finalQuery =
      cleanedQuery && cleanedQuery.length >= 2
        ? cleanedQuery
        : userQuery;

    const searchResult = await ProductService.searchProducts(finalQuery, limit);

    const productsFromService = Array.isArray(searchResult?.data)
      ? searchResult.data
      : Array.isArray(searchResult)
        ? searchResult
        : [];

    let products = sanitizeProducts(productsFromService);

    if (wantsDiscount) {
      const discounted = products.filter((p) => {
        if (!p) return false;
        const hasDiscountField = typeof p.discount === 'number' && p.discount > 0;
        const hasCheaperPrice =
          typeof p.originalPrice === 'number' &&
          typeof p.price === 'number' &&
          p.originalPrice > p.price;
        return hasDiscountField || hasCheaperPrice;
      });
      if (discounted.length > 0) {
        products = discounted;
      }
    }

    if (budget) {
      const priceOf = (p) => {
        const price = Number(p?.price || 0);
        return isNaN(price) ? 0 : price;
      };

      const tiers = [1.1, 1.25, 1.5]; // 10%, 25%, 50% trên ngân sách
      let filtered = [];

      for (const tol of tiers) {
        filtered = products.filter((p) => {
          const price = priceOf(p);
          return price > 0 && price <= budget * tol;
        });
        if (filtered.length) {
          break;
        }
      }

      if (filtered.length) {
        products = filtered.sort(
          (a, b) => Math.abs(priceOf(a) - budget) - Math.abs(priceOf(b) - budget)
        );
      } else {
        // Không có trong ngưỡng 50%: không trả kết quả quá xa ngân sách
        const closest = [...products]
          .filter((p) => priceOf(p) > 0 && priceOf(p) <= budget * 2) // chặn kết quả quá xa
          .sort((a, b) => Math.abs(priceOf(a) - budget) - Math.abs(priceOf(b) - budget));
        products = closest;
      }
    }

    products = products.slice(0, limit);

    const keywords = Array.isArray(searchResult?.relatedKeywords) && searchResult.relatedKeywords.length > 0
      ? searchResult.relatedKeywords
      : [finalQuery || userQuery].filter(Boolean);

    return {
      products,
      keywords,
      cleanedQuery: cleanedQuery || null
    };
  } catch (error) {
    console.error('Error in searchProductsWithNormalization:', error);
    return {
      products: [],
      keywords: [userQuery].filter(Boolean)
    };
  }
};

const buildSystemPrompt = ({
  userMessage,
  intent,
  categories,
  brands,
  products,
  promotions,
  orders,
  history,
  metadata = {}
}) => {
const recentHistory =
  Array.isArray(history) && history.length > 0 ? history.slice(-5) : [];

return `
Bạn là trợ lý bán hàng & CSKH của Walkzy Shop.
Giọng thân thiện như nhân viên Shopee/Lazada, không nhắc tới AI hay kỹ thuật.

Mục tiêu:
- Tư vấn sản phẩm chính xác
- Gợi ý theo nhu cầu / giá / ngữ cảnh
- Hỗ trợ đơn hàng, vận chuyển, đổi trả
Trả lời ngắn gọn, dễ hiểu, không lan man.

Intent hợp lệ:
search_product, recommend_product, check_order, ask_sale,
ask_category, ask_brand, ask_favorite, ask_shopping_process, faq, general.

Mô tả intent:
- search_product: tìm sản phẩm theo từ khóa
- recommend_product: gợi ý theo nhu cầu
- check_order: kiểm tra đơn hàng
- ask_sale: khuyến mãi / voucher
- ask_category: danh mục
- ask_brand: thương hiệu
- ask_favorite: sản phẩm bán chạy / yêu thích
- ask_shopping_process: quy trình mua, đổi trả, giao nhận, thanh toán
- faq: câu hỏi lặp lại
- general: trò chuyện chung

Quy tắc bắt buộc:
1) Không bịa dữ liệu (đơn hàng, tồn kho, giá, khuyến mãi, danh mục, sản phẩm).
2) Nếu thiếu dữ liệu, hỏi lại ngắn gọn để làm rõ.
3) Nếu có products: phần text chỉ 1–2 câu mở đầu (<140 ký tự),
   không mô tả dài; phần chính hiển thị bằng product card.
4) Nếu không có products: trả lời ngắn gọn, đi thẳng vào ý chính.
5) Văn phong: thân thiện, dễ hiểu, tập trung giải quyết nhu cầu.
6) Không nhắc tới AI, model hay kỹ thuật.

Định dạng trả về (JSON):
{
  "text": "Nội dung trả lời ngắn gọn",
  "intent": "intent cuối",
  "products": [],
  "orders": [],
  "promotions": [],
  "metadata": {}
}

Dữ liệu hệ thống hiện có:
- Categories: ${JSON.stringify(categories || [])}
- Brands: ${JSON.stringify(brands || [])}
- Products: ${JSON.stringify(products || [])}
- Promotions: ${JSON.stringify(promotions || [])}
- UserOrders: ${JSON.stringify(orders || [])}
- Metadata: ${JSON.stringify(metadata || {})}
 - Metadata: ${JSON.stringify(metadata || {})}

Tin nhắn người dùng: ${userMessage}
Intent gợi ý: ${intent}
${recentHistory.length ? `Lịch sử gần đây: ${JSON.stringify(recentHistory)}` : ""}

Luôn trả về JSON, dựa hoàn toàn trên dữ liệu trên.
`.trim();
};

const parseGeminiJson = (rawText) => {
  if (!rawText) return {};
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {
        return {};
      }
    }
    return {};
  }
};

const buildFallbackText = ({
  intent,
  userMessage,
  products = [],
  promotions = [],
  categories = [],
  brands = [],
  orders = [],
  faqAnswer = null,
  isAuthenticated = true,
  metadata = {}
}) => {
  switch (intent) {
    case "search_product":
      // Ưu tiên bám ngữ cảnh sản phẩm đính kèm
      if (metadata?.productSnippet?.productName) {
        if (metadata.productSnippet.productsList && metadata.productSnippet.productsList.length >= 2) {
          const [p1, p2] = metadata.productSnippet.productsList.slice(0, 2);
          const name1 = p1.productName;
          const name2 = p2.productName;
          const price1 = p1.productPrice ? formatCurrencyVN(p1.productPrice) : 'N/A';
          const price2 = p2.productPrice ? formatCurrencyVN(p2.productPrice) : 'N/A';
          const conclusion = [
            `- Nếu ưu tiên lịch sự/đi làm → chọn ${name1 || 'SP1'}`,
            `- Nếu ưu tiên thoải mái/đa dụng → chọn ${name2 || 'SP2'}`,
          ].join('\n');
          return [
            `So sánh nhanh 2 sản phẩm:`,
            `• Mục đích: ${name1} phù hợp bối cảnh trang trọng; ${name2} phù hợp casual/đa dụng.`,
            `• Phong cách: ${name1} thiên về ${p1.productCategory || 'phong cách'}; ${name2} thiên về ${p2.productCategory || 'phong cách'}.`,
            `• Giá: ${price1} vs ${price2}.`,
            `• Tiện dụng: xem độ bền/chất liệu và sức chứa (nếu là túi/balo).`,
            `Kết luận:\n${conclusion}`
          ].join('\n');
        }
        const name = metadata.productSnippet.productName;
        const priceHint = metadata.productSnippet.productPrice ? ` (khoảng ${formatCurrencyVN(metadata.productSnippet.productPrice)})` : "";
        const styleHint = metadata?.profile?.context
          ? metadata.profile.context === "office"
            ? "Phong cách đi làm: ưu tiên giày da/loafer, màu trung tính."
            : metadata.profile.context === "party"
              ? "Phong cách tiệc: giày da bóng/loafer, tông đen/nâu."
              : metadata.profile.context === "travel"
                ? "Phong cách du lịch: sneaker êm/thoáng, dễ phối."
                : "Phong cách thể thao: sneaker chạy bộ, thoáng khí."
          : null;
        if (products.length) {
          const p0 = products[0] || {};
          const priceText = p0.price ? `- Giá hiện tại: ${formatCurrencyVN(p0.price)}${p0.originalPrice && p0.originalPrice > p0.price ? ` (giá gốc ${formatCurrencyVN(p0.originalPrice)})` : ""}` : null;
          const sizeTip = metadata?.profile ? buildSizeSuggestion(metadata.profile) : null;
          const colorHint = "- Màu sắc: bạn bấm vào sản phẩm để xem các màu đang có.";
          return [
            `Tư vấn cho “${name}”${priceHint}:`,
            priceText,
            styleHint,
            sizeTip,
            colorHint,
            `Mình gửi ${products.length} lựa chọn phù hợp bên dưới, bạn xem thử nhé.`
          ].filter(Boolean).join("\n");
        }

        return [
          `Đã nhận sản phẩm “${name}”${priceHint}.`,
          styleHint,
          metadata?.profile ? buildSizeSuggestion(metadata.profile) : null,
          `Bạn muốn mình tư vấn size/màu/phong cách cho sản phẩm này hay gợi ý mẫu tương tự (cùng loại/giá gần)?`
        ].filter(Boolean).join("\n");
      }

      if (metadata?.budget) {
        const budgetText = formatCurrencyVN(metadata.budget);
        if (products.length) {
          const minPrice = Math.min(...products.map((p) => Number(p?.price || 0)).filter((v) => v > 0));
          const maxPrice = Math.max(...products.map((p) => Number(p?.price || 0)).filter((v) => v > 0));
          const rangeText = minPrice && maxPrice ? ` (~${formatCurrencyVN(minPrice)} đến ${formatCurrencyVN(maxPrice)})` : "";
          const sizeTip = metadata?.profile ? buildSizeSuggestion(metadata.profile) : null;
          const extra = sizeTip ? `\n${sizeTip}` : "";
          return `Mình tìm được ${products.length} sản phẩm trong tầm khoảng ${budgetText}${rangeText}. Nếu chưa ưng, bạn cho mình biết loại giày (sneaker/da/sandal) hoặc nới ngân sách nhẹ để có thêm lựa chọn.${extra}`;
        }
        return `Mình chưa thấy sản phẩm trong tầm khoảng ${budgetText} (±10–50%). Bạn muốn nới ngân sách thêm chút hoặc đổi phân khúc (ví dụ sneaker/da/sandal) để mình tìm tiếp?`;
      }
      if (products.length) {
        if (metadata?.productSnippet?.productName) {
          const name = metadata.productSnippet.productName;
          const priceHint = metadata.productSnippet.productPrice ? ` (khoảng ${formatCurrencyVN(metadata.productSnippet.productPrice)})` : "";
          const styleHint = metadata?.profile?.context
            ? metadata.profile.context === "office"
              ? "Phong cách đi làm: ưu tiên giày da/loafer, màu trung tính."
              : metadata.profile.context === "party"
                ? "Phong cách tiệc: giày da bóng/loafer, tông đen/nâu."
                : metadata.profile.context === "travel"
                  ? "Phong cách du lịch: sneaker êm/thoáng, dễ phối."
                  : "Phong cách thể thao: sneaker chạy bộ, thoáng khí."
            : null;
          return [
            `Mình tìm được ${products.length} lựa chọn phù hợp với “${name}”${priceHint}. Bạn xem thử nhé:`,
            styleHint
          ].filter(Boolean).join("\n");
        }
        const sizeTip = metadata?.profile ? buildSizeSuggestion(metadata.profile) : null;
        const comboTip = metadata?.profile?.context === "party"
          ? "Gợi ý combo: giày da + thắt lưng cùng tông, có thể thêm ví tối màu."
          : metadata?.profile?.context === "office"
            ? "Gợi ý combo: giày da/loafer + thắt lưng da, màu trung tính dễ phối."
            : metadata?.profile?.context === "travel"
              ? "Gợi ý combo: sneaker nhẹ + vớ thoáng + balo/túi chéo tiện dụng."
              : metadata?.profile?.context === "sport"
                ? "Gợi ý combo: sneaker chạy bộ + vớ thể thao + balo/bao rút gọn."
                : null;
        const extra = [sizeTip, comboTip].filter(Boolean).join("\n");
        return `Mình tìm được ${products.length} sản phẩm khớp với "${userMessage}". Bạn bấm vào sản phẩm để xem chi tiết, hoặc cho mình biết thêm yêu cầu.${extra ? `\n${extra}` : ""}`;
      }
      return `Mình chưa rõ bạn muốn tìm loại gì trong "${userMessage}". Bạn mô tả giúp mình kiểu giày/dép (sneaker, chạy bộ, sandal, da, boot...), khoảng giá/màu/size hoặc bối cảnh (đi làm/tiệc/du lịch) để mình gợi ý chính xác hơn.`;
    case "recommend_product":
      if (products.length) {
        const sizeTip = metadata?.profile ? buildSizeSuggestion(metadata.profile) : null;
        const comboTip = metadata?.profile?.context === "party"
          ? "Combo đề xuất: giày da bóng + thắt lưng cùng màu, phối thêm đồng hồ thanh lịch."
          : metadata?.profile?.context === "office"
            ? "Combo đề xuất: loafer/oxford + thắt lưng da + túi công sở gọn nhẹ."
            : metadata?.profile?.context === "travel"
              ? "Combo đề xuất: sneaker êm + vớ thoáng + balo/túi đeo chéo chống nước."
              : metadata?.profile?.context === "sport"
                ? "Combo đề xuất: sneaker chạy bộ + vớ thể thao + túi/bao rút gọn."
                : null;
        const extra = [sizeTip, comboTip].filter(Boolean).join("\n");
        return `Mình gợi ý ${products.length} mẫu bạn có thể thích. Bạn xem thử nhé!${extra ? `\n${extra}` : ""}`;
      }
      return "Bạn đang tìm phụ kiện nào? (giày, túi, thắt lưng, ví, kính…); nếu có chiều cao/cân nặng/bối cảnh (đi làm/tiệc/du lịch), bạn cho mình biết để gợi ý chuẩn hơn.";
    case "check_order":
      if (!isAuthenticated) {
        return "Bạn cần đăng nhập để xem đơn hàng của mình nhé. Vui lòng đăng nhập hoặc cung cấp mã đơn (ví dụ: #12345) để mình kiểm tra giúp.";
      }

      if (!orders || orders.length === 0) {
        return "Hiện tại bạn chưa có đơn hàng nào. Bạn muốn mình gợi ý sản phẩm để đặt hàng không?";
      }

      // Use the most recent order and present a short, non-sensitive summary
      const latest = orders[0];
      const statusMap = {
        pending: 'đang chờ xác nhận',
        confirmed: 'đã được xác nhận',
        processing: 'đang xử lý',
        shipped: 'đang giao',
        delivered: 'đã giao',
        completed: 'đã hoàn tất',
        cancelled: 'đã bị hủy',
        refunded: 'đã hoàn tiền',
        returned: 'đã trả hàng',
        failed: 'giao hàng thất bại'
      };

      const statusText = statusMap[latest.status] || (latest.status || 'đang xử lý');
      // Short order code to avoid exposing full ObjectId
      const rawId = String(latest.id || latest._id || '');
      const shortId = rawId.replace(/[^0-9a-zA-Z]/g, '').slice(-6) || rawId.slice(0,6);
      const dateText = latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('vi-VN') : '';

      let msg = `Đơn #${shortId} của bạn ${statusText}`;
      if (latest.status === 'shipped') {
        msg += ' Dự kiến nhận trong 1–2 ngày tới nhé!';
      } else if (latest.status === 'delivered' || latest.status === 'completed') {
        msg += ' Đơn hàng đã được giao.';
      } else if (latest.status === 'pending') {
        msg += ' Đang chờ xác nhận. Mình sẽ thông báo khi có cập nhật.';
      } else {
        msg += '.';
      }

      if (dateText) {
        msg += ` (Ngày đặt: ${dateText})`;
      }

      if (orders.length > 1) {
        msg += ` Bạn có ${orders.length} đơn gần đây. Bạn muốn xem chi tiết đơn nào (gõ mã đơn hoặc chọn 'Tra cứu đơn hàng' để xem tất cả)?`;
      }

      return msg;
    case "ask_sale":
      return promotions.length
        ? `Có ${promotions.length} ưu đãi đang hoạt động, bạn muốn dùng mã nào?`
        : "Hiện tại chưa có voucher nào, nhưng bạn có thể xem Flash Sale trong hôm nay!";
    case "ask_category":
      if (!categories.length) {
        return "Mình không tìm thấy danh mục nào trong hệ thống.";
      }
      const grouped = formatCategoryGroups(categories);
      return grouped
        ? `Danh mục hiện có (đã nhóm cho dễ xem):\n${grouped}\nBạn muốn xem danh mục nào?`
        : `Danh mục hiện có: ${categories.join(', ')}. Bạn muốn xem danh mục nào?`;
    case "ask_brand":
      return brands.length
        ? `Thương hiệu hiện có: ${brands.join(', ')}. Bạn muốn xem sản phẩm của thương hiệu nào?`
        : "Mình không tìm thấy thương hiệu nào trong hệ thống.";
    case "ask_favorite":
      return products.length
        ? `Top sản phẩm được yêu thích: ${products.slice(0, 3).map((p) => p.name).join(', ')}. Bạn muốn xem mẫu nào?`
        : "Hiện chưa có danh sách sản phẩm yêu thích.";
    case "ask_shopping_process":
      return faqAnswer
        ? `${faqAnswer.question}: ${faqAnswer.answer}`
        : "Bạn muốn biết bước nào trong quy trình mua hàng, thanh toán, giao nhận hoặc đổi trả?";
    case "faq":
      return faqAnswer
        ? `${faqAnswer.question}: ${faqAnswer.answer}`
        : "Bạn cần hỏi thêm điều gì về chính sách, thanh toán hoặc giao hàng?";
    default:
      return "Xin chào! Mình là trợ lý AI của Walkzy, mình có thể giúp bạn tìm/gợi ý sản phẩm, xem khuyến mãi hoặc kiểm tra đơn hàng.";
  }
};

const buildResponsePayload = ({ text, intent, products = [], promotions = [], orders = [], metadata = {} }) => ({
  status: "OK",
  text,
  message: text,
  intent,
  products: products.map((p) => ({
    id: p._id || p.id,
    name: p.name,
    image: p.image,
    price: p.price,
    discount: p.discount || 0,
    rating: p.rating || 0,
    slug: p.slug
  })),
  orders,
  promotions,
  metadata
});

const processChatMessage = async (message, userId = null, conversationHistory = [], attachments = []) => {
  try {
    const userMessage = (message || "").trim();
    if (!userMessage) {
      return { status: "ERR", message: "Vui lòng nhập câu hỏi" };
    }

    const availableCategories = await getAvailableCategories();
    const availableBrands = await getAvailableBrands();
    const activePromotions = await getActivePromotions(10);

    let intent = classifyIntent(userMessage);
    const budget = parseBudgetFromMessage(userMessage);
    const rememberedProfile = extractProfileFromHistory(conversationHistory);
    const currentProfile = parseBodyProfile(userMessage);
    const profile = mergeProfile(rememberedProfile, currentProfile);
    const productSnippet = parseProductSnippet(userMessage);
    const metadata = {
      intentDetected: intent,
      historyLength: Array.isArray(conversationHistory) ? conversationHistory.length : 0,
      attachments: Array.isArray(attachments) ? attachments.length : 0,
      budget: budget || null,
      profile,
      productSnippet
    };

    let products = [];
    let orders = [];
    let faqAnswer = null;
    let fallbackText = "";

    const recentTexts = (conversationHistory || []).slice(-3).map((m) => (m?.content || "").toLowerCase());
    const historyMentionsSale = recentTexts.some((t) => /(sale|giảm|khuyến mãi|flash)/i.test(t));
    const historyMentionsCategory = recentTexts.some((t) => /(danh mục|category|loại)/i.test(t));

    if (productSnippet?.productName) {
      intent = "search_product";
    }

    if (intent === "search_product") {
      const forceSale = historyMentionsSale && !/(voucher)/i.test(userMessage);
      const searchText = productSnippet?.productName
        ? `${productSnippet.productName} ${productSnippet.productCategory || ''} ${productSnippet.productBrand || ''}`
        : userMessage;
      const { products: foundProducts, keywords } = await searchProductsWithNormalization(searchText, 6, budget, forceSale);
      products = foundProducts;
      metadata.keywords = keywords;
      fallbackText = buildFallbackText({
        intent,
        userMessage: searchText,
        products,
        categories: availableCategories,
        brands: availableBrands,
        metadata
      });
    } else if (intent === "recommend_product") {
      const isGenericRecommend =
        userMessage.split(/\s+/).length <= 2 &&
        !/(giày|dép|túi|tui|balo|ví|thắt lưng|kính|phụ kiện)/i.test(userMessage);

      if (isGenericRecommend) {
        fallbackText = buildFallbackText({ intent, userMessage, products: [], metadata });
      } else {
        const recommended = await recommendProducts(userMessage, 6, availableCategories);
        products = dedupeProductsById(recommended).slice(0, 6);

        if (!products.length) {
          const { products: backupProducts, keywords } = await searchProductsWithNormalization(userMessage, 6);
          products = backupProducts;
          metadata.keywords = keywords;
        }

        fallbackText = buildFallbackText({ intent, userMessage, products, metadata });
      }
    } else if (intent === "check_order") {
      if (!userId) {
        fallbackText = buildFallbackText({ intent, userMessage, orders: [], isAuthenticated: false, metadata });
      } else {
        orders = await getUserOrders(userId);
        fallbackText = buildFallbackText({ intent, userMessage, orders, isAuthenticated: true, metadata });
      }
    } else if (intent === "ask_sale") {
      fallbackText = buildFallbackText({ intent, userMessage, promotions: activePromotions, metadata });
    } else if (intent === "ask_category") {
      fallbackText = buildFallbackText({ intent, userMessage, categories: availableCategories, metadata });
    } else if (intent === "ask_brand") {
      fallbackText = buildFallbackText({ intent, userMessage, brands: availableBrands, metadata });
    } else if (intent === "ask_favorite") {
      products = await getFavoriteProducts(6);
      fallbackText = buildFallbackText({ intent, userMessage, products, metadata });
    } else if (intent === "ask_shopping_process") {
      faqAnswer = findMatchingFAQ(userMessage);
      fallbackText = buildFallbackText({ intent, userMessage, faqAnswer, metadata });
    } else if (intent === "faq") {
      faqAnswer = findMatchingFAQ(userMessage);
      fallbackText = buildFallbackText({ intent, userMessage, faqAnswer, metadata });
    } else {
      const sizeTip = buildSizeSuggestion(profile) || "";
      const contextTip = profile?.context
        ? `Mình sẽ ưu tiên gợi ý phong cách phù hợp bối cảnh: ${profile.context === "office" ? "đi làm" : profile.context === "party" ? "tiệc" : profile.context === "travel" ? "du lịch" : "thể thao"}.`
        : "";
      const ask = "Bạn cho mình biết loại sản phẩm (giày/sandal/da/sneaker...) hoặc tông màu để mình gợi ý nhanh.";
      const extra = [sizeTip, contextTip, ask].filter(Boolean).join(" ");
      fallbackText = extra || "Bạn đang quan tâm sản phẩm nào để mình hỗ trợ?";
    }

    const relevantPromotions = intent === "ask_sale" ? activePromotions : [];

    let aiText = "";
    let aiIntent = intent;
    let aiMetadata = {};

    const shouldUseGenAI =
      genAI &&
      !SKIP_GEMINI_CHAT_RESPONSE &&
      !["search_product", "recommend_product", "ask_category"].includes(intent);

    if (shouldUseGenAI) {
      try {
        const prompt = buildSystemPrompt({
          userMessage,
          intent,
          categories: availableCategories,
          brands: availableBrands,
          products,
          promotions: relevantPromotions,
          orders,
          history: conversationHistory,
          metadata
        });
        const raw = await callGeminiAPI(prompt);
        const parsed = parseGeminiJson(raw);
        aiText = parsed.text || parsed.message || "";
        aiIntent = parsed.intent || intent;
        aiMetadata = parsed.metadata || {};
      } catch (error) {
        console.error("Không thể sinh phản hồi từ Gemini:", error.message);
      }
    }

    const attachmentNote =
      Array.isArray(attachments) && attachments.length > 0
        ? `\n(Mình đã nhận ${attachments.length} ảnh tham chiếu, bạn mô tả thêm nhu cầu để mình gợi ý chuẩn hơn nhé.)`
        : "";

    const finalText = (aiText || fallbackText) + attachmentNote;
    const finalIntent = aiIntent || intent;

    return buildResponsePayload({
      text: finalText,
      intent: finalIntent,
      products,
      promotions: relevantPromotions,
      orders,
      metadata: {
        ...metadata,
        ai: aiMetadata,
        intentBeforeAI: intent
      }
    });
  } catch (error) {
    console.error("Lỗi processChatMessage:", error);
    return {
      status: "ERR",
      message: error.message || "Xin lỗi, mình gặp lỗi khi xử lý câu hỏi. Bạn thử lại sau nhé.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    };
  }
};



/* EXPORT */
module.exports = {
  processChatMessage,
  searchProducts,
  recommendProducts,
  getUserOrders,
  FAQ_DATABASE,
  normalizeKeywords
};
