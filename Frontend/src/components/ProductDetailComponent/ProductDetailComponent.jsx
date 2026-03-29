import { Col, Image, InputNumber, Rate, Row, Alert, Space, Dropdown } from 'antd';
import React, { useEffect, useState, useMemo } from 'react';
import {
    MinusOutlined,
    PlusOutlined,
    StarFilled,
    ShoppingCartOutlined,
    HeartOutlined,
    HeartFilled,
    ShareAltOutlined,
    EnvironmentOutlined,
    CopyOutlined,
    LinkOutlined,
    MessageOutlined
} from '@ant-design/icons';
import ButtonComponent from '../ButtonComponent/ButtonComponent';
// ProductChatButton removed per new chat model
import * as ProductService from '../../services/ProductService';
import * as WishlistService from '../../services/WishlistService';
import * as NotificationService from '../../services/NotificationService';
import * as AttributeService from '../../services/AttributeService';
import * as CartService from '../../services/CartService';
import { useQuery } from '@tanstack/react-query';
import Loading from '../LoadingComponent/Loading';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { addorderProduct, resetOrder, selectedOrder, addToOrderSelected } from '../../redux/slides/orderSlide';
import { convertPrice } from '../../utils';
import * as message from '../Message/Message';
import { WrapperImageGallery, WrapperProductInfo, WrapperVariationSelector, WrapperQuantityControl, WrapperActionButtons, WrapperProductContainer } from './enhancedStyle';

const ProductDetailComponent = ({ idProduct }) => {
    // Tất cả hooks phải được gọi ở top-level, không được conditional
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [isOutOfStock, setIsOutOfStock] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const handleAskAI = () => {
        if (!productDetails) return;
        const payload = {
            id: productDetails._id || productDetails.id,
            name: productDetails.name,
            price: finalPrice,
            image: productImages?.[0] || productDetails.image,
            brand: productDetails.brand?.name || productDetails.brand,
            category: productDetails.category?.name || productDetails.category,
            link: `${window.location.origin}/product-details/${productDetails._id || productDetails.id || idProduct}`
        };
        window.dispatchEvent(new CustomEvent('open-chat-with-product', { detail: payload }));
    };

    const user = useSelector((state) => state.user);
    const order = useSelector((state) => state.order);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // Validate và normalize ID - chỉ là biến, không phải hook
    const validProductId = idProduct?.trim() || null;

    // Tất cả hooks phải được gọi trước khi có bất kỳ early return nào
    const fetchGetDetailsProduct = async () => {
        // Double check để đảm bảo an toàn
        if (!validProductId) {
            throw new Error('Product ID is required');
        }
        const res = await ProductService.getDetailsProduct(validProductId);
        return res.data;
    };

    const { isPending, data: productDetails } = useQuery({
        queryKey: ['product-details', validProductId],
        queryFn: fetchGetDetailsProduct,
        enabled: !!validProductId,
        staleTime: 2 * 60 * 1000, // Cache 2 phút - data vẫn fresh
        cacheTime: 5 * 60 * 1000, // Giữ cache 5 phút
        refetchOnMount: 'always',
        retry: false, // Không retry nếu lỗi
    });

    // Fetch colors from Attribute service để lấy hexCode
    const { data: colorsData } = useQuery({
        queryKey: ['colors'],
        queryFn: () => AttributeService.getAllAttribute('color'),
        staleTime: 30 * 60 * 1000, // Colors ít thay đổi, cache 30 phút
        cacheTime: 60 * 60 * 1000, // Giữ cache 1 giờ
    });

    // Tạo map color value -> hexCode
    const colorMap = useMemo(() => {
        if (!colorsData?.data) return {};
        const map = {};
        colorsData.data.forEach(color => {
            map[color.value] = color.hexCode || '#ffffff';
        });
        return map;
    }, [colorsData]);

    // Stock helper: read stock from multiple possible fields (stock, countInStock, quantity)
    const getStock = (obj) => Number(obj?.stock ?? obj?.countInStock ?? obj?.quantity ?? 0);

    // Lấy danh sách màu sắc, kích cỡ, chất liệu - HIỂN THỊ TẤT CẢ các tùy chọn hiện có
    // Nghiệp vụ: Thuộc tính chỉ bị coi là hết hàng nếu toàn bộ các biến thể chứa nó có tồn kho = 0.
    const availableColors = useMemo(() => {
        if (!productDetails?.hasVariations || !productDetails?.variations) return [];
        return [...new Set(productDetails.variations.filter(v => v.isActive && v.color).map(v => v.color))];
    }, [productDetails]);

    const availableSizes = useMemo(() => {
        if (!productDetails?.hasVariations || !productDetails?.variations) return [];
        return [...new Set(productDetails.variations.filter(v => v.isActive && v.size).map(v => v.size))];
    }, [productDetails]);

    const availableMaterials = useMemo(() => {
        if (!productDetails?.hasVariations || !productDetails?.variations) return [];
        return [...new Set(productDetails.variations.filter(v => v.isActive && v.material).map(v => v.material))];
    }, [productDetails]);

    // Tìm variation hiện tại
    const currentVariation = useMemo(() => {
        if (!productDetails?.hasVariations || !productDetails?.variations) return null;

        return productDetails.variations.find(v =>
            v.isActive &&
            (!selectedColor || v.color === selectedColor) &&
            (!selectedSize || v.size === selectedSize) &&
            (!selectedMaterial || v.material === selectedMaterial)
        );
    }, [productDetails, selectedColor, selectedSize, selectedMaterial]);

    // Tính available stock - tổng tồn kho dựa trên các lựa chọn hiện tại
    const availableStock = useMemo(() => {
        if (!productDetails?.hasVariations || !productDetails?.variations) {
            return getStock(productDetails);
        }

        // Lọc các biến thể khớp với bộ lọc hiện tại (nếu một thuộc tính chưa chọn, coi như khớp tất cả)
        const matchingVariations = productDetails.variations.filter(v =>
            v.isActive &&
            (!selectedColor || v.color === selectedColor) &&
            (!selectedSize || v.size === selectedSize) &&
            (!selectedMaterial || v.material === selectedMaterial)
        );

        return matchingVariations.reduce((sum, v) => sum + getStock(v), 0);
    }, [productDetails, selectedColor, selectedSize, selectedMaterial]);

    // Lấy hình ảnh của product (không thay đổi theo màu)
    const productImages = useMemo(() => {
        // Luôn lấy ảnh từ product chính, không lấy từ variation
        return productDetails?.images && productDetails.images.length > 0
            ? productDetails.images
            : (productDetails?.image ? [productDetails.image] : []);
    }, [productDetails]);

    // Kiểm tra item trong giỏ hàng
    const itemInCart = useMemo(() => {
        if (!productDetails?._id) return null;

        return order?.orderItems?.find((item) => {
            if (productDetails?.hasVariations) {
                return item.product === productDetails._id &&
                    item.variation?.color === selectedColor &&
                    item.variation?.size === selectedSize &&
                    item.variation?.material === selectedMaterial;
            }
            return item.product === productDetails._id && !item.variation;
        });
    }, [order, productDetails, selectedColor, selectedSize, selectedMaterial]);

    // Tính số lượng tối đa có thể mua
    const maxQuantity = useMemo(() => {
        const cartQuantity = itemInCart?.amount || 0;
        return Math.max(0, availableStock - cartQuantity);
    }, [availableStock, itemInCart]);

    // Reset quantity khi đổi màu/size/material
    useEffect(() => {
        if (selectedColor || selectedSize || selectedMaterial) {
            if (quantity > maxQuantity) {
                setQuantity(maxQuantity > 0 ? 1 : 0);
            }

            if (maxQuantity === 0) {
                // Check if the product has any stock in other variations
                const productHasAnyStock = productDetails?.hasVariations
                    ? productDetails.variations.some(v => v.isActive && getStock(v) > 0)
                    : getStock(productDetails) > 0;

                if (productHasAnyStock) {
                    // Don't show a global 'out of stock' alert; show contextual message instead
                    setIsOutOfStock(false);
                    setErrorMessage('');
                } else {
                    setIsOutOfStock(true);
                    setErrorMessage('Sản phẩm này đã hết hàng.');
                }
            } else {
                setIsOutOfStock(false);
                setErrorMessage('');
            }
        }
    }, [selectedColor, selectedSize, selectedMaterial, maxQuantity, productDetails, quantity]);

    // Kiểm tra sản phẩm có trong wishlist không (với variation nếu có)
    useEffect(() => {
        if (productDetails?._id) {
            const variation = productDetails?.hasVariations && (selectedColor || selectedSize || selectedMaterial)
                ? { color: selectedColor || '', size: selectedSize || '', material: selectedMaterial || '' }
                : null;
            setIsFavorite(WishlistService.isInWishlist(productDetails._id, variation, user?.id));
        }
    }, [productDetails?._id, selectedColor, selectedSize, selectedMaterial, user?.id]);

    // Tự động chọn các thuộc tính có sẵn để người dùng bắt đầu với một lựa chọn hợp lệ
    useEffect(() => {
        if (productDetails?.hasVariations && !selectedColor && availableColors.length > 0) {
            // Ưu tiên chọn màu nào còn hàng
            const inStockColor = availableColors.find(color =>
                productDetails.variations.some(v => v.isActive && v.color === color && getStock(v) > 0)
            );
            setSelectedColor(inStockColor || availableColors[0]);
        }
    }, [productDetails, availableColors, selectedColor]);

    useEffect(() => {
        if (productDetails?.hasVariations && !selectedMaterial && availableMaterials.length > 0 && selectedColor) {
            // Ưu tiên chọn chất liệu có sẵn cho màu đã chọn
            const inStockMaterial = availableMaterials.find(material =>
                productDetails.variations.some(v => v.isActive && v.color === selectedColor && v.material === material && getStock(v) > 0)
            );
            setSelectedMaterial(inStockMaterial || availableMaterials[0]);
        }
    }, [productDetails, availableMaterials, selectedColor, selectedMaterial]);

    useEffect(() => {
        if (productDetails?.hasVariations && !selectedSize && availableSizes.length > 0 && selectedColor && selectedMaterial) {
            // Ưu tiên chọn kích cỡ có sẵn cho tổ hợp màu và chất liệu đã chọn
            const inStockSize = availableSizes.find(size =>
                productDetails.variations.some(v => v.isActive && v.color === selectedColor && v.material === selectedMaterial && v.size === size && getStock(v) > 0)
            );
            setSelectedSize(inStockSize || availableSizes[0]);
        }
    }, [productDetails, availableSizes, selectedColor, selectedMaterial, selectedSize]);

    // Reset error khi quantity thay đổi
    useEffect(() => {
        if (quantity <= maxQuantity && quantity > 0) {
            setErrorMessage('');
        }
    }, [quantity, maxQuantity]);

    // Validate khi thêm vào giỏ
    const validateBeforeAdd = () => {
        if (productDetails?.hasVariations) {
            if (!selectedColor && availableColors.length > 0) {
                setErrorMessage('Vui lòng chọn màu trước khi thêm vào giỏ hàng.');
                return false;
            }
            if (!selectedSize && availableSizes.length > 0) {
                setErrorMessage('Vui lòng chọn size trước khi thêm vào giỏ hàng.');
                return false;
            }
            if (!selectedMaterial && availableMaterials.length > 0) {
                setErrorMessage('Vui lòng chọn chất liệu trước khi thêm vào giỏ hàng.');
                return false;
            }
        }

        if (availableStock === 0) {
            setErrorMessage('Sản phẩm này đã hết hàng.');
            return false;
        }

        if (quantity > maxQuantity) {
            setErrorMessage(`Rất tiếc, bạn chỉ có thể mua tối đa ${maxQuantity} sản phẩm.`);
            return false;
        }

        if (itemInCart && (itemInCart.amount + quantity) > availableStock) {
            setErrorMessage(`Bạn đã có ${itemInCart.amount} sản phẩm trong giỏ hàng. Không thể thêm vượt quá tồn kho.`);
            return false;
        }

        return true;
    };

    const handleQuantityChange = (value) => {
        const numValue = Number(value) || 1;
        if (numValue > maxQuantity) {
            setQuantity(maxQuantity);
            setErrorMessage(`Rất tiếc, bạn chỉ có thể mua tối đa ${maxQuantity} sản phẩm.`);
        } else if (numValue < 1) {
            setQuantity(1);
        } else {
            setQuantity(numValue);
            setErrorMessage('');
        }
    };

    const handleIncreaseQuantity = () => {
        if (quantity < maxQuantity) {
            setQuantity(quantity + 1);
            setErrorMessage('');
        } else {
            setErrorMessage(`Rất tiếc, bạn chỉ có thể mua tối đa ${maxQuantity} sản phẩm.`);
        }
    };

    const handleDecreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
            setErrorMessage('');
        }
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        setSelectedSize(null); // Reset size khi đổi màu
        setSelectedMaterial(null); // Reset material khi đổi màu
        setQuantity(1);
        setErrorMessage('');
    };

    const handleSizeSelect = (size) => {
        setSelectedSize(size);
        const newVariation = productDetails?.variations?.find(v =>
            v.color === selectedColor &&
            v.size === size &&
            (!selectedMaterial || v.material === selectedMaterial) &&
            v.isActive
        );
        if (newVariation) {
            const newStock = newVariation.stock || 0;
            const cartQty = itemInCart?.amount || 0;
            const newMax = Math.max(0, newStock - cartQty);
            if (quantity > newMax) {
                setQuantity(newMax > 0 ? 1 : 0);
            }
        }
        setErrorMessage('');
    };

    const handleMaterialSelect = (material) => {
        setSelectedMaterial(material);
        setSelectedSize(null); // Reset size khi đổi material
        const newVariation = productDetails?.variations?.find(v =>
            v.color === selectedColor &&
            v.material === material &&
            v.isActive
        );
        if (newVariation) {
            const newStock = newVariation.stock || 0;
            const cartQty = itemInCart?.amount || 0;
            const newMax = Math.max(0, newStock - cartQty);
            if (quantity > newMax) {
                setQuantity(newMax > 0 ? 1 : 0);
            }
        }
        setErrorMessage('');
    };

    const handleAddToCart = async () => {
        // Allow Guest User to add to cart
        // if (!user?.id) {
        //     navigate('/sign-in', { state: location?.pathname });
        //     return;
        // }

        if (!validateBeforeAdd()) {
            return;
        }

        // Luôn lấy ảnh từ product chính, không lấy từ variation
        const productImage = productDetails?.images && productDetails.images.length > 0
            ? productDetails.images[0]
            : productDetails?.image;

        const orderItem = {
            name: productDetails?.name,
            amount: quantity,
            image: productImage, // Luôn dùng ảnh chính của sản phẩm
            price: currentVariation?.price || productDetails?.price,
            product: productDetails?._id,
            discount: productDetails?.discount || 0,
            countInstock: availableStock,
            availableStock: availableStock,
            weight: productDetails?.weight || 0,
            category: productDetails?.category?._id || productDetails?.category,
        };

        // Thêm variation info nếu có
        if (productDetails?.hasVariations && (selectedColor || selectedSize || selectedMaterial)) {
            orderItem.variation = {
                color: selectedColor || '',
                size: selectedSize || '',
                material: selectedMaterial || '',
                sku: currentVariation?.sku || ''
            };
        }

        dispatch(addorderProduct({ orderItem }));

        if (user?.id) {
            try {
                await CartService.addToCart({ orderItem }, user.access_token);
            } catch (e) {
                console.error("Failed to sync cart", e);
            }
        }
    };

    const handleBuyNow = () => {
        // if (!user?.id) {
        //     navigate('/sign-in', { state: location?.pathname });
        //     return;
        // }

        if (!validateBeforeAdd()) {
            return;
        }

        // Luôn lấy ảnh từ product chính, không lấy từ variation
        const productImage = productDetails?.images && productDetails.images.length > 0
            ? productDetails.images[0]
            : productDetails?.image;

        const orderItem = {
            name: productDetails?.name,
            amount: quantity,
            image: productImage, // Luôn dùng ảnh chính của sản phẩm
            price: currentVariation?.price || productDetails?.price,
            product: productDetails?._id,
            discount: productDetails?.discount || 0,
            countInstock: availableStock,
            availableStock: availableStock,
            weight: productDetails?.weight || 0,
            category: productDetails?.category?._id || productDetails?.category,
        };

        if (productDetails?.hasVariations && (selectedColor || selectedSize || selectedMaterial)) {
            orderItem.variation = {
                color: selectedColor || '',
                size: selectedSize || '',
                material: selectedMaterial || '',
                sku: currentVariation?.sku || ''
            };
        }

        // Thêm trực tiếp vào orderItemsSelected (không thêm vào giỏ hàng) và chuyển đến trang thanh toán
        dispatch(addToOrderSelected({ orderItem }));

        // Lưu tạm đơn “Mua ngay” để phòng trường hợp chuyển trang/đăng nhập lại
        try {
            sessionStorage.setItem('pending_buy_now', JSON.stringify([orderItem]));
        } catch (e) {
            console.warn('Cannot persist buy-now payload', e);
        }

        // Navigate đến trang thanh toán ngay
        navigate('/payment');
    };

    // Xử lý yêu thích
    const handleToggleFavorite = async () => {
        if (!productDetails?._id) return;

        // Nếu sản phẩm có variations, phải chọn màu và size trước
        if (productDetails?.hasVariations) {
            if (!selectedColor && availableColors.length > 0) {
                message.warning('Vui lòng chọn màu sắc trước khi thêm vào yêu thích');
                return;
            }
            if (!selectedSize && availableSizes.length > 0) {
                message.warning('Vui lòng chọn size trước khi thêm vào yêu thích');
                return;
            }
            if (!selectedMaterial && availableMaterials.length > 0) {
                message.warning('Vui lòng chọn chất liệu trước khi thêm vào yêu thích');
                return;
            }
        }

        const variation = productDetails?.hasVariations && (selectedColor || selectedSize || selectedMaterial)
            ? { color: selectedColor || '', size: selectedSize || '', material: selectedMaterial || '' }
            : null;

        try {
            const token = user?.access_token;

            if (isFavorite) {
                // Backend remove favorite
                if (token) {
                    const res = await ProductService.removeFavorite(productDetails._id, token);
                    if (res?.status === 'OK') {
                        setIsFavorite(false);
                        message.success(res?.message || 'Đã bỏ yêu thích');
                    } else {
                        message.error(res?.message || 'Không thể bỏ yêu thích');
                        return;
                    }
                }
                // Local fallback
                const result = WishlistService.removeFromWishlist(productDetails._id, variation, user?.id);
                if (result.success) {
                    setIsFavorite(false);
                    if (!token) message.success(result.message);
                }
            } else {
                // Backend add favorite
                if (token) {
                    const res = await ProductService.addFavorite(productDetails._id, token);
                    if (res?.status === 'OK') {
                        setIsFavorite(true);
                        message.success(res?.message || 'Đã thêm vào yêu thích');
                    } else {
                        message.error(res?.message || 'Không thể thêm yêu thích');
                        return;
                    }
                }
                // Local fallback
                const result = WishlistService.addToWishlist(productDetails._id, variation, user?.id);
                if (result.success) {
                    setIsFavorite(true);
                    if (!token) message.success(result.message);
                }
            }
        } catch (error) {
            console.error(error);
            message.error('Có lỗi khi cập nhật yêu thích');
        }
    };

    // Xử lý share
    const handleShare = () => {
        const productUrl = `${window.location.origin}/product-details/${productDetails?._id}`;

        // Kiểm tra xem browser có hỗ trợ Web Share API không
        if (navigator.share) {
            navigator.share({
                title: productDetails?.name || 'Sản phẩm',
                text: productDetails?.description || '',
                url: productUrl,
            }).catch((error) => {
                console.log('Error sharing:', error);
                // Fallback to copy link
                copyToClipboard(productUrl);
            });
        } else {
            // Fallback: Copy link to clipboard
            copyToClipboard(productUrl);
        }
    };

    // Copy link to clipboard
    const copyToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                message.success('Đã sao chép liên kết!');
            }).catch(() => {
                // Fallback for older browsers
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    };

    // Fallback copy method
    const fallbackCopyToClipboard = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            message.success('Đã sao chép liên kết!');
        } catch (err) {
            message.error('Không thể sao chép liên kết');
        }
        document.body.removeChild(textArea);
    };

    // Share menu items
    const shareMenuItems = [
        {
            key: 'copy',
            label: 'Sao chép liên kết',
            icon: <CopyOutlined />,
            onClick: () => {
                const productUrl = `${window.location.origin}/product-details/${productDetails?._id}`;
                copyToClipboard(productUrl);
            }
        },
        {
            key: 'share',
            label: 'Chia sẻ',
            icon: <ShareAltOutlined />,
            onClick: handleShare
        }
    ];

    useEffect(() => {
        if (order.isSuccessOrder) {
            message.success('Đã thêm vào giỏ hàng');
            dispatch(resetOrder());
        }
        if (order.isErrorOrder && order.errorMessage) {
            message.error(order.errorMessage);
            setErrorMessage(order.errorMessage);
            // Clear global order error so it doesn't persist across navigations
            dispatch(resetOrder());
        }
    }, [order.isSuccessOrder, order.isErrorOrder, order.errorMessage]);

    if (!productDetails) {
        return null;
    }

    // Normalize discount and prices
    const discount = Number(productDetails?.discount) || 0;
    const finalPrice = Number(productDetails?.price) || 0; // backend stores final price in `price`

    // Compute original price for display when available or derivable
    let originalPriceToShow = null;
    if (productDetails?.originalPrice && Number(productDetails.originalPrice) > finalPrice) {
        originalPriceToShow = Number(productDetails.originalPrice);
    } else if (discount > 0 && discount < 100 && finalPrice > 0) {
        // If originalPrice not provided but discount exists and price is final, derive original
        const inferredOriginal = Math.round(finalPrice / (1 - discount / 100));
        if (inferredOriginal > finalPrice) originalPriceToShow = inferredOriginal;
    }

    return (
        <Loading isPending={isPending}>
            <WrapperProductContainer>
                <Row gutter={[32, 32]}>
                    {/* Left: Image Gallery */}
                    <Col xs={24} md={10}>
                        <WrapperImageGallery>
                            <div
                                className="main-image"
                                style={{
                                    // Thêm background color dựa trên màu được chọn
                                    backgroundColor: selectedColor && colorMap[selectedColor]
                                        ? colorMap[selectedColor]
                                        : '#f5f5f5',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    transition: 'background-color 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {productDetails?.discount > 0 && (
                                    <div className="discount-badge">-{productDetails.discount}%</div>
                                )}
                                <Image
                                    src={productImages[selectedImageIndex] || productDetails?.image}
                                    alt={productDetails?.name}
                                    preview={{
                                        mask: 'Xem ảnh',
                                        maskClassName: 'image-preview-mask'
                                    }}
                                    style={{
                                        width: '100%',
                                        height: window.innerWidth < 768 ? '350px' : '500px',
                                        objectFit: 'contain',
                                        background: 'transparent',
                                        borderRadius: '8px'
                                    }}
                                />
                            </div>
                            {productImages.length > 1 && (
                                <div className="thumbnail-list">
                                    {productImages.map((img, index) => (
                                        <div
                                            key={index}
                                            className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                                            onClick={() => setSelectedImageIndex(index)}
                                        >
                                            <img src={img} alt={`${productDetails?.name} ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </WrapperImageGallery>
                    </Col>

                    {/* Right: Product Info */}
                    <Col xs={24} md={14}>
                        <WrapperProductInfo>
                            {/* Title */}
                            <h1 className="product-title">{productDetails?.name}</h1>

                            {/* Rating & Sold */}
                            <div className="rating-section">
                                <Rate
                                    allowHalf
                                    value={productDetails?.rating || 0}
                                    disabled
                                    style={{ fontSize: '16px', color: '#faad14' }}
                                />
                                <span className="sold-count">
                                    {productDetails?.selled || 0} đã bán
                                </span>
                                <span className="separator">|</span>
                                <span className="review-count">Đánh giá</span>
                            </div>

                            {/* Price */}
                            <div className="price-section">
                                {originalPriceToShow && originalPriceToShow > finalPrice && (
                                    <div className="original-price">
                                        {convertPrice(originalPriceToShow)}
                                    </div>
                                )}
                                <div className="current-price">
                                    {convertPrice(finalPrice)}
                                </div>

                            </div>

                            {/* Delivery Info */}
                            <div className="delivery-section">
                                <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                                <span>Giao đến </span>
                                <span className="address">{user?.address || 'Chưa có địa chỉ'}</span>
                                <span
                                    className="change-address"
                                    onClick={() => navigate('/profile-user')}
                                    style={{ cursor: 'pointer', color: '#1890ff', marginLeft: '8px' }}
                                >
                                    Đổi địa chỉ
                                </span>
                            </div>

                            {/* Variations */}
                            {productDetails?.hasVariations && productDetails?.variations && (
                                <>
                                    {/* Color Selection */}
                                    {availableColors.length > 0 && (
                                        <WrapperVariationSelector>
                                            <div className="variation-label">
                                                Màu sắc: <span className="selected-value">{selectedColor || 'Chưa chọn'}</span>
                                            </div>
                                            <div className="variation-options">
                                                {availableColors.map((color) => {
                                                    // Kiểm tra tồn kho cho lựa chọn hiện tại kết hợp với màu này
                                                    const stockForSelection = productDetails.variations
                                                        .filter(v => v.isActive && v.color === color &&
                                                            (!selectedSize || v.size === selectedSize) &&
                                                            (!selectedMaterial || v.material === selectedMaterial))
                                                        .reduce((sum, v) => sum + getStock(v), 0);

                                                    // Kiểm tra tồn kho tổng của màu này (không phụ thuộc size/material khác)
                                                    const globalStockForColor = productDetails.variations
                                                        .filter(v => v.isActive && v.color === color)
                                                        .reduce((sum, v) => sum + getStock(v), 0);

                                                    const isAvailableForSelection = stockForSelection > 0;
                                                    const isGloballyInStock = globalStockForColor > 0;
                                                    const isSelected = selectedColor === color;
                                                    const hexCode = colorMap[color] || '#ffffff';

                                                    return (
                                                        <div
                                                            key={color}
                                                            className={`color-option ${isSelected ? 'selected' : ''} ${!isGloballyInStock ? 'disabled' : ''} ${!isAvailableForSelection && isGloballyInStock ? 'not-available-for-selection' : ''}`}
                                                            onClick={() => isGloballyInStock && handleColorSelect(color)}
                                                            title={!isGloballyInStock ? 'Hết hàng hoàn toàn' : (!isAvailableForSelection ? 'Hết hàng với lựa chọn hiện tại' : `${color} - Còn ${stockForSelection} sản phẩm`)}
                                                            style={{
                                                                backgroundColor: hexCode,
                                                                border: isSelected ? '3px solid #1890ff' : '2px solid #ddd',
                                                                opacity: isGloballyInStock ? 1 : 0.3,
                                                                cursor: isGloballyInStock ? 'pointer' : 'not-allowed',
                                                                boxShadow: (hexCode === '#ffffff' || hexCode === '#fff' ? 'inset 0 0 0 1px #ddd' : 'none'),
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {!isAvailableForSelection && isGloballyInStock && <div className="unavailable-slash" />}
                                                            {isSelected && <div className="check-icon">✓</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </WrapperVariationSelector>
                                    )}

                                    {/* Material Selection */}
                                    {availableMaterials.length > 0 && (
                                        <WrapperVariationSelector>
                                            <div className="variation-label">
                                                Chất liệu: <span className="selected-value">{selectedMaterial || 'Chưa chọn'}</span>
                                            </div>
                                            <div className="variation-options">
                                                {availableMaterials.map((material) => {
                                                    // Kiểm tra tồn kho cho lựa chọn hiện tại kết hợp với chất liệu này
                                                    const stockForSelection = productDetails.variations
                                                        .filter(v => v.isActive && v.material === material &&
                                                            (!selectedColor || v.color === selectedColor) &&
                                                            (!selectedSize || v.size === selectedSize))
                                                        .reduce((sum, v) => sum + getStock(v), 0);

                                                    // Kiểm tra tồn kho tổng của chất liệu này
                                                    const globalStockForMaterial = productDetails.variations
                                                        .filter(v => v.isActive && v.material === material)
                                                        .reduce((sum, v) => sum + getStock(v), 0);

                                                    const isAvailableForSelection = stockForSelection > 0;
                                                    const isGloballyInStock = globalStockForMaterial > 0;
                                                    const isSelected = selectedMaterial === material;

                                                    return (
                                                        <div
                                                            key={material}
                                                            className={`size-option ${isSelected ? 'selected' : ''} ${!isGloballyInStock ? 'disabled' : ''} ${!isAvailableForSelection && isGloballyInStock ? 'not-available-for-selection' : ''}`}
                                                            onClick={() => isGloballyInStock && handleMaterialSelect(material)}
                                                            title={!isGloballyInStock ? 'Hết hàng hoàn toàn' : (!isAvailableForSelection ? 'Hết hàng với lựa chọn hiện tại' : `${material} - Còn ${stockForSelection} sản phẩm`)}
                                                            style={{
                                                                opacity: isGloballyInStock ? 1 : 0.5,
                                                                cursor: isGloballyInStock ? 'pointer' : 'not-allowed',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {material}
                                                            {!isGloballyInStock && <span className="out-of-stock-badge">Hết</span>}
                                                            {!isAvailableForSelection && isGloballyInStock && <span className="not-avail-badge">Hết</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </WrapperVariationSelector>
                                    )}

                                    {/* Size Selection */}
                                    {availableSizes.length > 0 && (
                                        <WrapperVariationSelector>
                                            <div className="variation-label">
                                                Kích cỡ: <span className="selected-value">{selectedSize || 'Chưa chọn'}</span>
                                            </div>
                                            <div className="variation-options">
                                                {availableSizes.map((size) => {
                                                    // Kiểm tra tồn kho cho lựa chọn hiện tại kết hợp với kích cỡ này
                                                    const stockForSelection = productDetails.variations
                                                        .filter(v => v.isActive && v.size === size &&
                                                            (!selectedColor || v.color === selectedColor) &&
                                                            (!selectedMaterial || v.material === selectedMaterial))
                                                        .reduce((sum, v) => sum + getStock(v), 0);

                                                    // Kiểm tra tồn kho tổng của kích cỡ này
                                                    const globalStockForSize = productDetails.variations
                                                        .filter(v => v.isActive && v.size === size)
                                                        .reduce((sum, v) => sum + getStock(v), 0);

                                                    const isAvailableForSelection = stockForSelection > 0;
                                                    const isGloballyInStock = globalStockForSize > 0;
                                                    const isSelected = selectedSize === size;

                                                    return (
                                                        <div
                                                            key={size}
                                                            className={`size-option ${isSelected ? 'selected' : ''} ${!isGloballyInStock ? 'disabled' : ''} ${!isAvailableForSelection && isGloballyInStock ? 'not-available-for-selection' : ''}`}
                                                            onClick={() => isGloballyInStock && handleSizeSelect(size)}
                                                            title={!isGloballyInStock ? 'Hết hàng hoàn toàn' : (!isAvailableForSelection ? 'Hết hàng với lựa chọn hiện tại' : `${size} - Còn ${stockForSelection} sản phẩm`)}
                                                            style={{
                                                                opacity: isGloballyInStock ? 1 : 0.5,
                                                                cursor: isGloballyInStock ? 'pointer' : 'not-allowed',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {size}
                                                            {!isGloballyInStock && <span className="out-of-stock-badge">Hết</span>}
                                                            {!isAvailableForSelection && isGloballyInStock && <span className="not-avail-badge">Hết</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </WrapperVariationSelector>
                                    )}
                                </>
                            )}

                            {/* Stock Info */}
                            <div className="stock-info">
                                {availableStock > 0 ? (
                                    <span style={{ color: '#52c41a' }}>Còn {availableStock} sản phẩm</span>
                                ) : (
                                    <span style={{ color: '#ff4d4f' }}>Hết hàng</span>
                                )}
                                {/* Show contextual out-of-stock message when a variation is selected */}
                                {maxQuantity === 0 && (selectedSize || selectedColor || selectedMaterial) && (
                                    <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                                        {`Size ${selectedSize || '-'} – ${selectedColor || '-'} hiện hết hàng. Chọn size/màu khác`}
                                    </div>
                                )}
                            </div>

                            {/* Quantity */}
                            <WrapperQuantityControl>
                                <div className="quantity-label">Số lượng</div>
                                <div className="quantity-input-wrapper">
                                    <button
                                        className="quantity-btn"
                                        onClick={handleDecreaseQuantity}
                                        disabled={quantity <= 1}
                                    >
                                        <MinusOutlined />
                                    </button>
                                    <InputNumber
                                        min={1}
                                        max={maxQuantity}
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        controls={false}
                                        className="quantity-input"
                                    />
                                    <button
                                        className="quantity-btn"
                                        onClick={handleIncreaseQuantity}
                                        disabled={quantity >= maxQuantity || maxQuantity === 0}
                                    >
                                        <PlusOutlined />
                                    </button>
                                </div>
                            </WrapperQuantityControl>

                            {/* Error Message */}
                            {errorMessage && (
                                <Alert
                                    message={errorMessage}
                                    type="error"
                                    showIcon
                                    closable
                                    onClose={() => setErrorMessage('')}
                                    style={{ marginBottom: '16px' }}
                                />
                            )}

                            {/* Action Buttons */}
                            <WrapperActionButtons>
                                <ButtonComponent
                                    size="large"
                                    styleButton={{
                                        background: isOutOfStock || maxQuantity === 0 ? '#d9d9d9' : 'rgb(255,57,69)',
                                        height: '48px',
                                        width: '100%',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: isOutOfStock || maxQuantity === 0 ? 'not-allowed' : 'pointer',
                                        opacity: isOutOfStock || maxQuantity === 0 ? 0.6 : 1
                                    }}
                                    onClick={handleBuyNow}
                                    disabled={isOutOfStock || maxQuantity === 0}
                                    textbutton="MUA NGAY"
                                    styletextbutton={{
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        letterSpacing: '0.5px'
                                    }}
                                />
                                <ButtonComponent
                                    size="large"
                                    styleButton={{
                                        background: '#fff',
                                        height: '48px',
                                        width: '100%',
                                        border: `2px solid ${isOutOfStock || maxQuantity === 0 ? '#d9d9d9' : 'rgb(255,57,69)'}`,
                                        borderRadius: '8px',
                                        cursor: isOutOfStock || maxQuantity === 0 ? 'not-allowed' : 'pointer',
                                        opacity: isOutOfStock || maxQuantity === 0 ? 0.6 : 1
                                    }}
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || maxQuantity === 0}
                                    textbutton={
                                        <Space>
                                            <ShoppingCartOutlined />
                                            THÊM VÀO GIỎ HÀNG
                                        </Space>
                                    }
                                    styletextbutton={{
                                        color: isOutOfStock || maxQuantity === 0 ? '#d9d9d9' : 'rgb(255,57,69)',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        letterSpacing: '0.5px'
                                    }}
                                />
                                <div style={{ position: 'fixed', right: '20px', bottom: '120px', zIndex: 1100 }}>
                                    <button
                                        type="button"
                                        onClick={handleAskAI}
                                        style={{
                                            border: 'none',
                                            borderRadius: '20px',
                                            padding: '10px 14px',
                                            background: '#0ea5e9',
                                            color: '#fff',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: '0 12px 32px rgba(14,165,233,0.35)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <MessageOutlined />
                                        Hỏi AI
                                    </button>
                                </div>


                            </WrapperActionButtons>

                            {/* Notify when back in stock */}
                            {maxQuantity === 0 && (selectedSize || selectedColor || selectedMaterial) && (
                                <div style={{ marginTop: 12 }}>
                                    <button
                                        className="notify-btn"
                                        onClick={async () => {
                                            if (!user?.id) {
                                                navigate('/sign-in', { state: location?.pathname });
                                                return;
                                            }
                                            try {
                                                const variation = {
                                                    color: selectedColor || '',
                                                    size: selectedSize || '',
                                                    material: selectedMaterial || '',
                                                    sku: currentVariation?.sku || ''
                                                };
                                                const res = await NotificationService.subscribeRestock(productDetails._id, variation, user?.access_token);
                                                if (res?.status === 'OK' || res?.message) {
                                                    message.success(res.message || 'Đã đăng ký nhận thông báo');
                                                } else {
                                                    message.success('Đã đăng ký nhận thông báo');
                                                }
                                            } catch (e) {
                                                console.error('subscribe error', e);
                                                message.error(e?.response?.data?.message || e?.message || 'Không thể đăng ký nhận thông báo');
                                            }
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: '1px dashed #1890ff',
                                            color: '#1890ff',
                                            padding: '8px 12px',
                                            borderRadius: 6,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Nhận thông báo khi có hàng
                                    </button>
                                </div>
                            )}

                            {/* Social Actions */}
                            <div className="social-actions">
                                <button
                                    className={`social-btn ${isFavorite ? 'favorite-active' : ''}`}
                                    onClick={handleToggleFavorite}
                                >
                                    {isFavorite ? <HeartFilled /> : <HeartOutlined />} Yêu thích
                                </button>
                                <Dropdown
                                    menu={{ items: shareMenuItems }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                >
                                    <button className="social-btn share-btn">
                                        <ShareAltOutlined /> Chia sẻ
                                    </button>
                                </Dropdown>
                            </div>

                            {/* Product Description */}
                            {productDetails?.description && (
                                <div className="description-section" style={{
                                    marginTop: '32px',
                                    paddingTop: '24px',
                                    borderTop: '1px solid #f0f0f0'
                                }}>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        marginBottom: '16px',
                                        color: '#333'
                                    }}>
                                        Mô tả sản phẩm
                                    </h3>
                                    <div
                                        className="description-content"
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '1.8',
                                            color: '#666',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: productDetails.description.replace(/\n/g, '<br />')
                                        }}
                                    />
                                </div>
                            )}
                        </WrapperProductInfo>
                    </Col>
                </Row>
            </WrapperProductContainer>
        </Loading>
    );
};

export default ProductDetailComponent;
