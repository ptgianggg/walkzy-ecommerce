/**
 * Vietnamese Text Processing Utilities for Backend
 * Hỗ trợ bỏ dấu, normalize, và tạo regex tìm kiếm tiếng Việt có/không dấu.
 */

const VN_CHAR_GROUPS = {
    a: 'aàáảãạâấầẩẫậăắằẳẵặ',
    e: 'eèéẻẽẹêếềểễệ',
    i: 'iìíỉĩị',
    o: 'oòóỏõọôốồổỗộơớờởỡợ',
    u: 'uùúủũụưứừửữự',
    y: 'yỳýỷỹỵ',
    d: 'dđ'
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Bỏ dấu tiếng Việt bằng Unicode normalize (ổn định hơn map thủ công).
 */
const removeVietnameseDiacritics = (text) => {
    if (!text) return '';
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

/**
 * Normalize: lowercase + trim + bỏ dấu.
 */
const normalizeText = (text) => {
    if (!text) return '';
    return removeVietnameseDiacritics(String(text).toLowerCase().trim());
};

/**
 * Tạo pattern regex cho 1 từ khoá, hỗ trợ có/không dấu.
 * Nếu prefixOnly = true, pattern sẽ match đầu từ.
 */
const createVietnameseRegex = (searchTerm, { prefixOnly = false } = {}) => {
    if (!searchTerm) return '';

    const normalized = searchTerm.toLowerCase();
    const pattern = normalized
        .split('')
        .map((char) => {
            const group = VN_CHAR_GROUPS[char];
            if (!group) {
                return escapeRegex(char);
            }
            // Gộp cả dạng hoa để match không phân biệt hoa/thường
            const unique = Array.from(new Set([...group, group.toUpperCase(), char.toUpperCase()])).join('');
            return `[${unique}]`;
        })
        .join('');

    if (prefixOnly) {
        // Ưu tiên khớp đầu từ hoặc sau khoảng trắng
        return `(?:^|\\s)${pattern}`;
    }
    return pattern;
};

/**
 * Tạo Mongo $or query cho fuzzy search tiếng Việt.
 * - prefixOnly khi từ khóa quá ngắn (1-2 ký tự) để giảm nhiễu.
 */
const createFuzzySearchQuery = (searchTerm, options = {}) => {
    if (!searchTerm) return null;

    const normalized = normalizeText(searchTerm);
    if (!normalized) return null;

    const isShort = normalized.length <= 2;
    const prefixOnly = options.prefixOnly ?? isShort;

    const accentPattern = createVietnameseRegex(normalized, { prefixOnly });
    const plainPattern = escapeRegex(normalized);

    const orConditions = [
        { name: { $regex: accentPattern, $options: 'i' } },
        { slug: { $regex: accentPattern, $options: 'i' } }
    ];

    // Với từ khóa dài hơn, cho phép match cả description
    if (!isShort) {
        orConditions.push({ description: { $regex: accentPattern, $options: 'i' } });
    }

    // Thêm pattern không dấu để cover trường hợp dữ liệu đã sẵn không dấu
    if (plainPattern !== accentPattern) {
        orConditions.push(
            { name: { $regex: plainPattern, $options: 'i' } },
            { slug: { $regex: plainPattern, $options: 'i' } }
        );
        if (!isShort) {
            orConditions.push({ description: { $regex: plainPattern, $options: 'i' } });
        }
    }

    return {
        $or: orConditions
    };
};

module.exports = {
    removeVietnameseDiacritics,
    createVietnameseRegex,
    createFuzzySearchQuery,
    normalizeText
};
