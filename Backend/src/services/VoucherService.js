const Promotion = require('../models/PromotionModel');
const User = require('../models/UserModel');
const Product = require('../models/ProductModel');
const Order = require('../models/OrderProduct');
const Category = require('../models/CategoryModel');

const validateVoucher = (code, orderItems, totalPrice, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!code || !code.trim()) {
                return resolve({
                    status: 'ERR',
                    message: 'Vui lòng nhập mã voucher'
                });
            }

            const promotion = await Promotion.findOne({
                code: code.trim().toUpperCase(),
                isActive: true
            })
            .select('name code type value maxDiscount minPurchase startDate endDate isActive isForNewUser isShopWide products categories brands applicableSizes applicableColors usageLimit usageCount userLimit')
            .populate('products', 'name price countInStock hasVariations variations')
            .populate('categories', 'name')
            .populate('brands', 'name')
            .lean(); // Sử dụng lean() để tăng tốc độ query

            if (!promotion) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã voucher không tồn tại hoặc đã hết hạn'
                });
            }

            // Kiểm tra thời gian hiệu lực
            const now = new Date();
            if (now < promotion.startDate || now > promotion.endDate) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã voucher chưa có hiệu lực hoặc đã hết hạn'
                });
            }

            // Kiểm tra giới hạn sử dụng tổng
            if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
                return resolve({
                    status: 'ERR',
                    message: 'Mã voucher đã hết lượt sử dụng'
                });
            }

            // Kiểm tra user mới và số lần sử dụng (chỉ khi có userId) - tối ưu: chạy song song
            if (userId) {
                const [user, userUsageCount] = await Promise.all([
                    promotion.isForNewUser ? User.findById(userId).select('totalOrders') : Promise.resolve(null),
                    promotion.userLimit ? Order.countDocuments({
                        user: userId,
                        $or: [
                            { promotion: promotion._id }, // Nếu order có field promotion
                            { voucherCode: promotion.code } // Hoặc check theo voucherCode (backward compatible)
                        ],
                        status: { $nin: ['cancelled', 'refunded'] }
                    }) : Promise.resolve(0)
                ]);

                // Check user mới
                if (promotion.isForNewUser && user && user.totalOrders > 0) {
                    return resolve({
                        status: 'ERR',
                        message: 'Voucher này chỉ dành cho khách hàng mới'
                    });
                }

                // Check số lần sử dụng của user
                if (promotion.userLimit && userUsageCount >= promotion.userLimit) {
                    return resolve({
                        status: 'ERR',
                        message: `Bạn đã sử dụng hết lượt voucher này (tối đa ${promotion.userLimit} lần)`
                    });
                }
            }

            // Kiểm tra giá trị đơn hàng tối thiểu
            if (promotion.minPurchase && totalPrice < promotion.minPurchase) {
                return resolve({
                    status: 'ERR',
                    message: `Đơn hàng tối thiểu ${promotion.minPurchase.toLocaleString()} VNĐ để sử dụng mã này`
                });
            }

            // Kiểm tra tồn kho và lấy thông tin chi tiết sản phẩm - Nếu sản phẩm hết hàng hoặc hết size → không áp dụng
            // Tối ưu: dùng Promise.all để check song song thay vì tuần tự
            const stockAndInfoChecks = await Promise.all(
                orderItems.map(async (item) => {
                    const product = await Product.findById(item.product)
                        .select('countInStock hasVariations variations category brand')
                        .lean();
                    
                    if (!product) {
                        return { valid: false, message: 'Sản phẩm không tồn tại' };
                    }

                    // Check nếu sản phẩm hết hàng
                    if (product.countInStock <= 0) {
                        return { valid: false, message: 'Sản phẩm hết hàng' };
                    }

                    // Check nếu có variation và hết size
                    if (item.variation && product.hasVariations && product.variations) {
                        const variation = product.variations.find(v => 
                            v.color === item.variation.color && 
                            v.size === item.variation.size &&
                            v.isActive
                        );
                        if (!variation || (variation.stock !== undefined && variation.stock <= 0)) {
                            return { valid: false, message: 'Sản phẩm hết size' };
                        }
                    }

                    return { 
                        valid: true, 
                        productDetail: product, 
                        itemPrice: item.price || product.price, 
                        amount: item.amount || item.quantity,
                        variation: item.variation // Capture variation for potential size/color check
                    };
                })
            );

            // Kiểm tra nếu có lỗi nào
            const invalidCheck = stockAndInfoChecks.find(check => !check.valid);
            if (invalidCheck) {
                return resolve({
                    status: 'ERR',
                    message: invalidCheck.message || 'Voucher này không áp dụng cho sản phẩm trong giỏ hàng của bạn.'
                });
            }

            // Tính toán applicableSubtotal
            let applicableSubtotal = 0;
            if (promotion.isShopWide) {
                applicableSubtotal = totalPrice;
            } else {
                // Xác định danh sách category hợp lệ (bao gồm category con)
                let allCategoryIds = [];
                if (promotion.categories && promotion.categories.length > 0) {
                    const baseCategoryIds = promotion.categories.map(c => String(c._id));
                    const children = await Category.find({ parentCategory: { $in: baseCategoryIds } }).select('_id').lean();
                    const childIds = children.map(c => String(c._id));
                    allCategoryIds = Array.from(new Set([...baseCategoryIds, ...childIds]));
                }

                const productIds = promotion.products ? promotion.products.map(p => p._id.toString()) : [];
                const brandIds = promotion.brands ? promotion.brands.map(b => b._id.toString()) : [];
                const applicableSizes = promotion.applicableSizes || [];
                const applicableColors = promotion.applicableColors || [];

                // Lọc các item thỏa mãn điều kiện
                stockAndInfoChecks.forEach(check => {
                    const pd = check.productDetail;
                    const variation = check.variation;
                    let isApplicable = false;

                    // Nếu không có bất kỳ giới hạn nào (products, categories, brands, sizes, colors)
                    // thì mặc định là áp dụng cho mọi thứ (tương đương shopwide)
                    if (productIds.length === 0 && allCategoryIds.length === 0 && brandIds.length === 0 &&
                        applicableSizes.length === 0 && applicableColors.length === 0) {
                        isApplicable = true;
                    } else {
                        // Check products/categories/brands (OR logic)
                        if (productIds.length > 0 && productIds.includes(pd._id.toString())) {
                            isApplicable = true;
                        }
                        if (!isApplicable && allCategoryIds.length > 0) {
                            const itemCategory = pd.category?._id?.toString() || pd.category?.toString();
                            if (allCategoryIds.includes(String(itemCategory))) {
                                isApplicable = true;
                            }
                        }
                        if (!isApplicable && brandIds.length > 0) {
                            const itemBrand = pd.brand?._id?.toString() || pd.brand?.toString();
                            if (brandIds.includes(String(itemBrand))) {
                                isApplicable = true;
                            }
                        }

                        // Nếu đã thỏa mãn 1 trong các group trên, kiểm tra thêm size/color (nếu có giới hạn)
                        // Giới hạn size/color thường là AND với product group
                        if (isApplicable || (productIds.length === 0 && allCategoryIds.length === 0 && brandIds.length === 0)) {
                            if (applicableSizes.length > 0) {
                                if (!variation?.size || !applicableSizes.includes(variation.size)) {
                                    isApplicable = false;
                                } else {
                                    isApplicable = true; // Match size
                                }
                            }
                            if (isApplicable && applicableColors.length > 0) {
                                if (!variation?.color || !applicableColors.includes(variation.color)) {
                                    isApplicable = false;
                                } else {
                                    isApplicable = true; // Match color
                                }
                            }
                        }
                    }

                    if (isApplicable) {
                        applicableSubtotal += check.itemPrice * check.amount;
                    }
                });

                if (applicableSubtotal === 0) {
                    return resolve({
                        status: 'ERR',
                        message: 'Voucher này không áp dụng cho bất kỳ sản phẩm nào trong giỏ hàng của bạn.'
                    });
                }
            }

            // Tính toán giá trị giảm
            let discountAmount = 0;
            if (promotion.type === 'percentage' || promotion.type === 'voucher_shop_wide' || promotion.type === 'voucher_new_user') {
                // Nếu là percentage hoặc voucher mới (cũng dùng percentage hoặc fixed)
                discountAmount = (applicableSubtotal * promotion.value) / 100;
                if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
                    discountAmount = promotion.maxDiscount;
                }
            } else if (promotion.type === 'fixed') {
                discountAmount = promotion.value;
                if (discountAmount > applicableSubtotal) {
                    discountAmount = applicableSubtotal;
                }
            }

            resolve({
                status: 'OK',
                message: 'Mã voucher hợp lệ',
                data: {
                    promotion: {
                        _id: promotion._id,
                        name: promotion.name,
                        code: promotion.code,
                        type: promotion.type,
                        value: promotion.value,
                        maxDiscount: promotion.maxDiscount
                    },
                    promotionId: promotion._id, // Trả về promotionId để frontend gửi khi tạo order
                    discountAmount: Math.round(discountAmount),
                    applicableSubtotal: Math.round(applicableSubtotal)
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    validateVoucher
};

