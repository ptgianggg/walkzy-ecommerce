import styled from 'styled-components';

export const WrapperAnnouncementBar = styled.div`
  width: 100%;
  background-color: #000000;
  color: #ffffff;
  padding: 12px 0;
  overflow: hidden;
  position: relative;
  z-index: 200;
  height: 48px; /* 40-60px */
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 10px 0;
    height: 44px;
  }
`;

export const WrapperContent = styled.div`
  width: 100%;
  max-width: 1270px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  height: 100%;
  
  @media (max-width: 1270px) {
    padding: 0 16px;
  }
  
  @media (max-width: 768px) {
    padding: 0 12px;
  }
`;

export const WrapperText = styled.div`
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  display: inline-block;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
  
  /* Marquee animation - chạy từ phải sang trái */
  &.marquee-text {
    display: inline-block;
    animation: marquee 30s linear infinite;
    will-change: transform;
    /* Bắt đầu từ bên phải (100% của container width) */
    padding-left: 100%;
  }
  
  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  
  /* Pause on hover */
  &:hover {
    animation-play-state: paused;
  }
`;

