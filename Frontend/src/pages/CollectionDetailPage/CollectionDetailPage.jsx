import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Select, Button, Empty, Pagination, Badge } from 'antd';
import { 
    FilterOutlined, 
    ClearOutlined, 
    DownOutlined, 
    ShoppingOutlined,
    FireOutlined,
    BookOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import * as ProductService from '../../services/ProductService';
import * as CollectionService from '../../services/CollectionService';
import * as CategoryService from '../../services/CategoryService';
import { isProductInCategory } from '../../utils';
import * as BrandService from '../../services/BrandService';
import Loading from '../../components/LoadingComponent/Loading';
import CardComponent from '../../components/CardComponent/CardComponent';
import { getPlaceholderImage } from '../../utils';

const { Option } = Select;

const CollectionContainer = styled.div`
    min-height: 100vh;
    background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
`;

const HeroBanner = styled.div`
    position: relative;
    width: 100%;
    height: 500px;
    overflow: hidden;
    margin-bottom: 40px;
    
    @media (max-width: 768px) {
        height: 300px;
        margin-bottom: 24px;
    }
    
    .banner-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .banner-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .banner-content {
        text-align: center;
        color: #fff;
        z-index: 2;
        padding: 0 20px;
        max-width: 800px;
        
        .collection-title {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 16px;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
            
            @media (max-width: 768px) {
                font-size: 32px;
            }
        }
        
        .collection-subtitle {
            font-size: 20px;
            opacity: 0.95;
            margin-bottom: 24px;
            
            @media (max-width: 768px) {
                font-size: 16px;
            }
        }
    }
`;

const ContentWrapper = styled.div`
    max-width: 1270px;
    margin: 0 auto;
    padding: 0 20px;
    
    @media (max-width: 768px) {
        padding: 0 16px;
    }
`;

const DescriptionSection = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 40px;
    margin-bottom: 40px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #f0f0f0;
    
    @media (max-width: 768px) {
        padding: 24px;
        margin-bottom: 24px;
    }
    
    .description-title {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 20px;
        color: #1a1a1a;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .description-text {
        font-size: 16px;
        line-height: 1.8;
        color: #555;
        margin-bottom: 24px;
    }
    
    .cta-button {
        height: 48px;
        padding: 0 32px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 8px;
    }
`;

const FilterBar = styled.div`
    background: #ffffff;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    margin-bottom: 32px;
    border: 1px solid #f0f0f0;
    
    .filter-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f5f5f5;
        
        .filter-icon {
            font-size: 20px;
            color: #52c41a;
        }
        
        .filter-title {
            font-size: 18px;
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
            height: 42px;
            
            .ant-select-selector {
                border-radius: 8px;
                border: 1.5px solid #e0e0e0;
                transition: all 0.3s ease;
                
                &:hover {
                    border-color: #52c41a;
                }
            }
            
            &.ant-select-focused .ant-select-selector {
                border-color: #52c41a;
                box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.1);
            }
        }
    }
    
    .filter-label {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 10px;
        display: block;
        letter-spacing: 0.2px;
    }
    
    .reset-btn {
        height: 42px;
        border-radius: 8px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
    }
`;

const ProductGrid = styled.div`
    margin-bottom: 40px;
`;

const ProductCountBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 20px;
    margin-bottom: 24px;
    font-size: 14px;
    font-weight: 600;
    color: #0369a1;
    border: 1px solid #bae6fd;
`;

const DealSection = styled.div`
    background: linear-gradient(135deg, #ff6b6b 0%, #e07d69ff 100%);
    border-radius: 16px;
    padding: 40px;
    margin-bottom: 40px;
    color: #fff;
    box-shadow: 0 8px 32px rgba(238, 77, 45, 0.3);
    
    @media (max-width: 768px) {
        padding: 24px;
        margin-bottom: 24px;
    }
    
    .deal-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        
        .deal-icon {
            font-size: 32px;
        }
        
        .deal-title {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
        }
    }
    
    .deal-products {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 24px;
    }
`;

const StorytellingSection = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 40px;
    margin-bottom: 40px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #f0f0f0;
    
    @media (max-width: 768px) {
        padding: 24px;
        margin-bottom: 24px;
    }
    
    .story-title {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 24px;
        color: #1a1a1a;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .story-content {
        font-size: 16px;
        line-height: 1.8;
        color: #555;
        white-space: pre-line;
    }
`;

const RelatedCollectionsSection = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 40px;
    margin-bottom: 40px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #f0f0f0;
    
    @media (max-width: 768px) {
        padding: 24px;
        margin-bottom: 24px;
    }
    
    .section-title {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 24px;
        color: #1a1a1a;
    }
`;

const CollectionCard = styled.div`
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fff;
    border: 1px solid #eef2f7;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    
    &:hover {
        transform: translateY(-8px);
        box-shadow: 0 18px 32px rgba(15, 23, 42, 0.16);
        border-color: #cbd5f5;
    }
    
    .collection-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }
    
    .collection-info {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        text-align: center;
        
        .collection-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1a1a1a;
        }
        
        .collection-desc {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 80px 20px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #f0f0f0;
`;

const CollectionDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    
    // State cho filters và pagination
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [priceSort, setPriceSort] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [pagination, setPagination] = useState({
        page: 0,
        limit: 20,
        total: 0,
        totalPage: 1
    });
    
    // Fetch collection details
    const { data: collectionData, isPending: isPendingCollection } = useQuery({
        queryKey: ['collection', slug],
        queryFn: () => CollectionService.getCollectionBySlug(slug),
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });
    
    const collection = collectionData?.data;
    const collectionId = collection?._id;
    
    // Fetch products by collection
    const { data: productsData, isPending: isPendingProducts } = useQuery({
        queryKey: ['collection-products', slug, collectionId],
        queryFn: () => ProductService.getProductsByCollection(slug, 1000),
        enabled: !!slug && !!collectionId,
        staleTime: 2 * 60 * 1000,
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
    
    // Fetch all collections for related
    const { data: allCollectionsData } = useQuery({
        queryKey: ['all-collections'],
        queryFn: () => CollectionService.getAllCollection(),
        staleTime: 30 * 60 * 1000,
    });
    
    const categories = categoriesData?.data?.filter(cat => cat.isActive) || [];
    const brands = brandsData?.data?.filter(brand => brand.isActive !== false) || [];
    const allProducts = productsData?.data || [];
    const allCollections = allCollectionsData?.data?.filter(col => 
        col.isActive && col._id !== collectionId
    ) || [];

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
                    <span style={{ paddingLeft: `${level * 14}px`, display: 'flex', gap: 8, alignItems: 'center' }}>
                        {level === 0 ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#52c41a', boxShadow: '0 0 0 4px rgba(82, 196, 26, 0.12)' }} /> : null}
                        <span style={{ fontWeight: 600, color: '#1f1f1f' }}>{name}</span>
                        {level === 0 && hasChildren ? <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#8c8c8c' }}>All</span> : null}
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
        
        // Sort products
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
    }, [allProducts, selectedCategory, selectedBrand, priceSort, sortBy, categories]);
    
    // Get flash sale products from collection
    const flashSaleProducts = useMemo(() => {
        return filteredAndSortedProducts
            .filter(p => p.discount > 0)
            .slice(0, 4);
    }, [filteredAndSortedProducts]);
    
    // Pagination
    const paginatedProducts = useMemo(() => {
        const start = pagination.page * pagination.limit;
        const end = start + pagination.limit;
        return filteredAndSortedProducts.slice(start, end);
    }, [filteredAndSortedProducts, pagination.page, pagination.limit]);
    
    // Update total when filtered products change
    useEffect(() => {
        const total = filteredAndSortedProducts.length;
        const totalPage = Math.ceil(total / pagination.limit);
        setPagination(prev => ({
            ...prev,
            total,
            totalPage
        }));
    }, [filteredAndSortedProducts.length, pagination.limit]);
    
    const handleResetFilters = () => {
        setSelectedCategory(null);
        setSelectedBrand(null);
        setPriceSort(null);
        setSortBy('newest');
        setPagination(prev => ({ ...prev, page: 0 }));
    };
    
    const handlePageChange = (page, pageSize) => {
        setPagination(prev => ({
            ...prev,
            page: page - 1,
            limit: pageSize
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const hasActiveFilters = selectedCategory || selectedBrand || priceSort || sortBy !== 'newest';
    const isPending = isPendingCollection || isPendingProducts;
    
    if (!collection && !isPending) {
        return (
            <CollectionContainer>
                <ContentWrapper>
                    <EmptyState>
                        <Empty description="Không tìm thấy bộ sưu tập" />
                        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
                            Về trang chủ
                        </Button>
                    </EmptyState>
                </ContentWrapper>
            </CollectionContainer>
        );
    }
    
    return (
        <Loading isPending={isPending}>
            <CollectionContainer>
                {/* Hero Banner */}
                {collection?.image && (
                    <HeroBanner>
                        <img 
                            src={collection.image} 
                            alt={collection.name}
                            className="banner-image"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="banner-overlay">
                            <div className="banner-content">
                                <h1 className="collection-title">{collection?.name}</h1>
                                {collection?.description && (
                                    <p className="collection-subtitle">
                                        {collection.description.length > 150 
                                            ? collection.description.substring(0, 150) + '...'
                                            : collection.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </HeroBanner>
                )}
                
                <ContentWrapper>
                    {/* Mô tả + CTA */}
                    {collection?.description && (
                        <DescriptionSection>
                            <h2 className="description-title">
                                <BookOutlined />
                                BỘ SƯU TẬP
                            </h2>
                            
                        </DescriptionSection>
                    )}
                    
                    {/* Bộ lọc sản phẩm */}
                    <FilterBar>
                        <div className="filter-header">
                            
                            <h3 className="filter-title">Bộ lọc sản phẩm</h3>
                        </div>
                        <div className="filter-row">
                            <div className="filter-item">
                                <label className="filter-label">Danh mục</label>
                                <Select
                                    placeholder="Tat ca danh muc"
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
                                />
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
                            
                            {hasActiveFilters && (
                                <Button 
                                    type="default" 
                                    danger
                                    onClick={handleResetFilters}
                                    className="reset-btn"
                                    icon={<ClearOutlined />}
                                >
                                    Xóa bộ lọc
                                </Button>
                            )}
                        </div>
                    </FilterBar>
                    
                    {/* Grid sản phẩm */}
                    <div id="products-section">
                        <ProductGrid>
                            {paginatedProducts.length > 0 ? (
                                <>
                                    <ProductCountBadge>
                                        <Badge 
                                            count={filteredAndSortedProducts.length} 
                                            showZero 
                                            style={{ backgroundColor: '#52c41a' }}
                                        />
                                        <span>Sản phẩm được tìm thấy</span>
                                    </ProductCountBadge>
                                    <Row gutter={[20, 28]} style={{ display: 'flex', alignItems: 'stretch' }}>
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
                                                    discount={product.discount}
                                                    id={product._id}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                    
                                    {/* Pagination */}
                                    {pagination.totalPage > 1 && (
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
                                    )}
                                </>
                            ) : (
                                <EmptyState>
                                    <Empty 
                                        description="Không tìm thấy sản phẩm nào"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    >
                                        <Button 
                                            type="primary" 
                                            onClick={handleResetFilters}
                                            style={{ marginTop: 16 }}
                                        >
                                            Xóa bộ lọc
                                        </Button>
                                    </Empty>
                                </EmptyState>
                            )}
                        </ProductGrid>
                    </div>
                    
                    {/* Deal nổi bật */}
                    {flashSaleProducts.length > 0 && (
                        <DealSection>
                            <div className="deal-header">
                                <FireOutlined className="deal-icon" />
                                <h2 className="deal-title">Deal nổi bật</h2>
                            </div>
                            <Row gutter={[20, 20]}>
                                {flashSaleProducts.map((product) => (
                                    <Col xs={12} sm={8} md={6} key={product._id}>
                                        <CardComponent
                                            countInStock={product.countInStock}
                                            description={product.description}
                                            image={(product.images && product.images.length > 0) ? product.images[0] : product.image}
                                            name={product.name}
                                            price={product.price}
                                            rating={product.rating}
                                            type={product.type}
                                            selled={product.selled}
                                            discount={product.discount}
                                            id={product._id}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </DealSection>
                    )}
                    
                    {/* Storytelling */}
                    {collection?.description && collection.description.length > 200 && (
                        <StorytellingSection>
                            <h2 className="story-title">
                                <BookOutlined />
                                Câu chuyện của bộ sưu tập
                            </h2>
                            <div className="story-content">
                                {collection.description}
                            </div>
                        </StorytellingSection>
                    )}
                    
                    {/* Sản phẩm gợi ý / Bộ sưu tập khác */}
                    {allCollections.length > 0 && (
                        <RelatedCollectionsSection>
                            <h2 className="section-title">Bộ sưu tập khác</h2>
                            <Row gutter={[20, 20]}>
                                {allCollections.slice(0, 3).map((col) => (
                                    <Col xs={24} sm={12} md={8} key={col._id}>
                                        <CollectionCard onClick={() => navigate(`/collection/${col.slug}`)}>
                                            <img 
                                                src={col.image || '/placeholder-collection.jpg'} 
                                                alt={col.name}
                                                className="collection-image"
                                                onError={(e) => {
                                                    e.target.src = getPlaceholderImage(400, 200, 'Collection');
                                                }}
                                            />
                                            <div className="collection-info">
                                                <div className="collection-name">{col.name}</div>
                                                {col.description && (
                                                    <div className="collection-desc">{col.description}</div>
                                                )}
                                            </div>
                                        </CollectionCard>
                                    </Col>
                                ))}
                            </Row>
                        </RelatedCollectionsSection>
                    )}
                </ContentWrapper>
            </CollectionContainer>
        </Loading>
    );
};

export default CollectionDetailPage;
