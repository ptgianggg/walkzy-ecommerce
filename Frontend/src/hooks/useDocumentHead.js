import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as SettingsService from '../services/SettingsService'

/**
 * Hook để cập nhật favicon, title và các meta tags từ settings
 */
export const useDocumentHead = () => {
  const isUpdatingRef = useRef(false)

  // Load public settings (không cần authentication)
  // Luôn refetch khi mount để đảm bảo có data mới nhất
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['public-settings'],
    queryFn: SettingsService.getSettingsPublic,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    cacheTime: 10 * 60 * 1000, // Giữ cache 10 phút
    refetchOnMount: true, // Luôn refetch khi mount
    refetchOnWindowFocus: true, // Refetch khi focus window
    retry: 2, // Retry 2 lần nếu lỗi
  })

  // Hàm cập nhật favicon và title
  const updateDocumentHead = (settings) => {
    if (!settings || isUpdatingRef.current) return

    isUpdatingRef.current = true

    try {
      // Cập nhật title
      if (settings.websiteName) {
        document.title = settings.websiteName
      }

      // Chỉ cập nhật favicon nếu có favicon mới từ settings
      if (settings.websiteFavicon16 || settings.websiteFavicon32) {
        // Xóa tất cả favicon cũ (cả icon và shortcut icon)
        const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
        existingFavicons.forEach(favicon => favicon.remove())
      }

      // Hàm tạo favicon link
      const createFaviconLink = (href, sizes = null) => {
        if (!href) return null
        
        const link = document.createElement('link')
        link.rel = 'icon'
        if (sizes) {
          link.sizes = sizes
        }
        link.type = href.includes('.ico') ? 'image/x-icon' : 'image/png'
        // Nếu là data URL (base64) thì không thêm timestamp (query) vì sẽ làm hỏng URL
        if (href.startsWith('data:')) {
          link.href = href
        } else {
          // Thêm timestamp để tránh browser cache
          const separator = href.includes('?') ? '&' : '?'
          link.href = `${href}${separator}_t=${Date.now()}`
        }
        return link
      }

      // Cập nhật favicon 16x16
      if (settings.websiteFavicon16) {
        const favicon16 = createFaviconLink(settings.websiteFavicon16, '16x16')
        if (favicon16) {
          document.head.appendChild(favicon16)
        }
      }

      // Cập nhật favicon 32x32
      if (settings.websiteFavicon32) {
        const favicon32 = createFaviconLink(settings.websiteFavicon32, '32x32')
        if (favicon32) {
          document.head.appendChild(favicon32)
        }
        
        // Nếu không có favicon16, dùng favicon32 làm favicon chính (không có sizes)
        if (!settings.websiteFavicon16) {
          const faviconMain = createFaviconLink(settings.websiteFavicon32)
          if (faviconMain) {
            document.head.appendChild(faviconMain)
          }
        }
      } else if (settings.websiteFavicon16) {
        // Nếu chỉ có favicon16, dùng nó làm favicon chính (không có sizes)
        const faviconMain = createFaviconLink(settings.websiteFavicon16)
        if (faviconMain) {
          document.head.appendChild(faviconMain)
        }
      }

      // Cập nhật meta description
      if (settings.websiteDescription) {
        let metaDescription = document.querySelector('meta[name="description"]')
        if (!metaDescription) {
          metaDescription = document.createElement('meta')
          metaDescription.name = 'description'
          document.head.appendChild(metaDescription)
        }
        metaDescription.content = settings.websiteDescription
      }

      // Cập nhật apple-touch-icon
      if (settings.websiteLogo) {
        let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
        if (!appleTouchIcon) {
          appleTouchIcon = document.createElement('link')
          appleTouchIcon.rel = 'apple-touch-icon'
          document.head.appendChild(appleTouchIcon)
        }
        appleTouchIcon.href = settings.websiteLogo
      }

      // Lưu vào localStorage để dùng khi reload
      if (settings.websiteFavicon16 || settings.websiteFavicon32 || settings.websiteName) {
        localStorage.setItem('websiteSettings', JSON.stringify({
          websiteFavicon16: settings.websiteFavicon16,
          websiteFavicon32: settings.websiteFavicon32,
          websiteName: settings.websiteName,
          websiteDescription: settings.websiteDescription,
          websiteLogo: settings.websiteLogo,
          updatedAt: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error updating document head:', error)
    } finally {
      isUpdatingRef.current = false
    }
  }

  // Cập nhật khi có settings data
  useEffect(() => {
    if (settingsData?.status === 'OK' && settingsData?.data) {
      updateDocumentHead(settingsData.data)
    }
  }, [settingsData])

  // Load từ localStorage ngay khi mount (trước khi API trả về)
  // Đảm bảo favicon hiển thị ngay lập tức khi page load
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cachedSettings = localStorage.getItem('websiteSettings')
        if (cachedSettings) {
          const settings = JSON.parse(cachedSettings)
          // Chỉ dùng cache nếu không quá cũ (dưới 24 giờ)
          const cacheAge = Date.now() - (settings.updatedAt || 0)
          if (cacheAge < 24 * 60 * 60 * 1000) {
            // Chỉ cập nhật nếu có favicon hoặc title
            if (settings.websiteFavicon16 || settings.websiteFavicon32 || settings.websiteName) {
              // Cập nhật ngay lập tức, không đợi
              // Đảm bảo DOM đã sẵn sàng
              if (document.head) {
                updateDocumentHead(settings)
                return true // Đã load từ cache
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading cached settings:', error)
      }
      return false
    }
    
    // Load ngay lập tức khi mount
    // Nếu DOM chưa sẵn sàng, đợi một chút
    if (document.head) {
      loadFromCache()
    } else {
      // Đợi DOM ready
      const timer = setTimeout(() => {
        loadFromCache()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, []) // Chỉ chạy 1 lần khi mount

  return { settingsData, isLoading }
}

