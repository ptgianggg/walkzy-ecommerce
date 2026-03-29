import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Breadcrumb,
    Row,
    Col,
    Select,
    Slider,
    Rate,
    Tag,
    Button,
    Spin,
    Empty
} from 'antd';
import { HomeOutlined, ShoppingOutlined, ReloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as CategoryService from '../../services/CategoryService';
import * as ProductService from '../../services/ProductService';
import { convertPrice, getPlaceholderImage } from '../../utils';
import Loading from '../../components/LoadingComponent/Loading';

const { Option } = Select;

const PageContainer = styled.div`
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 40px;
`;

const BannerSection = styled.div`
    width: 100%;
    height: 300px;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 24px;
    
    @media (max-width: 768px) {
        height: 200px;
    }
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${props => props.bgImage ? `url(${props.bgImage}) center/cover` : 'none'};
        opacity: 0.3;
    }
`;

const BannerContent = styled.div`
    position: relative;
    z-index: 1;
    text-align: center;
    color: white;
    
    h1 {
        font-size: 48px;
        font-weight: bold;
        margin: 0 0 16px 0;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        
        @media (max-width: 768px) {
            font-size: 32px;
        }
    }
    
    p {
        font-size: 18px;
        margin: 0;
        opacity: 0.9;
        
        @media (max-width: 768px) {
            font-size: 14px;
        }
    }
`;

const ContentWrapper = styled.div`
    max-width: 1270px;
    margin: 0 auto;
    padding: 0 20px;
`;

const BreadcrumbWrapper = styled.div`
    background: white;
    padding: 16px 24px;
    border-radius: 8px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    
    @media (max-width: 768px) {
        padding: 12px 16px;
    }
`;

const FiltersSection = styled.div`
    background: #ffffff;
    padding: 28px;
    border-radius: 20px;
    margin-bottom: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.12);
    
    @media (max-width: 768px) {
        padding: 20px;
    }
`;

const FiltersHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;

    h3 {
        margin: 0 0 6px;
        font-size: 22px;
        color: #111827;
    }

    p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
    }
`;

const FilterGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
`;

const FilterCard = styled.div`
    background: #f7f8ff;
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
`;

const FilterLabel = styled.span`
    font-weight: 600;
    font-size: 14px;
    color: #373b62;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const ActiveFilters = styled.div`
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

const PriceValues = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 15px;
    font-weight: 700;
    color: #333;
`;

const ProductGrid = styled.div`
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    
    @media (max-width: 768px) {
        padding: 16px;
    }
`;

const ProductCard = styled.div`
    border-radius: 20px;
    overflow: hidden;
    transition: transform 0.28s cubic-bezier(.2,.8,.2,1), box-shadow 0.28s cubic-bezier(.2,.8,.2,1);
    cursor: pointer;
    height: 100%;
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: #ffffff;
    display: flex;
    flex-direction: column;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);

    &:hover {
        transform: translateY(-8px);
        box-shadow: 0 25px 50px rgba(15, 23, 42, 0.16);
        border-color: rgba(99, 102, 241, 0.35);
    }
`;

const ProductImageWrapper = styled.div`
    position: relative;
    width: 100%;
    padding-top: 100%;
    overflow: hidden;
    background: #f8fafc;

    img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.35s ease;
    }

    ${ProductCard}:hover & img {
        transform: scale(1.08);
    }
`;

const ProductContent = styled.div`
    padding: 20px 22px 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
`;

const OutOfStockOverlay = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.08);
    z-index: 2;
    pointer-events: none;

    span {
        width: 100%;
        text-align: center;
        padding: 12px 0;
        background: rgba(255, 255, 255, 0.92);
        color: #111827;
        font-weight: 800;
        letter-spacing: 1.2px;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
    }
`;

const DiscountBadge = styled(Tag)`
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    font-weight: 800;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    color: #fff;
    background: linear-gradient(135deg, #ff4d4f 0%, #ff6b6b 100%);
    box-shadow: 0 3px 8px rgba(0,0,0,0.12);
`;

const ProductName = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 48px;
    
    @media (max-width: 768px) {
        font-size: 14px;
        min-height: 40px;
    }
`;

const ProductRating = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .ant-rate {
        font-size: 14px;
    }

    .ant-rate-star-full .ant-rate-star-second,
    .ant-rate-star-half .ant-rate-star-first {
        color: #fadb14;
    }
    
    span {
        font-size: 12px;
        color: #999;
    }
`;

const ProductPrice = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
`;

const CurrentPrice = styled.span`
    font-size: 20px;
    font-weight: bold;
    color: #ff4d4f;
    text-align: center;
    
    @media (max-width: 768px) {
        font-size: 18px;
    }
`;

const OldPrice = styled.span`
    font-size: 14px;
    color: #999;
    text-decoration: line-through;
    text-align: center;
`;

const CategoryDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState([0, 10000000]);
    const [discountFilter, setDiscountFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    const [childCategoryFilter, setChildCategoryFilter] = useState('all');
    const [page, setPage] = useState(0);
    const limit = 20;

    // Fetch category details
    const { data: categoryData, isPending: isPendingCategory } = useQuery({
        queryKey: ['category', id],
        queryFn: () => CategoryService.getDetailsCategory(id),
        enabled: !!id,
        staleTime: 30 * 60 * 1000,
    });

    const category = categoryData?.data;

    const { data: allCategoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => CategoryService.getAllCategory(),
        enabled: !!id,
        staleTime: 30 * 60 * 1000,
    });

    // Fetch all products for the category (fetch all at once, then paginate client-side)
    const { data: productsData, isPending: isPendingProducts, error: productsError } = useQuery({
        queryKey: ['category-products', id, sortBy],
        queryFn: async () => {
            if (!id) {
                return {
                    status: 'OK',
                    data: [],
                    total: 0
                };
            }

            let sortParam = null;
            if (sortBy === 'newest') sortParam = '-createdAt';
            else if (sortBy === 'price-low') sortParam = 'price';
            else if (sortBy === 'price-high') sortParam = '-price';
            else if (sortBy === 'selled') sortParam = '-selled';
            else if (sortBy === 'rating') sortParam = '-rating';

            try {
                // Fetch all products (use large limit to get all products)
                // Backend will handle pagination properly
                const result = await ProductService.getProductsByCategory(id, 1000, 0, sortParam);
                return result;
            } catch (error) {
                console.error('Error fetching products by category:', error);
                return {
                    status: 'OK',
                    data: [],
                    total: 0
                };
            }
        },
        enabled: !!id && !!category,
        staleTime: 0, // Không cache để luôn có dữ liệu mới nhất khi có sản phẩm mới
        cacheTime: 2 * 60 * 1000, // Giữ cache 2 phút
        refetchOnMount: true, // Refetch khi component mount để đảm bảo có sản phẩm mới
        retry: 1,
    });

    const allProducts = productsData?.data || [];
    const totalProducts = productsData?.total || 0;

    // Filter products client-side and apply pagination
    const childCategories = useMemo(() => {
        if (!allCategoriesData?.data || !id) return [];
        return allCategoriesData.data.filter(cat => {
            const parent = cat.parentCategory;
            const parentId = typeof parent === 'object' ? parent?._id : parent;
            return parentId === id;
        });
    }, [allCategoriesData, id]);

    const filteredProducts = useMemo(() => {
        let filtered = [...allProducts];

        if (childCategoryFilter !== 'all') {
            filtered = filtered.filter(product => {
                const productCat = product.category;
                const productCatId = typeof productCat === 'object' ? productCat?._id : productCat;
                return productCatId === childCategoryFilter;
            });
        }

        // Filter by price range
        filtered = filtered.filter(product => {
            const finalPrice = product.price;
            return finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
        });

        // Filter by discount
        if (discountFilter !== 'all') {
            if (discountFilter === '10+') {
                filtered = filtered.filter(p => p.discount >= 10);
            } else if (discountFilter === '20+') {
                filtered = filtered.filter(p => p.discount >= 20);
            } else if (discountFilter === '30+') {
                filtered = filtered.filter(p => p.discount >= 30);
            } else if (discountFilter === '50+') {
                filtered = filtered.filter(p => p.discount >= 50);
            }
        }

        // Filter by brand
        if (brandFilter !== 'all' && brandFilter) {
            filtered = filtered.filter(p =>
                p.brand?._id === brandFilter || p.brand?.slug === brandFilter
            );
        }

        // Apply pagination
        const startIndex = page * limit;
        const endIndex = startIndex + limit;
        return filtered.slice(startIndex, endIndex);
    }, [allProducts, priceRange, discountFilter, brandFilter, page, limit]);

    const totalFiltered = useMemo(() => {
        let filtered = [...allProducts];

        if (childCategoryFilter !== 'all') {
            filtered = filtered.filter(product => {
                const productCat = product.category;
                const productCatId = typeof productCat === 'object' ? productCat?._id : productCat;
                return productCatId === childCategoryFilter;
            });
        }

        // Filter by price range
        filtered = filtered.filter(product => {
            const finalPrice = product.price;
            return finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
        });

        // Filter by discount
        if (discountFilter !== 'all') {
            if (discountFilter === '10+') {
                filtered = filtered.filter(p => p.discount >= 10);
            } else if (discountFilter === '20+') {
                filtered = filtered.filter(p => p.discount >= 20);
            } else if (discountFilter === '30+') {
                filtered = filtered.filter(p => p.discount >= 30);
            } else if (discountFilter === '50+') {
                filtered = filtered.filter(p => p.discount >= 50);
            }
        }

        // Filter by brand
        if (brandFilter !== 'all' && brandFilter) {
            filtered = filtered.filter(p =>
                p.brand?._id === brandFilter || p.brand?.slug === brandFilter
            );
        }

        return filtered.length;
    }, [allProducts, priceRange, discountFilter, brandFilter]);

    // Get unique brands from products
    const brands = useMemo(() => {
        const brandSet = new Set();
        allProducts.forEach(product => {
            if (product.brand) {
                brandSet.add(JSON.stringify({
                    id: product.brand._id || product.brand,
                    name: product.brand.name || 'Unknown',
                    slug: product.brand.slug
                }));
            }
        });
        return Array.from(brandSet).map(b => JSON.parse(b));
    }, [allProducts]);

    const getFinalAndOriginal = (product) => {
        const finalPrice = product.price;
        let originalPrice = product.originalPrice;
        if (!originalPrice && product.discount > 0 && product.price > 0) {
            originalPrice = Math.round(product.price / (1 - product.discount / 100));
        }
        return { finalPrice, originalPrice };
    };

    const handleProductClick = (productId) => {
        navigate(`/product-details/${productId}`);
    };

    const [hoveredProductId, setHoveredProductId] = useState(null);

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [sortBy, priceRange, discountFilter, brandFilter, childCategoryFilter]);

    const handleResetFilters = () => {
        setPriceRange([0, 10000000]);
        setDiscountFilter('all');
        setBrandFilter('all');
        setChildCategoryFilter('all');
        setSortBy('newest');
    };

    const activeFilters = useMemo(() => {
        const chips = [];
        if (childCategoryFilter !== 'all') {
            const child = childCategories.find(cat => cat._id === childCategoryFilter);
            chips.push({
                key: 'child',
                label: child ? `Danh mục: ${child.name}` : 'Danh mục con'
            });
        }
        if (discountFilter !== 'all') {
            chips.push({ key: 'discount', label: `Giảm ${discountFilter}%` });
        }
        if (brandFilter !== 'all') {
            const brand = brands.find(b => b.id === brandFilter);
            chips.push({ key: 'brand', label: brand ? `Thương hiệu: ${brand.name}` : 'Thương hiệu' });
        }
        if (priceRange[0] !== 0 || priceRange[1] !== 10000000) {
            chips.push({ key: 'price', label: `Giá: ${convertPrice(priceRange[0])} - ${convertPrice(priceRange[1])}` });
        }
        return chips;
    }, [childCategoryFilter, childCategories, discountFilter, brandFilter, brands, priceRange]);

    const handleRemoveFilter = (key) => {
        switch (key) {
            case 'child':
                setChildCategoryFilter('all');
                break;
            case 'discount':
                setDiscountFilter('all');
                break;
            case 'brand':
                setBrandFilter('all');
                break;
            case 'price':
                setPriceRange([0, 10000000]);
                break;
            default:
                break;
        }
    };

    if (isPendingCategory) {
        return (
            <Loading isPending={true}>
                <div style={{ minHeight: '100vh' }} />
            </Loading>
        );
    }

    if (!category) {
        return (
            <PageContainer>
                <ContentWrapper>
                    <Empty description="Danh mục không tồn tại" />
                </ContentWrapper>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
           

            <ContentWrapper>
                <BreadcrumbWrapper>
                    <Breadcrumb
                        items={[
                            {
                                title: (
                                    <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                                        <HomeOutlined /> Trang chủ
                                    </span>
                                ),
                            },
                            {
                                title: (
                                    <span>
                                        <ShoppingOutlined /> Danh mục
                                    </span>
                                ),
                            },
                            {
                                title: category.name,
                            },
                        ]}
                    />
                </BreadcrumbWrapper>

                <FiltersSection>
                    <FiltersHeader>
                        <div>
                            <h3>Bộ lọc</h3>
                           
                        </div>
                        <Button onClick={handleResetFilters} type="text" icon={<ReloadOutlined />}>
                            Đặt lại bộ lọc
                        </Button>
                    </FiltersHeader>

                    <FilterGrid>
                        <FilterCard>
                            <FilterLabel>Sắp xếp</FilterLabel>
                            <Select
                                value={sortBy}
                                onChange={setSortBy}
                                size="large"
                            >
                                <Option value="newest">Mới nhất</Option>
                                <Option value="price-low">Giá: Thấp đến cao</Option>
                                <Option value="price-high">Giá: Cao đến thấp</Option>
                                <Option value="selled">Bán chạy</Option>
                                <Option value="rating">Đánh giá cao</Option>
                            </Select>
                        </FilterCard>

                        <FilterCard>
                            <FilterLabel>Khoảng giá</FilterLabel>
                            <div>
                                <Slider
                                    range
                                    min={0}
                                    max={10000000}
                                    step={100000}
                                    value={priceRange}
                                    onChange={setPriceRange}
                                    tooltip={{
                                        formatter: (value) => convertPrice(value)
                                    }}
                                />
                                <PriceValues>
                                    <span>{convertPrice(priceRange[0])}</span>
                                    <span>{convertPrice(priceRange[1])}</span>
                                </PriceValues>
                            </div>
                        </FilterCard>

                        <FilterCard>
                            <FilterLabel>Danh mục con</FilterLabel>
                            <Select
                                value={childCategoryFilter}
                                onChange={setChildCategoryFilter}
                                size="large"
                                placeholder="Chọn danh mục con"
                            >
                                <Option value="all">Tất cả</Option>
                                {childCategories.map(cat => (
                                    <Option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </Option>
                                ))}
                            </Select>
                        </FilterCard>

                        <FilterCard>
                            <FilterLabel>Giảm giá</FilterLabel>
                            <Select
                                value={discountFilter}
                                onChange={setDiscountFilter}
                                size="large"
                            >
                                <Option value="all">Tất cả</Option>
                                <Option value="10+">10% trở lên</Option>
                                <Option value="20+">20% trở lên</Option>
                                <Option value="30+">30% trở lên</Option>
                                <Option value="50+">50% trở lên</Option>
                            </Select>
                        </FilterCard>

                        {brands.length > 0 && (
                            <FilterCard>
                                <FilterLabel>Thương hiệu</FilterLabel>
                                <Select
                                    value={brandFilter}
                                    onChange={setBrandFilter}
                                    size="large"
                                >
                                    <Option value="all">Tất cả</Option>
                                    {brands.map(brand => (
                                        <Option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </Option>
                                    ))}
                                </Select>
                            </FilterCard>
                        )}
                    </FilterGrid>

                    {activeFilters.length > 0 && (
                        <ActiveFilters>
                            {activeFilters.map(filter => (
                                <Tag
                                    key={filter.key}
                                    closable
                                    onClose={() => handleRemoveFilter(filter.key)}
                                    color="#d6e4ff"
                                    style={{ color: '#1d4ed8', fontWeight: 600 }}
                                >
                                    {filter.label}
                                </Tag>
                            ))}
                        </ActiveFilters>
                    )}
                </FiltersSection>

                <ProductGrid>
                    {isPendingProducts ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin size="large" />
                            <p style={{ marginTop: '16px', color: '#999' }}>Đang tải sản phẩm...</p>
                        </div>
                    ) : allProducts.length === 0 ? (
                        <Empty
                            description={
                                <div>
                                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                                        Danh mục này chưa có sản phẩm nào
                                    </p>
                                    <Button
                                        type="primary"
                                        onClick={() => navigate('/')}
                                    >
                                        Quay về trang chủ
                                    </Button>
                                </div>
                            }
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : filteredProducts.length === 0 ? (
                        <Empty
                            description={
                                <div>
                                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                                        Không tìm thấy sản phẩm nào phù hợp với bộ lọc
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setPriceRange([0, 10000000]);
                                            setDiscountFilter('all');
                                            setBrandFilter('all');
                                            setPage(0);
                                        }}
                                    >
                                        Xóa bộ lọc
                                    </Button>
                                </div>
                            }
                        />
                    ) : (
                        <>
                            <Row gutter={[18, 24]}>
                                {filteredProducts.map((product) => {
                                    const { finalPrice, originalPrice } = getFinalAndOriginal(product);
                                    const imageList = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
                                    const primaryImage = imageList[0] || product.image;
                                    const hoverImage = imageList.length > 1 ? imageList[1] : null;
                                    const isHovered = hoveredProductId === product._id;
                                    const activeImage = isHovered && hoverImage ? hoverImage : primaryImage;
                                    const isOutOfStock = Number(product.countInStock) <= 0;

                                    return (
                                        <Col
                                            xs={12}
                                            sm={12}
                                            md={8}
                                            lg={6}
                                            xl={6}
                                            xxl={4}
                                            key={product._id}
                                        >
                                            <ProductCard
                                                onClick={() => handleProductClick(product._id)}
                                                role="button"
                                                tabIndex={0}
                                                onMouseEnter={() => setHoveredProductId(product._id)}
                                                onMouseLeave={() => setHoveredProductId(null)}
                                            >
                                                <ProductImageWrapper>
                                                    {product.discount > 0 && (
                                                        <DiscountBadge color="red">
                                                            -{product.discount}%
                                                        </DiscountBadge>
                                                    )}
                                                    {isOutOfStock && (
                                                        <OutOfStockOverlay>
                                                            <span>HẾT HÀNG</span>
                                                        </OutOfStockOverlay>
                                                    )}
                                                    <img
                                                        alt={product.name}
                                                        src={activeImage}
                                                        onError={(e) => {
                                                            e.target.src = getPlaceholderImage(300, 300, 'No Image');
                                                        }}
                                                    />
                                                </ProductImageWrapper>
                                                <ProductContent>
                                                    <ProductName>{product.name}</ProductName>
                                                    <ProductRating>
                                                        <Rate
                                                            disabled
                                                            value={product.rating || 0}
                                                            allowHalf
                                                            style={{ fontSize: '13px' }}
                                                        />
                                                    </ProductRating>
                                                    <ProductPrice>
                                                        {product.discount > 0 && (
                                                            <OldPrice>
                                                                {convertPrice(originalPrice)}
                                                            </OldPrice>
                                                        )}
                                                        <CurrentPrice>
                                                            {convertPrice(finalPrice)}
                                                        </CurrentPrice>
                                                    </ProductPrice>
                                                </ProductContent>
                                            </ProductCard>
</Col>
                                    );
                                })}
                            </Row>

                            {filteredProducts.length < totalFiltered && (
                                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={handleLoadMore}
                                        loading={isPendingProducts}
                                        style={{
                                            minWidth: '200px',
                                            height: '48px',
                                            borderRadius: '8px',
                                            fontWeight: 600
                                        }}
                                    >
                                        Xem thêm sản phẩm
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </ProductGrid>
            </ContentWrapper>
        </PageContainer>
    );
};

export default CategoryDetailPage;
