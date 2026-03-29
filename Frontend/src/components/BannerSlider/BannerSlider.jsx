import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'antd';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { WrapperSliderStyle, DesktopImage, MobileImage, SingleImage } from './style';
import * as BannerService from '../../services/BannerService';
import Loading from '../LoadingComponent/Loading';

const BannerSlider = () => {
  const navigate = useNavigate();
  
  // Fetch banners với cache (staleTime: 5 phút, cacheTime: 10 phút)
  const { data: bannersData, isPending } = useQuery({
    queryKey: ['banners', 'slider'],
    queryFn: () => BannerService.getAllBanner('slider'),
    staleTime: 5 * 60 * 1000, // 5 phút
    cacheTime: 10 * 60 * 1000, // 10 phút
    refetchOnWindowFocus: false,
  });

  // Filter và sort banners
  const activeBanners = useMemo(() => {
    if (!bannersData?.data) return [];
    
    const now = new Date();
    
    return bannersData.data
      .filter(banner => {
        // Kiểm tra isActive
        if (!banner.isActive) return false;
        
        // Kiểm tra thời gian
        const startDate = banner.startDate ? new Date(banner.startDate) : null;
        const endDate = banner.endDate ? new Date(banner.endDate) : null;
        
        // Chưa đến lúc hiển thị
        if (startDate && now < startDate) return false;
        
        // Đã hết hạn
        if (endDate && now > endDate) return false;
        
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sắp xếp theo order
      .slice(0, 6); // Giới hạn tối đa 6 slide để không nặng
  }, [bannersData]);

  const settings = {
    dots: true,
    infinite: activeBanners.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: activeBanners.length > 1,
    autoplaySpeed: 4000, // 4 giây (3-5 giây)
    pauseOnHover: true,
    arrows: activeBanners.length > 1,
    lazyLoad: 'ondemand',
  };

  const handleBannerClick = (banner) => {
    if (banner.link) {
      // Nếu là link ngoài
      if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
        window.open(banner.link, '_blank');
      } else {
        // Link nội bộ
        navigate(banner.link);
      }
    }
  };

  if (isPending) {
    return (
      <div style={{ width: '100%', height: '274px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading isPending={true} />
      </div>
    );
  }

  if (!activeBanners || activeBanners.length === 0) {
    return null;
  }

  return (
    <WrapperSliderStyle {...settings}>
      {activeBanners.map((banner) => (
        <div key={banner._id}>
          <div
            style={{
              position: 'relative',
              cursor: banner.link ? 'pointer' : 'default',
            }}
            onClick={() => handleBannerClick(banner)}
          >
            {banner.imageMobile ? (
              <>
                {/* Desktop Image */}
                <DesktopImage
                  src={banner.image}
                  alt={banner.title || banner.name}
                  preview={false}
                  loading="lazy"
                />
                {/* Mobile Image */}
                <MobileImage
                  src={banner.imageMobile}
                  alt={banner.title || banner.name}
                  preview={false}
                  loading="lazy"
                />
              </>
            ) : (
              <SingleImage
                src={banner.image}
                alt={banner.title || banner.name}
                preview={false}
                loading="lazy"
              />
            )}
            {(banner.title || banner.description) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  color: '#fff',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  maxWidth: '50%',
                }}
              >
                {banner.title && (
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                    {banner.title}
                  </h2>
                )}
                {banner.description && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                    {banner.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </WrapperSliderStyle>
  );
};

export default BannerSlider;

