import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Spin, Empty, Breadcrumb } from 'antd';
import { HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as CategoryService from '../../services/CategoryService';
import Loading from '../../components/LoadingComponent/Loading';

const PageContainer = styled.div`
    min-height: 100vh;
    background: #f5f5f5;
    padding: 40px 0;
`;

const ContentWrapper = styled.div`
    max-width: 1270px;
    margin: 0 auto;
    padding: 0 20px;
`;

const HeaderSection = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60px 20px;
    text-align: center;
    color: white;
    margin-bottom: 40px;
    border-radius: 0 0 16px 16px;
    
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

const CategoriesGrid = styled.div`
    background: white;
    padding: 32px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    
    @media (max-width: 768px) {
        padding: 16px;
    }
`;

const CategoryCard = styled(Card)`
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    height: 100%;
    border: 1px solid #f0f0f0;
    text-align: center;
    
    &:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        border-color: #1890ff;
    }
    
    .ant-card-cover {
        position: relative;
        overflow: hidden;
        background: #f5f5f5;
        padding: 20px;
        
        @media (max-width: 768px) {
            padding: 12px;
        }
        
        img {
            transition: transform 0.3s;
        }
        
        &:hover img {
            transform: scale(1.1);
        }
    }
    
    .ant-card-body {
        padding: 20px 16px;
        
        @media (max-width: 768px) {
            padding: 12px;
        }
    }
`;

const CategoryName = styled.div`
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-top: 12px;
    
    @media (max-width: 768px) {
        font-size: 16px;
    }
`;

const AllCategoriesPage = () => {
    const navigate = useNavigate();

    const { data: categoriesData, isPending } = useQuery({
        queryKey: ['categories'],
        queryFn: () => CategoryService.getAllCategory(),
        staleTime: 30 * 60 * 1000,
        cacheTime: 60 * 60 * 1000,
    });

    const categories = categoriesData?.data?.filter(cat => cat.isActive) || [];

    // Only show top-level (parent) categories on this page
    const parentCategories = categories.filter(cat => !(cat.parentCategory && (cat.parentCategory._id || cat.parentCategory)));

    if (isPending) {
        return (
            <Loading isPending={true}>
                <div style={{ minHeight: '100vh' }} />
            </Loading>
        );
    }

    return (
        <PageContainer>
            <HeaderSection>
                <h1>Tất cả danh mục</h1>
                <p>Khám phá {parentCategories.length} danh mục sản phẩm</p>
            </HeaderSection>

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
                                        <ShoppingOutlined /> Tất cả danh mục
                                    </span>
                                ),
                            },
                        ]}
                    />
                </BreadcrumbWrapper>

                <CategoriesGrid>
                    {parentCategories.length === 0 ? (
                        <Empty description="Không có danh mục nào" />
                    ) : (
                        <Row gutter={[24, 24]}>
                            {parentCategories.map((category) => (
                                <Col 
                                    xs={12} 
                                    sm={12} 
                                    md={8} 
                                    lg={6} 
                                    xl={6}
                                    key={category._id}
                                >
                                    <CategoryCard
                                        hoverable
                                        cover={
                                            <div style={{ 
                                                position: 'relative', 
                                                paddingTop: '100%',
                                                overflow: 'hidden',
                                                background: '#f5f5f5',
                                                borderRadius: '8px'
                                            }}>
                                                {category.image ? (
                                                    <img
                                                        alt={category.name}
                                                        src={category.image}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        fontSize: '64px'
                                                    }}>
                                                        📦
                                                    </div>
                                                )}
                                            </div>
                                        }
                                        onClick={() => navigate(`/category/${category._id}`)}
                                    >
                                        <CategoryName>{category.name}</CategoryName>
                                    </CategoryCard>
                                </Col>
                            ))}
                        </Row>
                    )}
                </CategoriesGrid>
            </ContentWrapper>
        </PageContainer>
    );
};

export default AllCategoriesPage;

