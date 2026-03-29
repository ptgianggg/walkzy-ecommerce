import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WrapperAnnouncementBar, WrapperText, WrapperContent } from './style';
import * as BannerService from '../../services/BannerService';

const AnnouncementBar = () => {
  // Fetch announcement banners với cache
  const { data: bannersData } = useQuery({
    queryKey: ['banners', 'announcement'],
    queryFn: () => BannerService.getAllBanner('announcement'),
    staleTime: 5 * 60 * 1000, // 5 phút
    cacheTime: 10 * 60 * 1000, // 10 phút
    refetchOnWindowFocus: false,
  });

  // Filter và sort announcements
  const activeAnnouncements = useMemo(() => {
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
      .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sắp xếp theo order
  }, [bannersData]);

  // Nối nhiều thông báo bằng " • "
  const announcementText = useMemo(() => {
    if (activeAnnouncements.length === 0) return null;
    
    // Lấy text từ trường text (ưu tiên), nếu không có thì dùng name
    const texts = activeAnnouncements
      .map(announcement => {
        // Ưu tiên text, nếu không có thì dùng name
        return announcement.text || announcement.name || '';
      })
      .filter(text => text && text.trim());
    
    if (texts.length === 0) return null;
    
    // Nối các text bằng " • "
    const joinedText = texts.join(' • ');
    
    // Lặp lại 3 lần để đảm bảo marquee chạy liên tục không bị gián đoạn
    return `${joinedText} • ${joinedText} • ${joinedText}`;
  }, [activeAnnouncements]);

  if (!announcementText) {
    return null;
  }

  // Lấy màu từ banner đầu tiên
  const firstAnnouncement = activeAnnouncements[0];
  const style = {
    backgroundColor: firstAnnouncement.backgroundColor || '#000000',
    color: firstAnnouncement.textColor || '#ffffff',
  };

  return (
    <WrapperAnnouncementBar style={style}>
      <WrapperContent>
        <WrapperText className="marquee-text">
          {announcementText}
        </WrapperText>
      </WrapperContent>
    </WrapperAnnouncementBar>
  );
};

export default AnnouncementBar;

