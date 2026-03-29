import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Tag, Button, Rate, Progress, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FireOutlined, RightOutlined } from '@ant-design/icons';
import { convertPrice, getPlaceholderImage } from '../../utils';
import styled from 'styled-components';
import dayjs from 'dayjs';

const WrapperFlashSale = styled.div`
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    padding: 32px;
    border-radius: 12px;
    margin: 0;
    color: #fff;
    position: relative;
    
    @media (max-width: 768px) {
        padding: 20px;
    }
`;

const WrapperCountdown = styled.div`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    
    @media (max-width: 768px) {
        width: 100%;
        justify-content: center;
        margin-top: 16px;
        gap: 8px;
    }
`;

const CountdownItem = styled.div`
    background: rgba(255,255,255,0.25);
    padding: 12px 16px;
    border-radius: 8px;
    text-align: center;
    min-width: 60px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.3);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    
    .number {
        font-size: 28px;
        font-weight: bold;
        display: block;
        line-height: 1.2;
    }
    
    .label {
        font-size: 12px;
        opacity: 0.95;
        margin-top: 4px;
    }
    
    @media (max-width: 768px) {
        min-width: 50px;
        padding: 10px 12px;
        
        .number {
            font-size: 22px;
        }
        
        .label {
            font-size: 11px;
        }
    }
`;

const ProductProgressBar = styled.div`
    margin-top: 8px;
    position: relative;
    
    .ant-progress {
        margin: 0;
        
        .ant-progress-outer {
            position: relative;
            
            .ant-progress-inner {
                background: #fff;
                border-radius: 12px;
                overflow: hidden;
                height: 28px;
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.08);
            }
        }
        
        .ant-progress-bg {
            background: linear-gradient(90deg, #FF3B30 0%, #FF6B6B 50%, #FF8C42 100%) !important;
            border-radius: 12px;
            transition: width 0.3s ease-out !important;
            height: 28px;
            box-shadow: 0 2px 6px rgba(255, 59, 48, 0.4);
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
  left: 50%; 
  transform: translate(-50%, -50%); 

  display: flex;
  align-items: center;
  gap: 4px;

  z-index: 2;
  pointer-events: none;

  font-size: 10px;
  font-weight: 700;
  color: #f8f8f8ff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.countdown-overlay .time-value {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 1000;
  letter-spacing: 0.5px;
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

const ProductCard = styled(Card)`
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    height: 100%;
    
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    }
`;

const ProductGrid = styled.div`
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

    @media (min-width: 1200px) {
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    @media (max-width: 1199px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    @media (max-width: 992px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 768px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`;

// Component Progress Bar cho từng sản phẩm
const ProductProgressBarComponent = React.memo(({ product }) => {
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

            // Tính thời gian còn lại
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

            // Tính tổng thời gian flash sale của sản phẩm
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
        <ProductProgressBar>
            <Progress
                percent={progress}
                strokeColor={{
                    '0%': '#FF3B30',
                    '50%': '#FF6B6B',
                    '100%': '#FF8C42',
                }}
                trailColor="#fff"
                size={28}
                showInfo={false}
            />
            <div className="countdown-overlay">
                <span className="time-value">{timeText}</span>
            </div>
        </ProductProgressBar>
    );
});

ProductProgressBarComponent.displayName = 'ProductProgressBarComponent';

const FlashSaleSection = ({ products = [], isLoading = false }) => {
    const navigate = useNavigate();

    // Tìm thời gian bắt đầu và kết thúc sale sớm nhất từ các sản phẩm (cho countdown tổng)
    const { startDate, endDate } = useMemo(() => {
        const validProducts = products.filter(p => {
            const hasStartDate = p.saleStartDate && (p.saleStartDate !== null && p.saleStartDate !== undefined);
            const hasEndDate = p.saleEndDate && (p.saleEndDate !== null && p.saleEndDate !== undefined);
            return hasStartDate && hasEndDate;
        });

        if (validProducts.length === 0) {
            return { startDate: null, endDate: null };
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
            return { startDate: null, endDate: null };
        }

        // Tìm endDate sớm nhất cho countdown tổng
        const earliestEnd = validDates.reduce((earliest, current) => {
            return current.end.isBefore(earliest.end) ? current : earliest;
        }, validDates[0]);

        return {
            startDate: earliestEnd.start,
            endDate: earliestEnd.end
        };
    }, [products]);

    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        if (!endDate || !startDate) {
            setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        if (!startDate.isValid() || !endDate.isValid()) {
            setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const updateCountdown = () => {
            const now = dayjs();
            const diff = endDate.diff(now, 'second');

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            setTimeLeft({ hours, minutes, seconds });
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);

        return () => clearInterval(timer);
    }, [startDate, endDate]);

    // Hiển thị skeleton khi đang load
    if (isLoading) {
        return (
            <WrapperFlashSale style={{ background: '#f5f5f5', color: '#333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <Skeleton.Input active size="large" style={{ width: 250 }} />
                    <Skeleton.Input active size="large" style={{ width: 150 }} />
                </div>
                <ProductGrid>
                    {[...Array(5)].map((_, index) => (
                        <Card key={index} style={{ borderRadius: 8 }}>
                            <Skeleton.Image active style={{ width: '100%', height: 180 }} />
                            <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 16 }} />
                        </Card>
                    ))}
                </ProductGrid>
            </WrapperFlashSale>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <WrapperFlashSale>
            {/* Header với countdown timer ở góc trên bên phải */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <FireOutlined style={{ fontSize: '32px' }} />
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: '28px',
                            fontWeight: 900,
                            letterSpacing: '0.5px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif"
                        }}>FLASH SALE</h2>
                        {endDate ? (
                            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                                Kết thúc: {endDate.format('DD/MM/YYYY HH:mm')}
                            </p>
                        ) : (
                            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Deal sốc hôm nay</p>
                        )}
                    </div>
                </div>

                {/* Countdown Timer tổng ở góc trên bên phải */}
                {startDate && endDate && startDate.isValid() && endDate.isValid() && (
                    <WrapperCountdown>
                        <CountdownItem>
                            <span className="number">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="label">Giờ</span>
                        </CountdownItem>
                        <CountdownItem>
                            <span className="number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="label">Phút</span>
                        </CountdownItem>
                        <CountdownItem>
                            <span className="number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="label">Giây</span>
                        </CountdownItem>
                    </WrapperCountdown>
                )}
            </div>

            {/* Danh sách sản phẩm với progress bar riêng */}
            <ProductGrid>
                {products.slice(0, 5).map((product) => {
                    const originalPrice = product.originalPrice || product.price;
                    const discountPrice = originalPrice * (1 - (product.discount || 0) / 100);
                    const productImage = (product.images && product.images.length > 0)
                        ? product.images[0]
                        : (product.image || '');

                    return (
                        <div key={product._id} style={{ height: '100%' }}>
                            <ProductCard
                                hoverable
                                cover={
                                    <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                                        <Tag
                                            color="red"
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                left: '8px',
                                                zIndex: 1,
                                                fontSize: '12px',
                                                padding: '4px 8px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            -{product.discount || 50}%
                                        </Tag>
                                        <img
                                            alt={product.name}
                                            src={productImage}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.src = getPlaceholderImage(300, 300, 'No Image');
                                            }}
                                        />
                                    </div>
                                }
                                onClick={() => navigate(`/product-details/${product._id}`)}
                            >
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {product.name}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    marginBottom: '8px',
                                    flexWrap: 'wrap',
                                    rowGap: '2px'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4d4f', lineHeight: 1.1, wordBreak: 'break-word' }}>
                                        {convertPrice(discountPrice)}
                                    </span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: '#999',
                                        textDecoration: 'line-through',
                                        lineHeight: 1.1,
                                        wordBreak: 'break-word'
                                    }}>
                                        {convertPrice(originalPrice)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                                    <Rate disabled value={product.rating || 0} allowHalf style={{ fontSize: '13px' }} />
                                    <span style={{ fontSize: '13px', color: '#999' }}>({product.selled || 0})</span>
                                </div>
                                {/* Time Progress Bar với countdown bên trong - Nằm dưới rating */}
                                <ProductProgressBarComponent product={product} />
                            </ProductCard>
                        </div>
                    );
                })}
            </ProductGrid>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate('/flash-sale')}
                    style={{
                        background: '#fff',
                        color: '#ff4d4f',
                        border: 'none',
                        fontWeight: 'bold'
                    }}
                >
                    Xem tất cả deal sốc <RightOutlined />
                </Button>
            </div>
        </WrapperFlashSale>
    );
};

export default FlashSaleSection;
