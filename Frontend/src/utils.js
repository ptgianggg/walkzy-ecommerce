import { orderContant } from "./contant";

export const isJonString = (data) => {
    try {
        JSON.parse(data)
    } catch (error) {
        return false
    }
    return true
}

export const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

export function getItem(label, key, icon, children, type) {
    return {
        key,
        icon,
        children,
        label,
        type,
    };
}


export const renderOptions = (arr) => {
    let results = []
    if (arr) {
        results = arr?.map((opt) => {
            return {
                value: opt,
                label: opt
            }
        })
    }
    results.push({
        label: 'Thêm type',
        value: 'add_type'
    })
    return results
}

export const convertPrice = (price) => {
    try {
        // Kiểm tra price có tồn tại và là một số hợp lệ không
        if (price === null || price === undefined || price === '' || isNaN(Number(price))) {
            return '0 VND'
        }
        
        const numPrice = Number(price)
        if (numPrice < 0) {
            return '0 VND'
        }
        
        const result = numPrice.toLocaleString('vi-VN').replaceAll(',', '.')
        return `${result} VND `

    } catch (error) {
        return '0 VND'
    }
}
export const convertDataChart = (data, type) => {

    try {
        const object = {}
        Array.isArray(data) && data.forEach((opt) => {
            console.log('opt', opt, type)
            console.log('paymentMethod', opt[type], object[opt[type]])
            if (!object[opt[type]]) {
                object[opt[type]] = 1
            } else {
                object[opt[type]] += 1
            }
        });
        const result = Array.isArray(Object.keys(object)) && Object.keys(object).map((item) => {
            return {
                name: orderContant.payment[item],
                value: object[item]
            }
        })
        console.log('result', result)
        return result
    } catch (e) {
        return []
    }
}

/**
 * Tạo placeholder image bằng data URI (SVG base64)
 * Không phụ thuộc vào external service, luôn hoạt động
 * @param {number} width - Chiều rộng (mặc định: 300)
 * @param {number} height - Chiều cao (mặc định: 300)
 * @param {string} text - Text hiển thị (mặc định: "No Image")
 * @returns {string} Data URI của placeholder image
 */
export const getPlaceholderImage = (width = 300, height = 300, text = 'No Image') => {
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text 
                x="50%" 
                y="50%" 
                font-family="Arial, sans-serif" 
                font-size="14" 
                fill="#999" 
                text-anchor="middle" 
                dominant-baseline="middle"
            >
                ${text}
            </text>
        </svg>
    `.trim();
    
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// Check if a product belongs to a selected category.
// Selecting a parent should include products in all descendant categories (not only immediate children).
export const isProductInCategory = (product, selectedCategoryId, categories = []) => {
    if (!selectedCategoryId) return true;

    const productCategoryId = typeof product.category === 'object' ? (product.category?._id || product.category) : product.category;
    if (!productCategoryId) return false;

    if (String(productCategoryId) === String(selectedCategoryId)) return true;

    // Find selected category object
    const selectedCat = categories.find(c => String(c._id) === String(selectedCategoryId));
    if (!selectedCat) return false;

    // Build a set of all descendant IDs (children, grandchildren, ...)
    const descendants = new Set();
    const stack = [String(selectedCategoryId)];

    while (stack.length) {
        const currentId = stack.pop();
        categories.forEach((cat) => {
            const parentId = cat.parentCategory && (cat.parentCategory._id || cat.parentCategory);
            if (parentId && String(parentId) === String(currentId)) {
                const childId = String(cat._id);
                if (!descendants.has(childId)) {
                    descendants.add(childId);
                    stack.push(childId);
                }
            }
        });
    }

    return descendants.has(String(productCategoryId));
}