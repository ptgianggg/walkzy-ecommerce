import styled from 'styled-components';
import { Image } from 'antd';

export const WrapperHomepageBanner = styled.div`
  width: 100%;
  margin: 32px 0;
  
  @media (max-width: 768px) {
    margin: 24px 0;
  }
`;

// Định nghĩa BannerItem trước để có thể sử dụng trong BannerGrid
export const BannerItem = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .ant-image {
    width: 100%;
    display: block;
    
    img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }
  }
  
  /* Layout single - ảnh ngang dài */
  &[layout="single"] {
    .ant-image img {
      width: 100%;
      height: auto;
      max-height: 400px;
      object-fit: cover;
      
      @media (max-width: 768px) {
        max-height: 250px;
      }
    }
  }
  
  /* Layout double, triple, grid - ảnh vuông hoặc tỷ lệ phù hợp */
  &[layout="double"],
  &[layout="triple"],
  &[layout="grid"] {
    aspect-ratio: 1;
    
    .ant-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .desktop-banner {
    @media (max-width: 768px) {
      display: none !important;
    }
  }
  
  .mobile-banner {
    display: none !important;
    
    @media (max-width: 768px) {
      display: block !important;
    }
  }
`;

export const BannerGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || 'repeat(4, 1fr)'};
  gap: 16px;
  
  /* Layout single - 1 ảnh ngang dài */
  &[layout="single"] {
    grid-template-columns: 1fr;
    
    ${BannerItem} {
      min-height: 200px;
      
      @media (max-width: 768px) {
        min-height: 150px;
      }
    }
  }
  
  /* Layout double - 2 ảnh ngang */
  &[layout="double"] {
    grid-template-columns: repeat(2, 1fr);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  /* Layout triple - 3 ảnh */
  &[layout="triple"] {
    grid-template-columns: repeat(3, 1fr);
    
    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  /* Layout grid - 2x2 */
  &[layout="grid"] {
    grid-template-columns: repeat(2, 1fr);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 1024px) {
    gap: 12px;
  }
  
  @media (max-width: 768px) {
    gap: 12px;
  }
`;

