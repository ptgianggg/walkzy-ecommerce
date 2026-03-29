import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Button, Empty } from 'antd';
import { AppstoreOutlined, ArrowRightOutlined } from '@ant-design/icons';
import styled, { createGlobalStyle } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import * as CollectionService from '../../services/CollectionService';
import { getPlaceholderImage } from '../../utils';

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

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  padding: 32px 0 48px;
`;

const Container = styled.div`
  max-width: 1270px;
  margin: 0 auto;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const Header = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 24px 24px 20px;
  margin-bottom: 28px;
  border: 1px solid #eef5ec;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .title {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(135deg, #132663ff 0%, #20135aff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    letter-spacing: -0.4px;

    .icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #f0f9f4;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #1d1068ff;
      box-shadow: inset 0 0 0 1px #e6f4eb;
    }

    @media (max-width: 768px) {
      font-size: 26px;
    }
  }

  .subtitle {
    font-size: 15px;
    color: #4a4a4a;
    margin: 12px 0 0;
    max-width: 860px;
    line-height: 1.7;
  }
`;

const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  color: #096dd9;
  border: 1px solid #c6e2ff;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
`;

const CollectionCard = styled.div`
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
  border: 1px solid #f0f0f0;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
    border-color: #c8c9d3ff;
  }

  .cover {
    width: 100%;
    height: 200px;
    object-fit: cover;
    background: #fafafa;
    display: block;
  }

  .info {
    padding: 16px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .name {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: #1a1a1a;
  }

  .desc {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }

  .cta {
    margin-top: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #1890ff;
    font-weight: 600;
    font-size: 14px;
  }

  .badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: linear-gradient(135deg, #ff7a45 0%, #ff4d4f 100%);
    color: #fff;
    padding: 6px 10px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 12px;
    box-shadow: 0 6px 14px rgba(255, 77, 79, 0.32);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
`;

const CollectionsPage = () => {
  const navigate = useNavigate();

  const { data: collectionsData, isPending } = useQuery({
    queryKey: ['all-collections-page'],
    queryFn: () => CollectionService.getAllCollection(),
    staleTime: 30 * 60 * 1000,
  });

  const collections = collectionsData?.data || [];

  return (
    <PageWrapper>
      <GlobalStyle />
      <Container>
        <Header>
          <div className="top">
            <div className="title">
              <span className="icon">
                <AppstoreOutlined />
              </span>
              TẤT CẢ BỘ SƯU TẬP
            </div>
            <CountBadge>{collections.length} bộ sưu tập</CountBadge>
          </div>
          
        </Header>

        {collections.length > 0 ? (
          <Row gutter={[20, 24]}>
            {collections.map((collection) => (
              <Col xs={24} sm={12} md={12} lg={8} key={collection._id}>
                <CollectionCard onClick={() => navigate(`/collection/${collection.slug}`)}>
                  {collection.isTrending && <span className="badge">Nổi bật</span>}
                  <img
                    className="cover"
                    src={collection.image || getPlaceholderImage(600, 300, 'Collection')}
                    alt={collection.name}
                    onError={(e) => {
                      e.target.src = getPlaceholderImage(600, 300, 'Collection');
                    }}
                  />
                  <div className="info">
                    <h3 className="name">{collection.name}</h3>
                    {collection.description && <p className="desc">{collection.description}</p>}
                    <span className="cta">
                      Xem bộ sưu tập <ArrowRightOutlined />
                    </span>
                  </div>
                </CollectionCard>
              </Col>
            ))}
          </Row>
        ) : (
          !isPending && (
            <EmptyState>
              <Empty description="Chưa có bộ sưu tập nào" />
              <Button type="primary" onClick={() => navigate('/') } style={{ marginTop: 16 }}>
                Về trang chủ
              </Button>
            </EmptyState>
          )
        )}
      </Container>
    </PageWrapper>
  );
};

export default CollectionsPage;

