import styled, { keyframes } from 'styled-components';
import { Image } from 'antd';

// Animation: Fade-in + Zoom + Slide-up
const popupEnter = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;


export const WrapperPopup = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px; /* Giảm từ 600px xuống 500px */
  margin: 0 auto;
  animation: ${popupEnter} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  
  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

export const PopupContent = styled.div`
  position: relative;
  width: 100%;
  border-radius: 14px; /* Bo góc 12-16px, chọn 14px */
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

export const PopupImage = styled(Image)`
  width: 100% !important;
  height: auto !important;
  display: block !important;
  object-fit: contain;
  border-radius: 14px; /* Bo góc ảnh */
  
  &.desktop-popup {
    @media (max-width: 768px) {
      display: none !important;
    }
  }
  
  &.mobile-popup {
    display: none !important;
    
    @media (max-width: 768px) {
      display: block !important;
    }
  }
`;

