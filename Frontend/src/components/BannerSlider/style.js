import Slider from "react-slick";
import styled from "styled-components";
import { Image } from "antd";

export const WrapperSliderStyle = styled(Slider)`
  .slick-arrow.slick-prev {
    left: 12px;
    top: 50%;
    z-index: 10;
    &::before {
      font-size: 40px;
      color: #fff;
    }
  }

  .slick-arrow.slick-next {
    right: 28px;
    top: 50%;
    z-index: 10;
    &::before {
      font-size: 40px;
      color: #fff;
    }
  }

  .slick-dots {
    z-index: 10;
    bottom: -2px !important;
    li {
      button {
        &::before {
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }
    li.slick-active button::before {
      color: #fff;
    }
  }

  @media (max-width: 768px) {
    .slick-arrow.slick-prev {
      left: 8px;
      &::before {
        font-size: 30px;
      }
    }

    .slick-arrow.slick-next {
      right: 16px;
      &::before {
        font-size: 30px;
      }
    }
    
    .slick-dots {
      bottom: -8px !important;
    }
  }
`;

// Aspect ratio 1920x600 = 3.2:1
const BannerImage = styled(Image)`
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  object-fit: cover;

  /* HERO BANNER FASHION */
  aspect-ratio: 16 / 7;
  min-height: 560px;

  @media (max-width: 768px) {
    aspect-ratio: 16 / 9;
    min-height: 300px;
  }
`;


export const DesktopImage = styled(BannerImage)`
  @media (max-width: 768px) {
    display: none !important;
  }
`;

export const MobileImage = styled(BannerImage)`
  display: none !important;
  
  @media (max-width: 768px) {
    display: block !important;
  }
`;

export const SingleImage = styled(BannerImage)`
  /* Giữ nguyên cho cả desktop và mobile */
`;

