const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Kiểm tra API key
if (!process.env.GEMINI_API_KEY) {
  console.error('[GeminiVision] WARNING: GEMINI_API_KEY is not set in .env file!');
}

// Khởi tạo Gemini AI với SDK chuẩn
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeImageForProductSearch = async (imageBuffer, mimeType) => {
  try {
    // Kiểm tra API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY chưa được cấu hình. Vui lòng kiểm tra file .env');
    }

    // Kiểm tra image buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Ảnh không hợp lệ hoặc rỗng');
    }

    // Convert buffer thành base64
    const base64Image = imageBuffer.toString('base64');
    
    if (!base64Image || base64Image.length === 0) {
      throw new Error('Không thể chuyển đổi ảnh sang base64');
    }

    // Prompt để Gemini phân tích ảnh và mô tả sản phẩm - tách thành 3 phần rõ ràng, NGẮN GỌN
    const prompt = `Bạn là một chuyên gia phân tích sản phẩm thời trang cho cửa hàng Walkzy.
Cửa hàng chuyên bán: giày, dép, túi xách, balo, ví da, kính mắt, thắt lưng và phụ kiện thời trang.

Hãy phân tích ảnh này và trả về mô tả theo ĐÚNG FORMAT sau (3 phần, cách nhau bởi dấu "|"):

PHẦN 1 - LOẠI SẢN PHẨM (BẮT BUỘC, TỐI ĐA 2-3 TỪ):
- Chỉ trả về 1-2 loại sản phẩm chính nhất: "thắt lưng", "dây nịt", "giày", "giày thể thao", "dép", "túi xách", "balo", "ví da", "kính mắt"
- Ưu tiên từ khóa phổ biến nhất, không liệt kê tất cả
- Ví dụ: "thắt lưng" hoặc "thắt lưng, dây nịt" (KHÔNG quá 3 từ)
- KHÔNG thêm màu sắc, chất liệu, hay đặc điểm khác

PHẦN 2 - THUỘC TÍNH QUAN TRỌNG (CHỈ MÀU CHÍNH + CHẤT LIỆU CHÍNH):
- Chỉ trả về MÀU CHÍNH NHẤT (1 màu): "màu đen", "màu trắng", "màu nâu", "màu xanh"
- Và CHẤT LIỆU CHÍNH NHẤT (1 chất liệu): "da", "da saffiano", "vải", "canvas", "nylon"
- TỐI ĐA 2 thuộc tính: 1 màu + 1 chất liệu
- KHÔNG liệt kê nhiều màu hoặc nhiều chất liệu
- Ví dụ: "màu đen, da" hoặc chỉ "màu đen" hoặc chỉ "da"

PHẦN 3 - THUỘC TÍNH PHỤ (KHÔNG DÙNG ĐỂ SEARCH):
- Các đặc điểm như: "cổ điển", "trơn", "có logo", "họa tiết", "kẻ sọc", "in hình", "phong cách"
- Những thuộc tính này KHÔNG có trong database nên không dùng để search

FORMAT OUTPUT (bắt buộc):
PHẦN1|PHẦN2|PHẦN3

VÍ DỤ OUTPUT ĐÚNG (NGẮN GỌN):
- "thắt lưng|màu đen, da|trơn, cổ điển"
- "giày thể thao|màu trắng, vải|có logo"
- "túi xách|màu đen, da saffiano|phong cách hiện đại"
- "balo|màu xanh, nylon|có nhiều ngăn"
- "thắt lưng|màu đen|trơn"

VÍ DỤ OUTPUT SAI (QUÁ DÀI - KHÔNG LÀM VẬY):
- "giày, giày thể thao, sneaker|màu trắng, màu đen, màu vàng, da, vải|sneaker, có logo, kẻ sọc" ❌

QUAN TRỌNG:
- PHẦN 1: TỐI ĐA 3 từ (ví dụ: "thắt lưng" hoặc "thắt lưng, dây nịt")
- PHẦN 2: TỐI ĐA 2 thuộc tính (1 màu + 1 chất liệu, hoặc chỉ 1 trong 2)
- PHẦN 3: Có thể có nhiều thuộc tính nhưng không dùng để search
- Trả về NGẮN GỌN, chỉ lấy thuộc tính CHÍNH NHẤT
- Trả về đúng format với dấu "|" phân cách 3 phần`;

    // Gọi API Gemini với SDK chuẩn @google/generative-ai
    console.log('[GeminiVision] Getting model gemini-1.5-pro...');
    // Sử dụng model 1.5 Pro để có khả năng phân tích hình ảnh và suy luận tốt nhất
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    console.log('[GeminiVision] Generating content...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    console.log('[GeminiVision] Response received');
    const response = await result.response;
    const rawDescription = response.text().trim();
    
    if (!rawDescription || rawDescription.length === 0) {
      throw new Error('Gemini không thể phân tích ảnh này');
    }

    // Hàm làm sạch và rút gọn phần 1 (loại sản phẩm)
    const cleanProductType = (text) => {
      if (!text) return '';
      // Tách theo dấu phẩy
      const parts = text.split(',').map(p => p.trim()).filter(p => p);
      
      // Ưu tiên từ khóa dài hơn và cụ thể hơn (ví dụ: "giày thể thao" > "giày")
      // Sắp xếp theo độ dài giảm dần, lấy phần đầu tiên (cụ thể nhất)
      const sortedParts = parts.sort((a, b) => b.length - a.length);
      
      // Chỉ lấy 1 từ khóa chính nhất (cụ thể nhất)
      return sortedParts[0] || '';
    };

    // Hàm làm sạch và rút gọn phần 2 (màu sắc và chất liệu)
    const cleanImportantAttributes = (text) => {
      if (!text) return '';
      const parts = text.split(',').map(p => p.trim()).filter(p => p);
      
      // Tách màu sắc và chất liệu
      const colors = [];
      const materials = [];
      
      parts.forEach(part => {
        const lowerPart = part.toLowerCase();
        // Kiểm tra nếu là màu sắc
        if (lowerPart.includes('màu') || 
            ['đen', 'trắng', 'nâu', 'xanh', 'đỏ', 'hồng', 'vàng', 'cam', 'xám', 'tím'].some(c => lowerPart.includes(c))) {
          colors.push(part);
        } else {
          // Các từ còn lại coi là chất liệu
          materials.push(part);
        }
      });
      
      // Chỉ lấy màu đầu tiên và chất liệu đầu tiên
      const result = [];
      if (colors.length > 0) result.push(colors[0]);
      if (materials.length > 0) result.push(materials[0]);
      
      return result.join(', ');
    };

    // Parse response thành 3 phần
    let productType = '';
    let importantAttributes = '';
    let secondaryAttributes = '';
    let searchDescription = ''; // Chỉ dùng phần 1 và 2 cho search
    let fullDescription = rawDescription; // Mô tả đầy đủ (để backward compatibility)

    // Kiểm tra xem response có format 3 phần không (có dấu |)
    if (rawDescription.includes('|')) {
      const parts = rawDescription.split('|').map(p => p.trim());
      const rawProductType = parts[0] || '';
      const rawImportantAttributes = parts[1] || '';
      secondaryAttributes = parts[2] || '';
      
      // Làm sạch và rút gọn phần 1 và 2
      productType = cleanProductType(rawProductType);
      importantAttributes = cleanImportantAttributes(rawImportantAttributes);
      
      // Tạo mô tả search (chỉ phần 1 và 2 đã được làm sạch)
      const searchParts = [];
      if (productType) searchParts.push(productType);
      if (importantAttributes) searchParts.push(importantAttributes);
      searchDescription = searchParts.join(' ').trim();
      
      // Nếu không có search description, fallback về full description
      if (!searchDescription) {
        searchDescription = rawDescription;
      }
    } else {
      // Fallback: nếu không có format 3 phần, coi toàn bộ là phần 1
      productType = cleanProductType(rawDescription);
      searchDescription = productType;
      fullDescription = rawDescription;
    }

    console.log('[GeminiVision] Successfully analyzed image');
    console.log('[GeminiVision] Product Type:', productType);
    console.log('[GeminiVision] Important Attributes:', importantAttributes);
    console.log('[GeminiVision] Secondary Attributes:', secondaryAttributes);
    console.log('[GeminiVision] Search Description:', searchDescription);

    // Trả về object có cấu trúc
    return {
      productType: productType,
      importantAttributes: importantAttributes,
      secondaryAttributes: secondaryAttributes,
      searchDescription: searchDescription, // Chỉ dùng để search
      fullDescription: fullDescription // Mô tả đầy đủ (backward compatibility)
    };
  } catch (error) {
    console.error('[GeminiVision] Error analyzing image:', error);
    console.error('[GeminiVision] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Trả về lỗi chi tiết hơn
    if (error.message.includes('API_KEY') || error.message.includes('apiKey')) {
      throw new Error('Lỗi cấu hình API key. Vui lòng kiểm tra GEMINI_API_KEY trong file .env');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      throw new Error('Đã vượt quá giới hạn API. Vui lòng thử lại sau.');
    } else {
      throw new Error(`Không thể phân tích ảnh: ${error.message || 'Lỗi không xác định'}`);
    }
  }
};

/**
 * Phân tích ảnh và trả về các từ khóa tìm kiếm
 * @param {Buffer} imageBuffer - Buffer của ảnh
 * @param {string} mimeType - MIME type của ảnh
 * @returns {Promise<string[]>} - Mảng các từ khóa tìm kiếm
 */
const extractSearchKeywords = async (imageBuffer, mimeType) => {
  try {
    const descriptionData = await analyzeImageForProductSearch(imageBuffer, mimeType);
    
    // Chỉ dùng searchDescription (phần 1 và 2) để trích xuất từ khóa
    const searchDescription = descriptionData.searchDescription || descriptionData.fullDescription || '';
    
    // Trích xuất các từ khóa quan trọng từ mô tả search
    const keywords = searchDescription
      .toLowerCase()
      .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2) // Chỉ lấy từ có độ dài > 2
      .filter((word, index, self) => self.indexOf(word) === index); // Loại bỏ trùng lặp

    return keywords;
  } catch (error) {
    console.error('Error extracting keywords:', error);
    throw error;
  }
};

module.exports = {
  analyzeImageForProductSearch,
  extractSearchKeywords
};

