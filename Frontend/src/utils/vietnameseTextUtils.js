/**
 * Vietnamese Text Processing Utilities
 * Hỗ trợ xử lý văn bản tiếng Việt cho tìm kiếm thông minh
 */

// Map các ký tự có dấu sang không dấu
const VIETNAMESE_DIACRITICS_MAP = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
};

// Dictionary cho typo correction - các lỗi chính tả phổ biến
const TYPO_CORRECTIONS = {
    // Giày
    'gaiy': 'giày',
    'gày': 'giày',
    'giáy': 'giày',
    'giay': 'giày',
    'gìay': 'giày',
    'gịay': 'giày',
    'gỉay': 'giày',
    'gĩay': 'giày',
    // Dép
    'dep': 'dép',
    'dép': 'dép',
    'đep': 'dép',
    'đép': 'dép',
    // Túi
    'tui': 'túi',
    'túi': 'túi',
    'tùi': 'túi',
    'tụi': 'túi',
    // Balo
    'balo': 'balo',
    'ba lo': 'balo',
    'ba-lo': 'balo',
    // Ví
    'vi': 'ví',
    'ví': 'ví',
    'vì': 'ví',
    // Kính
    'kinh': 'kính',
    'kính': 'kính',
    'kình': 'kính',
    // Thắt lưng
    'that lung': 'thắt lưng',
    'thắt lung': 'thắt lưng',
    'that lưng': 'thắt lưng',
    // Sneaker
    'sneaker': 'sneaker',
    'sneakers': 'sneaker',
    'sneaker': 'sneaker',
    // Boot
    'boot': 'boot',
    'boots': 'boot',
    // Sandal
    'sandal': 'sandal',
    'sandals': 'sandal',
    'xăng đan': 'sandal',
    'xang dan': 'sandal',
};

/**
 * Loại bỏ dấu tiếng Việt
 */
export const removeVietnameseDiacritics = (text) => {
    if (!text) return '';
    return text
        .split('')
        .map(char => VIETNAMESE_DIACRITICS_MAP[char] || char)
        .join('');
};

/**
 * Normalize text: lowercase, remove diacritics, trim
 */
export const normalizeText = (text) => {
    if (!text) return '';
    return removeVietnameseDiacritics(text.toLowerCase().trim());
};

/**
 * Sửa lỗi chính tả phổ biến
 */
export const correctTypo = (text) => {
    if (!text) return '';
    
    const normalized = text.toLowerCase().trim();
    
    // Kiểm tra trong dictionary
    if (TYPO_CORRECTIONS[normalized]) {
        return TYPO_CORRECTIONS[normalized];
    }
    
    // Sửa lỗi thay thế ký tự phổ biến
    let corrected = normalized;
    
    // Sửa 'gaiy' → 'giày'
    corrected = corrected.replace(/gaiy/g, 'giày');
    corrected = corrected.replace(/gày/g, 'giày');
    corrected = corrected.replace(/giáy/g, 'giày');
    
    // Sửa 'dep' → 'dép'
    corrected = corrected.replace(/\bdep\b/g, 'dép');
    
    // Sửa 'tui' → 'túi'
    corrected = corrected.replace(/\btui\b/g, 'túi');
    
    // Sửa 'vi' → 'ví'
    corrected = corrected.replace(/\bvi\b/g, 'ví');
    
    // Sửa 'kinh' → 'kính'
    corrected = corrected.replace(/\bkinh\b/g, 'kính');
    
    return corrected;
};

/**
 * Tính điểm tương đồng giữa 2 chuỗi (Levenshtein distance)
 */
export const calculateSimilarity = (str1, str2) => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLength);
};

/**
 * Fuzzy match - kiểm tra xem text có match với search term không
 */
export const fuzzyMatch = (text, searchTerm, threshold = 0.6) => {
    if (!text || !searchTerm) return false;
    
    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchTerm);
    const correctedSearch = correctTypo(normalizedSearch);
    
    // Exact match (sau khi normalize)
    if (normalizedText.includes(normalizedSearch) || normalizedText.includes(correctedSearch)) {
        return true;
    }
    
    // Fuzzy match với similarity
    const similarity = calculateSimilarity(normalizedText, normalizedSearch);
    if (similarity >= threshold) {
        return true;
    }
    
    // Kiểm tra từng từ
    const searchWords = correctedSearch.split(/\s+/);
    const textWords = normalizedText.split(/\s+/);
    
    for (const searchWord of searchWords) {
        for (const textWord of textWords) {
            if (textWord.includes(searchWord) || searchWord.includes(textWord)) {
                return true;
            }
            const wordSimilarity = calculateSimilarity(textWord, searchWord);
            if (wordSimilarity >= threshold) {
                return true;
            }
        }
    }
    
    return false;
};

/**
 * Tính điểm relevance cho sản phẩm
 */
export const calculateRelevanceScore = (product, searchTerm) => {
    if (!product || !searchTerm) return 0;
    
    const normalizedSearch = normalizeText(searchTerm);
    const correctedSearch = correctTypo(normalizedSearch);
    
    let score = 0;
    
    // Name matching
    const productName = normalizeText(product.name || '');
    
    // Exact match trong name = điểm cao nhất
    if (productName === normalizedSearch || productName === correctedSearch) {
        score += 1000;
    } else if (productName.startsWith(normalizedSearch) || productName.startsWith(correctedSearch)) {
        score += 500;
    } else if (productName.includes(normalizedSearch) || productName.includes(correctedSearch)) {
        score += 100;
    } else {
        // Fuzzy match
        const similarity = calculateSimilarity(productName, normalizedSearch);
        score += similarity * 50;
    }
    
    // Description matching
    const productDesc = normalizeText(product.description || '');
    if (productDesc.includes(normalizedSearch) || productDesc.includes(correctedSearch)) {
        score += 10;
    }
    
    // Category matching
    const categoryName = normalizeText(product.category?.name || '');
    if (categoryName.includes(normalizedSearch) || categoryName.includes(correctedSearch)) {
        score += 50;
    }
    
    // Brand matching
    const brandName = normalizeText(product.brand?.name || '');
    if (brandName.includes(normalizedSearch) || brandName.includes(correctedSearch)) {
        score += 50;
    }
    
    // Bonus cho featured và best selling
    if (product.isFeatured) {
        score += 5;
    }
    if (product.selled > 0) {
        score += Math.min(product.selled / 100, 5);
    }
    
    return score;
};

/**
 * Sắp xếp kết quả theo relevance
 */
export const sortByRelevance = (products, searchTerm) => {
    if (!products || !Array.isArray(products)) return [];
    
    return products
        .map(product => ({
            ...product,
            _relevanceScore: calculateRelevanceScore(product, searchTerm)
        }))
        .filter(product => product._relevanceScore > 0)
        .sort((a, b) => b._relevanceScore - a._relevanceScore)
        .map(({ _relevanceScore, ...product }) => product);
};

