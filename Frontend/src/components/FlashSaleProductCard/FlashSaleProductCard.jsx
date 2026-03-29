import React, { useState, useEffect, useMemo } from 'react';
import { Card, Tag, Rate, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetOrder } from '../../redux/slides/orderSlide';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { convertPrice, getPlaceholderImage } from '../../utils';

const ProductCardWrapper = styled(Card)`
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.22s ease;
    border: 1px solid #f0f0f0;
    height: 100%;
    display: flex;
    flex-direction: column;
    
    &:hover {
        transform: translateY(-6px);
        box-shadow: 0 8px 20px rgba(12, 18, 20, 0.06);
        border-color: rgba(0,0,0,0.06);
        
        .product-image-wrapper {
            img {
                transform: scale(1.06);
                filter: contrast(0.98) saturate(0.98);
            }
        }
        
        .product-name {
            color: rgba(0,0,0,0.85);
        }
    }
    
    .ant-card-body {
        padding: 14px 14px 16px 14px;
        display: flex;
        flex-direction: column;
        flex: 1;
    }
`;

const ImageWrapper = styled.div`
    position: relative;
    padding-top: 78%;
    overflow: hidden;
    background: #fafafa;
    border-radius: 8px;
    margin-bottom: 12px;
    
    .product-image-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.32s cubic-bezier(0.2, 0, 0, 1), filter 0.32s ease;
        }
    }
`;

const DiscountBadge = styled(Tag)`
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    background: linear-gradient(135deg, #FF6B6B 0%, #FF3B30 100%);
    color: #fff;
    border: none;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 6px;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(18, 24, 31, 0.06);
    text-transform: none;
    letter-spacing: 0.2px;
    opacity: 0.95;

    @media (max-width: 768px) {
        font-size: 10px;
        padding: 2px 6px;
    }
`;

const ProgressBarWrapper = styled.div`
    margin-top: 8px;
    position: relative;
    
    .ant-progress {
        margin: 0;
        
        .ant-progress-outer {
            position: relative;
            
            .ant-progress-inner {
                background: #fff;
                border-radius: 10px;
                overflow: hidden;
                height: 14px;
                box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
            }
        }
        
        .ant-progress-bg {
            background: linear-gradient(90deg, #FF6B6B 0%, #FF3B30 100%) !important;
            border-radius: 10px;
            transition: width 0.28s ease-out !important;
            height: 14px;
            box-shadow: 0 1px 4px rgba(12, 18, 20, 0.04);
            position: relative;
            
            &::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(255, 255, 255, 0.4) 50%, 
                    transparent 100%);
                animation: shimmer 2s infinite;
            }
        }
    }
    
.countdown-overlay {
  position: absolute;
  top: 50%;
  left: 45%;
  transform: translate(-50%, -50%);

  display: flex;
  align-items: center;
  gap: 6px;

  z-index: 2;
  pointer-events: none;

  font-size: 11px;
  font-weight: 700;
  color: rgba(235, 235, 229, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
}

.countdown-overlay .time-value {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }
`;

const ProductName = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: #222;
    margin-bottom: 8px;
    line-height: 1.3;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 36px;
    transition: color 0.18s;
    
    @media (max-width: 768px) {
        font-size: 12px;
        min-height: 34px;
    }
`;

const PriceWrapper = styled.div`
    margin-bottom: 8px;
    flex: 1;
    text-align: center;
`;

const DiscountPrice = styled.div`
    font-size: 20px;
    font-weight: 900;
    color: #404047ff;
    line-height: 1.15;
    margin-bottom: 6px;
    text-align: center;
    
    @media (max-width: 768px) {
        font-size: 18px;
    }
`;

const OriginalPrice = styled.div`
    font-size: 12px;
    color: #9b9b9b;
    text-decoration: line-through;
    margin-top: 4px;
    text-align: center;
    
    @media (max-width: 768px) {
        font-size: 11px;
    }
`;

const RatingWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: auto;
    padding-top: 8px;
    margin-bottom: 4px;
    
    .rating-text {
        font-size: 13px;
        color: #666;
    }
    
    .ant-rate {
        font-size: 13px;
    }
    
    @media (max-width: 768px) {
        .rating-text {
            font-size: 12px;
        }
        
        .ant-rate {
            font-size: 12px;
        }
    }
`;

// Component Progress Bar cho từng sản phẩm
const ProductProgressBar = React.memo(({ product }) => {
    const [progress, setProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

    const productDates = useMemo(() => {
        if (!product.saleStartDate || !product.saleEndDate) {
            return { startDate: null, endDate: null };
        }

        const start = dayjs(product.saleStartDate);
        const end = dayjs(product.saleEndDate);

        if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
            return { startDate: null, endDate: null };
        }

        return { startDate: start, endDate: end };
    }, [product.saleStartDate, product.saleEndDate]);

    useEffect(() => {
        const { startDate, endDate } = productDates;

        if (!startDate || !endDate) {
            setProgress(0);
            setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const updateProgress = () => {
            const now = dayjs();
            const diff = endDate.diff(now, 'second');

            if (diff <= 0) {
                setProgress(0);
                setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;
            setTimeRemaining({ hours, minutes, seconds });

            const totalDuration = endDate.diff(startDate, 'second');

            if (totalDuration > 0) {
                // Tính percent = (timeLeft / totalTime) * 100
                // timeLeft = thời gian còn lại đến khi kết thúc
                // totalTime = tổng thời gian flash sale (từ start đến end)
                let progressValue = 0;

                if (diff <= 0) {
                    // Đã kết thúc
                    progressValue = 0;
                } else {
                    // Tính phần trăm: (thời gian còn lại / tổng thời gian) * 100
                    progressValue = Math.max(0, Math.min(100, (diff / totalDuration) * 100));
                }

                setProgress(progressValue);
            } else {
                setProgress(0);
            }
        };

        updateProgress();
        const timer = setInterval(updateProgress, 1000);

        return () => clearInterval(timer);
    }, [productDates]);

    if (!productDates.startDate || !productDates.endDate) {
        return null;
    }

    const timeText = `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`;

    return (
        <ProgressBarWrapper>
            <Progress
                percent={progress}
                strokeColor={{
                    '0%': '#FF6B6B',
                    '100%': '#FF3B30',
                }}
                trailColor="#fff"
                size={12}
                showInfo={false}
            />
            <div className="countdown-overlay">
                
                <span className="time-value">{timeText}</span>
            </div>
        </ProgressBarWrapper>
    );
});

ProductProgressBar.displayName = 'ProductProgressBar';

const FlashSaleProductCard = ({ product }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isHovered, setIsHovered] = useState(false);

    const finalPrice = product.price;
    let originalPrice = product.originalPrice;
    if (!originalPrice && product.discount > 0 && product.price > 0) {
        originalPrice = Math.round(product.price / (1 - (product.discount || 0) / 100));
    }
    const imageList = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const primaryImage = imageList[0] || product.image || '';
    const hoverImage = imageList.length > 1 ? imageList[1] : null;
    const productImage = isHovered && hoverImage ? hoverImage : primaryImage;

    const handleClick = (e) => {
        // Prevent accidental propagation and ensure we have a valid id
        e && typeof e.stopPropagation === 'function' && e.stopPropagation();
        const id = product && (product._id || product.id) ? String(product._id || product.id).trim() : null;
        if (!id) {
            console.warn('FlashSaleProductCard missing product id', product);
            return;
        }
        // Clear any previous order errors so they don't show up on the product detail page
        try { dispatch(resetOrder()); } catch (e) { /* ignore */ }
        navigate(`/product-details/${id}`);
    };

    return (
        <ProductCardWrapper
            hoverable
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            cover={
                <ImageWrapper>
                    <DiscountBadge>
                        -{product.discount || 0}%
                    </DiscountBadge>
                    <div className="product-image-wrapper">
                        <img
                            alt={product.name}
                            src={productImage}
                            onError={(e) => {
                                e.target.src = getPlaceholderImage(300, 300, 'No Image');
                            }}
                        />
                    </div>
                </ImageWrapper>
            }
            onClick={handleClick}
        >
            <ProductName className="product-name">
                {product.name}
            </ProductName>

            <PriceWrapper>
                {originalPrice && originalPrice > finalPrice && (
                    <OriginalPrice>
                        {convertPrice(originalPrice)}
                    </OriginalPrice>
                )}
                <DiscountPrice>
                    {convertPrice(finalPrice)}
                </DiscountPrice>
            </PriceWrapper>

            <RatingWrapper>
                <Rate
                    disabled
                    value={product.rating || 0}
                    allowHalf
                />
                <span className="rating-text">
                    ({product.selled || 0})
                </span>
            </RatingWrapper>

            {/* Progress Bar Flash Sale - Nằm dưới rating */}
            <ProductProgressBar product={product} />
        </ProductCardWrapper>
    );
};

export default FlashSaleProductCard;
