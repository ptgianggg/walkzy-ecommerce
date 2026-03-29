import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Rate, Tag } from 'antd';
import * as ProductService from '../../services/ProductService';
import { convertPrice, getPlaceholderImage } from '../../utils';
import styled from 'styled-components';
import Loading from '../LoadingComponent/Loading';

const WrapperRelatedProducts = styled.div`
  margin-top: 32px;
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #333;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
`;

const ProductCard = styled(Card)`
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.28s cubic-bezier(.2,.8,.2,1), box-shadow 0.28s cubic-bezier(.2,.8,.2,1);
  height: 100%;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .ant-card-cover {
    position: relative;
    padding-top: 0; /* removed to avoid extra top whitespace; inner wrapper controls aspect */
    overflow: hidden;
    background: #f5f5f5;

    img {
      position: static;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }

    &:hover img {
      transform: scale(1.06);
    }
  }

  .ant-card-body {
    padding: 12px 12px 14px;
  }

  .product-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 1;
    font-size: 11px;
    padding: 3px 6px;
    font-weight: 800;
    border-radius: 8px;
  }
`;

const RelatedProducts = ({ productId, categoryId, brandId, basePrice = null, limit = 8 }) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const fetchRelatedProducts = async () => {
    const res = await ProductService.getAllProduct('', 50);
    if (res?.status === 'OK' && res?.data) {
      const cleaned = res.data.filter(
        (product) => product._id !== productId && product.isActive !== false
      );
      const normBasePrice = Number(basePrice) > 0 ? Number(basePrice) : null;

      const scoreProduct = (product) => {
        const price = Number(product.price) || 0;
        const isSameCategory =
          !!categoryId &&
          (product.category?._id === categoryId || product.category === categoryId);
        const isSameBrand =
          !!brandId && (product.brand?._id === brandId || product.brand === brandId);

        let priceScore = 0;
        if (normBasePrice && price > 0) {
          const diffRatio = Math.abs(price - normBasePrice) / normBasePrice;
          if (diffRatio <= 0.15) priceScore = 1.2; // trong khoảng +/-15%
          else if (diffRatio <= 0.25) priceScore = 0.9; // trong khoảng +/-25%
          else if (diffRatio <= 0.35) priceScore = 0.4; // còn tương đối gần
          else priceScore = -0.2; // quá lệch
        }

        const saleScore = product.discount > 0 ? 0.3 : 0;
        const ratingScore =
          (product.rating || 0) >= 4.5 ? 0.35 : (product.rating || 0) >= 4 ? 0.2 : 0;
        const soldScore =
          (product.selled || 0) >= 150 ? 0.25 : (product.selled || 0) >= 50 ? 0.15 : 0;

        const baseScore = (isSameCategory ? 3 : 0) + (isSameBrand ? 1.5 : 0);
        const finalScore = baseScore + priceScore + saleScore + ratingScore + soldScore;

        return {
          isSameCategory,
          isSameBrand,
          finalScore,
          priceDiff: normBasePrice ? price - normBasePrice : 0,
        };
      };

      const sorted = cleaned
        .map((p) => ({ product: p, meta: scoreProduct(p) }))
        .sort((a, b) => {
          if (a.meta.isSameCategory !== b.meta.isSameCategory) {
            return a.meta.isSameCategory ? -1 : 1;
          }
          if (a.meta.isSameBrand !== b.meta.isSameBrand) {
            return a.meta.isSameBrand ? -1 : 1;
          }
          if (b.meta.finalScore !== a.meta.finalScore) {
            return b.meta.finalScore - a.meta.finalScore;
          }
          const ratingDiff = (b.product.rating || 0) - (a.product.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          const discountDiff = (b.product.discount || 0) - (a.product.discount || 0);
          if (discountDiff !== 0) return discountDiff;
          const soldDiff = (b.product.selled || 0) - (a.product.selled || 0);
          if (soldDiff !== 0) return soldDiff;

          if (normBasePrice) {
            const aPriceDiff = Math.abs(a.meta.priceDiff);
            const bPriceDiff = Math.abs(b.meta.priceDiff);
            if (aPriceDiff !== bPriceDiff) return aPriceDiff - bPriceDiff;
          }
          return 0;
        })
        .map((item) => item.product)
        .slice(0, limit);

      return { ...res, data: sorted };
    }
    return { ...res, data: [] };
  };

  const { data: relatedProductsData, isPending } = useQuery({
    queryKey: ['related-products', productId, categoryId, brandId, basePrice],
    queryFn: fetchRelatedProducts,
    enabled: !!productId && (!!categoryId || !!brandId),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const relatedProducts = relatedProductsData?.data || [];

  if (!relatedProducts.length) {
    return null;
  }

  const visibleProducts = showAll ? relatedProducts : relatedProducts.slice(0, 4);

  const getFinalAndOriginal = (product) => {
    const finalPrice = product.price;
    let originalPrice = product.originalPrice;
    if (!originalPrice && product.discount > 0 && product.price > 0) {
      originalPrice = Math.round(product.price / (1 - product.discount / 100));
    }
    return { finalPrice, originalPrice };
  };

  return (
    <Loading isPending={isPending}>
      <WrapperRelatedProducts>
        <SectionTitle>Sản phẩm liên quan</SectionTitle>
        <Row gutter={[16, 24]}>
          {visibleProducts.map((product) => {
            const { finalPrice, originalPrice } = getFinalAndOriginal(product);
            const productImage =
              product.images && product.images.length > 0
                ? product.images[0]
                : product.image || '';

            return (
              <Col xs={12} sm={12} md={8} lg={6} xl={6} key={product._id}>
                <ProductCard
                  hoverable
                  cover={
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '4 / 5',
                        overflow: 'hidden',
                        background: '#f5f5f5',
                      }}
                    >
                      {product.discount > 0 && (
                        <Tag
                          className="product-badge"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            zIndex: 1,
                            fontSize: '12px',
                            padding: '4px 8px',
                            fontWeight: 800,
                            borderRadius: '10px',
                            color: '#fff',
                            background: 'linear-gradient(135deg, #ff4d4f 0%, #ff6b6b 100%)',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
                          }}
                        >
                          -{product.discount}%
                        </Tag>
                      )}
                      <img
                        alt={product.name}
                        src={productImage}
                        style={{ objectPosition: 'center 60%' }}
                        onError={(e) => {
                          e.target.src = getPlaceholderImage(300, 300, 'No Image');
                        }}
                      />
                    </div>
                  }
                  onClick={() => navigate(`/product-details/${product._id}`)}
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '32px',
                          marginBottom: '4px',
                          textAlign: 'center',
                        }}
                      >
                        {product.name}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '6px', textAlign: 'center' }}>
                          <Rate
                            disabled
                            value={product.rating || 0}
                            allowHalf
                            style={{ fontSize: '12px' }}
                          />
                          <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                            ({product.selled || 0})
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                          }}
                        >
                          {originalPrice > finalPrice && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#999',
                                textDecoration: 'line-through',
                              }}
                            >
                              {convertPrice(originalPrice)}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: '#ff4d4f',
                            }}
                          >
                            {convertPrice(finalPrice)}
                          </span>
                        </div>
                      </div>
                    }
                  />
                </ProductCard>
              </Col>
            );
          })}
        </Row>
        {relatedProducts.length > 4 && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: '#111',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {showAll ? 'Thu gọn' : 'Xem thêm'}
            </button>
          </div>
        )}
      </WrapperRelatedProducts>
    </Loading>
  );
};

export default RelatedProducts;
