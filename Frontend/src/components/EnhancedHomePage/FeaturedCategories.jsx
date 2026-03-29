import React from 'react';
import { Card, Row, Col, Button, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

    body {
        font-family: 'Inter', 'Roboto', system-ui, -apple-system, sans-serif;
    }

    h1, h2, h3, h4, h5, h6 {
        font-family: 'Montserrat', 'Inter', 'Roboto', system-ui, sans-serif;
        font-weight: 800;
        letter-spacing: -0.2px;
    }
`;

const WrapperCategories = styled.div`
    margin: 0;
    background: #fdfdfd8c;
    padding: 24px;
    border-radius: 8px;
    font-family: 'Inter', 'Roboto', system-ui, -apple-system, sans-serif;
    
    @media (max-width: 768px) {
        padding: 16px;
    }
`;

const WrapperSectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f0f0f0;
    position: relative;

    /* 'Xem tất cả' button hidden by default, appears on hover or keyboard focus */
    .view-all {
        opacity: 0;
        transform: translateX(8px);
        transition: opacity 200ms ease, transform 200ms ease;
        pointer-events: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #1890ff;
        font-weight: 600;
    }

    &:hover .view-all,
    &:focus-within .view-all {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
    }
    
    @media (max-width: 768px) {
        flex-direction: column;
        align-items: center; /* center title and button on mobile */
        gap: 12px;

        /* On small screens, make the button always visible (space is limited) */
        .view-all {
            opacity: 1;
            transform: none;
            pointer-events: auto;
        }
    }
`;

const WrapperSectionTitle = styled.h2`
    font-size: 24px;
    font-family: 'Montserrat', 'Inter', 'Roboto', system-ui, sans-serif;
    font-weight: 900;
    margin: 0;
    color: #000;
    letter-spacing: 0.6px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.05);
    text-transform: uppercase; /* Make the title uppercase */
    flex: 1 1 auto; /* allow title to take center space */
    text-align: center; /* center the text */
    
    @media (max-width: 768px) {
        font-size: 22px;
    }
`;

const CategoryCard = styled(Card)`
    border-radius: 16px;
    border: none;
    cursor: pointer;
    background: transparent;
    transition: transform 0.28s cubic-bezier(.2,.8,.2,1), box-shadow 0.28s cubic-bezier(.2,.8,.2,1);
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);

    &:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
    }

    .ant-card-body {
        padding: 0;
    }
`;

const CategoryImageWrapper = styled.div`
    position: relative;
    width: 100%;
    padding-top: 100%;
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(135deg, #dfe9f3 0%, #fef9d7 100%);

    img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.35s ease;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.55));
        transition: opacity 0.3s ease;
        opacity: 0.8;
    }

    ${CategoryCard}:hover & img {
        transform: scale(1.04);
    }

    ${CategoryCard}:hover &::after {
        opacity: 0.9;
    }
`;

const CategoryOverlayText = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 12px;
    color: #f8fafc;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.3px;
    text-shadow: 0 6px 24px rgba(15, 23, 42, 0.45);
`;

const FeaturedCategories = ({ categories = [], isLoading = false }) => {
    const navigate = useNavigate();

    // Hiển thị skeleton khi đang load
    if (isLoading) {
        return (
            <WrapperCategories>
                <WrapperSectionHeader>
                    <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
                    <Skeleton.Button active size="small" style={{ width: 100 }} />
                </WrapperSectionHeader>
                <Row gutter={[16, 16]}>
                    {[...Array(8)].map((_, index) => (
                        <Col xs={12} sm={8} md={6} lg={6} key={index}>
                            <Card>
                                <Skeleton.Image
                                    active
                                    style={{ width: '100%', height: '150px' }}
                                />
                                <Skeleton active paragraph={{ rows: 1 }} style={{ marginTop: 16 }} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </WrapperCategories>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    // Build parent -> children hierarchy and display parent categories for clear hierarchy
    const normalized = categories.map(cat => ({
        ...cat,
        parentId: cat.parentCategory && (typeof cat.parentCategory === 'object' ? (cat.parentCategory._id || cat.parentCategory) : cat.parentCategory)
    }));

    const parents = normalized.filter(cat => !cat.parentId);
    const fallback = normalized.slice(0, 8);
    const displayParents = parents.length > 0 ? parents.slice(0, 8) : fallback;

    return (
        <>
            <GlobalStyle />
            <WrapperCategories>
                <WrapperSectionHeader>
                    <WrapperSectionTitle>
                        Danh mục nổi bật
                    </WrapperSectionTitle>
                    <Button
                        type="link"
                        onClick={() => navigate('/categories')}
                        className="view-all"
                        aria-label="Xem tất cả danh mục"
                    >
                        Xem tất cả <RightOutlined />
                    </Button>
                </WrapperSectionHeader>
                <Row gutter={[16, 16]}>
                    {displayParents.map((parent) => (
                        <Col xs={12} sm={8} md={6} lg={6} key={parent._id}>
                            <CategoryCard
                                hoverable
                                onClick={() => navigate(`/category/${parent._id}`)}
                            >
                                <CategoryImageWrapper>
                                    {parent.image && (
                                        <img src={parent.image} alt={parent.name} />
                                    )}
                                    <CategoryOverlayText>{parent.name}</CategoryOverlayText>
                                </CategoryImageWrapper>
                            </CategoryCard>
                        </Col>
                    ))}
                </Row>
            </WrapperCategories>
        </>
    );
};

export default FeaturedCategories;
