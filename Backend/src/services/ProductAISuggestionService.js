const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const safeTrim = (value) => (value ? String(value).trim() : '');
const toUpperSlug = (value) => {
    const normalized = safeTrim(value)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/--+/g, '-');
    return normalized || 'SKU';
};

const truncateText = (text, limit) => {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit).trim() : text.trim();
};

const cleanJSONResponse = (rawText) => {
    if (!rawText) return null;
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Lấy phần JSON giữa { ... }
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleaned;

    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return null;
    }
};

const buildPrompt = (payload) => {
    const {
        productName,
        category,
        brand,
        collections = [],
        colors = [],
        sizes = [],
        material,
        targetGender,
        hasVariant,
        baseSKU
    } = payload || {};

    return `
Bạn là AI Product Assistant của hệ thống bán hàng Walkzy.
Nhiệm vụ: tạo nhanh dữ liệu sản phẩm đầy đủ chỉ bằng 1 lần nhấn nút "Gợi ý mô tả AI".

DỮ LIỆU ĐẦU VÀO:
- Tên sản phẩm: ${safeTrim(productName) || 'N/A'}
- Danh mục: ${safeTrim(category) || 'N/A'}
- Thương hiệu: ${safeTrim(brand) || 'N/A'}
- Bộ sưu tập: ${collections.filter(Boolean).join(', ') || 'N/A'}
- Màu sắc: ${colors.filter(Boolean).join(', ') || 'N/A'}
- Size: ${sizes.filter(Boolean).join(', ') || 'N/A'}
- Chất liệu: ${safeTrim(material) || 'N/A'}
- Đối tượng: ${safeTrim(targetGender) || 'unisex'}
- Sản phẩm có biến thể không: ${hasVariant ? 'true' : 'false'}
- SKU gốc (nếu có): ${safeTrim(baseSKU) || 'chưa có'}

TRẢ VỀ DUY NHẤT 1 JSON, không kèm mô tả ngoài JSON.
Schema bắt buộc:
{
  "productNameSuggestion": "tối đa 65 ký tự, chuẩn SEO, ngắn gọn",
  "shortDescription": "20-25 từ, tóm tắt giá trị cốt lõi",
  "longDescription": "50-90 từ, văn phong trẻ trung, dễ đọc, không lặp ý",
  "highlights": ["ưu điểm chất liệu", "ưu điểm form dáng", "ưu điểm độ bền", "ưu điểm thoải mái", "ưu điểm màu sắc/phối đồ"],
  "seoDescription": "meta description <=150 ký tự, tự nhiên, không nhồi từ khóa",
  "tags": ["3-6 từ khóa SEO"],
  "suggestedSKU": "BRAND-PRODUCTCODE-COLOR (nếu có baseSKU thì cải thiện chuẩn hóa)",
  "variantMatrix": hasVariant ? [
    { "color": "", "size": "", "autoSKU": "" }
  ] : []
}

Quy tắc:
- Không dùng icon hoặc ký tự lạ.
- Nội dung thực tế, không phóng đại.
- Ngôn ngữ: Tiếng Việt.
`.trim();
};

const buildVariantMatrix = (colors = [], sizes = [], baseSku = '') => {
    const colorList = colors.length > 0 ? colors : ['Default'];
    const sizeList = sizes.length > 0 ? sizes : ['FREESIZE'];
    const skuBase = toUpperSlug(baseSku || `SKU-${colorList[0]}`);
    const matrix = [];

    colorList.forEach((color) => {
        if (sizeList.length > 0) {
            sizeList.forEach((size) => {
                const colorCode = toUpperSlug(color).substring(0, 3) || 'CLR';
                const sizeCode = toUpperSlug(size).substring(0, 3) || 'SIZ';
                matrix.push({
                    color,
                    size,
                    autoSKU: `${skuBase}-${colorCode}-${sizeCode}`
                });
            });
        } else {
            const colorCode = toUpperSlug(color).substring(0, 3) || 'CLR';
            matrix.push({
                color,
                size: '',
                autoSKU: `${skuBase}-${colorCode}`
            });
        }
    });

    return matrix;
};

const buildFallbackSuggestion = (payload) => {
    const {
        productName,
        category,
        brand,
        collections = [],
        colors = [],
        sizes = [],
        material,
        targetGender,
        hasVariant,
        baseSKU
    } = payload || {};

    const mainName = safeTrim(productName) || 'Sản phẩm mới';
    const brandName = safeTrim(brand) || 'WALKZY';
    const categoryName = safeTrim(category) || 'thời trang';
    const colorList = colors.filter(Boolean);
    const sizeList = sizes.filter(Boolean);
    const materialText = safeTrim(material) || 'chất liệu cao cấp';
    const audience = safeTrim(targetGender) || 'unisex';
    const collectionText = collections.filter(Boolean).slice(0, 2).join(', ');

    const fallbackSKU = toUpperSlug(baseSKU || `${brandName}-${mainName}`).substring(0, 40);
    const variantMatrix = hasVariant ? buildVariantMatrix(colorList, sizeList, fallbackSKU) : [];

    const shortDescription = `Thiết kế ${categoryName} ${audience} của ${brandName}, ${colorList[0] || 'nhiều màu'} dễ phối, ${materialText} thoáng, mang lại sự thoải mái khi sử dụng.`;
    const longDescription = `Mẫu ${mainName} thuộc dòng ${categoryName} của ${brandName}${collectionText ? `, nằm trong bộ sưu tập ${collectionText}` : ''}. ${materialText} êm, form đứng dáng, tông ${colorList[0] || 'trung tính'} dễ phối đồ, phù hợp ${audience}. Phù hợp đi làm, đi chơi, di chuyển nhiều vẫn thoải mái.`;
    const seoDescription = truncateText(
        `${mainName} ${brandName} ${categoryName} ${audience} với ${materialText}, màu ${colorList[0] || 'dễ phối'}, thoải mái và bền.`,
        150
    );

    const tags = [
        `${categoryName} ${brandName}`.toLowerCase(),
        `${mainName}`.toLowerCase(),
        `${categoryName} ${audience}`.toLowerCase()
    ].filter(Boolean);

    return {
        productNameSuggestion: truncateText(`${brandName} ${mainName}`.trim(), 65),
        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim(),
        highlights: [
            `${materialText} mềm, thoáng và bền màu.`,
            `Form chuẩn, giữ dáng khi vận động.`,
            `Đường may chắc chắn, sử dụng lâu dài.`,
            `Thoải mái cho ${audience}, phù hợp mang cả ngày.`,
            `${colorList[0] || 'tông dễ phối'} phối được nhiều phong cách.`
        ],
        seoDescription,
        tags,
        suggestedSKU: fallbackSKU,
        variantMatrix
    };
};

const normalizeSuggestion = (rawData, payload) => {
    const fallback = buildFallbackSuggestion(payload);
    const data = rawData && typeof rawData === 'object' ? rawData : {};

    const productNameSuggestion = truncateText(
        data.productNameSuggestion || fallback.productNameSuggestion,
        65
    );

    const shortDescription = data.shortDescription || fallback.shortDescription;
    const longDescription = data.longDescription || fallback.longDescription;
    const seoDescription = truncateText(
        data.seoDescription || data.metaDescription || fallback.seoDescription,
        150
    );

    const highlights = Array.isArray(data.highlights) && data.highlights.length >= 3
        ? data.highlights.slice(0, 5)
        : fallback.highlights;

    const tags = Array.isArray(data.tags) && data.tags.length > 0
        ? data.tags.slice(0, 6)
        : fallback.tags;

    const suggestedSKU = toUpperSlug(data.suggestedSKU || payload.baseSKU || fallback.suggestedSKU);
    const hasVariant = Boolean(payload?.hasVariant);
    const variantMatrix = hasVariant
        ? (Array.isArray(data.variantMatrix) && data.variantMatrix.length > 0
            ? data.variantMatrix.map((item) => ({
                color: safeTrim(item.color),
                size: safeTrim(item.size),
                autoSKU: safeTrim(item.autoSKU) || `${suggestedSKU}-${toUpperSlug(item.color || 'CLR').substring(0, 3)}-${toUpperSlug(item.size || 'SIZ').substring(0, 3)}`
            }))
            : buildVariantMatrix(payload.colors || [], payload.sizes || [], suggestedSKU))
        : [];

    return {
        productNameSuggestion,
        shortDescription,
        longDescription,
        highlights,
        seoDescription,
        tags,
        suggestedSKU,
        variantMatrix
    };
};

const callGemini = async (prompt) => {
    if (!genAI) {
        throw new Error('Thiếu GEMINI_API_KEY, không thể gọi AI');
    }

    const modelCandidates = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = null;

    for (const model of modelCandidates) {
        try {
            const response = await genAI.models.generateContent({
                model,
                contents: prompt
            });
            const rawText = response.text || response.response?.text || '';
            if (rawText && rawText.trim()) {
                return { rawText, modelUsed: model };
            }
        } catch (error) {
            lastError = error;
            continue;
        }
    }

    throw lastError || new Error('Không thể sinh nội dung bằng AI');
};

const generateProductDescription = async (payload = {}) => {
    try {
        const prompt = buildPrompt(payload);
        let parsed = null;
        let rawText = '';
        let modelUsed = null;

        try {
            const aiResponse = await callGemini(prompt);
            rawText = aiResponse.rawText;
            modelUsed = aiResponse.modelUsed;
            parsed = cleanJSONResponse(rawText);
        } catch (error) {
            // Fall back phía dưới
        }

        const data = normalizeSuggestion(parsed, payload);

        return {
            status: 'OK',
            data,
            rawText,
            modelUsed,
            usedFallback: !parsed
        };
    } catch (error) {
        const fallback = buildFallbackSuggestion(payload);
        return {
            status: 'OK',
            data: fallback,
            rawText: null,
            modelUsed: null,
            usedFallback: true,
            message: error.message
        };
    }
};

module.exports = {
    generateProductDescription
};
