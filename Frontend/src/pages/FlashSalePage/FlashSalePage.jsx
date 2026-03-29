import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Select, Button, Empty, Spin } from 'antd';
import { FireOutlined, DownOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import * as ProductService from '../../services/ProductService';
import * as CategoryService from '../../services/CategoryService';
import { isProductInCategory } from '../../utils';
import Loading from '../../components/LoadingComponent/Loading';
import FlashSaleProductCard from '../../components/FlashSaleProductCard/FlashSaleProductCard';
import FlashSaleCountdown from '../../components/FlashSaleCountdown/FlashSaleCountdown';

const { Option } = Select;

const FlashSaleContainer = styled.div`
    min-height: 100vh;
    background: linear-gradient(180deg, #fff5f5 0%, #ffffff 100%);
    padding: 24px 0;
`;

const HeaderSection = styled.div`
    max-width: 1270px;
    margin: 0 auto;
    padding: 0 16px;
    margin-bottom: 32px;
`;

const TitleSection = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    
    .title {
        font-size: 32px;
        font-weight: 800;
        color: #FF3B30;
        margin: 0;
        
        @media (max-width: 768px) {
            font-size: 24px;
        }
    }
    
    .icon {
        font-size: 40px;
        color: #FF3B30;
        
        @media (max-width: 768px) {
            font-size: 32px;
        }
    }
`;

const FilterBar = styled.div`
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin-bottom: 24px;
    
    .filter-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        align-items: center;
        
        @media (max-width: 768px) {
            flex-direction: column;
            align-items: stretch;
        }
    }
    
    .filter-item {
        flex: 1;
        min-width: 180px;
        
        @media (max-width: 768px) {
            width: 100%;
        }
        
        .ant-select {
            width: 100%;
        }
    }
    
    .filter-label {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
        display: block;
    }
    
    .reset-btn {
        margin-left: auto;
        
        @media (max-width: 768px) {
            width: 100%;
            margin-left: 0;
            margin-top: 8px;
        }
    }
`;

const ProductGrid = styled.div`
    max-width: 1270px;
    margin: 0 auto;
    padding: 0 16px;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const FlashSalePage = () => {
    const navigate = useNavigate();
    
    // State cho filters
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [discountRange, setDiscountRange] = useState(null);
    const [priceSort, setPriceSort] = useState(null);
    const [sortBy, setSortBy] = useState('ending-soon'); // ending-soon, best-selling, discount-high
    
    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => CategoryService.getAllCategory(),
        staleTime: 30 * 60 * 1000,
    });

    // Fetch flash sale products (filter by category if selected)
    const { data: flashSaleData, isPending } = useQuery({
        queryKey: ['flash-sale', selectedCategory],
        queryFn: async () => {
            const categoriesToSend = selectedCategory ? [selectedCategory] : [];
            const res = await ProductService.getFlashSaleProducts(1000, categoriesToSend);
            return res;
        },
        staleTime: 0,
        cacheTime: 5 * 60 * 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        keepPreviousData: true
    });
    
    const categories = categoriesData?.data?.filter(cat => cat.isActive) || [];
    const allProducts = flashSaleData?.data || [];

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
                        {level === 0 ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4d4f', boxShadow: '0 0 0 4px rgba(255, 77, 79, 0.14)' }} /> : null}
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

    // Tính toán thời gian tổng cho countdown (thời gian kết thúc sớm nhất)
    const { overallStartDate, overallEndDate } = useMemo(() => {
        const validProducts = allProducts.filter(p => 
            p.saleStartDate && p.saleEndDate
        );
        
        if (validProducts.length === 0) {
            return { overallStartDate: null, overallEndDate: null };
        }
        
        const validDates = validProducts
            .map(p => {
                try {
                    const start = dayjs(p.saleStartDate);
                    const end = dayjs(p.saleEndDate);
                    if (start.isValid() && end.isValid() && end.isAfter(start)) {
                        return { start, end };
                    }
                    return null;
                } catch (e) {
                    return null;
                }
            })
            .filter(item => item !== null);
        
        if (validDates.length === 0) {
            return { overallStartDate: null, overallEndDate: null };
        }
        
        // Tìm thời gian kết thúc sớm nhất
        const earliestEnd = validDates.reduce((earliest, current) => {
            return current.end.isBefore(earliest.end) ? current : earliest;
        }, validDates[0]);
        
        return {
            overallStartDate: earliestEnd.start,
            overallEndDate: earliestEnd.end
        };
    }, [allProducts]);
    
    // Filter và sort products
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = [...allProducts];

        if (selectedCategory) {
            filtered = filtered.filter(p => isProductInCategory(p, selectedCategory, categories));
        }

        // Filter by discount range
        if (discountRange) {
            const [min, max] = discountRange.split('-').map(Number);
            filtered = filtered.filter(p => {
                const discount = p.discount || 0;
                if (max === 100) {
                    return discount >= min;
                }
                return discount >= min && discount <= max;
            });
        }
        
        // Sort products
        filtered.sort((a, b) => {
            if (sortBy === 'ending-soon') {
                // Sắp xếp theo thời gian kết thúc (sớm nhất trước)
                const aEnd = a.saleEndDate ? dayjs(a.saleEndDate).valueOf() : Infinity;
                const bEnd = b.saleEndDate ? dayjs(b.saleEndDate).valueOf() : Infinity;
                return aEnd - bEnd;
            } else if (sortBy === 'best-selling') {
                // Sắp xếp theo số lượng bán
                return (b.selled || 0) - (a.selled || 0);
            } else if (sortBy === 'discount-high') {
                // Sắp xếp theo mức giảm giá cao nhất
                return (b.discount || 0) - (a.discount || 0);
            }
            return 0;
        });
        
        // Sort by price
        if (priceSort === 'low-to-high') {
            filtered.sort((a, b) => {
                const aPrice = (a.originalPrice || a.price) * (1 - (a.discount || 0) / 100);
                const bPrice = (b.originalPrice || b.price) * (1 - (b.discount || 0) / 100);
                return aPrice - bPrice;
            });
        } else if (priceSort === 'high-to-low') {
            filtered.sort((a, b) => {
                const aPrice = (a.originalPrice || a.price) * (1 - (a.discount || 0) / 100);
                const bPrice = (b.originalPrice || b.price) * (1 - (b.discount || 0) / 100);
                return bPrice - aPrice;
            });
        }
        
        return filtered;
    }, [allProducts, discountRange, priceSort, sortBy, selectedCategory, categories]);
    
    const handleResetFilters = () => {
        setSelectedCategory(null);
        setDiscountRange(null);
        setPriceSort(null);
        setSortBy('ending-soon');
    };
    
    const hasActiveFilters = !!selectedCategory || discountRange || priceSort || sortBy !== 'ending-soon';
    
    return (
        <Loading isPending={isPending}>
            <FlashSaleContainer>
                <HeaderSection>
                    <TitleSection>
                        <FireOutlined className="icon" />
                        <h1 className="title">FLASH SALE - DEAL SỐC HÔM NAY</h1>
                    </TitleSection>
                    
                    {/* Countdown Timer tổng */}
                    {overallStartDate && overallEndDate && (
                        <FlashSaleCountdown 
                            startDate={overallStartDate} 
                            endDate={overallEndDate} 
                        />
                    )}
                    
                    {/* Filter Bar */}
                    <FilterBar>
                        <div className="filter-row">
                            <div className="filter-item">
                                <label className="filter-label">Danh mục</label>
                                <Select
                                    placeholder="Chọn danh mục"
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
                                <label className="filter-label">Mức giảm giá</label>
                                <Select
                                    placeholder="Chọn mức giảm giá"
                                    value={discountRange}
                                    onChange={setDiscountRange}
                                    allowClear
                                    suffixIcon={<DownOutlined />}
                                >
                                    <Option value="0-20">0% - 20%</Option>
                                    <Option value="20-30">20% - 30%</Option>
                                    <Option value="30-50">30% - 50%</Option>
                                    <Option value="50-70">50% - 70%</Option>
                                    <Option value="70-100">Trên 70%</Option>
                                </Select>
                            </div>
                            
                            <div className="filter-item">
                                <label className="filter-label">Sắp xếp theo giá</label>
                                <Select
                                    placeholder="Chọn sắp xếp giá"
                                    value={priceSort}
                                    onChange={setPriceSort}
                                    allowClear
                                    suffixIcon={<DownOutlined />}
                                >
                                    <Option value="low-to-high">Giá thấp - cao </Option>
                                    <Option value="high-to-low">Giá cao - thấp</Option>
                                </Select>
                            </div>
                            
                            <div className="filter-item">
                                <label className="filter-label">Sắp xếp theo</label>
                                <Select
                                    value={sortBy}
                                    onChange={setSortBy}
                                    suffixIcon={<DownOutlined />}
                                >
                                    <Option value="ending-soon">Sắp kết thúc</Option>
                                    <Option value="best-selling">Bán chạy</Option>
                                    <Option value="discount-high">Giảm giá cao nhất</Option>
                                </Select>
                            </div>
                            
                            {hasActiveFilters && (
                                <Button 
                                    type="default" 
                                    onClick={handleResetFilters}
                                    className="reset-btn"
                                >
                                    XA3a b??T l???c
                                </Button>
                            )}
                        </div>
                    </FilterBar>
                </HeaderSection>
                
                {/* Product Grid */}
                <ProductGrid>
                    {filteredAndSortedProducts.length > 0 ? (
                        <Row gutter={[16, 24]}>
                            {filteredAndSortedProducts.map((product) => (
                                <Col 
                                    xs={12} 
                                    sm={12} 
                                    md={6} 
                                    lg={6} 
                                    xl={6} 
                                    key={product._id}
                                >
                                    <FlashSaleProductCard product={product} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <EmptyState>
                            <Empty 
                                description="Không tìm thấy sản phẩm flash sale nào"
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
            </FlashSaleContainer>
        </Loading>
    );
};

export default FlashSalePage;

