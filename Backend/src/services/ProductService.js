const Product = require('../models/ProductModel')
const Category = require('../models/CategoryModel')
const Brand = require('../models/BrandModel')
const crypto = require('crypto')
const vietnameseUtils = require('../utils/vietnameseTextUtils')
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')




const createProduct = (newProduct) => {
    return new Promise(async (resolve, reject) => {
        const { 
            name, 
            image, 
            images,
            type, 
            countInStock, 
            originalPrice,
        price, 
        rating, 
        description, 
        discount,
        category,
        brand,
        collections,
        baseSKU,
        shortDescription,
        metaTitle,
        metaDescription,
        variations,
        hasVariations,
        slug,
        saleStartDate,
        saleEndDate
        } = newProduct
        
        // Remove client-only parentCategory (frontend convenience field)
        if (newProduct.parentCategory !== undefined) {
            delete newProduct.parentCategory;
        }
        
        try {
            const checkProduct = await Product.findOne({
                name: name
            })
            if (checkProduct !== null) {
                resolve({
                    status: 'ERR',
                    message: 'Tên sản phẩm đã tồn tại'
                })
                return
            }

            // Auto-generate slug nếu không có
            const productSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
            
            // Kiểm tra slug trùng
            const checkSlug = await Product.findOne({ slug: productSlug });
            if (checkSlug) {
                resolve({
                    status: 'ERR',
                    message: 'Slug đã tồn tại'
                })
                return
            }

            // Xử lý images
            const productImages = images && images.length > 0 ? images : (image ? [image] : []);
            const seoTitle = metaTitle || name;
            const seoDesc = metaDescription || shortDescription || (description ? String(description).substring(0, 150) : '');
            
            // Validate và fix duplicate SKU trong variations
            let finalVariations = variations || [];
            if (hasVariations && variations && variations.length > 0) {
                const processedVariations = [];
                const usedSKUs = new Set(); // Track SKUs đã dùng trong batch này
                
                // Helper function để generate unique SKU
                const generateUniqueSKU = async (baseSKU, maxRetries = 5) => {
                    let finalSKU = baseSKU;
                    let attempts = 0;
                    
                    while (attempts < maxRetries) {
                        // Kiểm tra SKU có trùng trong batch hiện tại không
                        if (usedSKUs.has(finalSKU)) {
                            const timestamp = Date.now().toString().slice(-6);
                            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                            // Nếu SKU đã có timestamp, thay thế phần cuối
                            const baseWithoutSuffix = finalSKU.split('-').slice(0, -2).join('-') || baseSKU;
                            finalSKU = `${baseWithoutSuffix}-${timestamp}-${randomSuffix}`;
                            attempts++;
                            continue;
                        }
                        
                        // Kiểm tra SKU có trùng trong database không
                        const existingProduct = await Product.findOne({
                            'variations.sku': finalSKU
                        });
                        
                        if (existingProduct) {
                            // Nếu trùng trong DB, tạo SKU mới
                            const timestamp = Date.now().toString().slice(-6);
                            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                            // Nếu SKU đã có timestamp, thay thế phần cuối
                            const baseWithoutSuffix = finalSKU.split('-').slice(0, -2).join('-') || baseSKU;
                            finalSKU = `${baseWithoutSuffix}-${timestamp}-${randomSuffix}`;
                            attempts++;
                            continue;
                        }
                        
                        // SKU hợp lệ, break loop
                        break;
                    }
                    
                    // Nếu vẫn trùng sau maxRetries, thêm UUID để đảm bảo unique
                    if (attempts >= maxRetries) {
                        const uuid = crypto.randomBytes(4).toString('hex').toUpperCase();
                        const baseWithoutSuffix = finalSKU.split('-').slice(0, -2).join('-') || baseSKU;
                        finalSKU = `${baseWithoutSuffix}-${uuid}`;
                    }
                    
                    return finalSKU;
                };
                
                // Xử lý từng variation và tạo object mới để tránh mutate object gốc
                for (const variation of variations) {
                    const processedVariation = { ...variation }; // Tạo copy để tránh mutate
                    
                    if (processedVariation.sku) {
                        const finalSKU = await generateUniqueSKU(processedVariation.sku);
                        processedVariation.sku = finalSKU;
                        usedSKUs.add(finalSKU);
                    }
                    
                    // Đảm bảo các trường bắt buộc có giá trị
                    processedVariation.stock = Number(processedVariation.stock) || 0;
                    processedVariation.isActive = processedVariation.isActive !== undefined ? processedVariation.isActive : true;
                    
                    processedVariations.push(processedVariation);
                }
                finalVariations = processedVariations;
            }

            // Tính countInStock từ variations sau khi đã xử lý
            let stockCount = Number(countInStock) || 0;
            if (hasVariations && finalVariations && finalVariations.length > 0) {
                stockCount = finalVariations.reduce((total, variation) => {
                    return total + (Number(variation.stock) || 0);
                }, 0);
            }

            const createdProduct = await Product.create({
                name,
                slug: productSlug,
                image: productImages[0] || image, // Giữ image để tương thích
                images: productImages,
                type,
                category: category || null,
                brand: brand || null,
                collections: collections || [],
                baseSKU: baseSKU || null,
                variations: finalVariations,
                hasVariations: hasVariations || false,
                countInStock: stockCount,
                originalPrice: originalPrice ? Number(originalPrice) : Number(price), // Nếu không có originalPrice thì dùng price
                price: Number(price),
                rating: Number(rating) || 0,
                description: description || '',
                shortDescription: shortDescription || '',
                metaTitle: seoTitle,
                metaDescription: seoDesc,
                discount: Number(discount) || 0,
                saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
                saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
                isNewProduct: newProduct.isNewProduct !== undefined ? newProduct.isNewProduct : (newProduct.isNew !== undefined ? newProduct.isNew : true), // Tự động set isNewProduct = true cho sản phẩm mới (hỗ trợ cả isNew cũ để tương thích)
                isActive: newProduct.isActive !== undefined ? newProduct.isActive : true, // Tự động set isActive = true
                isFeatured: newProduct.isFeatured || false
            })
            
            if (createdProduct) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: createdProduct
                })
            } else {
                resolve({
                    status: 'ERR',
                    message: 'Không thể tạo sản phẩm'
                })
            }

        } catch (e) {
            reject(e)
        }
    })
}

const updateProduct = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkProduct = await Product.findById(id);
            if (checkProduct === null) {
                resolve({
                    status: 'ERR',
                    message: 'Sản phẩm không tồn tại'
                })
                return
            }

            // Nếu có variations, tính lại countInStock
            if (data.hasVariations && data.variations && data.variations.length > 0) {
                data.countInStock = data.variations.reduce((total, variation) => {
                    return total + (Number(variation.stock) || 0);
                }, 0);
            }

            // Remove client-only parentCategory if present (UI convenience field)
            if (data.parentCategory !== undefined) {
                delete data.parentCategory;
            }

            // Xử lý images
            if (data.images && data.images.length > 0) {
                data.image = data.images[0]; // Giữ image để tương thích
            }

            const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true })
            // After updating, detect if any variation became restocked (0 -> >0)
            try {
                if (data.variations && Array.isArray(data.variations) && data.variations.length > 0) {
                    const oldProduct = await Product.findById(id).lean();
                    const oldVariations = (oldProduct && oldProduct.variations) || [];

                    for (const newVar of data.variations) {
                        // Find matching old variation by sku if available, otherwise by color+size+material
                        let match = null;
                        if (newVar.sku) {
                            match = oldVariations.find(v => v.sku === newVar.sku);
                        }
                        if (!match) {
                            match = oldVariations.find(v =>
                                (v.color || '') === (newVar.color || '') &&
                                (v.size || '') === (newVar.size || '') &&
                                (v.material || '') === (newVar.material || '')
                            );
                        }

                        const oldStock = match ? (Number(match.stock) || 0) : 0;
                        const newStock = Number(newVar.stock) || 0;

                        if (oldStock === 0 && newStock > 0) {
                            // Lazy require to avoid circular deps
                            const NotificationService = require('./NotificationService');
                            // Notify subscribers for this variation
                            try {
                                await NotificationService.notifyRestockSubscribers(id, newVar, updatedProduct || {});
                            } catch (e) {
                                console.warn('Failed notifying restock subscribers for product', id, e.message || e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('Error checking restock notifications', e.message || e);
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedProduct
            })

        } catch (e) {
            reject(e)
        }
    })
}
const deleteProduct = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkProduct = await Product.findOne({
                _id: id
            })
            if (checkProduct === null) {
                resolve({
                    status: 'OK',
                    message: 'The product is not defined'
                })

            }
            await Product.findByIdAndDelete(id)
            resolve({
                status: 'OK',
                message: 'Delete product SUCCESS',

            })

        } catch (e) {
            reject(e)
        }
    })
}



const deleteManyProduct = (ids) => {
    console.log('_ids', ids)
    return new Promise(async (resolve, reject) => {
        try {
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                resolve({
                    status: 'ERR',
                    message: 'Danh sách ID là bắt buộc'
                });
                return;
            }
            
            await Product.deleteMany({ _id: { $in: ids } })
            resolve({
                status: 'OK',
                message: 'Delete product SUCCESS',
                count: ids.length
            })

        } catch (e) {
            reject(e)
        }
    })
}


const getDetailProduct = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const product = await Product.findById(id)
                .populate({ path: 'category', select: 'name slug parentCategory' })
                .populate('brand', 'name slug logo')
                .populate('collections', 'name slug');
            
            if (product === null) {
                resolve({
                    status: 'ERR',
                    message: 'Sản phẩm không tồn tại'
                })
                return
            }

            // Tăng lượt xem bất đồng bộ - không chặn response
            // Sử dụng updateOne để tối ưu hơn save()
            Product.updateOne(
                { _id: id },
                { $inc: { views: 1 } }
            ).catch(err => {
                // Log lỗi nhưng không ảnh hưởng đến response
                console.error('Error updating product views:', err);
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: product
            })

        } catch (e) {
            reject(e)
        }
    })
}
const getAllProduct = (limit, page, sort, filter, options = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { includeInactive = false } = options || {};
            
            // Base query - mặc định chỉ lấy sản phẩm active, admin có thể xem cả tạm dừng
            const activeCondition = includeInactive ? {} : { isActive: true };
            let baseQuery = { ...activeCondition };
            
            // Nếu có filter, tìm kiếm trong nhiều trường với fuzzy search
            // Filter có thể là array ['name', 'searchTerm'] hoặc string
            if (filter) {
                let searchLabel = 'name'; // Mặc định search theo name
                let searchTerm = null;
                
                // Xử lý filter: có thể là array hoặc string
                if (Array.isArray(filter) && filter.length >= 2) {
                    // Format: ['name', 'searchTerm']
                    searchLabel = filter[0];
                    searchTerm = filter[1];
                } else if (Array.isArray(filter) && filter.length === 1) {
                    // Chỉ có 1 phần tử, coi như là searchTerm
                    searchTerm = filter[0];
                } else if (typeof filter === 'string') {
                    // Nếu là string, coi như là searchTerm
                    searchTerm = filter;
                }
                
                // Nếu có searchTerm, thực hiện tìm kiếm
                if (searchTerm && searchTerm.trim().length > 0) {
                    const trimmedSearchTerm = searchTerm.trim();
                
                // Nếu filter là "name", sử dụng fuzzy search cho Vietnamese text
                    if (searchLabel === 'name') {
                        try {
                    // Tạo fuzzy search query với Vietnamese text matching
                            const fuzzyQuery = vietnameseUtils.createFuzzySearchQuery(trimmedSearchTerm);
                            
                            // Tìm category và brand có tên khớp (cho cả fuzzy và non-fuzzy)
                            const escapedSearchTerm = trimmedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const matchingCategories = await Category.find({
                                name: { $regex: escapedSearchTerm, $options: "i" },
                                isActive: true
                            }).select('_id').lean();
                            
                            const matchingBrands = await Brand.find({
                                name: { $regex: escapedSearchTerm, $options: "i" },
                                isActive: true
                            }).select('_id').lean();
                            
                            const categoryIds = matchingCategories.map(c => c._id);
                            const brandIds = matchingBrands.map(b => b._id);
                            
                            if (fuzzyQuery && fuzzyQuery.$or && Array.isArray(fuzzyQuery.$or) && fuzzyQuery.$or.length > 0) {
                                // Mở rộng fuzzy query để bao gồm category và brand
                                const orConditions = [...fuzzyQuery.$or];
                                
                                // Thêm điều kiện tìm theo category và brand
                                if (categoryIds.length > 0) {
                                    orConditions.push({ category: { $in: categoryIds } });
                                }
                                if (brandIds.length > 0) {
                                    orConditions.push({ brand: { $in: brandIds } });
                                }
                                
                        baseQuery = {
                            ...activeCondition,
                            $or: orConditions
                        };
                    } else {
                                // Fallback về search thông thường - tìm theo name, description, slug
                                // Và tìm theo category/brand bằng cách tìm category/brand trước
                                const escapedSearchTerm2 = trimmedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                
                                // Tìm category và brand có tên khớp
                                const matchingCategories2 = await Category.find({
                                    name: { $regex: escapedSearchTerm2, $options: "i" },
                                    isActive: true
                                }).select('_id').lean();
                                
                                const matchingBrands2 = await Brand.find({
                                    name: { $regex: escapedSearchTerm2, $options: "i" },
                                    isActive: true
                                }).select('_id').lean();
                                
                                const categoryIds2 = matchingCategories2.map(c => c._id);
                                const brandIds2 = matchingBrands2.map(b => b._id);
                                
                                // Tạo query với $or để tìm theo nhiều trường
                                const orConditions = [
                                    { name: { $regex: escapedSearchTerm2, $options: "i" } },
                                    { description: { $regex: escapedSearchTerm2, $options: "i" } },
                                    { slug: { $regex: escapedSearchTerm2, $options: "i" } }
                                ];
                                
                                // Thêm điều kiện tìm theo category và brand
                                if (categoryIds2.length > 0) {
                                    orConditions.push({ category: { $in: categoryIds2 } });
                                }
                                if (brandIds2.length > 0) {
                                    orConditions.push({ brand: { $in: brandIds2 } });
                                }
                                
                        baseQuery = {
                            ...activeCondition,
                            $or: orConditions
                        };
                            }
                        } catch (fuzzyError) {
                            // Nếu fuzzy search fail, fallback về search thông thường
                            console.error('[getAllProduct] Fuzzy search error:', fuzzyError);
                            const escapedSearchTerm = trimmedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            
                            // Tìm category và brand có tên khớp
                            const matchingCategories = await Category.find({
                                name: { $regex: escapedSearchTerm, $options: "i" },
                                isActive: true
                            }).select('_id').lean();
                            
                            const matchingBrands = await Brand.find({
                                name: { $regex: escapedSearchTerm, $options: "i" },
                                isActive: true
                            }).select('_id').lean();
                            
                            const categoryIds = matchingCategories.map(c => c._id);
                            const brandIds = matchingBrands.map(b => b._id);
                            
                            // Tạo query với $or để tìm theo nhiều trường
                            const orConditions = [
                                { name: { $regex: escapedSearchTerm, $options: "i" } },
                                { description: { $regex: escapedSearchTerm, $options: "i" } },
                                { slug: { $regex: escapedSearchTerm, $options: "i" } }
                            ];
                            
                            // Thêm điều kiện tìm theo category và brand
                            if (categoryIds.length > 0) {
                                orConditions.push({ category: { $in: categoryIds } });
                            }
                            if (brandIds.length > 0) {
                                orConditions.push({ brand: { $in: brandIds } });
                            }
                            
                            baseQuery = {
                                ...activeCondition,
                                $or: orConditions
                            };
                        }
                    } else {
                    // Nếu filter là trường khác, tìm kiếm trong trường đó (case-insensitive)
                        const escapedSearchTerm = trimmedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        baseQuery = {
                            ...activeCondition,
                            [searchLabel]: { '$regex': escapedSearchTerm, '$options': 'i' }
                        };
                    }
                }
            }
            
            // Đếm tổng số sản phẩm
            const totalProduct = await Product.countDocuments(baseQuery);
            
            // Base query với populate
            let query = Product.find(baseQuery)
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .populate('collections', 'name slug');
            
            // Apply sorting
            if (sort) {
                const objectSort = {};
                objectSort[sort[1]] = parseInt(sort[0]);
                query = query.sort(objectSort);
            } else {
                // Mặc định sort theo createdAt mới nhất
                query = query.sort({ createdAt: -1 });
            }
            
            // Apply pagination
            if (limit) {
                query = query.limit(limit).skip(page * limit);
            }
            
            let allProduct = await query;
            
            // Nếu đang tìm kiếm, sắp xếp lại theo độ liên quan (exact match trước)
            if (filter && Array.isArray(filter) && filter.length >= 2 && filter[0] === 'name') {
                const searchTerm = filter[1].toLowerCase();
                
                // Tính điểm relevance cho mỗi sản phẩm
                allProduct = allProduct.map(product => {
                    const p = product.toObject ? product.toObject() : product;
                    let relevanceScore = 0;
                    const productName = (p.name || '').toLowerCase();
                    const productDescription = (p.description || '').toLowerCase();
                    
                    if (productName === searchTerm) {
                        relevanceScore = 1000;
                    } else if (productName.startsWith(searchTerm)) {
                        relevanceScore = 500;
                    } else if (productName.includes(searchTerm)) {
                        relevanceScore = 100;
                    }
                    
                    if (productDescription.includes(searchTerm)) {
                        relevanceScore += 10;
                    }
                    
                    if (p.isFeatured) {
                        relevanceScore += 5;
                    }
                    if (p.selled > 0) {
                        relevanceScore += Math.min(p.selled / 100, 5);
                    }
                    
                    return { ...p, _relevanceScore: relevanceScore };
                });
                
                allProduct.sort((a, b) => {
                    if (b._relevanceScore !== a._relevanceScore) {
                        return b._relevanceScore - a._relevanceScore;
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                
                // Trả về plain objects và xóa _relevanceScore
                allProduct = allProduct.map(p => {
                    const { _relevanceScore, ...rest } = p;
                    return rest;
                });
            }
            
            // Nếu đang tìm kiếm theo "name", cũng tìm trong category và brand name
            // và thêm vào kết quả nếu chưa có
            if (filter && Array.isArray(filter) && filter.length >= 2 && filter[0] === 'name') {
                const searchTerm = filter[1];
                const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Tìm category và brand có tên khớp
                const Category = require('../models/CategoryModel');
                const Brand = require('../models/BrandModel');
                
                const matchingCategories = await Category.find({
                    name: { '$regex': escapedSearchTerm, '$options': 'i' },
                    isActive: true
                }).select('_id');
                
                const matchingBrands = await Brand.find({
                    name: { '$regex': escapedSearchTerm, '$options': 'i' },
                    isActive: true
                }).select('_id');
                
                // Tìm sản phẩm theo category hoặc brand
                if (matchingCategories.length > 0 || matchingBrands.length > 0) {
                    const additionalQuery = { ...activeCondition };
                    const orConditions = [];
                    
                    if (matchingCategories.length > 0) {
                        orConditions.push({ category: { $in: matchingCategories.map(c => c._id) } });
                    }
                    if (matchingBrands.length > 0) {
                        orConditions.push({ brand: { $in: matchingBrands.map(b => b._id) } });
                    }
                    
                    if (orConditions.length > 0) {
                        additionalQuery.$or = orConditions;
                        
                        // Lấy thêm sản phẩm từ category/brand
                        let additionalQueryBuilder = Product.find(additionalQuery)
                            .populate('category', 'name slug')
                            .populate('brand', 'name slug')
                            .populate('collections', 'name slug');
                        
                        if (sort) {
                            const objectSort = {};
                            objectSort[sort[1]] = parseInt(sort[0]);
                            additionalQueryBuilder = additionalQueryBuilder.sort(objectSort);
                        } else {
                            additionalQueryBuilder = additionalQueryBuilder.sort({ createdAt: -1 });
                        }
                        
                        const additionalProducts = await additionalQueryBuilder;
                        
                        // Kết hợp và loại bỏ trùng lặp
                        const existingIds = new Set(allProduct.map(p => p._id ? p._id.toString() : ''));
                        const newProducts = additionalProducts
                            .filter(p => !existingIds.has(p._id ? p._id.toString() : ''))
                            .map(product => {
                                const p = product.toObject ? product.toObject() : product;
                                let relevanceScore = 50; 
                                const productName = (p.name || '').toLowerCase();
                                
                                if (productName.includes(searchTerm.toLowerCase())) {
                                    relevanceScore += 20;
                                }
                                
                                if (p.isFeatured) {
                                    relevanceScore += 5;
                                }
                                if (p.selled > 0) {
                                    relevanceScore += Math.min(p.selled / 100, 5);
                                }
                                
                                return { ...p, _relevanceScore: relevanceScore };
                            });
                        
                        allProduct = [...allProduct, ...newProducts];
                        
                        allProduct.sort((a, b) => {
                            const aScore = a._relevanceScore || 0;
                            const bScore = b._relevanceScore || 0;
                            if (bScore !== aScore) {
                                return bScore - aScore;
                            }
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        });
                        
                        allProduct = allProduct.map(p => {
                            const { _relevanceScore, ...rest } = p;
                            return rest;
                        });
                        
                        // Giới hạn lại theo limit nếu có
                        if (limit) {
                            allProduct = allProduct.slice(0, limit);
                        }
                    }
                }
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allProduct,
                total: totalProduct,
                pageCurrent: Number(page + 1),
                totalPage: limit ? Math.ceil(totalProduct / limit) : 1
            })

        } catch (e) {
            reject(e)
        }
    })
}



const getAllType = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allType = await Product.distinct('type')
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allType,

            })

        } catch (e) {
            reject(e)
        }
    })
}
// Get featured products
const getFeaturedProducts = (limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const products = await Product.find({ isFeatured: true, isActive: true })
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .sort({ createdAt: -1 })
                .limit(limit);
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: products
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get new products - lấy sản phẩm mới nhất theo ngày tạo
const getNewProducts = (limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Lấy tất cả sản phẩm active, sắp xếp theo ngày tạo mới nhất
            const products = await Product.find({ isActive: true })
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất
                .limit(limit);
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: products
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get best selling products
const getBestSellingProducts = (limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const products = await Product.find({ isActive: true })
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .sort({ selled: -1 })
                .limit(limit);
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: products
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get products by collection
const getProductsByCollection = (collectionSlug, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const Collection = require('../models/CollectionModel');
            const collection = await Collection.findOne({ slug: collectionSlug });
            
            if (!collection) {
                return resolve({
                    status: 'ERR',
                    message: 'Collection not found'
                });
            }

            const products = await Product.find({ 
                collections: collection._id,
                isActive: true 
            })
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .limit(limit);
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: products
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get most favorite products (sorted by rating)
const getMostFavoriteProducts = (limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const products = await Product.find({ isActive: true })
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .sort({ favoritesCount: -1, rating: -1 })
                .limit(limit);
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: products
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get flash sale products (products currently on sale)
const getFlashSaleProducts = (limit = 10, categories = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date();
            
            // Base conditions for flash-sale products
            const baseQuery = {
                isActive: true,
                discount: { $gt: 0 },
                $or: [
                    // No sale dates (backwards compatibility)
                    {
                        $and: [
                            { $or: [{ saleStartDate: { $exists: false } }, { saleStartDate: null }] },
                            { $or: [{ saleEndDate: { $exists: false } }, { saleEndDate: null }] }
                        ]
                    },
                    // Has sale dates and currently in sale window
                    {
                        $and: [
                            { saleStartDate: { $exists: true, $ne: null, $lte: now } },
                            { saleEndDate: { $exists: true, $ne: null, $gte: now } }
                        ]
                    }
                ]
            };

            if (categories) {
                // categories may be comma-separated string or array
                let catIds = [];
                if (typeof categories === 'string') {
                    catIds = categories.split(',').map(s => s.trim()).filter(Boolean);
                } else if (Array.isArray(categories)) {
                    catIds = categories.map(String);
                }

                // Expand parent categories to include their children if needed
                const Category = require('../models/CategoryModel');
                const finalIds = [];
                for (const id of catIds) {
                    try {
                        const cat = await Category.findById(id).lean();
                        if (cat && !cat.parentCategory) {
                            const children = await Category.find({ parentCategory: id }).select('_id').lean();
                            if (children && children.length) {
                                finalIds.push(...children.map(c => String(c._id)));
                                continue;
                            }
                        }
                        finalIds.push(String(id));
                    } catch (e) {
                        finalIds.push(String(id));
                    }
                }

                if (finalIds.length > 0) {
                    baseQuery.category = { $in: finalIds };
                }
            }

            let query = Product.find(baseQuery)
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .sort({ discount: -1, createdAt: -1 });

            if (limit) query = query.limit(limit);

            const products = await query;
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: products
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get products by category
const getProductsByCategory = (categoryId, limit = 20, page = 0, sort = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!categoryId) {
                resolve({
                    status: 'ERR',
                    message: 'Category ID is required'
                });
                return;
            }

            // Hỗ trợ category cha: nếu categoryId là danh mục cha (root),
            // thì lấy các danh mục con và trả về sản phẩm của tất cả các danh mục đó.
            // Build list of category IDs to query (include provided id and its children if any)
            let categoryIds = [categoryId];
            try {
                const parentCat = await Category.findById(categoryId).lean();
                if (parentCat && !parentCat.parentCategory) {
                    const children = await Category.find({ parentCategory: categoryId }).select('_id').lean();
                    const childIds = children.map(c => String(c._id));
                    categoryIds = categoryIds.concat(childIds);
                }
            } catch (err) {
                // noop - if Category lookup fails, fallback to single categoryId
            }

            // Base query - lấy sản phẩm theo category (có thể là nhiều id) và isActive
            const baseQuery = { 
                category: { $in: categoryIds },
                isActive: true 
            };
            
            // Đếm tổng số sản phẩm
            const totalProduct = await Product.countDocuments(baseQuery);
            
            // Build query với populate
            let query = Product.find(baseQuery)
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .populate('collections', 'name slug');
            
            // Apply sorting
            if (sort) {
                const sortParts = sort.startsWith('-') 
                    ? [sort.substring(1), '-1'] 
                    : [sort, '1'];
                const objectSort = {};
                objectSort[sortParts[0]] = parseInt(sortParts[1]);
                query = query.sort(objectSort);
            } else {
                // Mặc định sort theo createdAt mới nhất
                query = query.sort({ createdAt: -1 });
            }
            
            // Apply pagination
            if (limit) {
                query = query.limit(limit).skip(page * limit);
            }
            
            const products = await query;
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: products,
                total: totalProduct,
                pageCurrent: Number(page + 1),
                totalPage: limit ? Math.ceil(totalProduct / limit) : 1
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Add favorite
const addFavorite = (productId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!productId || !userId) {
                resolve({
                    status: 'ERR',
                    message: 'productId và userId là bắt buộc'
                });
                return;
            }

            const updated = await Product.findOneAndUpdate(
                { _id: productId, favorites: { $ne: userId } },
                { $addToSet: { favorites: userId }, $inc: { favoritesCount: 1 } },
                { new: true }
            );

            if (!updated) {
                resolve({
                    status: 'OK',
                    message: 'Đã yêu thích',
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'Đã thêm vào danh sách yêu thích',
                data: { favoritesCount: updated.favoritesCount }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Remove favorite
const removeFavorite = (productId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!productId || !userId) {
                resolve({
                    status: 'ERR',
                    message: 'productId và userId là bắt buộc'
                });
                return;
            }

            const updated = await Product.findOneAndUpdate(
                { _id: productId, favorites: userId },
                { $pull: { favorites: userId }, $inc: { favoritesCount: -1 } },
                { new: true }
            );

            if (!updated) {
                resolve({
                    status: 'OK',
                    message: 'Đã bỏ yêu thích',
                });
                return;
            }

            resolve({
                status: 'OK',
                message: 'Đã xóa khỏi danh sách yêu thích',
                data: { favoritesCount: updated.favoritesCount }
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get user's favorite products
const getFavoriteProducts = (userId, limit = 50, page = 0) => {
    return new Promise(async (resolve, reject) => {
        try {
            const Product = require('../models/ProductModel');
            const total = await Product.countDocuments({ favorites: userId, isActive: true });
            const products = await Product.find({ favorites: userId, isActive: true })
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(page * limit);
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: products,
                total: total,
                pageCurrent: Number(page + 1),
                totalPage: Math.ceil(total / limit)
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Chuẩn hóa dữ liệu sản phẩm trả về cho search AI
const sanitizeProductForSearch = (product) => {
    // Chỉ kiểm tra _id và name - KHÔNG loại bỏ sản phẩm vì giá
    // Vì có thể sản phẩm chưa có giá nhưng vẫn cần hiển thị
    if (!product || !product._id) {
        return null;
    }

    // Đảm bảo có name - nếu không có thì dùng tên mặc định
    const productName = product.name || 'Sản phẩm không tên';
    
    // Xử lý giá - cho phép giá = 0 hoặc null
    const basePrice = Number(product.originalPrice || product.price || 0);
    const salePrice = Number(product.price || 0);
    
    // Luôn có giá (có thể là 0) - không loại bỏ sản phẩm
    const resolvedOriginalPrice = basePrice > 0 ? basePrice : (salePrice > 0 ? salePrice : 0);
    const resolvedSalePrice = salePrice > 0 ? salePrice : (basePrice > 0 ? basePrice : 0);
    const discountPrice = product.discount && resolvedSalePrice > 0
        ? Math.max(resolvedSalePrice * (1 - product.discount / 100), 0)
        : resolvedSalePrice;

    // Xử lý image - đảm bảo luôn có image (có thể là placeholder)
    const productImage = product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);

    return {
        ...product,
        _id: product._id,
        name: productName, // Đảm bảo luôn có name
        image: productImage, // Đảm bảo luôn có image (có thể null)
        images: product.images || (productImage ? [productImage] : []),
        originalPrice: resolvedOriginalPrice,
        price: resolvedSalePrice,
        discountPrice,
        discount: product.discount || 0,
        rating: product.rating || 0,
        slug: product.slug || '',
        type: product.type || '',
        category: product.category || null,
        brand: product.brand
            ? {
                id: product.brand._id || product.brand.id || product.brand,
                name: product.brand.name || product.brand,
                slug: product.brand.slug
            }
            : null
    };
};

// Normalize keyword list (lowercase, remove diacritics, unique)
const normalizeKeyword = (keyword = '') => vietnameseUtils.normalizeText(keyword || '');
const buildNormalizedKeywords = (keywords = []) => {
    const normalized = keywords
        .filter(Boolean)
        .map((k) => normalizeKeyword(k))
        .filter((k) => k.length > 0);
    return [...new Set(normalized)].slice(0, 5);
};

// Build normalized search fields from product
const buildProductSearchFields = (product = {}) => {
    return {
        name: normalizeKeyword(product.name || ''),
        slug: normalizeKeyword(product.slug || ''),
        category: normalizeKeyword(product.category?.name || ''),
        brand: normalizeKeyword(product.brand?.name || ''),
        description: normalizeKeyword(product.description || ''),
        type: normalizeKeyword(product.type || '')
    };
};

// Scoring relevance for a product against normalized keywords
const scoreProductRelevance = (product, normalizedKeywords = []) => {
    if (!product || !normalizedKeywords.length) return 0;
    const fields = buildProductSearchFields(product);
    let total = 0;
    let hasStrongPrefix = false;

    normalizedKeywords.forEach((keyword) => {
        if (!keyword) return;
        const isShort = keyword.length <= 2;

        // Name priority
        if (fields.name === keyword) {
            total += 140;
        } else if (fields.name.startsWith(keyword)) {
            total += 110;
        } else if (fields.name.includes(keyword)) {
            total += 70;
        }

        // Slug
        if (fields.slug.startsWith(keyword)) {
            total += 50;
        } else if (fields.slug.includes(keyword)) {
            total += 30;
        }

        // Category / brand / type
        if (fields.category.startsWith(keyword)) {
            total += 60;
        } else if (fields.category.includes(keyword)) {
            total += 30;
        }

        if (fields.brand.startsWith(keyword)) {
            total += 40;
        } else if (fields.brand.includes(keyword)) {
            total += 20;
        }

        if (fields.type.startsWith(keyword)) {
            total += 25;
        } else if (fields.type.includes(keyword)) {
            total += 10;
        }

        // Description chi cong nhe khi tu khoa du dai
        if (!isShort && fields.description.includes(keyword)) {
            total += 10;
        }

        if (fields.name.startsWith(keyword) || fields.slug.startsWith(keyword)) {
            hasStrongPrefix = true;
        }

        // Với từ khoá quá ngắn, phạt các match lỏng để giảm nhiễu
        if (isShort && !(fields.name.startsWith(keyword) || fields.slug.startsWith(keyword))) {
            total -= 40;
        }
    });

    const matchedCount = normalizedKeywords.filter((k) => k && (
        fields.name.includes(k) ||
        fields.slug.includes(k) ||
        fields.category.includes(k) ||
        fields.brand.includes(k)
    )).length;

    if (matchedCount >= normalizedKeywords.length && normalizedKeywords.length > 0) {
        total += 40;
    } else if (matchedCount >= Math.ceil(normalizedKeywords.length * 0.6)) {
        total += 20;
    }

    // Business signals
    total += product.isFeatured ? 8 : 0;
    total += Math.min(product.selled || 0, 8000) / 800 * 10; // up to 10 points
    total += Math.min(product.rating || 0, 5) * 2;

    // Nếu từ khóa quá ngắn mà không có prefix match mạnh, loại bỏ
    if (normalizedKeywords.some((k) => k.length <= 2) && !hasStrongPrefix) {
        return 0;
    }

    return total;
};

/* ============================================================
   🔍 TÌM KIẾM SẢN PHẨM VỚI AI (Search with AI Normalization)
   Sử dụng Gemini AI để chuẩn hóa từ khóa và tìm kiếm thông minh
   ============================================================ */
const searchProductsWithAI = async (keyword, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!keyword || keyword.trim().length === 0) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: [],
                    total: 0
                });
                return;
            }

            const ChatService = require('./ChatService');

            // Step 1: Normalize keyword via AI
            const trimmedKeyword = keyword.trim();
            const { normalized, relatedKeywords } = await ChatService.normalizeKeywords(trimmedKeyword);
            const normalizedKeyword = normalized || trimmedKeyword;

            console.log('dY"? AI Normalized Keywords:', {
                original: keyword,
                normalizedKeyword,
                relatedKeywords
            });

            // Step 2: Build search keyword list (use normalized first)
            const candidateKeywords = [
                trimmedKeyword,
                normalized,
                ...(Array.isArray(relatedKeywords) ? relatedKeywords : [])
            ]
                .filter(Boolean)
                .map(k => k.trim());

            const uniqueKeywords = [...new Set(candidateKeywords)].filter(k => k.length > 0);
            const searchKeywords = uniqueKeywords.length > 0 ? uniqueKeywords : [trimmedKeyword];
            const normalizedKeywords = buildNormalizedKeywords(searchKeywords);
            const perKeywordLimit = Math.max(limit * 2, 15);
            const productMap = new Map();

            // Step 3: Query per keyword with accent-insensitive fuzzy + prefix for short terms
            for (const searchTerm of searchKeywords) {
                const normalizedTerm = normalizeKeyword(searchTerm);
                if (!normalizedTerm) continue;
                const isShort = normalizedTerm.length <= 2;

                const fuzzyQuery = vietnameseUtils.createFuzzySearchQuery(searchTerm, { prefixOnly: isShort });
                const escapedSearchTerm = escapeRegex(searchTerm);
                const orConditions = (fuzzyQuery && Array.isArray(fuzzyQuery.$or)) ? [...fuzzyQuery.$or] : [];

                const matchingCategories = await Category.find({
                    name: { $regex: escapedSearchTerm, $options: "i" },
                    isActive: true
                }).select('_id').lean();

                const matchingBrands = await Brand.find({
                    name: { $regex: escapedSearchTerm, $options: "i" },
                    isActive: true
                }).select('_id').lean();

                const categoryIds = matchingCategories.map(c => c._id);
                const brandIds = matchingBrands.map(b => b._id);

                if (categoryIds.length > 0) {
                    orConditions.push({ category: { $in: categoryIds } });
                }
                if (brandIds.length > 0) {
                    orConditions.push({ brand: { $in: brandIds } });
                }

                if (orConditions.length === 0) {
                    orConditions.push(
                        { name: { $regex: escapedSearchTerm, $options: "i" } },
                        { slug: { $regex: escapedSearchTerm, $options: "i" } }
                    );
                }

                const query = { isActive: true, $or: orConditions };
                const products = await Product.find(query)
                    .populate('category', 'name slug')
                    .populate('brand', 'name slug')
                    .populate('collections', 'name slug')
                    .select("name image images price originalPrice discount rating slug category brand description selled isFeatured createdAt type")
                    .limit(perKeywordLimit)
                    .lean();

                products.forEach(product => {
                    const sanitizedProduct = sanitizeProductForSearch(product);
                    if (!sanitizedProduct) return;
                    const key = String(product._id);
                    if (!productMap.has(key)) {
                        productMap.set(key, sanitizedProduct);
                    }
                });
            }

            const scoredProducts = Array.from(productMap.values())
                .map((product) => ({
                    ...product,
                    _relevanceScore: scoreProductRelevance(product, normalizedKeywords)
                }))
                .filter((p) => p._relevanceScore > 0);

            scoredProducts.sort((a, b) => {
                if (b._relevanceScore !== a._relevanceScore) {
                    return b._relevanceScore - a._relevanceScore;
                }
                return (b.selled || 0) - (a.selled || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            const resultProducts = scoredProducts
                .slice(0, limit)
                .map(({ _relevanceScore, ...product }) => product);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: resultProducts,
                total: resultProducts.length,
                originalKeyword: keyword,
                normalizedKeyword,
                relatedKeywords: Array.isArray(relatedKeywords) ? relatedKeywords.slice(0, 5) : [],
                suggestionKeywords: uniqueKeywords.slice(0, 5),
                keywordsForQuery: uniqueKeywords.slice(0, 5)
            });

        } catch (e) {
            console.error('Error in searchProductsWithAI:', e);
            reject(e);
        }
    });
};

/* ============================================================
   🔍 TÌM KIẾM SẢN PHẨM CHUẨN (Search Products - Clean Response)
   Sử dụng AI chuẩn hóa từ khóa (ẩn khỏi user), tìm trong name, description, category.name, brand.name
   Trả về response sạch không có thông tin AI normalization
   ============================================================ */
const searchProducts = async (keyword, limit = 20) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!keyword || keyword.trim().length === 0) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: [],
                    total: 0,
                    relatedKeywords: []
                });
                return;
            }

            const ChatService = require('./ChatService');

            // Normalize keyword silently for BE search
            const trimmedKeyword = keyword.trim();
            const { normalized, relatedKeywords } = await ChatService.normalizeKeywords(trimmedKeyword);
            const candidateKeywords = [
                trimmedKeyword,
                normalized,
                ...(Array.isArray(relatedKeywords) ? relatedKeywords : [])
            ]
                .filter(Boolean)
                .map((k) => k.trim());

            const uniqueKeywords = [...new Set(candidateKeywords)].filter(k => k.length > 0);
            const searchKeywords = uniqueKeywords.length > 0 ? uniqueKeywords : [trimmedKeyword];
            const normalizedKeywords = buildNormalizedKeywords(searchKeywords);
            const perKeywordLimit = Math.max(limit * 2, 20);
            const productMap = new Map();

            for (const searchTerm of searchKeywords) {
                const normalizedTerm = normalizeKeyword(searchTerm);
                if (!normalizedTerm) continue;
                const isShort = normalizedTerm.length <= 2;

                const fuzzyQuery = vietnameseUtils.createFuzzySearchQuery(searchTerm, { prefixOnly: isShort });
                const escapedSearchTerm = escapeRegex(searchTerm);
                const orConditions = (fuzzyQuery && Array.isArray(fuzzyQuery.$or)) ? [...fuzzyQuery.$or] : [];

                const matchingCategories = await Category.find({
                    name: { $regex: escapedSearchTerm, $options: "i" },
                    isActive: true
                }).select('_id').lean();

                const matchingBrands = await Brand.find({
                    name: { $regex: escapedSearchTerm, $options: "i" },
                    isActive: true
                }).select('_id').lean();

                const categoryIds = matchingCategories.map(c => c._id);
                const brandIds = matchingBrands.map(b => b._id);

                if (categoryIds.length > 0) {
                    orConditions.push({ category: { $in: categoryIds } });
                }
                if (brandIds.length > 0) {
                    orConditions.push({ brand: { $in: brandIds } });
                }

                if (orConditions.length === 0) {
                    orConditions.push(
                        { name: { $regex: escapedSearchTerm, $options: "i" } },
                        { slug: { $regex: escapedSearchTerm, $options: "i" } }
                    );
                }

                const query = { isActive: true, $or: orConditions };
                const products = await Product.find(query)
                    .populate('category', 'name slug')
                    .populate('brand', 'name slug')
                    .populate('collections', 'name slug')
                    .select("name image images price originalPrice discount rating slug category brand description selled isFeatured createdAt type")
                    .limit(perKeywordLimit)
                    .lean();

                products.forEach(product => {
                    const sanitizedProduct = sanitizeProductForSearch(product);
                    if (!sanitizedProduct) return;
                    const key = String(product._id);
                    if (!productMap.has(key)) {
                        productMap.set(key, sanitizedProduct);
                    }
                });
            }

            const scoredProducts = Array.from(productMap.values())
                .map((product) => ({
                    ...product,
                    _relevanceScore: scoreProductRelevance(product, normalizedKeywords)
                }))
                .filter((p) => p._relevanceScore > 0);

            scoredProducts.sort((a, b) => {
                if (b._relevanceScore !== a._relevanceScore) {
                    return b._relevanceScore - a._relevanceScore;
                }
                return (b.selled || 0) - (a.selled || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            const resultProducts = scoredProducts
                .slice(0, limit)
                .map(({ _relevanceScore, ...product }) => product);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: resultProducts,
                total: resultProducts.length,
                relatedKeywords: Array.isArray(relatedKeywords) ? relatedKeywords.slice(0, 5) : []
            });

        } catch (e) {
            console.error('Error in searchProducts:', e);
            reject(e);
        }
    });
};

/* ============================================================
   🔍 TÌM KIẾM AUTocomplete NHANH (Fast Autocomplete Search)
   Tối ưu cho autocomplete - không dùng AI, chỉ tìm trong name và slug
   Trả về nhanh với ít dữ liệu nhất
   ============================================================ */
const searchProductsAutocomplete = async (keyword, limit = 4) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!keyword || keyword.trim().length === 0) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: [],
                    total: 0
                });
                return;
            }

            const trimmedKeyword = keyword.trim();
            const normalizedKeyword = normalizeKeyword(trimmedKeyword);
            if (!normalizedKeyword) {
                resolve({ status: 'OK', message: 'SUCCESS', data: [], total: 0 });
                return;
            }

            const fuzzyQuery = vietnameseUtils.createFuzzySearchQuery(trimmedKeyword, { prefixOnly: true });
            const escapedSearchTerm = escapeRegex(trimmedKeyword);
            const orConditions = (fuzzyQuery && Array.isArray(fuzzyQuery.$or)) ? [...fuzzyQuery.$or] : [
                { name: { $regex: `(?:^|\s)${escapedSearchTerm}`, $options: "i" } },
                { slug: { $regex: `(?:^|\s)${escapedSearchTerm}`, $options: "i" } }
            ];

            const query = {
                isActive: true,
                $or: orConditions
            };

            const products = await Product.find(query)
                .select("_id name image images price discount slug category brand description selled isFeatured createdAt type")
                .limit(limit * 2)
                .lean();

            const scoredProducts = products
                .map((product) => {
                    const sanitized = sanitizeProductForSearch(product);
                    if (!sanitized) return null;
                    return {
                        ...sanitized,
                        _relevanceScore: scoreProductRelevance(sanitized, [normalizedKeyword])
                    };
                })
                .filter(Boolean)
                .filter((p) => p._relevanceScore > 0);

            scoredProducts.sort((a, b) => {
                if (b._relevanceScore !== a._relevanceScore) {
                    return b._relevanceScore - a._relevanceScore;
                }
                return (b.selled || 0) - (a.selled || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            const resultProducts = scoredProducts
                .slice(0, limit)
                .map(({ _relevanceScore, ...product }) => product);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: resultProducts,
                total: resultProducts.length
            });

        } catch (e) {
            console.error('Error in searchProductsAutocomplete:', e);
            reject(e);
        }
    });
};

/**
 * Tìm kiếm sản phẩm dựa trên mô tả từ ảnh
 * @param {string} description - Mô tả sản phẩm từ Gemini Vision
 * @param {number} limit - Số lượng sản phẩm tối đa
 * @returns {Promise} - Danh sách sản phẩm tương tự
 */
const searchProductsByImageDescription = async (description, limit = 20) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!description || description.trim().length === 0) {
                console.log('[ImageSearch] Empty description');
                resolve({
                    status: 'ERR',
                    message: 'Không có mô tả sản phẩm',
                    data: [],
                    total: 0
                });
                return;
            }

            const trimmedDescription = description.trim();
            console.log('[ImageSearch] Processing description:', trimmedDescription.substring(0, 100));
            
            // Hàm helper để tạo regex pattern linh hoạt hơn (cho phép sai 1-2 ký tự)
            const createFlexibleRegex = (keyword) => {
                if (!keyword || keyword.length < 2) return keyword;
                
                // Escape special regex characters
                const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Loại bỏ dấu tiếng Việt để tìm kiếm linh hoạt hơn
                const noDiacritics = vietnameseUtils.removeVietnameseDiacritics(keyword.toLowerCase());
                
                // Tạo pattern match cả có dấu và không dấu
                const patterns = [escaped, noDiacritics];
                
                // Tạo pattern cho từng ký tự có thể có dấu
                const flexiblePattern = keyword
                    .toLowerCase()
                    .split('')
                    .map(char => {
                        const noDiacriticsChar = vietnameseUtils.removeVietnameseDiacritics(char);
                        // Nếu ký tự có thể có dấu, tạo pattern match cả có dấu và không dấu
                        if (noDiacriticsChar !== char) {
                            return `[${char}${noDiacriticsChar}]`;
                        }
                        return char;
                    })
                    .join('');
                
                if (flexiblePattern !== escaped) {
                    patterns.push(flexiblePattern);
                }
                
                // Loại bỏ duplicates và tạo regex
                const uniquePatterns = [...new Set(patterns.filter(Boolean))];
                return uniquePatterns.length > 0 ? `(${uniquePatterns.join('|')})` : escaped;
            };
            
            // Tách các từ khóa từ mô tả - cải thiện để giữ cả cụm từ và tách thành từng từ
            const rawKeywords = trimmedDescription
                .toLowerCase()
                .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ,]/g, ' ')
                .split(/[\s,]+/) // Tách theo khoảng trắng hoặc dấu phẩy
                .filter(word => word.length > 1); // Lọc từ có độ dài > 1
            
            // Tạo set để lưu keywords (cả cụm từ và từng từ riêng lẻ)
            let keywords = new Set();
            
            // Thêm cụm từ gốc (nếu có nhiều từ liên tiếp)
            rawKeywords.forEach((word, index) => {
                // Thêm từ đơn
                keywords.add(word);
                
                // Tạo cụm từ 2 từ (ví dụ: "túi xách")
                if (index < rawKeywords.length - 1) {
                    const twoWordPhrase = `${word} ${rawKeywords[index + 1]}`;
                    keywords.add(twoWordPhrase);
                }
                
                // Tạo cụm từ 3 từ (ví dụ: "giày thể thao")
                if (index < rawKeywords.length - 2) {
                    const threeWordPhrase = `${word} ${rawKeywords[index + 1]} ${rawKeywords[index + 2]}`;
                    keywords.add(threeWordPhrase);
                }
            });
            
            // Chuyển set thành array và loại bỏ duplicates
            keywords = Array.from(keywords).filter((word, index, self) => self.indexOf(word) === index);
            
            // Thêm các từ khóa liên quan (synonyms)
            const keywordSynonyms = {
                'giày': ['giày', 'sneaker', 'boot', 'dép'],
                'sneaker': ['giày', 'sneaker', 'giày thể thao'],
                'boot': ['giày', 'boot', 'giày cao cổ'],
                'dép': ['dép', 'sandal'],
                'túi': ['túi', 'túi xách', 'túi đeo', 'túi'],
                'xách': ['túi xách', 'túi', 'xách'],
                'túi xách': ['túi xách', 'túi', 'xách', 'túi đeo'],
                'balo': ['balo', 'ba lô', 'túi balo'],
                'ví': ['ví', 'ví da', 'ví cầm tay'],
                'kính': ['kính', 'kính mắt', 'kính râm'],
                'thắt lưng': ['thắt lưng', 'dây nịt', 'thắt lưng da'],
                'thắt': ['thắt lưng', 'dây nịt'],
                'lưng': ['thắt lưng', 'dây nịt'],
                'dây': ['dây nịt', 'thắt lưng'],
                'nịt': ['dây nịt', 'thắt lưng'],
                'màu': ['màu'],
                'xanh': ['xanh', 'màu xanh'],
                'đen': ['đen', 'màu đen'],
                'trắng': ['trắng', 'màu trắng'],
                'canvas': ['canvas', 'vải canvas']
            };
            
            // Mở rộng keywords với synonyms
            const expandedKeywords = new Set(keywords);
            keywords.forEach(keyword => {
                // Tìm synonyms cho từ khóa
                Object.keys(keywordSynonyms).forEach(synonymKey => {
                    // Match exact hoặc partial
                    if (keyword === synonymKey || 
                        keyword.includes(synonymKey) || 
                        synonymKey.includes(keyword)) {
                        keywordSynonyms[synonymKey].forEach(syn => expandedKeywords.add(syn));
                    }
                });
                
                // Tách cụm từ thành từng từ riêng lẻ và thêm synonyms
                const words = keyword.split(/\s+/);
                words.forEach(word => {
                    if (word.length > 1) {
                        expandedKeywords.add(word); // Thêm từng từ riêng lẻ
                        // Tìm synonyms cho từng từ
                        Object.keys(keywordSynonyms).forEach(synonymKey => {
                            if (word === synonymKey || word.includes(synonymKey) || synonymKey.includes(word)) {
                                keywordSynonyms[synonymKey].forEach(syn => expandedKeywords.add(syn));
                            }
                        });
                    }
                });
            });
            
            keywords = Array.from(expandedKeywords).slice(0, 30); // Tăng lên 30 từ khóa để bao phủ tốt hơn

            if (keywords.length === 0) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: [],
                    total: 0
                });
                return;
            }

            // Tìm category và brand có tên khớp với keywords (sử dụng flexible search)
            const Category = require('../models/CategoryModel');
            const Brand = require('../models/BrandModel');
            
            // Tạo các pattern linh hoạt cho category và brand
            const categoryPatterns = [];
            const brandPatterns = [];
            
            keywords.forEach(keyword => {
                if (keyword && keyword.length > 1) {
                    const flexiblePattern = createFlexibleRegex(keyword);
                    categoryPatterns.push({ name: { $regex: flexiblePattern, $options: 'i' } });
                    brandPatterns.push({ name: { $regex: flexiblePattern, $options: 'i' } });
                }
            });
            
            const matchingCategories = categoryPatterns.length > 0 ? await Category.find({
                $or: categoryPatterns,
                isActive: true
            }).select('_id name').lean() : [];
            
            const matchingBrands = brandPatterns.length > 0 ? await Brand.find({
                $or: brandPatterns,
                isActive: true
            }).select('_id name').lean() : [];
            
            const categoryIds = matchingCategories.map(c => c._id);
            const brandIds = matchingBrands.map(b => b._id);
            
            console.log('[ImageSearch] Matching categories:', matchingCategories.map(c => c.name));
            console.log('[ImageSearch] Matching brands:', matchingBrands.map(b => b.name));
            
            // Tạo query tìm kiếm với các từ khóa - sử dụng flexible regex để tìm linh hoạt hơn
            const orConditions = [];
            
            if (keywords.length > 0) {
                keywords.forEach(keyword => {
                    // Chỉ thêm keyword nếu có độ dài hợp lệ
                    if (keyword && keyword.length > 1) {
                        const flexiblePattern = createFlexibleRegex(keyword);
                        
                        // Tìm kiếm trong nhiều trường với pattern linh hoạt
                        orConditions.push(
                            { name: { $regex: flexiblePattern, $options: 'i' } },
                            { description: { $regex: flexiblePattern, $options: 'i' } },
                            { type: { $regex: flexiblePattern, $options: 'i' } },
                            { slug: { $regex: flexiblePattern, $options: 'i' } }
                        );
                        
                        // Thêm tìm kiếm không dấu (fallback)
                        const noDiacritics = vietnameseUtils.removeVietnameseDiacritics(keyword);
                        if (noDiacritics !== keyword.toLowerCase()) {
                            orConditions.push(
                                { name: { $regex: noDiacritics, $options: 'i' } },
                                { description: { $regex: noDiacritics, $options: 'i' } },
                                { slug: { $regex: noDiacritics, $options: 'i' } }
                            );
                        }
                    }
                });
            }
            
            // Thêm điều kiện tìm theo category và brand
            if (categoryIds.length > 0) {
                orConditions.push({ category: { $in: categoryIds } });
            }
            if (brandIds.length > 0) {
                orConditions.push({ brand: { $in: brandIds } });
            }

            // Nếu không có điều kiện nào, sử dụng mô tả gốc
            if (orConditions.length === 0) {
                // Tách mô tả thành các từ đơn giản
                const simpleKeywords = trimmedDescription
                    .toLowerCase()
                    .split(/\s+/)
                    .filter(word => word.length > 2)
                    .slice(0, 5);
                
                simpleKeywords.forEach(keyword => {
                    orConditions.push(
                        { name: { $regex: keyword, $options: 'i' } },
                        { type: { $regex: keyword, $options: 'i' } }
                    );
                });
            }

            // Tìm sản phẩm khớp với bất kỳ từ khóa nào trong name, description, type
            const query = {
                isActive: true
            };
            
            // Chỉ thêm $or nếu có điều kiện
            if (orConditions.length > 0) {
                query.$or = orConditions;
            } else {
                // Fallback: tìm tất cả sản phẩm active
                console.log('[ImageSearch] No keywords found, returning all active products');
            }
            
            console.log('[ImageSearch] Keywords:', keywords);
            console.log('[ImageSearch] Query:', JSON.stringify(query, null, 2));

            // Tìm tất cả sản phẩm khớp
            let allProducts = [];
            try {
                allProducts = await Product.find(query)
                    .populate('category', 'name')
                    .populate('brand', 'name')
                    .lean();
                
                console.log('[ImageSearch] Found products:', allProducts.length);
            } catch (queryError) {
                console.error('[ImageSearch] Query error:', queryError);
                // Fallback: tìm với query đơn giản hơn, sử dụng flexible regex
                console.log('[ImageSearch] Trying fallback query...');
                const fallbackOrConditions = [];
                keywords.slice(0, 5).forEach(keyword => {
                    if (keyword && keyword.length > 1) {
                        const flexiblePattern = createFlexibleRegex(keyword);
                        const noDiacritics = vietnameseUtils.removeVietnameseDiacritics(keyword);
                        fallbackOrConditions.push(
                            { name: { $regex: flexiblePattern, $options: 'i' } },
                            { name: { $regex: noDiacritics, $options: 'i' } }
                        );
                    }
                });
                
                const fallbackQuery = {
                    isActive: true,
                    $or: fallbackOrConditions.length > 0 ? fallbackOrConditions : [{ name: { $regex: keywords[0] || '', $options: 'i' } }]
                };
                allProducts = await Product.find(fallbackQuery)
                    .populate('category', 'name')
                    .populate('brand', 'name')
                    .limit(limit * 2)
                    .lean();
                console.log('[ImageSearch] Fallback found:', allProducts.length);
            }

            // Hàm helper để kiểm tra match linh hoạt (có dấu, không dấu, partial match)
            const flexibleMatch = (text, keyword) => {
                if (!text || !keyword) return false;
                const lowerText = text.toLowerCase().trim();
                const lowerKeyword = keyword.toLowerCase().trim();
                
                if (lowerKeyword.length < 1) return false;
                
                const noDiacriticsText = vietnameseUtils.removeVietnameseDiacritics(lowerText);
                const noDiacriticsKeyword = vietnameseUtils.removeVietnameseDiacritics(lowerKeyword);
                
                // 1. Exact match (có dấu)
                if (lowerText.includes(lowerKeyword)) return true;
                
                // 2. Match không dấu
                if (noDiacriticsText.includes(noDiacriticsKeyword)) return true;
                
                // 3. Word boundary match - từ khóa là một từ hoàn chỉnh trong text
                const keywordRegex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (keywordRegex.test(lowerText)) return true;
                
                // 4. Word boundary match không dấu
                const keywordRegexNoDiacritics = new RegExp(`\\b${noDiacriticsKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (keywordRegexNoDiacritics.test(noDiacriticsText)) return true;
                
                // 5. Partial match - từng từ trong keyword match với từng từ trong text
                const textWords = lowerText.split(/\s+/);
                const keywordWords = lowerKeyword.split(/\s+/);
                
                // Nếu keyword là cụm từ, kiểm tra tất cả từ trong keyword có trong text không
                if (keywordWords.length > 1) {
                    let allWordsMatch = true;
                    for (const kw of keywordWords) {
                        if (kw.length < 2) continue; // Bỏ qua từ quá ngắn
                        let wordMatched = false;
                        for (const tw of textWords) {
                            if (tw.includes(kw) || kw.includes(tw)) {
                                wordMatched = true;
                                break;
                            }
                            // Match không dấu
                            const twNoDiacritics = vietnameseUtils.removeVietnameseDiacritics(tw);
                            const kwNoDiacritics = vietnameseUtils.removeVietnameseDiacritics(kw);
                            if (twNoDiacritics.includes(kwNoDiacritics) || kwNoDiacritics.includes(twNoDiacritics)) {
                                wordMatched = true;
                                break;
                            }
                        }
                        if (!wordMatched) {
                            allWordsMatch = false;
                            break;
                        }
                    }
                    if (allWordsMatch) return true;
                }
                
                // 6. Partial match từng từ riêng lẻ
                for (const kw of keywordWords) {
                    if (kw.length < 2) continue; // Bỏ qua từ quá ngắn
                    for (const tw of textWords) {
                        if (tw.includes(kw) || kw.includes(tw)) return true;
                        // Match không dấu
                        const twNoDiacritics = vietnameseUtils.removeVietnameseDiacritics(tw);
                        const kwNoDiacritics = vietnameseUtils.removeVietnameseDiacritics(kw);
                        if (twNoDiacritics.includes(kwNoDiacritics) || kwNoDiacritics.includes(twNoDiacritics)) return true;
                    }
                }
                
                return false;
            };

            // Tính điểm relevance dựa trên số từ khóa khớp - sử dụng flexible matching
            const scoredProducts = allProducts.map(product => {
                const productName = (product.name || '').toLowerCase();
                const productType = (product.type || '').toLowerCase();
                const productDescription = (product.description || '').toLowerCase();
                const productSlug = (product.slug || '').toLowerCase();
                const categoryName = (product.category?.name || '').toLowerCase();
                const brandName = (product.brand?.name || '').toLowerCase();
                
                let relevanceScore = 0;
                let matchedKeywords = [];

                keywords.forEach(keyword => {
                    // Exact match trong name = điểm cao nhất
                    if (flexibleMatch(productName, keyword)) {
                        const nameWords = productName.split(/\s+/);
                        const keywordLower = keyword.toLowerCase();
                        // Kiểm tra exact word match
                        if (nameWords.some(word => {
                            const wordNoDiacritics = vietnameseUtils.removeVietnameseDiacritics(word);
                            const keywordNoDiacritics = vietnameseUtils.removeVietnameseDiacritics(keywordLower);
                            return word === keywordLower || wordNoDiacritics === keywordNoDiacritics || 
                                   word.startsWith(keywordLower) || wordNoDiacritics.startsWith(keywordNoDiacritics);
                        })) {
                            relevanceScore += 25; // Tăng điểm cho exact word match
                        } else {
                            relevanceScore += 15; // Partial match trong name
                        }
                        matchedKeywords.push(keyword);
                    } 
                    // Match trong slug
                    else if (flexibleMatch(productSlug, keyword)) {
                        relevanceScore += 18;
                        matchedKeywords.push(keyword);
                    }
                    // Match trong category name
                    else if (flexibleMatch(categoryName, keyword)) {
                        relevanceScore += 15;
                        matchedKeywords.push(keyword);
                    }
                    // Match trong brand name
                    else if (flexibleMatch(brandName, keyword)) {
                        relevanceScore += 12;
                        matchedKeywords.push(keyword);
                    }
                    // Match trong type
                    else if (flexibleMatch(productType, keyword)) {
                        relevanceScore += 10;
                        matchedKeywords.push(keyword);
                    } 
                    // Match trong description
                    else if (flexibleMatch(productDescription, keyword)) {
                        relevanceScore += 5;
                        matchedKeywords.push(keyword);
                    }
                });

                // Bonus nếu có nhiều từ khóa khớp
                if (matchedKeywords.length === keywords.length) {
                    relevanceScore += 30; // Tăng bonus nếu tất cả từ khóa đều khớp
                } else if (matchedKeywords.length >= keywords.length * 0.7) {
                    relevanceScore += 20; // Bonus nếu khớp >= 70% từ khóa
                } else if (matchedKeywords.length >= keywords.length * 0.5) {
                    relevanceScore += 10; // Bonus nếu khớp >= 50% từ khóa
                } else if (matchedKeywords.length >= keywords.length * 0.3) {
                    relevanceScore += 5; // Bonus nhỏ nếu khớp >= 30% từ khóa
                }
                
                // Bonus nếu category khớp
                if (categoryIds.length > 0 && product.category && categoryIds.some(id => id.toString() === product.category._id?.toString())) {
                    relevanceScore += 15;
                }
                
                // Bonus nếu brand khớp
                if (brandIds.length > 0 && product.brand && brandIds.some(id => id.toString() === product.brand._id?.toString())) {
                    relevanceScore += 10;
                }

                return {
                    ...product,
                    _relevanceScore: relevanceScore,
                    _matchedKeywords: matchedKeywords
                };
            });
            
            console.log('[ImageSearch] Scored products:', scoredProducts.length);
            if (scoredProducts.length > 0) {
                console.log('[ImageSearch] Top product:', {
                    name: scoredProducts[0].name,
                    score: scoredProducts[0]._relevanceScore,
                    matched: scoredProducts[0]._matchedKeywords
                });
            }

            // Sắp xếp theo relevance score
            scoredProducts.sort((a, b) => {
                if (b._relevanceScore !== a._relevanceScore) {
                    return b._relevanceScore - a._relevanceScore;
                }
                // Nếu cùng điểm, ưu tiên sản phẩm bán chạy và mới nhất
                return (b.selled || 0) - (a.selled || 0) || 
                       new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            // Lọc bỏ các sản phẩm có điểm relevance = 0 (không khớp gì cả)
            // Giảm ngưỡng để bao gồm cả sản phẩm tương tự (không nhất thiết khớp 100%)
            let filteredProducts = scoredProducts.filter(p => p._relevanceScore > 0);
            
            // Nếu không tìm thấy sản phẩm nào, thử tìm với query rộng hơn
            if (filteredProducts.length === 0) {
                console.log('[ImageSearch] No products found with keywords, trying broader search...');
                
                // Lấy các từ khóa quan trọng nhất (từ khóa đầu tiên thường là loại sản phẩm)
                const mainKeywords = keywords.slice(0, 5);
                
                // Thử tìm với từng từ khóa riêng lẻ (không cần tất cả), sử dụng flexible regex
                const broadOrConditions = [];
                mainKeywords.forEach(keyword => {
                    if (keyword && keyword.length > 1) {
                        const flexiblePattern = createFlexibleRegex(keyword);
                        const noDiacritics = vietnameseUtils.removeVietnameseDiacritics(keyword);
                        broadOrConditions.push(
                            { name: { $regex: flexiblePattern, $options: 'i' } },
                            { type: { $regex: flexiblePattern, $options: 'i' } },
                            { slug: { $regex: flexiblePattern, $options: 'i' } },
                            { name: { $regex: noDiacritics, $options: 'i' } },
                            { type: { $regex: noDiacritics, $options: 'i' } }
                        );
                    }
                });
                
                const broadQuery = {
                    isActive: true,
                    $or: broadOrConditions.length > 0 ? broadOrConditions : [
                        { name: { $regex: mainKeywords[0] || '', $options: 'i' } }
                    ]
                };
                
                // Thêm tìm theo category nếu có
                if (categoryIds.length > 0) {
                    broadQuery.$or.push({ category: { $in: categoryIds } });
                }
                
                const broadProducts = await Product.find(broadQuery)
                    .populate('category', 'name')
                    .populate('brand', 'name')
                    .limit(limit * 3) // Tăng limit để có nhiều lựa chọn hơn
                    .lean();
                
                console.log('[ImageSearch] Broad search found:', broadProducts.length);
                
                // Tính điểm lại cho các sản phẩm này với flexible matching
                filteredProducts = broadProducts.map(product => {
                    const productName = (product.name || '').toLowerCase();
                    const productType = (product.type || '').toLowerCase();
                    const productSlug = (product.slug || '').toLowerCase();
                    const categoryName = (product.category?.name || '').toLowerCase();
                    let relevanceScore = 0;
                    let matchedKeywords = [];

                    keywords.forEach(keyword => {
                        if (flexibleMatch(productName, keyword)) {
                            relevanceScore += 12;
                            matchedKeywords.push(keyword);
                        } else if (flexibleMatch(productSlug, keyword)) {
                            relevanceScore += 10;
                            matchedKeywords.push(keyword);
                        } else if (flexibleMatch(categoryName, keyword)) {
                            relevanceScore += 10;
                            matchedKeywords.push(keyword);
                        } else if (flexibleMatch(productType, keyword)) {
                            relevanceScore += 6;
                            matchedKeywords.push(keyword);
                        }
                    });
                    
                    // Bonus nếu category khớp
                    if (categoryIds.length > 0 && product.category && categoryIds.some(id => id.toString() === product.category._id?.toString())) {
                        relevanceScore += 10;
                    }

                    return {
                        ...product,
                        _relevanceScore: relevanceScore,
                        _matchedKeywords: matchedKeywords
                    };
                }).filter(p => p._relevanceScore > 0)
                  .sort((a, b) => b._relevanceScore - a._relevanceScore);
            }
            
            // Nếu vẫn không có, tìm tất cả sản phẩm cùng category (nếu có)
            if (filteredProducts.length === 0 && categoryIds.length > 0) {
                console.log('[ImageSearch] Trying to find products in same category...');
                const categoryProducts = await Product.find({
                    isActive: true,
                    category: { $in: categoryIds }
                })
                    .populate('category', 'name')
                    .populate('brand', 'name')
                    .limit(limit)
                    .sort({ rating: -1, selled: -1 })
                    .lean();
                
                if (categoryProducts.length > 0) {
                    filteredProducts = categoryProducts.map(product => ({
                        ...product,
                        _relevanceScore: 5, // Điểm thấp nhưng vẫn hiển thị
                        _matchedKeywords: ['cùng danh mục']
                    }));
                    console.log('[ImageSearch] Found', filteredProducts.length, 'products in same category');
                }
            }
            
            // Lấy số lượng giới hạn và xóa _relevanceScore
            const resultProducts = filteredProducts
                .slice(0, limit)
                .map(({ _relevanceScore, _matchedKeywords, ...product }) => {
                    // Đảm bảo có image
                    const productImage = product.image || 
                        (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);
                    
                    return {
                        ...product,
                        image: productImage,
                        images: product.images || (productImage ? [productImage] : [])
                    };
                });

            console.log('[ImageSearch] Final result:', resultProducts.length, 'products');

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: resultProducts,
                total: resultProducts.length,
                searchDescription: trimmedDescription
            });

        } catch (e) {
            console.error('[ImageSearch] Error in searchProductsByImageDescription:', e);
            console.error('[ImageSearch] Error stack:', e.stack);
            console.error('[ImageSearch] Error details:', {
                message: e.message,
                name: e.name
            });
            
            // Trả về lỗi thay vì reject để frontend có thể xử lý
            resolve({
                status: 'ERR',
                message: e.message || 'Lỗi khi tìm kiếm sản phẩm',
                data: [],
                total: 0
            });
        }
    });
};

module.exports = {
    createProduct,
    updateProduct,
    getDetailProduct,
    deleteProduct,
    getAllProduct,
    deleteManyProduct,
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
    searchProductsWithAI,
    searchProducts,
    searchProductsAutocomplete,
    searchProductsByImageDescription,
    getFavoriteProducts
}
