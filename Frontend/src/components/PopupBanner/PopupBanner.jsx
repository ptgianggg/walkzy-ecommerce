import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { WrapperPopup, PopupContent, PopupImage } from './style';
import * as BannerService from '../../services/BannerService';
import { Image } from 'antd';

const PopupBanner = () => {
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  // Fetch popup banners với cache
  const { data: bannersData } = useQuery({
    queryKey: ['banners', 'popup'],
    queryFn: () => BannerService.getAllBanner('popup'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Filter và sort popups
  const activePopups = useMemo(() => {
    if (!bannersData?.data) return [];
    
    const now = new Date();
    
    return bannersData.data
      .filter(banner => {
        // Kiểm tra isActive
        if (!banner.isActive) return false;
        
        // Kiểm tra thời gian
        const startDate = banner.startDate ? new Date(banner.startDate) : null;
        const endDate = banner.endDate ? new Date(banner.endDate) : null;
        
        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;
        
        // Kiểm tra showOnPages
        if (banner.showOnPages && banner.showOnPages.length > 0) {
          const currentPath = location.pathname;
          const isHomePage = currentPath === '/';
          const isProductPage = currentPath.startsWith('/product');
          const isCartPage = currentPath.startsWith('/order') || currentPath.includes('cart');
          
          const shouldShow = banner.showOnPages.some(page => {
            if (page === 'home' && isHomePage) return true;
            if (page === 'product' && isProductPage) return true;
            if (page === 'cart' && isCartPage) return true;
            return false;
          });
          
          if (!shouldShow) return false;
        }
        
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [bannersData, location.pathname]);

  // Hiển thị popup đầu tiên
  const currentPopup = activePopups.length > 0 ? activePopups[0] : null;

  // Khóa session cho popup: khác cho từng user + token (mỗi lần đăng nhập mới)
  const popupSessionKey = useMemo(() => {
    const userId = user?.id || 'guest';
    const tokenSig = user?.access_token ? user.access_token.slice(0, 8) : 'noauth';
    return `popup_seen_${userId}_${tokenSig}`;
  }, [user?.id, user?.access_token]);

  // Hiển thị popup duy nhất một lần cho mỗi lần đăng nhập (hoặc mỗi session guest)
  useEffect(() => {
    if (!currentPopup) return;

    const hasSeen = popupSessionKey && sessionStorage.getItem(popupSessionKey) === 'true';
    if (hasSeen) {
      setIsVisible(false);
      setDismissedThisSession(true);
      return;
    }

    setDismissedThisSession(false);

    const timer = setTimeout(() => {
      setIsVisible(true);
      if (popupSessionKey) {
        sessionStorage.setItem(popupSessionKey, 'true');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPopup, popupSessionKey]);

  const handleClose = () => {
    setDismissedThisSession(true);
    setIsVisible(false);
  };

  const handleModalClick = (e) => {
    // Nếu click vào background overlay, đóng popup
    if (e.target.classList.contains('ant-modal-mask')) {
      handleClose();
    }
  };

  if (!currentPopup || !isVisible) {
    return null;
  }

  const handleImageClick = () => {
    if (currentPopup.link) {
      if (currentPopup.link.startsWith('http://') || currentPopup.link.startsWith('https://')) {
        window.open(currentPopup.link, '_blank');
      } else {
        window.location.href = currentPopup.link;
      }
      handleClose();
    }
  };

  return (
    <Modal
      open={isVisible}
      onCancel={handleClose}
      footer={null}
      closable={false}
      maskClosable={true}
      onOk={handleClose}
      width={currentPopup.imageMobile ? '90%' : 'auto'}
      centered
      className="popup-banner-modal"
      styles={{
        body: {
          padding: 0,
        },
        content: {
          padding: 0,
        }
      }}
      modalRender={(modal) => (
        <div onClick={handleModalClick}>
          {modal}
        </div>
      )}
    >
      <WrapperPopup>
        <CloseOutlined
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '-14px', // Cách popup 14px (12-16px)
            right: '-14px', // Cách popup 14px (12-16px)
            fontSize: '20px',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
        <PopupContent
          onClick={currentPopup.link ? handleImageClick : undefined}
          style={{ cursor: currentPopup.link ? 'pointer' : 'default' }}
        >
          {currentPopup.imageMobile ? (
            <>
              <PopupImage
                src={currentPopup.image}
                alt={currentPopup.title || currentPopup.name}
                preview={false}
                className="desktop-popup"
              />
              <PopupImage
                src={currentPopup.imageMobile}
                alt={currentPopup.title || currentPopup.name}
                preview={false}
                className="mobile-popup"
              />
            </>
          ) : (
            <PopupImage
              src={currentPopup.image}
              alt={currentPopup.title || currentPopup.name}
              preview={false}
            />
          )}
        </PopupContent>
      </WrapperPopup>
    </Modal>
  );
};

export default PopupBanner;

