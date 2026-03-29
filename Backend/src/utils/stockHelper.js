/**
 * Helper functions để xử lý tồn kho variations
 */

/**
 * Tìm variation theo color, size và material
 */
const findVariation = (product, color, size, material) => {
    if (!product.hasVariations || !product.variations || product.variations.length === 0) {
        return null;
    }

    return product.variations.find(v => {
        const matchColor = !color || v.color === color || (!v.color && !color);
        const matchSize = !size || v.size === size || (!v.size && !size);
        const matchMaterial = !material || v.material === material || (!v.material && !material);
        return matchColor && matchSize && matchMaterial && v.isActive;
    });
};

/**
 * Kiểm tra và cập nhật stock của variation
 * Trả về { success: boolean, message: string, variation: object }
 */
const updateVariationStock = async (Product, productId, variation, amount, operation = 'decrease') => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return { success: false, message: 'Sản phẩm không tồn tại' };
        }

        // Nếu không có variations, dùng countInStock
        if (!product.hasVariations || !product.variations || product.variations.length === 0) {
            if (operation === 'decrease') {
                if (product.countInStock < amount) {
                    return { success: false, message: 'Không đủ tồn kho' };
                }
                product.countInStock -= amount;
                product.selled = (product.selled || 0) + amount;
            } else {
                // increase (hoàn lại)
                product.countInStock += amount;
                product.selled = Math.max(0, (product.selled || 0) - amount);
            }
            await product.save();
            return { success: true, product };
        }

        // Tìm variation
        const foundVariation = findVariation(
            product,
            variation?.color,
            variation?.size,
            variation?.material
        );

        if (!foundVariation) {
            return { success: false, message: 'Không tìm thấy biến thể sản phẩm' };
        }

        // Kiểm tra stock
        if (operation === 'decrease') {
            if (foundVariation.stock < amount) {
                return { 
                    success: false, 
                    message: `Không đủ tồn kho. Chỉ còn ${foundVariation.stock} sản phẩm` 
                };
            }
            
            // Cập nhật stock variation
            foundVariation.stock -= amount;
            
            // Cập nhật countInStock tổng
            product.countInStock = product.variations.reduce((total, v) => total + (v.stock || 0), 0);
            product.selled = (product.selled || 0) + amount;
        } else {
            // increase (hoàn lại)
            foundVariation.stock += amount;
            product.countInStock = product.variations.reduce((total, v) => total + (v.stock || 0), 0);
            product.selled = Math.max(0, (product.selled || 0) - amount);
        }

        await product.save();
        return { success: true, product, variation: foundVariation };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Kiểm tra stock có đủ không (không cập nhật)
 */
const checkVariationStock = (product, variation, amount) => {
    if (!product.hasVariations || !product.variations || product.variations.length === 0) {
        return {
            success: product.countInStock >= amount,
            available: product.countInStock,
            message: product.countInStock >= amount ? 'OK' : 'Không đủ tồn kho'
        };
    }

    const foundVariation = findVariation(product, variation?.color, variation?.size, variation?.material);
    
    if (!foundVariation) {
        return { success: false, available: 0, message: 'Không tìm thấy biến thể' };
    }

    return {
        success: foundVariation.stock >= amount,
        available: foundVariation.stock,
        message: foundVariation.stock >= amount ? 'OK' : `Chỉ còn ${foundVariation.stock} sản phẩm`,
        variation: foundVariation
    };
};

/**
 * Lấy stock của variation
 */
const getVariationStock = (product, color, size, material) => {
    if (!product.hasVariations || !product.variations || product.variations.length === 0) {
        return product.countInStock || 0;
    }

    const variation = findVariation(product, color, size, material);
    return variation ? (variation.stock || 0) : 0;
};

module.exports = {
    findVariation,
    updateVariationStock,
    checkVariationStock,
    getVariationStock
};

