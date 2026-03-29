import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';

const CountdownWrapper = styled.div`
    background: linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%);
    border-radius: 16px;
    padding: 18px 20px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(255, 59, 48, 0.18);
    
    @media (max-width: 768px) {
        padding: 14px 16px;
    }
`;

const CountdownHeader = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
    
    @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
    }
`;

const Title = styled.h3`
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    
    @media (max-width: 768px) {
        font-size: 15px;
    }
`;

const CountdownContainer = styled.div`
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
    max-width: 420px;
    margin: 0 auto;
    
    @media (max-width: 768px) {
        width: 100%;
        gap: 8px;
        max-width: 100%;
    }
`;

const CountdownItem = styled.div`
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 10px;
    padding: 10px 12px;
    text-align: center;
    min-width: 52px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    
    @media (max-width: 768px) {
        min-width: 46px;
        padding: 8px 10px;
    }
    
    .number {
        font-size: 22px;
        font-weight: 800;
        color: #fff;
        display: block;
        line-height: 1.1;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
        
        @media (max-width: 768px) {
            font-size: 18px;
        }
    }
    
    .label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.95);
        margin-top: 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        
        @media (max-width: 768px) {
            font-size: 10px;
        }
    }
`;

const TimeInfo = styled.div`
    text-align: center;
    margin-top: 12px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    
    @media (max-width: 768px) {
        font-size: 12px;
    }
`;

const FlashSaleCountdown = ({ startDate, endDate }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    
    const isValid = useMemo(() => {
        if (!startDate || !endDate) return false;
        try {
            if (typeof startDate.isValid === 'function' && typeof endDate.isValid === 'function') {
                return startDate.isValid() && endDate.isValid();
            }
            return false;
        } catch (e) {
            return false;
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (!isValid) {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const updateCountdown = () => {
            const now = dayjs();
            const diff = endDate.diff(now, 'second');
            
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            
            const days = Math.floor(diff / 86400);
            const hours = Math.floor((diff % 86400) / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;
            
            setTimeLeft({ days, hours, minutes, seconds });
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);

        return () => clearInterval(timer);
    }, [endDate, isValid]);

    if (!isValid) {
        return null;
    }

    return (
        <CountdownWrapper>
            <CountdownHeader>
                <Title></Title>
            </CountdownHeader>
            
            <CountdownContainer>
                {timeLeft.days > 0 && (
                    <CountdownItem>
                        <span className="number">{String(timeLeft.days).padStart(2, '0')}</span>
                        <span className="label">Ngày</span>
                    </CountdownItem>
                )}
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
            </CountdownContainer>
            
            <TimeInfo>
                {startDate && endDate && (
                    <>
                        Kết thúc: {endDate.format('DD/MM/YYYY HH:mm')}
                    </>
                )}
            </TimeInfo>
        </CountdownWrapper>
    );
};

export default FlashSaleCountdown;

