import React from 'react';
import { Card, Row, Col, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const WrapperCollections = styled.div`
    margin: 0;
    background: #fff;
    padding: 24px;
    border-radius: 8px;
    
    @media (max-width: 768px) {
        padding: 16px;
    }
`;

const CollectionCard = styled(Card)`
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    height: 400px;
    position: relative;
    
    &:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.2);
        
        .overlay {
            background: rgba(0,0,0,0.3);
            opacity: 1;
            pointer-events: auto;
        }
    }
    
    .ant-card-cover {
        height: 100%;
        position: relative;
        
        img {
            height: 100%;
            object-fit: cover;
        }
    }
    
    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.4);
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
    }
    
    .content {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 24px;
        color: #fff;
        z-index: 2;
    }

    .cta-button {
        background: rgba(255, 255, 255, 0.7);
        border: none;
        color: #111827;
        border-radius: 999px;
        padding: 10px 18px;
        font-weight: 700;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .cta-button:hover,
    .cta-button:focus {
        background: rgba(255, 255, 255, 0.85);
        color: #111827;
        transform: translateY(-2px);
        box-shadow: 0 14px 26px rgba(0,0,0,0.3);
    }
`;

const CollectionsSection = ({ collections = [] }) => {
    const navigate = useNavigate();

    if (collections.length === 0) {
        return null;
    }

    return (
        <WrapperCollections>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f0f0f0',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <h2 style={{ 
                    margin: 0, 
                    fontSize: '22px', 
                    fontWeight: 900,
                    fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                    letterSpacing: '0.3px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    color: '#000'
                }}>
                    BỘ SƯU TẬP
                </h2>
                <Button 
                    type="link" 
                    onClick={() => navigate('/collections')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    Xem tất cả <RightOutlined />
                </Button>
            </div>
            
            <Row gutter={[16, 16]}>
                {collections.map((collection) => (
                    <Col xs={24} sm={24} md={12} lg={8} key={collection._id}>
                        <CollectionCard
                            hoverable
                            cover={
                                <>
                                    <div className="overlay">
                                        <Button 
                                            type="primary" 
                                            size="large"
                                            className="cta-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/collection/${collection.slug}`);
                                            }}
                                        >
                                            Xem bộ sưu tập
                                        </Button>
                                    </div>
                                    <img
                                        alt={collection.name}
                                        src={collection.image || '/placeholder-collection.jpg'}
                                        style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                                    />
                                </>
                            }
                            onClick={() => navigate(`/collection/${collection.slug}`)}
                        >
                            <div className="content">
                                <h3 style={{ 
                                    margin: 0, 
                                    fontSize: '24px', 
                                    fontWeight: 'bold',
                                    color: '#fff',
                                    marginBottom: '8px'
                                }}>
                                    {collection.name}
                                </h3>
                                                            </div>
                        </CollectionCard>
                    </Col>
                ))}
            </Row>
        </WrapperCollections>
    );
};

export default CollectionsSection;
