import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { convertPrice, getPlaceholderImage } from '../../utils';
import { Rate } from 'antd';
import styled from 'styled-components';

const CardWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-10px) scale(1.025);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
    border-color: #d9d9d9;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #fafafa;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  ${CardWrapper}:hover & img {
    transform: scale(1.08);
  }
`;

const DiscountBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #ee4d2d 0%, #ff6b6b 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 9px;
  border-radius: 6px;
  box-shadow: 0 3px 10px rgba(238, 77, 45, 0.35);
  z-index: 2;
  letter-spacing: 0.2px;
  line-height: 1.2;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(6px);
`;

const OutOfStockOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(119, 82, 82, 0.08);
  z-index: 3;
  pointer-events: none;

  span {
    background: rgba(255, 255, 255, 0.92);
    color: #474343ff;
    font-weight: 800;
    letter-spacing: 1.2px;
    width: 100%;
    text-align: center;
    padding: 12px 0;
    border-radius: 0;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
  }
`;

const CardBody = styled.div`
  padding: 0 12px 16px 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
`;

const ProductNameWrapper = styled.div`
  position: relative;
  min-height: 40px;
  max-height: 40px;
  overflow: hidden;
  margin-bottom: 4px;
  text-align: center;
`;

const ProductName = styled.div`
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  position: relative;
  word-break: break-word;
  text-align: center;
  mask-image: linear-gradient(to bottom, black 0%, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 0%, black 85%, transparent 100%);
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 60px;
    height: 100%;
    background: linear-gradient(to right, 
      rgba(255, 255, 255, 0) 0%, 
      rgba(255, 255, 255, 0.6) 40%, 
      rgba(255, 255, 255, 0.9) 70%, 
      #fff 100%
    );
    pointer-events: none;
  }
`;

const RatingSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 2px;
  flex-wrap: wrap;
`;

const RatingWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;

  .ant-rate {
    font-size: 13px;
  }
`;

const SoldText = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  text-align: center;
`;

const FavoriteText = styled.div`
  font-size: 12px;
  color: #d94646;
  font-weight: 700;
  text-align: center;
`;


const PriceSection = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
`;

const CurrentPrice = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #ee4d2d;
  letter-spacing: -0.3px;
  line-height: 1.2;
`;

const OriginalPrice = styled.span`
  font-size: 13px;
  color: #8c8c8c;
  text-decoration: line-through;
  font-weight: 400;
  line-height: 1.2;
`;

const CardComponents = (props) => {
  const { countInStock, description, image, images, name, price, rating, type, discount, selled, favoritesCount, id, originalPrice: passedOriginalPrice, showSoldCount = false, showFavoriteCount = false } = props
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false);
  const handleDetailsProduct = (id) => {
    navigate(`/product-details/${id}`)
  }

  const isOutOfStock = Number(countInStock) <= 0;
  const imageList = Array.isArray(images) ? images.filter(Boolean) : [];
  const primaryImage = imageList[0] || image;
  const hoverImage = imageList.length > 1 ? imageList[1] : null;
  const activeImage = isHovered && hoverImage ? hoverImage : primaryImage;
  const finalPrice = price;
  let originalPrice = passedOriginalPrice;
  if (!originalPrice && discount > 0 && price > 0) {
    originalPrice = Math.round(price / (1 - discount / 100));
  }

  return (
    <CardWrapper
      onClick={() => handleDetailsProduct(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ImageContainer>
        {discount > 0 && (
          <DiscountBadge>
            -{discount}%
          </DiscountBadge>
        )}
        {isOutOfStock && (
          <OutOfStockOverlay>
            <span>HẾT HÀNG</span>
          </OutOfStockOverlay>
        )}
        <img
          draggable={false}
          alt={name}
          src={activeImage}
          onError={(e) => {
            e.target.src = getPlaceholderImage(300, 300, 'No Image');
          }}
        />
      </ImageContainer>

      <CardBody>
        <ProductNameWrapper>
          <ProductName>{name}</ProductName>
        </ProductNameWrapper>

        <RatingSection>
          <RatingWrapper>
            <Rate
              disabled
              value={rating || 0}
              allowHalf
              style={{ fontSize: '10px' }}
            />
          </RatingWrapper>
        </RatingSection>
        {showSoldCount && (
          <SoldText>Đã bán {selled || 0}</SoldText>
        )}
        {showFavoriteCount && (
          <FavoriteText>Yêu thích {favoritesCount || 0}</FavoriteText>
        )}

        <PriceSection>
          {originalPrice && originalPrice > finalPrice && (
            <OriginalPrice>{convertPrice(originalPrice)}</OriginalPrice>
          )}
          <CurrentPrice>{convertPrice(finalPrice)}</CurrentPrice>
        </PriceSection>
      </CardBody>
    </CardWrapper>
  )
}

export default CardComponents
