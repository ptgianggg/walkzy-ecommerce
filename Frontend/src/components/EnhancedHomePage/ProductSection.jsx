import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Button, Rate, Tag, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { convertPrice, getPlaceholderImage } from '../../utils';
import { RightOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Meta } = Card;

const WrapperSection = styled.div`
    margin: 0;
    background: #fff;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    
    @media (max-width: 768px) {
        padding: 20px 16px;
    }
`;

const WrapperSectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;
    
    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 16px;
    }
`;

const WrapperSectionTitle = styled.h2`
    font-size: ${props => props.size === 'small' ? '22px' : (props.compact ? '20px' : '28px')};
    font-weight: ${props => props.compact ? 800 : 900};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0f1724;
    letter-spacing: 0.2px;
    font-family: 'Montserrat', 'Inter', system-ui, sans-serif;
    text-shadow: none;
    
    @media (max-width: 768px) {
        font-size: ${props => props.size === 'small' ? '18px' : (props.compact ? '18px' : '22px')};
    }
`;

const TopGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;

    @media (max-width: 992px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const TopCard = styled.div`
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 12px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
    }

    &.rank-1 {
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
    }

    &.rank-2,
    &.rank-3 {
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    }
`;

const TopImage = styled.div`
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 12px;
    background: #f8fafc;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.3s ease;
    }

    ${TopCard}:hover & img {
        transform: scale(1.04);
    }
`;

const TopBadge = styled.div`
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    color: #1f2937;
    font-size: 11px;
    font-weight: 700;
    padding: 5px 9px;
    border-radius: 999px;
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
    letter-spacing: 0.2px;
`;

const TopDiscountBadge = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #ff7a72 0%, #ff9a8b 100%);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 5px 8px;
    border-radius: 999px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.12);
`;

const TopName = styled.div`
    font-size: 15px;
    font-weight: 700;
    color: #111827;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 42px;
`;

const TopRating = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #6b7280;
    font-size: 13px;
    font-weight: 600;
`;

const TopFavorites = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    color: #d94848;
    font-weight: 600;

    &.strong {
        color: #b91c1c;
        font-weight: 700;
    }
`;

const TopPrice = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: auto;

    .final-price {
        font-size: 18px;
        font-weight: 800;
        color: #ef4444;
    }

    .original-price {
        font-size: 12px;
        color: #9ca3af;
        text-decoration: line-through;
    }
`;

const ProductCard = styled(Card)`
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    /* fixed height to ensure uniform card sizes */
    height: 380px;
    border: 1px solid #f3f6f9;
    box-shadow: 0 4px 10px rgba(16,24,40,0.04);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    
    @media (max-width: 992px) {
        height: 360px;
    }
    @media (max-width: 768px) {
        height: 340px;
    }
    
    &:hover {
        box-shadow: 0 10px 30px rgba(16,24,40,0.08);
        transform: translateY(-6px);
        border-color: #e6e6e6;
    }
    
    .ant-card-cover {
        position: relative;
        overflow: hidden;
        background: #fafafa;
        border-radius: 12px 12px 0 0;
        flex: 0 0 auto;
        height: 240px; /* fixed cover height for prominent images */
        
        @media (max-width: 992px) {
            height: 220px;
        }
        @media (max-width: 768px) {
            height: 200px;
        }
        
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        &:hover img {
            transform: scale(1.04);
        }

        &::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0));
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        &:hover::after {
            opacity: 1;
        }
    }
    
    .ant-card-body {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        /* ensure body fills remaining space and content is vertically arranged */
        flex: 1 1 auto;
        min-height: 100px;
        overflow: hidden;
    }
    
    .ant-card-meta {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: 100%;
        overflow: hidden;
    }
    
    .ant-card-meta-detail {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
    }
    
    .ant-card-meta-title {
        margin-bottom: 6px !important;
    }
    
    .product-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 2;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    /* Ensure product title area is fixed height and doesn't push layout */
    .product-name {
        font-size: 14px;
        font-weight: 600;
        color: #0f1724;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        height: 44px; /* slightly larger for better aesthetics */
        line-height: 1.2;
        margin-bottom: 6px;
        word-break: break-word;
        text-align: center;
    }

    .price-row .final-price {
        color: #0f1724;
        font-weight: 700;
        font-size: 18px;
    }

    .price-row .original-price {
        color: #9aa0a6;
        text-decoration: line-through;
        font-weight: 400;
    }
`;
const ProductSection = ({ title, products, icon, showViewAll = true, viewAllPath, hideRating = false, titleSize = 'default', preserveOrder = false, showSoldCount = false, showFavoriteTop = false, isLoading = false }) => {
    const navigate = useNavigate();
    const [hoveredProductId, setHoveredProductId] = useState(null);
    const displayTitle = title === 'Sản phẩm mới' ? title.toUpperCase() : title;

    const handleProductClick = (productId) => {
        navigate(`/product-details/${productId}`);
    };

    const getFinalAndOriginal = (product) => {
        const finalPrice = product.price;
        let originalPrice = product.originalPrice;
        if (!originalPrice && product.discount > 0 && product.price > 0) {
            originalPrice = Math.round(product.price / (1 - product.discount / 100));
        }
        return { finalPrice, originalPrice };
    };

    const getFavoriteCount = (product) => {
        const directCount = product.favoritesCount ?? product.favoriteCount;
        if (typeof directCount === 'number') return directCount;
        if (Array.isArray(product.favorites)) return product.favorites.length;
        return 0;
    };

    const getReviewCount = (product) => {
        const reviewCount = product.reviewCount ?? product.numReviews ?? product.totalReviews;
        if (typeof reviewCount === 'number') return reviewCount;
        if (Array.isArray(product.reviews)) return product.reviews.length;
        return 0;
    };

    const formatCount = (value) => {
        try {
            return new Intl.NumberFormat('vi-VN').format(value || 0);
        } catch (e) {
            return String(value || 0);
        }
    };

    const filteredProducts = useMemo(() => (
        (products || []).filter((p) => {
            const availableStock = (p.countInStock ?? p.stock ?? p.quantity);
            const inStock = typeof availableStock === 'number' ? availableStock > 0 : true;
            const isActive = p.isActive !== false;
            return inStock && isActive;
        })
    ), [products]);

    const visibleProducts = useMemo(() => {
        if (preserveOrder) {
            return filteredProducts.slice(0, 4);
        }

        return [...filteredProducts]
            .sort((a, b) => {
                const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
                const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
                return bDate - aDate;
            })
            .slice(0, 4);
    }, [filteredProducts, preserveOrder]);

    const topFavoriteProducts = useMemo(() => {
        if (!showFavoriteTop) return [];
        return [...filteredProducts]
            .sort((a, b) => {
                const diff = getFavoriteCount(b) - getFavoriteCount(a);
                if (diff !== 0) return diff;
                const ratingDiff = (b.rating || 0) - (a.rating || 0);
                if (ratingDiff !== 0) return ratingDiff;
                const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
                const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
                return bDate - aDate;
            })
            .slice(0, 3);
    }, [filteredProducts, showFavoriteTop]);

    if (isLoading) {
        return (
            <WrapperSection>
                <WrapperSectionHeader>
                    <Skeleton.Input active size="large" style={{ width: 250 }} />
                </WrapperSectionHeader>
                <Row gutter={[20, 28]}>
                    {[...Array(4)].map((_, index) => (
                        <Col key={index} xs={12} sm={12} md={6} lg={6}>
                            <Card style={{ borderRadius: 12 }}>
                                <Skeleton.Image active style={{ width: '100%', height: 240 }} />
                                <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 16 }} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </WrapperSection>
        );
    }

    if (!products || products.length === 0 || (visibleProducts.length === 0 && topFavoriteProducts.length === 0)) {
        return null;
    }

    return (
        <WrapperSection>
            <WrapperSectionHeader>
                <WrapperSectionTitle compact={title === 'Sản phẩm mới'} size={titleSize}>
                    {title !== 'Sản phẩm mới' && icon}
                    {displayTitle}
                </WrapperSectionTitle>
                {showViewAll && (
                    <Button
                        type="link"
                        onClick={() => navigate(viewAllPath || '/product')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#1890ff',
                            padding: '4px 8px',
                            height: 'auto',
                            borderRadius: '6px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f7ff';
                            e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        Xem tất cả <RightOutlined style={{ fontSize: '12px' }} />
                    </Button>
                )}
            </WrapperSectionHeader>

            {showFavoriteTop && topFavoriteProducts.length > 0 ? (
                <TopGrid>
                    {topFavoriteProducts.map((product, index) => {
                        const { finalPrice, originalPrice } = getFinalAndOriginal(product);
                        const imageList = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
                        const primaryImage = imageList[0] || product.image || '';
                        const rank = index + 1;
                        const favoritesCount = getFavoriteCount(product);
                        const reviewCount = getReviewCount(product);
                        const showTopBadge = favoritesCount >= 10;
                        const strongSocial = favoritesCount >= 100;
                        const ratingValue = Number(product.rating || 0).toFixed(1);
                        const rankIcon = rank === 1 ? '❤️' : rank === 2 ? '🥈' : '🥉';
                        const rankText = rank === 1 ? `Yêu thích #${rank}` : `TOP #${rank}`;

                        return (
                            <TopCard
                                key={product._id}
                                className={`rank-${rank}`}
                                onClick={() => handleProductClick(product._id)}
                            >
                                <TopImage>
                                    {showTopBadge && (
                                        <TopBadge>{rankIcon} {rankText}</TopBadge>
                                    )}
                                    {product.discount > 0 && (
                                        <TopDiscountBadge>-{product.discount}%</TopDiscountBadge>
                                    )}
                                    <img
                                        alt={product.name}
                                        src={primaryImage}
                                        onError={(e) => {
                                            e.target.src = getPlaceholderImage(300, 300, 'No Image');
                                        }}
                                    />
                                </TopImage>
                                <TopName>{product.name}</TopName>
                                <TopRating>
                                    <Rate
                                        disabled
                                        value={product.rating || 0}
                                        allowHalf
                                        style={{ fontSize: '12px' }}
                                    />
                                    {reviewCount > 0 ? (
                                        <span>{formatCount(reviewCount)} đánh giá</span>
                                    ) : null}
                                </TopRating>
                                <TopFavorites className={strongSocial ? 'strong' : ''}>
                                    <span>❤️</span>
                                    <span>{formatCount(favoritesCount)} yêu thích</span>
                                </TopFavorites>
                                <TopPrice>
                                    {originalPrice > finalPrice && (
                                        <span className="original-price">{convertPrice(originalPrice)}</span>
                                    )}
                                    <span className="final-price">{convertPrice(finalPrice)}</span>
                                </TopPrice>
                            </TopCard>
                        );
                    })}
                </TopGrid>
            ) : (
                <Row gutter={[20, 28]} style={{ display: 'flex', alignItems: 'stretch' }}>
                    {visibleProducts.map((product) => {
                        const { finalPrice, originalPrice } = getFinalAndOriginal(product);
                        const imageList = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
                        const primaryImage = imageList[0] || product.image || '';
                        const hoverImage = imageList.length > 1 ? imageList[1] : null;
                        const isHovered = hoveredProductId === product._id;
                        const activeImage = isHovered && hoverImage ? hoverImage : primaryImage;

                        return (
                            <Col
                                xs={12}
                                sm={12}
                                md={6}
                                lg={6}
                                xl={6}
                                key={product._id}
                                style={{
                                    display: 'flex',
                                    marginBottom: '0',
                                    height: '100%'
                                }}
                            >
                                <ProductCard
                                    hoverable
                                    onMouseEnter={() => setHoveredProductId(product._id)}
                                    onMouseLeave={() => setHoveredProductId(null)}
                                    cover={
                                        <div>
                                            {product.discount > 0 && (
                                                <Tag
                                                    className="product-badge"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        left: '10px',
                                                        zIndex: 2,
                                                        fontSize: '11px',
                                                        padding: '4px 7px',
                                                        fontWeight: 700,
                                                        borderRadius: '12px',
                                                        lineHeight: '1',
                                                        color: '#fff',
                                                        background: 'linear-gradient(135deg, #ff7a72 0%, #ff9a8b 100%)',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                                                    }}
                                                >
                                                    -{product.discount}%
                                                </Tag>
                                            )}
                                            <img
                                                alt={product.name}
                                                src={activeImage}
                                                className="product-img"
                                                onError={(e) => {
                                                    e.target.src = getPlaceholderImage(300, 300, 'No Image');
                                                }}
                                            />
                                        </div>
                                    }
                                    onClick={() => handleProductClick(product._id)}
                                >
                                    <Meta
                                        title={
                                            <div className="product-name">{product.name}</div>
                                        }
                                        description={
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                                flex: 1,
                                                justifyContent: 'space-between',
                                                minHeight: '78px'
                                            }}>
                                                <div className="price-row" style={{
                                                    display: 'flex',
                                                    alignItems: 'baseline',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    flexWrap: 'wrap',
                                                    marginTop: '2px'
                                                }}>
                                                    {originalPrice > finalPrice && (
                                                        <span className="original-price">{convertPrice(originalPrice)}</span>
                                                    )}
                                                    <span className="final-price">{convertPrice(finalPrice)}</span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    flexWrap: 'wrap',
                                                    marginBottom: '2px',
                                                    minHeight: '18px' /* reserve space for consistent layout */
                                                }}>
                                                    {!hideRating && (
                                                        <Rate
                                                            disabled
                                                            value={product.rating || 0}
                                                            allowHalf
                                                            style={{ fontSize: '12px' }}
                                                        />
                                                    )}
                                                    {/* sold-count intentionally hidden on homepage cards for a cleaner look */}
                                                </div>
                                                {showSoldCount && (
                                                    <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                                                        Đã bán {product.selled || 0}
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    />
                                </ProductCard>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </WrapperSection>
    );
};

export default ProductSection;

