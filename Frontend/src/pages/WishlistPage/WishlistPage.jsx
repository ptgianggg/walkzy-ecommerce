import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Empty,
  Space,
  Modal,
  message as antMessage
} from 'antd'
import {
  HeartFilled,
  ShoppingCartOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  BellOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import styled from 'styled-components'

import * as ProductService from '../../services/ProductService'
import * as WishlistService from '../../services/WishlistService'
import * as NotificationService from '../../services/NotificationService'
import { addorderProduct, addToOrderSelected } from '../../redux/slides/orderSlide'
import { convertPrice, getPlaceholderImage } from '../../utils'
import * as message from '../../components/Message/Message'
import Loading from '../../components/LoadingComponent/Loading'

const { confirm } = Modal

/* ===================== STYLE ===================== */

const WrapperPage = styled.div`
  background: #f5f5f5;
  padding: 24px 0;
`

const WrapperContainer = styled.div`
  max-width: 1270px;
  width: 95%;
  margin: auto;
  background: #fff;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);

  @media (max-width: 768px) {
    padding: 16px;
    width: 98%;
  }
`

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
`

const ProductCard = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  transition: all 0.25s ease;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;

  &.out-of-stock,
  &.stopped-selling,
  &.unavailable {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 18px rgba(0,0,0,.08);
  }

  .ant-card-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cover {
    position: relative;
    padding-top: 90%;
    background: linear-gradient(135deg, #f8fbff 0%, #eef2ff 100%);
    overflow: hidden;
  }

  .product-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.25s ease;
  }

  &:hover .product-img {
    transform: scale(1.03);
  }

  .status-pill {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
    /* Compact, modern discount pill */
    background: linear-gradient(135deg, #ff4d4f 0%, #ff6b6b 100%);
    color: #fff;
    font-weight: 800;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    line-height: 1;
    box-shadow: 0 3px 8px rgba(0,0,0,0.12);
    border: none;
  }

  .product-title {
    font-size: 15px;
    font-weight: 600;
    min-height: 40px;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    cursor: pointer;
  }

  .price {
    font-size: 16px;
    font-weight: 700;
    color: #1677ff;
  }

  .old-price {
    font-size: 13px;
    text-decoration: line-through;
    color: #999;
    margin-left: 6px;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 22px;
  }

  .actions {
    margin-top: auto;
    display: flex;
    gap: 8px;
  }

  .actions .ant-btn {
    flex: 1;
    height: 36px;
    border-radius: 10px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: transform 0.15s ease, box-shadow 0.2s ease;
  }

  .actions .ant-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.08);
  }

  .btn-add {
    background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%);
    color: #fff;
    border: none;
  }

  .btn-buy {
    background: linear-gradient(135deg, #ff7a7a 0%, #ff4d4f 100%);
    color: #fff;
    border: none;
  }

  .btn-notify {
    background: #fff7e6;
    color: #d46b08;
    border: 1px solid #ffe7ba;
  }

  .btn-delete {
    background: #fff1f0;
    color: #cf1322;
    border: 1px solid #ffa39e;
  }
`

/* ===================== COMPONENT ===================== */

const WishlistPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)

  const [wishlistItems, setWishlistItems] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [notifyList, setNotifyList] = useState([])

  useEffect(() => {
    const syncWishlist = () => {
      const items = WishlistService.getWishlist(user?.id)
      setWishlistItems(items)
      setWishlistIds(items.map(i => i.productId || i))
    }

    // Initial load
    syncWishlist()

    // Listen for changes coming from other components/windows
    const listener = () => syncWishlist()
    window.addEventListener('storage', listener)
    window.addEventListener('wishlist-updated', listener)

    return () => {
      window.removeEventListener('storage', listener)
      window.removeEventListener('wishlist-updated', listener)
    }
  }, [user?.id])

  const { data, isPending, refetch } = useQuery({
    queryKey: ['wishlist-products', wishlistIds],
    queryFn: async () => {
      const results = await Promise.all(
        wishlistIds.map(async id => {
          try {
            const res = await ProductService.getDetailsProduct(id)
            const product = res?.data
            const wishItem = wishlistItems.find(i => (i.productId || i) === id)

            if (product && wishItem?.variation) {
              product.wishlistVariation = wishItem.variation
            }
            return product
          } catch {
            return { _id: id, error: true }
          }
        })
      )
      return results.filter(Boolean)
    },
    enabled: wishlistIds.length > 0
  })

  const products = data || []

  const getVariantStock = (product) => {
    try {
      const wishVar = product.wishlistVariation
      if (!product || product.error) return null
      // If product has variations and wishlist saved a variant, find the matching variation
      if (product.hasVariations && wishVar) {
        // try match by sku first
        if (wishVar.sku) {
          const found = (product.variations || []).find(v => v.sku === wishVar.sku && v.isActive)
          if (found) return Number(found.stock || 0)
        }
        // fallback match by color/size/material
        const found = (product.variations || []).find(v =>
          (v.color || '') === (wishVar.color || '') &&
          (v.size || '') === (wishVar.size || '') &&
          (v.material || '') === (wishVar.material || '') && v.isActive
        )
        if (found) return Number(found.stock || 0)
        return 0
      }
      // If no variations, use product countInStock
      return Number(product.countInStock || 0)
    } catch (e) {
      return null
    }
  }

  const getStatus = product => {
    if (!product || product.error) return 'unavailable'
    if (!product.isActive) return 'stopped-selling'

    // If there is a wishlist-specific variant, respect its stock
    if (product.hasVariations && product.wishlistVariation) {
      const stock = getVariantStock(product)
      if (stock === 0) return 'out-of-stock'
      return 'available'
    }

    if (product.countInStock === 0) return 'out-of-stock'
    return 'available'
  }

  /* ===================== ACTIONS ===================== */

  const removeWishlist = product => {
    confirm({
      title: 'Xóa khỏi yêu thích?',
      icon: <ExclamationCircleOutlined />,
      onOk() {
        WishlistService.removeFromWishlist(product._id, product.wishlistVariation, user?.id)
        message.success('Đã xóa khỏi yêu thích')
        const items = WishlistService.getWishlist(user?.id)
        setWishlistItems(items)
        setWishlistIds(items.map(i => i.productId || i))
        refetch()
      }
    })
  }

  const addToCart = product => {
    const variation = product.wishlistVariation || null
    const stock = getVariantStock(product)

    // Luôn lấy ảnh từ product chính
    const productImage = product.image || product.images?.[0]

    const orderItem = {
      product: product._id,
      name: product.name,
      price: product.price,
      amount: 1,
      image: productImage,
      countInstock: stock,
      availableStock: stock,
      weight: product.weight || 0,
      category: product.category?._id || product.category
    }

    if (variation) {
      orderItem.variation = {
        color: variation.color || '',
        size: variation.size || '',
        material: variation.material || '',
        sku: variation.sku || ''
      }
    }

    dispatch(addorderProduct({ orderItem }))
    message.success('Đã thêm vào giỏ hàng')
  }

  const buyNow = product => {
    if (!user?.access_token) {
      navigate('/sign-in', { state: { from: '/wishlist' } })
      return
    }

    const variation = product.wishlistVariation || null
    const stock = getVariantStock(product)

    // Luôn lấy ảnh từ product chính
    const productImage = product.image || product.images?.[0]

    const orderItem = {
      name: product.name,
      amount: 1,
      image: productImage,
      price: product.price,
      product: product._id,
      discount: product.discount || 0,
      countInstock: stock,
      availableStock: stock,
      weight: product.weight || 0,
      category: product.category?._id || product.category
    }

    if (variation) {
      orderItem.variation = {
        color: variation.color || '',
        size: variation.size || '',
        material: variation.material || '',
        sku: variation.sku || ''
      }
    }

    // Thêm trực tiếp vào orderItemsSelected (không thêm vào giỏ hàng)
    dispatch(addToOrderSelected({ orderItem }))

    // Lưu tạm đơn “Mua ngay” để phòng trường hợp chuyển trang/refresh
    try {
      sessionStorage.setItem('pending_buy_now', JSON.stringify([orderItem]))
    } catch (e) {
      console.warn('Cannot persist buy-now payload', e)
    }

    navigate('/payment')
  }

  const handleSubscribeNotify = async (product) => {
    // subscribe to variant if user logged in
    if (!user?.access_token) {
      navigate('/sign-in', { state: { from: '/wishlist' } })
      return
    }

    const variation = product.wishlistVariation || {}
    try {
      const res = await NotificationService.subscribeRestock(product._id, variation, user?.access_token)
      if (res?.status === 'OK' || res?.message) {
        antMessage.success(res.message || 'Đã đăng ký nhận thông báo')
        setNotifyList(prev => [...prev, { product: product._id, variation }])
      } else {
        antMessage.success('Đã đăng ký nhận thông báo')
      }
    } catch (e) {
      console.error('subscribe error', e)
      antMessage.error(e?.response?.data?.message || e?.message || 'Không thể đăng ký nhận thông báo')
    }
  }

  /* ===================== RENDER ===================== */
  if (!user?.id) {
    return (
      <WrapperPage>
        <WrapperContainer>
          <PageTitle>
            Sản phẩm yêu thích
          </PageTitle>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Vui lòng đăng nhập để xem danh sách sản phẩm yêu thích của bạn"
            style={{ padding: '40px 0' }}
          >
            <Button
              type="primary"
              size="large"
              style={{ borderRadius: '10px', height: 'auto', padding: '10px 40px', fontWeight: 600 }}
              onClick={() => navigate('/sign-in', { state: { from: '/wishlist' } })}
            >
              Đăng nhập ngay
            </Button>
          </Empty>
        </WrapperContainer>
      </WrapperPage>
    )
  }

  if (isPending) {
    return (
      <WrapperPage>
        <WrapperContainer>
          <Loading isPending />
        </WrapperContainer>
      </WrapperPage>
    )
  }

  return (
    <WrapperPage>
      <WrapperContainer>
        <PageTitle>

          Sản phẩm yêu thích
        </PageTitle>

        {products.length === 0 ? (
          <Empty description="Chưa có sản phẩm yêu thích">
            <Button type="primary" onClick={() => navigate('/product')}>
              Khám phá sản phẩm
            </Button>
          </Empty>
        ) : (
          <Row gutter={[16, 20]}>
            {products.map(product => {
              const status = getStatus(product)
              const finalPrice = product.price;
              let originalPrice = product.originalPrice;
              if (!originalPrice && product.discount > 0 && product.price > 0) {
                originalPrice = Math.round(product.price / (1 - (product.discount || 0) / 100));
              }

              return (
                <Col xs={12} sm={8} md={6} key={product._id}>
                  <ProductCard className={status}>
                    <div className="cover">
                      {product.discount > 0 && (
                        <Tag color="red" className="status-pill">
                          -{product.discount}%
                        </Tag>
                      )}
                      {(status === 'out-of-stock' || status === 'stopped-selling' || status === 'unavailable') && (
                        <Tag color="orange" className="status-pill">
                          {status === 'out-of-stock' && 'Hết hàng'}
                          {status === 'stopped-selling' && 'Ngừng bán'}
                          {status === 'unavailable' && 'Không khả dụng'}
                        </Tag>
                      )}
                      <img
                        className="product-img"
                        src={product.image || product.images?.[0]}
                        alt={product.name}
                        onError={e => {
                          e.target.src = getPlaceholderImage(300, 300)
                        }}
                      />
                    </div>

                    <div
                      className="product-title"
                      onClick={() => status === 'available' && navigate(`/product-details/${product._id}`)}
                      style={{ cursor: status === 'available' ? 'pointer' : 'not-allowed' }}
                    >
                      {product.name}
                    </div>

                    <div>
                      {originalPrice && originalPrice > finalPrice && (
                        <span className="old-price">{convertPrice(originalPrice)}</span>
                      )}
                      <span className="price">{convertPrice(finalPrice)}</span>
                    </div>

                    <div className="meta">
                      {product.wishlistVariation && (
                        <Tag size="small" color="blue">
                          {product.wishlistVariation.color} {product.wishlistVariation.size && `/ ${product.wishlistVariation.size}`}
                        </Tag>
                      )}
                      {product.brand && <Tag size="small">{product.brand.name || product.brand}</Tag>}
                    </div>

                    {/* Show a short out-of-stock message when saved variant is out */}
                    {status === 'out-of-stock' && product.wishlistVariation && (
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                        {`Size ${product.wishlistVariation.size || '-'} – ${product.wishlistVariation.color || '-'} hiện hết hàng. Chọn size/màu khác`}
                      </div>
                    )}

                    <div className="actions">
                      {status === 'available' ? (
                        <>
                          <Button
                            size="middle"
                            className="btn-add"
                            icon={<ShoppingCartOutlined />}
                            onClick={() => addToCart(product)}
                            block
                          >
                            Thêm
                          </Button>
                          <Button
                            size="middle"
                            className="btn-buy"
                            icon={<ThunderboltOutlined />}
                            onClick={() => buyNow(product)}
                            block
                          >
                            Mua
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="middle"
                          className="btn-notify"
                          icon={<BellOutlined />}
                          onClick={() => handleSubscribeNotify(product)}
                          block
                        >
                          Nhận thông báo
                        </Button>
                      )}

                      <Button
                        size="middle"
                        className="btn-delete"
                        icon={<DeleteOutlined />}
                        onClick={() => removeWishlist(product)}
                        block
                      >
                        Xóa
                      </Button>
                    </div>
                  </ProductCard>
                </Col>
              )
            })}
          </Row>
        )}
      </WrapperContainer>
    </WrapperPage>
  )
}

export default WishlistPage
