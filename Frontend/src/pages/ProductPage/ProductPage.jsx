import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Select, Button, Empty, Pagination, Breadcrumb, Spin, Rate as AntRate } from 'antd';
import { DownOutlined, FilterOutlined, ClearOutlined, HomeOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as ProductService from '../../services/ProductService';
import * as CategoryService from '../../services/CategoryService';
import { convertPrice, getPlaceholderImage, isProductInCategory } from '../../utils';
import * as BrandService from '../../services/BrandService';
import CardComponent from '../../components/CardComponent/CardComponent';

const { Option } = Select;

const ProductContainer = styled.div`
    min-height: 100vh;
    background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
    padding: 32px 0 48px;
    
    @media (max-width: 768px) {
        padding: 20px 0 32px;
    }
`;

const HeaderSection = styled.div`
    max-width: 1270px;
    width: 100%;
    margin: 0 auto;
    padding: 0 20px;
    margin-bottom: 40px;
    
    @media (max-width: 768px) {
        padding: 0 16px;
        margin-bottom: 24px;
    }
`;

const BreadcrumbWrapper = styled.div`
    margin-bottom: 24px;
    padding: 12px 0;
    
    .ant-breadcrumb {
        font-size: 13px;
        
        a {
            color: #1890ff;
            transition: color 0.2s;
            
            &:hover {
                color: #40a9ff;
            }
        }
        
        .ant-breadcrumb-link {
            color: #666;
        }
    }
`;

const TitleSection = styled.div`
    margin-bottom: 24px;
    padding: 16px 24px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    position: relative;
    overflow: hidden;
    
    .title-wrapper {
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
        z-index: 1;
        
        @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }
    }
    
    .icon {
        display: none;
    }
    
    .title {
        font-size: ${props => props.compact ? '22px' : '26px'};
        font-weight: 700;
        color: #063196ff;
        margin: 0;
        letter-spacing: -0.5px;
        text-shadow: none;
        line-height: 1.2;
        
        @media (max-width: 768px) {
            font-size: ${props => props.compact ? '18px' : '20px'};
        }
    }

    &.best-selling-title .title {
        font-size: 24px;
        text-transform: uppercase;
        letter-spacing: 1.2px;
    }

    &.most-favorite-title .title {
        font-size: 24px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    @media (max-width: 768px) {
        &.best-selling-title .title {
            font-size: 20px;
        }
        &.most-favorite-title .title {
            font-size: 20px;
        }
    }
    
    .search-keyword {
        display: inline-block;
        background: #f1f5f9;
        padding: 8px 20px;
        border-radius: 50px;
        font-size: 20px;
        font-weight: 700;
        margin-left: 12px;
        border: 1px solid #e2e8f0;
        color: #0f172a;
        
        @media (max-width: 768px) {
            font-size: 16px;
            padding: 6px 16px;
            margin-left: 0;
            margin-top: 8px;
            display: block;
            width: fit-content;
        }
    }
`;

const FilterBar = styled.div`
    background: #ffffff;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    margin-bottom: 32px;
    border: 1px solid #f0f0f0;
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
        box-shadow: 0 6px 24px rgba(0,0,0,0.12);
    }
    
    .filter-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f5f5f5;
        justify-content: space-between;

        .filter-title-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .filter-icon {
            font-size: 20px;
            color: #52c41a;
        }
        
        .filter-title {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0;
        }
    }
    
    .filter-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        align-items: end;
        
        @media (max-width: 768px) {
            grid-template-columns: 1fr;
            gap: 16px;
        }
    }
    
    .filter-item {
        display: flex;
        flex-direction: column;
        
        .ant-select {
            width: 100%;
            height: 40px;
            font-size: 13px;
            
            .ant-select-selector {
                border-radius: 12px;
                border: 1.5px solid #e0e0e0;
                transition: all 0.3s ease;
                background: #f8fafc;
                padding: 6px 12px;
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
                
                &:hover {
                    border-color: #52c41a;
                    background: #ffffff;
                }
            }
            
            &.ant-select-focused .ant-select-selector {
                border-color: #52c41a;
                box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.1);
                background: #ffffff;
            }
            
            .ant-select-selection-placeholder {
                color: #94a3b8;
            }
            
            .ant-select-selection-item {
                color: #0f172a;
                font-weight: 600;
            }
            
            .ant-select-arrow {
                color: #64748b;
            }
        }
    }

    .filter-actions {
        display: flex;
        align-items: end;
        justify-content: flex-end;

        @media (max-width: 768px) {
            justify-content: stretch;
        }
    }
    
    .filter-label {
        font-size: 13px;
        font-weight: 600;
        color: #333;
        margin-bottom: 10px;
        display: block;
        letter-spacing: 0.2px;
    }

    .reset-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 1px solid #e5e7eb;
        color: #ef4444;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
        background: #fff;

        &:hover {
            border-color: #fecaca;
            background: #fff5f5;
            color: #dc2626;
        }
    }

    .category-option {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
    }

    .category-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #52c41a;
        flex: 0 0 6px;
        box-shadow: 0 0 0 4px rgba(82, 196, 26, 0.12);
    }

    .category-name {
        font-weight: 600;
        color: #1f1f1f;
    }

    .category-hint {
        margin-left: auto;
        font-size: 12px;
        font-weight: 600;
        color: #8c8c8c;
    }
`;

const ProductGrid = styled.div`
    max-width: 1270px;
    width: 100%;
    margin: 0 auto;
    padding: 0 20px;
    
    @media (max-width: 768px) {
        padding: 0 16px;
    }
`;

const TopThreeSection = styled.div`
    max-width: 1270px;
    width: 100%;
    margin: 0 auto 28px;
    padding: 0 20px;

    @media (max-width: 768px) {
        padding: 0 16px;
    }
`;

const TopThreeTitle = styled.h2`
    font-size: 20px;
    font-weight: 800;
    color: #111827;
    margin: 0 0 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

const TopThreeGrid = styled.div`
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
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 12px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
    }

    &.rank-1 {
        background: linear-gradient(180deg, #FFF6E5 0%, #EAD7A8 70%);
        border-color: #F3E9D2;
    }

    &.rank-2 {
        background: linear-gradient(180deg, #FFFFFF 0%, #E6EAF0 70%);
        border-color: #EEF1F4;
    }

    &.rank-3 {
        background: linear-gradient(180deg, #FFFFFF 0%, #E8DED3 70%);
        border-color: #F4EFEA;
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
    }
`;

const TopRank = styled.div`
    position: absolute;
    top: 10px;
    left: 10px;
    background: #111827;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    padding: 4px 8px;
    border-radius: 10px;
    letter-spacing: 0.5px;

    &.rank-1 {
        background: linear-gradient(135deg, #D4AF37 0%, #f0f0f0ff 100%);
        color: #1f2937;
        box-shadow: 0 6px 14px rgba(245, 158, 11, 0.35);
    }

    &.rank-2 {
        background: linear-gradient(135deg, #9CA3AF 0%, #e5e7eb 100%);
        color: #111827;
        box-shadow: 0 6px 14px rgba(156, 163, 175, 0.35);
    }

    &.rank-3 {
        background: linear-gradient(135deg, #C08457 0%, #d6d4d1ff 100%);
        color: #111827;
        box-shadow: 0 6px 14px rgba(217, 119, 6, 0.35);
    }
`;

const TopTag = styled.div`
    background: #fff7ed;
    color: #c2410c;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 10px;
    border-radius: 999px;
    width: fit-content;
`;

const TopName = styled.div`
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 44px;
`;

const TopMeta = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #6b7280;
    font-size: 13px;
`;

const TopSold = styled.div`
    font-size: 13px;
    color: #374151;
    text-align: center;
`;

const TopPrice = styled.div`
    font-size: 18px;
    font-weight: 800;
    color: #ef4444;
    text-align: center;
`;

const TopPriceRow = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
`;

const TopOldPrice = styled.span`
    font-size: 12px;
    color: #9ca3af;
    text-decoration: line-through;
`;

const ProductCountBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 14px 24px;
    background: #ffffff;
    border-radius: 14px;
    margin-bottom: 32px;
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
    border: 1px solid #eef2f7;
    
    .count-number {
        background: #1f2937;
        color: #fff;
        padding: 6px 12px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.2px;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 80px 20px;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    border: 2px solid #f0f0f0;
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }
`;

const ProductPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNewProducts = searchParams.get('new') === 'true';
    const sortParam = searchParams.get('sort');
    const searchKeyword = searchParams.get('search'); // Lấy search parameter từ URL

    // State cho filters và pagination
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [priceSort, setPriceSort] = useState(sortParam || null);
    const [sortBy, setSortBy] = useState('newest'); // newest, best-selling, rating
    const [pagination, setPagination] = useState({
        page: 0,
        limit: 20,
        total: 0,
        totalPage: 1
    });

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => CategoryService.getAllCategory(),
        staleTime: 30 * 60 * 1000,
    });

    // Fetch brands
    const { data: brandsData } = useQuery({
        queryKey: ['brands'],
        queryFn: () => BrandService.getAllBrand(),
        staleTime: 30 * 60 * 1000,
    });

    // Fetch products based on query params - hỗ trợ search với AI
    const { data: productsData, isPending, isFetching } = useQuery({
        queryKey: ['all-products', isNewProducts, sortParam, searchKeyword, pagination.page, pagination.limit, sortBy, priceSort],
        queryFn: async () => {
            // Nếu có search keyword, sử dụng AI search (clean endpoint - không hiển thị AI info)
            if (searchKeyword && searchKeyword.trim().length > 0) {
                const res = await ProductService.searchProductsClean(searchKeyword.trim(), 1000);
                return {
                    status: res.status || 'OK',
                    message: res.message || 'SUCCESS',
                    data: res.data || [],
                    total: res.total || (res.data?.length || 0),
                    relatedKeywords: res.relatedKeywords || []
                };
            } else if (isNewProducts) {
                // Fetch all new products
                const res = await ProductService.getNewProducts(1000);
                return res;
            } else if (sortParam === 'selled') {
                // Fetch best selling products
                const res = await ProductService.getBestSellingProducts(1000);
                return res;
            } else if (sortParam === 'rating') {
                // Fetch most favorite products
                const res = await ProductService.getMostFavoriteProducts(1000);
                return res;
            } else {
                // Fetch all products
                const res = await ProductService.getAllProduct('', 1000);
                return res;
            }
        },
        enabled: true, // Luôn enabled để có thể search
        staleTime: 2 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        keepPreviousData: true, // Giữ data cũ khi đang fetch data mới để UI không bị block
        refetchOnWindowFocus: false, // Không refetch khi focus window
        // Tự động cancel request cũ khi có request mới (mặc định đã có, nhưng đảm bảo)
        retry: 1, // Chỉ retry 1 lần nếu lỗi
        retryDelay: 500,
    });

    const categories = categoriesData?.data?.filter(cat => cat.isActive) || [];
    const brands = brandsData?.data?.filter(brand => brand.isActive !== false) || [];
    const allProducts = productsData?.data || [];
    const isSearchMode = searchKeyword && searchKeyword.trim().length > 0;

    const categoryOptions = useMemo(() => {
        if (!categories.length) return [];

        const normalizeId = (value) => {
            if (!value) return null;
            if (typeof value === 'object') return value._id || value.id || null;
            return value;
        };

        const map = new Map();
        categories.forEach((cat) => {
            const id = String(cat?._id || cat?.id || '');
            if (!id) return;
            map.set(id, { ...cat, _id: id, children: [] });
        });

        const roots = [];
        map.forEach((node) => {
            const parentId = normalizeId(node.parentCategory);
            if (parentId && map.has(String(parentId))) {
                map.get(String(parentId)).children.push(node);
            } else {
                roots.push(node);
            }
        });

        const sortNodes = (nodes) => {
            nodes.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
            nodes.forEach((child) => sortNodes(child.children || []));
        };
        sortNodes(roots);

        const options = [];
        const walk = (node, level = 0) => {
            const hasChildren = Array.isArray(node.children) && node.children.length > 0;
            const name = node.name || 'Category';
            options.push({
                value: node._id,
                label: (
                    <span className="category-option" style={{ paddingLeft: `${level * 14}px` }}>
                        {level === 0 ? <span className="category-dot" /> : null}
                        <span className="category-name">{name}</span>
                        {level === 0 && hasChildren ? <span className="category-hint">All</span> : null}
                    </span>
                ),
                searchText: name,
            });
            (node.children || []).forEach((child) => walk(child, level + 1));
        };

        roots.forEach((root) => walk(root, 0));
        return options;
    }, [categories]);

    // Filter và sort products
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = [...allProducts];

        // Filter by category (supports parent categories)
        if (selectedCategory) {
            filtered = filtered.filter(p => isProductInCategory(p, selectedCategory, categories));
        }

        // Filter by brand
        if (selectedBrand) {
            filtered = filtered.filter(p => {
                const brandId = typeof p.brand === 'object' ? p.brand?._id : p.brand;
                return brandId === selectedBrand;
            });
        }

        // Sort products: gi? th? t? relevance t? backend khi ?ang search
        if (!isSearchMode) {
            filtered.sort((a, b) => {
                if (sortBy === 'newest') {
                    const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
                    const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
                    return bDate - aDate;
                } else if (sortBy === 'best-selling') {
                    return (b.selled || 0) - (a.selled || 0);
                } else if (sortBy === 'rating') {
                    return (b.rating || 0) - (a.rating || 0);
                }
                return 0;
            });
        }

        // Sort by price
        if (priceSort === 'low-to-high') {
            filtered.sort((a, b) => {
                const aPrice = a.price * (1 - (a.discount || 0) / 100);
                const bPrice = b.price * (1 - (b.discount || 0) / 100);
                return aPrice - bPrice;
            });
        } else if (priceSort === 'high-to-low') {
            filtered.sort((a, b) => {
                const aPrice = a.price * (1 - (a.discount || 0) / 100);
                const bPrice = b.price * (1 - (b.discount || 0) / 100);
                return bPrice - aPrice;
            });
        }

        return filtered;
    }, [allProducts, selectedCategory, selectedBrand, priceSort, sortBy, isSearchMode]);

    const isBestSellingPage = sortParam === 'selled' && !isSearchMode;
    const isMostFavoritePage = sortParam === 'rating' && !isSearchMode;

    const bestSellingSorted = useMemo(() => {
        if (!isBestSellingPage) return [];
        return [...filteredAndSortedProducts].sort((a, b) => (b.selled || 0) - (a.selled || 0));
    }, [filteredAndSortedProducts, isBestSellingPage]);

    const topThreeProducts = useMemo(() => {
        if (!isBestSellingPage) return [];
        const eligible = bestSellingSorted.filter((product) => {
            const stockValue = product.countInStock ?? product.stock ?? product.quantity;
            const inStock = typeof stockValue === 'number' ? stockValue > 0 : true;
            const isActive = product.isActive !== false;
            return inStock && isActive;
        });
        return eligible.slice(0, 3);
    }, [bestSellingSorted, isBestSellingPage]);

    const gridSourceProducts = useMemo(() => {
        if (!isBestSellingPage) return filteredAndSortedProducts;
        const topIds = new Set(topThreeProducts.map(p => String(p._id)));
        return bestSellingSorted.filter(p => !topIds.has(String(p._id)));
    }, [filteredAndSortedProducts, bestSellingSorted, topThreeProducts, isBestSellingPage]);

    // Pagination
    const paginatedProducts = useMemo(() => {
        const start = pagination.page * pagination.limit;
        const end = start + pagination.limit;
        return gridSourceProducts.slice(start, end);
    }, [gridSourceProducts, pagination.page, pagination.limit]);

    // Update total when filtered products change
    useEffect(() => {
        const total = gridSourceProducts.length;
        const totalPage = Math.ceil(total / pagination.limit);
        setPagination(prev => ({
            ...prev,
            total,
            totalPage
        }));
    }, [gridSourceProducts.length, pagination.limit]);

    const handleResetFilters = () => {
        setSelectedCategory(null);
        setSelectedBrand(null);
        setPriceSort(null);
        setSortBy('newest');
        setPagination(prev => ({ ...prev, page: 0 }));

        // Nếu đang ở chế độ search, xóa search parameter
        if (isSearchMode) {
            navigate('/product');
        }
    };

    const handlePageChange = (page, pageSize) => {
        setPagination(prev => ({
            ...prev,
            page: page - 1,
            limit: pageSize
        }));
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hasActiveFilters = selectedCategory || selectedBrand || priceSort || sortBy !== 'newest';

    const getPageTitle = () => {
        if (isSearchMode) {
            return 'Kết quả tìm kiếm';
        }
        if (isNewProducts) return 'Sản phẩm mới';
        if (sortParam === 'selled') return 'Sản phẩm bán chạy';
        if (sortParam === 'rating') return 'Sản phẩm được yêu thích nhất';
        return 'Tất cả sản phẩm';
    };

    const getPageIcon = () => {
        return null;
    };

    return (
        <ProductContainer>
            <HeaderSection>
                {/* Breadcrumb */}
                <BreadcrumbWrapper>
                    <Breadcrumb
                        items={[
                            {
                                title: (
                                    <span onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <HomeOutlined /> Trang chủ
                                    </span>
                                ),
                            },
                            {
                                title: isSearchMode ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Tìm kiếm
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Sản phẩm
                                    </span>
                                ),
                            },
                        ]}
                    />
                </BreadcrumbWrapper>

                {/* Title Section với gradient đẹp */}
                <TitleSection
                    isSearch={isSearchMode}
                    compact={isNewProducts}
                    className={sortParam === 'selled' ? 'best-selling-title' : sortParam === 'rating' ? 'most-favorite-title' : ''}
                >
                    <div className="title-wrapper">
                        {getPageIcon()}
                        <div>
                            <h1 className="title">
                                {isSearchMode ? (
                                    <>
                                        Kết quả tìm kiếm cho <span className="search-keyword">"{searchKeyword}"</span>
                                    </>
                                ) : (
                                    getPageTitle()
                                )}
                            </h1>
                        </div>
                    </div>
                </TitleSection>

                {/* Filter Bar */}
                <FilterBar>
                    <div className="filter-header">
                        <div className="filter-title-wrap">

                            <h3 className="filter-title">Bộ lọc sản phẩm</h3>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                type="text"
                                onClick={handleResetFilters}
                                className="reset-btn"
                                icon={<ClearOutlined />}
                            />
                        )}
                    </div>
                    <div className="filter-row">
                        <div className="filter-item">
                            <label className="filter-label">Danh mục</label>
                            <Select
                                placeholder="Tất cả danh mục"
                                value={selectedCategory}
                                onChange={setSelectedCategory}
                                allowClear
                                suffixIcon={<DownOutlined />}
                                showSearch
                                options={categoryOptions}
                                optionFilterProp="searchText"
                                filterOption={(input, option) =>
                                    String(option?.searchText || '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                            </Select>
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Thương hiệu</label>
                            <Select
                                placeholder="Tất cả thương hiệu"
                                value={selectedBrand}
                                onChange={setSelectedBrand}
                                allowClear
                                suffixIcon={<DownOutlined />}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {brands.map(brand => (
                                    <Option key={brand._id} value={brand._id}>
                                        {brand.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Sắp xếp theo giá</label>
                            <Select
                                placeholder="Mặc định"
                                value={priceSort}
                                onChange={setPriceSort}
                                allowClear
                                suffixIcon={<DownOutlined />}
                            >
                                <Option value="low-to-high">Giá thấp → cao</Option>
                                <Option value="high-to-low">Giá cao → thấp</Option>
                            </Select>
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Sắp xếp</label>
                            <Select
                                value={sortBy}
                                onChange={setSortBy}
                                suffixIcon={<DownOutlined />}
                            >
                                <Option value="newest">Mới nhất</Option>
                                <Option value="best-selling">Bán chạy</Option>
                                <Option value="rating">Đánh giá cao</Option>
                            </Select>
                        </div>

                        <div className="filter-actions" />
                    </div>
                </FilterBar>
            </HeaderSection>

            {/* Top 3 Best Selling */}
            {isBestSellingPage && topThreeProducts.length > 0 && (
                <TopThreeSection>
                    <TopThreeTitle>Top 3 BÁN CHẠY</TopThreeTitle>
                    <TopThreeGrid>
                        {topThreeProducts.map((product, index) => (
                            <TopCard
                                key={product._id}
                                className={`rank-${index + 1}`}
                                onClick={() => navigate(`/product-details/${product._id}`)}
                            >
                                <TopImage>
                                    <TopRank className={`rank-${index + 1}`}>#{index + 1}</TopRank>
                                    <img
                                        alt={product.name}
                                        src={(product.images && product.images.length > 0) ? product.images[0] : product.image}
                                        onError={(e) => {
                                            e.target.src = getPlaceholderImage(300, 300, 'No Image');
                                        }}
                                    />
                                </TopImage>
                                <TopTag>Ban chay #{index + 1}</TopTag>
                                <TopName>{product.name}</TopName>
                                <TopMeta>
                                    <AntRate disabled value={product.rating || 0} allowHalf style={{ fontSize: '13px' }} />
                                    <span>{Number(product.rating || 0).toFixed(1)}</span>
                                </TopMeta>
                                <TopSold>Đã bán {product.selled || 0} sản phẩm</TopSold>
                                <TopPriceRow>
                                    {product.discount > 0 && (
                                        <TopOldPrice>{convertPrice(Math.round(product.price / (1 - product.discount / 100)))}</TopOldPrice>
                                    )}
                                    <TopPrice>{convertPrice(product.price)}</TopPrice>
                                </TopPriceRow>
                            </TopCard>
                        ))}
                    </TopThreeGrid>
                </TopThreeSection>
            )}

            {/* Product Grid */}
            <ProductGrid>
                {/* Loading indicator - chỉ hiển thị khi đang fetch data mới (không block UI) */}
                {isFetching && !isPending && (
                    <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        marginBottom: '16px'
                    }}>
                        <Spin size="small" /> <span style={{ marginLeft: '8px', color: '#666' }}>Đang tải...</span>
                    </div>
                )}
                {/* Loading đầy đủ chỉ khi lần đầu load (isPending) */}
                {isPending ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px'
                    }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '16px', color: '#666' }}>Đang tải sản phẩm...</div>
                    </div>
                ) : paginatedProducts.length > 0 ? (
                    <>
                        <ProductCountBadge>
                            <span className="count-number">
                                {filteredAndSortedProducts.length}
                            </span>
                            <span>
                                {isSearchMode
                                    ? `Sản phẩm được tìm thấy cho "${searchKeyword}"`
                                    : 'Sản phẩm được tìm thấy'
                                }
                            </span>
                        </ProductCountBadge>
                        <Row gutter={[20, 28]} justify="start" style={{ display: 'flex', alignItems: 'stretch' }}>
                            {paginatedProducts.map((product) => (
                                <Col
                                    xs={12}
                                    sm={12}
                                    md={6}
                                    lg={6}
                                    xl={6}
                                    key={product._id}
                                    style={{
                                        display: 'flex',
                                        marginBottom: '0'
                                    }}
                                >
                                    <CardComponent
                                        countInStock={product.countInStock}
                                        description={product.description}
                                        image={(product.images && product.images.length > 0) ? product.images[0] : product.image}
                                        images={product.images}
                                        name={product.name}
                                        price={product.price}
                                        rating={product.rating}
                                        type={product.type}
                                        selled={product.selled}
                                        favoritesCount={product.favoritesCount ?? product.favoriteCount ?? product.favorites?.length}
                                        discount={product.discount}
                                        id={product._id}
                                        showSoldCount={isBestSellingPage}
                                        showFavoriteCount={isMostFavoritePage}
                                    />
                                </Col>
                            ))}
                        </Row>

                        {/* Pagination */}
                        {
                            pagination.totalPage > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: '32px'
                                }}>
                                    <Pagination
                                        current={pagination.page + 1}
                                        total={pagination.total}
                                        pageSize={pagination.limit}
                                        onChange={handlePageChange}
                                        showSizeChanger
                                        pageSizeOptions={['12', '20', '40', '60']}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} của ${total} sản phẩm`
                                        }
                                    />
                                </div>
                            )
                        }
                    </>
                ) : (
                    <EmptyState>
                        <Empty
                            description={
                                <div>
                                    <div style={{
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        color: '#333',
                                        marginBottom: '8px'
                                    }}>
                                        {isSearchMode
                                            ? `Không tìm thấy sản phẩm nào với từ khóa "${searchKeyword}"`
                                            : "Không tìm thấy sản phẩm nào"
                                        }
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#999',
                                        marginTop: '8px'
                                    }}>
                                        {isSearchMode
                                            ? 'Thử tìm kiếm với từ khóa khác hoặc xem tất cả sản phẩm'
                                            : 'Thử điều chỉnh bộ lọc hoặc xem tất cả sản phẩm'
                                        }
                                    </div>
                                </div>
                            }
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            {isSearchMode ? (
                                <div style={{
                                    marginTop: 24,
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'center',
                                    flexWrap: 'wrap'
                                }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => navigate('/product')}
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '10px 24px',
                                            height: 'auto',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                        }}
                                    >
                                        Xem tất cả sản phẩm
                                    </Button>
                                    <Button
                                        size="large"
                                        onClick={() => navigate('/')}
                                        style={{
                                            borderRadius: '8px',
                                            padding: '10px 24px',
                                            height: 'auto',
                                            fontWeight: 600
                                        }}
                                    >
                                        Về trang chủ
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleResetFilters}
                                    style={{
                                        marginTop: 24,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 24px',
                                        height: 'auto',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                    }}
                                >
                                    Xóa bộ lọc
                                </Button>
                            )}
                        </Empty>
                    </EmptyState>
                )}
            </ProductGrid>
        </ProductContainer>
    );
};

export default ProductPage;
