import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { WrapperHomepageBanner, BannerGrid, BannerItem } from './style';
import * as BannerService from '../../services/BannerService';
import { Image } from 'antd';
import Loading from '../LoadingComponent/Loading';

const HomepageBanner = () => {
  const navigate = useNavigate();
  
  // Fetch mini_banner với cache
  const { data: bannersData, isPending } = useQuery({
    queryKey: ['banners', 'mini_banner'],
    queryFn: () => BannerService.getAllBanner('mini_banner'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Filter và sort banners
  const activeBanners = useMemo(() => {
    if (!bannersData?.data) return [];
    
    const now = new Date();
    
    return bannersData.data
      .filter(banner => {
        if (!banner.isActive) return false;
        
        const startDate = banner.startDate ? new Date(banner.startDate) : null;
        const endDate = banner.endDate ? new Date(banner.endDate) : null;
        
        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;
        
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sắp xếp theo order
  }, [bannersData]);

  // Xác định layout dựa trên số lượng banner và layout field
  const layout = useMemo(() => {
    const count = activeBanners.length;
    if (count === 0) return 'single';
    
    // Nếu có layout được set, ưu tiên dùng layout đó
    const firstBannerLayout = activeBanners[0]?.layout;
    if (firstBannerLayout && ['single', 'double', 'triple', 'grid'].includes(firstBannerLayout)) {
      return firstBannerLayout;
    }
    
    // Tự động xác định layout dựa trên số lượng
    if (count === 1) return 'single';
    if (count === 2) return 'double';
    if (count === 3) return 'triple';
    return 'grid'; // 4 hoặc nhiều hơn
  }, [activeBanners]);

  // Responsive grid columns dựa trên layout
  const gridColumns = useMemo(() => {
    const count = activeBanners.length;
    if (layout === 'single') return '1fr';
    if (layout === 'double') return 'repeat(2, 1fr)';
    if (layout === 'triple') return 'repeat(3, 1fr)';
    if (layout === 'grid') {
      // Grid 2x2 cho 4 ảnh
      if (count === 4) return 'repeat(2, 1fr)';
      // Nếu nhiều hơn 4, hiển thị 4 cột
      return 'repeat(4, 1fr)';
    }
    return '1fr';
  }, [layout, activeBanners.length]);

  // Chỉ lấy số lượng banner phù hợp với layout
  const displayBanners = useMemo(() => {
    if (layout === 'single') return activeBanners.slice(0, 1);
    if (layout === 'double') return activeBanners.slice(0, 2);
    if (layout === 'triple') return activeBanners.slice(0, 3);
    if (layout === 'grid') return activeBanners.slice(0, 4); // Tối đa 4 cho grid
    return activeBanners;
  }, [activeBanners, layout]);

  const handleBannerClick = (banner) => {
    if (banner.link) {
      if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
        window.open(banner.link, '_blank');
      } else {
        navigate(banner.link);
      }
    }
  };

  if (isPending) {
    return <Loading isPending={true} />;
  }

  if (!activeBanners || activeBanners.length === 0) {
    return null;
  }

  return (
    <WrapperHomepageBanner>
      <BannerGrid columns={gridColumns} layout={layout}>
        {displayBanners.map((banner) => (
          <BannerItem
            key={banner._id}
            onClick={() => handleBannerClick(banner)}
            style={{ cursor: banner.link ? 'pointer' : 'default' }}
            layout={layout}
          >
            {banner.imageMobile ? (
              <>
                <Image
                  src={banner.image}
                  alt={banner.title || banner.name}
                  preview={false}
                  className="desktop-banner"
                />
                <Image
                  src={banner.imageMobile}
                  alt={banner.title || banner.name}
                  preview={false}
                  className="mobile-banner"
                />
              </>
            ) : (
              <Image
                src={banner.image}
                alt={banner.title || banner.name}
                preview={false}
              />
            )}
          </BannerItem>
        ))}
      </BannerGrid>
    </WrapperHomepageBanner>
  );
};

export default HomepageBanner;

