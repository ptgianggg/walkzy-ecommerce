import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import React, { Fragment, useState } from 'react'
import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import DefaultComponent from './components/DefaultComponent/DefaultComponent'
import PopupBanner from './components/PopupBanner/PopupBanner'
import SeasonalEffects from './components/SeasonalEffects/SeasonalEffects'
import  {routes}  from './routes'
import { isJonString } from './utils'
import { jwtDecode } from "jwt-decode"
import * as UserService from './services/UserService'
import { useDispatch, useSelector } from 'react-redux' 
import { updateUser, resetUser } from './redux/slides/userSlide'
import { clearCart, setCart } from './redux/slides/orderSlide'
import * as CartService from './services/CartService'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'
import Loading from './components/LoadingComponent/Loading'
import ChatBox from './components/ChatBox/ChatBox'
import { useDocumentHead } from './hooks/useDocumentHead'
import { getAccessToken, setAccessToken, removeAccessToken } from './utils/sessionToken'

function App() {
  // Cập nhật favicon, title và meta tags từ settings
  useDocumentHead()
  const dispatch = useDispatch()
  const[isPending,setIsPending] = useState(false)
  const user =useSelector ((state) =>state.user)
  const order = useSelector((state) => state.order)


  useEffect(() => {
    setIsPending(true)
    try {
      const { storageData, decoded } = handleDecoded()
      if(decoded?.id){
        // User đã đăng nhập - không xóa giỏ hàng, chỉ load user info
        // Chỉ load nếu chưa có user hoặc user id khác
        if (!user?.id || user?.id !== decoded?.id) {
          const currentUserId = user?.id
          handleGetDetailsUser(decoded?.id, storageData, currentUserId)
        }
      } else {
        // User chưa đăng nhập - giữ nguyên giỏ hàng trong localStorage (redux-persist)
        // Không xóa giỏ hàng, chỉ reset user nếu đang có user
        if (user?.id) {
          dispatch(resetUser())
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error)
      // Nếu token không hợp lệ, chỉ reset user, giữ giỏ hàng
      removeAccessToken()
      import('./utils/sessionToken').then(mod => mod.removeRefreshToken()).catch(() => {
        // ignore
      });
      if (user?.id) {
        dispatch(resetUser())
      }
    } finally {
      setIsPending(false)
    }
  }, [dispatch]) // Chỉ chạy 1 lần khi mount, không phụ thuộc vào user?.id

const handleDecoded = () => {
 let storageData = getAccessToken()
 let decoded = {}
 try {
   if (!storageData) return { decoded, storageData: null }
   let token = storageData
   if (typeof storageData === 'string' && isJonString(storageData)) {
     token = JSON.parse(storageData)
   }
   decoded = jwtDecode(token)
   storageData = token
 } catch (error) {
   console.error('Error parsing token:', error)
   // XA3a token khA'ng h���p l���
   removeAccessToken()
   storageData = null
   decoded = {}
 }
 return { decoded, storageData}
}
  UserService.axiosJWT.interceptors.request.use(async (config) => {
    const currentTime = new Date()
    const {decoded } = handleDecoded()
    if (decoded?.exp < currentTime.getTime() / 1000 ) {
      const data = await UserService.refreshToken()
      if (data?.access_token) {
        setAccessToken(data.access_token)
        config.headers['token'] = `Bearer ${data?.access_token}`
      }
    }
    return config
  }, function (error) {
    return Promise.reject(error)
  })

const handleGetDetailsUser = async(id, token, currentUserId) => {
  try {
    const res = await UserService.getDetailsUser(id, token)
    if (res?.data) {
      const newUserId = res.data._id || res.data.id
      
      // Nếu đăng nhập user khác, xóa giỏ hàng
      if (currentUserId && currentUserId !== newUserId) {
        dispatch(clearCart())
      }
      
      dispatch(updateUser({...res?.data, access_token: token}))
      
      // Sync Cart
      try {
        const cartRes = await CartService.syncCart({ cartItems: order?.orderItems || [] }, token)
        if (cartRes?.status === 'OK' && cartRes?.data?.cartItems) {
           // Flatten backend structure to match frontend expectations
            const mappedItems = cartRes.data.cartItems.map(item => {
                const productObj = item.product || {};
                const hasVariations = productObj.hasVariations || (productObj.variations && productObj.variations.length > 0);
                
                let variationStock = productObj.countInStock || 0;
                if (hasVariations && item.variation) {
                    const matchingVariation = productObj.variations?.find(v => 
                        v.color === item.variation.color &&
                        v.size === item.variation.size &&
                        v.material === item.variation.material
                    );
                    if (matchingVariation) {
                        variationStock = matchingVariation.stock || matchingVariation.countInStock || 0;
                    }
                }

                return {
                    ...item,
                    product: productObj._id || item.product, 
                    countInstock: variationStock,
                    availableStock: variationStock,
                    name: item.name || productObj.name,
                    image: item.image || productObj.image,
                    price: item.price || productObj.price,
                    originalPrice: productObj.originalPrice || productObj.price,
                    discount: productObj.discount || 0,
                    type: productObj.type,
                    category: productObj.category,
                    brand: productObj.brand
                };
            });
           dispatch(setCart({ cartItems: mappedItems }))
        }
      } catch (err) {
        console.error('Error syncing cart:', err)
      }
    }
  } catch (error) {
    console.error('Error getting user details:', error)
    // Nếu lỗi, xóa token và reset
    removeAccessToken()
    import('./utils/sessionToken').then(mod => mod.removeRefreshToken()).catch(() => {
      // ignore
    });
    dispatch(resetUser())
    dispatch(clearCart())
  }
}
  return (
    <div>   
      <Loading isPending={isPending}>
        <Router>
          {/* Use a nested component so `useLocation` hook can be used inside Router */}
          <InnerRoutes />
        </Router>
      </Loading>
    </div>
  )
}

function InnerRoutes() {
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const isAdminPage = location.pathname.startsWith('/system/admin');
  
  // Danh sách các trang cần ẩn ChatBox
  const hideChatBoxPages = [
    '/sign-in',
    '/sign-up',
    '/login',
    '/system/admin',
    '/payment/momo/return'
  ];
  
  const shouldHideChatBox = hideChatBoxPages.some(page => 
    location.pathname === page || location.pathname.startsWith(page)
  );

  // Scroll về đầu trang mỗi khi route thay đổi
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <>
      {/* Popup Banner - Hiển thị trên mọi trang theo showOnPages */}
      <PopupBanner />
      {/* Hiệu ứng mùa vụ Canvas */}
      <SeasonalEffects />
      {/* ChatBox AI - Ẩn khi ở trang đăng nhập, đăng ký, admin, hoặc momo return */}
      {!shouldHideChatBox && <ChatBox />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {routes.map((route) => {
            const Page = route.page;
            // Check quyền vào admin: isAdmin hoặc có roleId
            const hasAdminAccess = user?.isAdmin || (user?.roleId && typeof user.roleId === 'object' && user.roleId?._id) || (user?.roleId && typeof user.roleId === 'string');
            const ischeckAuth = !route.isPrivate || hasAdminAccess;
            const Layout = route.isShowHeader ? DefaultComponent : Fragment;
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  ischeckAuth ? (
                    <Layout>
                      <Page />
                    </Layout>
                  ) : (
                    <NotFoundPage />
                  )
                }
              />
            );
          })}
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App

