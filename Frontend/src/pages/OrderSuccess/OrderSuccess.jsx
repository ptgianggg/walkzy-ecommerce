import React, { useEffect, useMemo } from 'react'
import {
  WrapperSuccessContainer,
  WrapperSuccessHeader,
  WrapperTimeline,
  WrapperOrderInfo,
  WrapperInfoCard,
  WrapperProductsList,
  WrapperProductItem,
  WrapperTotalCard,
  WrapperActions
} from './style'
import { useSelector } from 'react-redux'
import Loading from '../../components/LoadingComponent/Loading'
import { useLocation, useNavigate } from 'react-router-dom'
import { orderContant } from '../../contant'
import { convertPrice } from '../../utils'
import {
  CheckCircleOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  HomeOutlined,
  EyeOutlined
} from '@ant-design/icons'
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent'

const OrderSuccess = () => {
  const user = useSelector((state) => state.user)
  const location = useLocation()
  const navigate = useNavigate()
  const successState = useMemo(() => {
    if (location.state) return location.state
    const cached = sessionStorage.getItem('last_order_success')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (error) {
        sessionStorage.removeItem('last_order_success')
      }
    }
    return null
  }, [location.state])

  useEffect(() => {
    if (location.state) {
      try {
        sessionStorage.setItem('last_order_success', JSON.stringify(location.state))
      } catch (error) {
        console.warn('Could not persist order success data', error)
      }
    }
  }, [location.state])

  // Tính toán giá trị
  const priceMemo = useMemo(() => {
    if (!successState?.orders) return 0
    return successState.orders.reduce((total, cur) => {
      return total + (cur.price * cur.amount)
    }, 0)
  }, [successState?.orders])

  const diliveryPriceMemo = useMemo(() => {
    if (priceMemo === 0) return 0
    if (priceMemo >= 500000) return 0
    if (priceMemo >= 200000) return 10000
    return 20000
  }, [priceMemo])

  const totalPriceMemo = useMemo(() => {
    return Number(priceMemo) + Number(diliveryPriceMemo)
  }, [priceMemo, diliveryPriceMemo])

  // Tính thời gian giao hàng dự kiến
  const estimatedDeliveryDate = useMemo(() => {
    // Nếu có estimatedDeliveryDate từ state (từ shipping method)
    if (successState?.estimatedDeliveryDate) {
      const date = new Date(successState.estimatedDeliveryDate)
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    // Fallback: tính theo delivery type cũ
    const today = new Date()
    const deliveryDays = successState?.delivery === 'fast' ? 3 : 5
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + deliveryDays)

    return deliveryDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [successState?.estimatedDeliveryDate, successState?.delivery])

  if (!successState) {
    return (
      <WrapperSuccessContainer>
        <div className="success-content">
          <WrapperSuccessHeader>
            <div className="success-icon-wrapper">
              <CheckCircleOutlined className="success-icon" />
            </div>
            <h1 className="success-title">Không tìm thấy thông tin đơn hàng</h1>
            <p className="success-message">Vui lòng quay lại trang đơn hàng</p>
            <ButtonComponent
              onClick={() => navigate('/my-order')}
              textbutton="Xem đơn hàng của tôi"
              styleButton={{
                background: '#1a94ff',
                height: 48,
                width: 'auto',
                border: 'none',
                borderRadius: 12,
                padding: '0 32px',
                marginTop: 24
              }}
              styletextbutton={{
                color: '#fff',
                fontSize: 15,
                fontWeight: 600
              }}
            />
          </WrapperSuccessHeader>
        </div>
      </WrapperSuccessContainer>
    )
  }

  return (
    <WrapperSuccessContainer>
      <Loading isPending={false}>
        <div className="success-content">
          {/* Success Header */}
          <WrapperSuccessHeader>
            <div className="success-icon-wrapper">
              <CheckCircleOutlined className="success-icon" />
            </div>
            <h1 className="success-title">Đặt hàng thành công!</h1>
            <p className="success-message">
              Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.
            </p>
            {successState?.orderId && (
              <div className="order-id">
                <span className="order-id-label">Mã đơn hàng:</span>
                <span>{successState.orderId}</span>
              </div>
            )}
          </WrapperSuccessHeader>

          {/* Timeline */}
          <WrapperTimeline>
            <div className="timeline-title">
              <FileTextOutlined className="timeline-icon" />
              Quy trình đơn hàng
            </div>
            <div className="timeline-steps">
              <div className="timeline-step">
                <div className="step-icon completed">
                  <CheckCircleOutlined />
                </div>
                <div className="step-label">Đặt hàng</div>
                <div className="step-description">Đã xác nhận</div>
              </div>
              <div className="timeline-step">
                <div className="step-icon active">
                  <ShoppingCartOutlined />
                </div>
                <div className="step-label">Chuẩn bị hàng</div>
                <div className="step-description">Đang xử lý</div>
              </div>
              <div className="timeline-step">
                <div className="step-icon">
                  <TruckOutlined />
                </div>
                <div className="step-label">Vận chuyển</div>
                <div className="step-description">Dự kiến: {estimatedDeliveryDate}</div>
              </div>
              <div className="timeline-step">
                <div className="step-icon">
                  <CheckCircleOutlined />
                </div>
                <div className="step-label">Giao hàng</div>
                <div className="step-description">Chờ giao hàng</div>
              </div>
            </div>
          </WrapperTimeline>

          {/* Order Info Grid */}
          <WrapperOrderInfo>
            {/* Delivery Info */}
            <WrapperInfoCard>
              <div className="card-header">
                <TruckOutlined className="card-icon" />
                <div className="card-title">Thông tin giao hàng</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Phương thức vận chuyển</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a94ff' }}>
                    {successState?.shippingRateName || orderContant.delivery[successState?.delivery] || 'Chưa xác định'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Hãng vận chuyển</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {successState?.shippingProvider || 'GHTK'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Phí vận chuyển</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: diliveryPriceMemo === 0 ? '#52c41a' : '#000' }}>
                    {diliveryPriceMemo === 0 ? 'Miễn phí' : convertPrice(diliveryPriceMemo)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Thời gian giao hàng</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    1–3 ngày
                  </div>
                </div>
              </div>
              <div className="info-item">
                <span className="info-label">Địa chỉ:</span>
                <span className="info-value">
                  {user?.address || 'Chưa có'}, {user?.city || ''}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Người nhận:</span>
                <span className="info-value">{user?.name || 'Chưa có'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Số điện thoại:</span>
                <span className="info-value">{user?.phone || 'Chưa có'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Giao hàng dự kiến:</span>
                <span className="info-value" style={{ color: '#52c41a', fontWeight: 600 }}>
                  {estimatedDeliveryDate}
                </span>
              </div>
            </WrapperInfoCard>

            {/* Payment Info */}
            <WrapperInfoCard>
              <div className="card-header">
                <CreditCardOutlined className="card-icon" />
                <div className="card-title">Thông tin thanh toán</div>
              </div>
              <div className="info-item">
                <span className="info-label">Phương thức:</span>
                <span className="info-value">
                  {orderContant.payment[successState?.payment] || 'Thanh toán tiền mặt khi nhận hàng'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Trạng thái:</span>
                <span className="info-value" style={{ color: successState?.payment === 'paypal' ? '#52c41a' : '#faad14' }}>
                  {successState?.payment === 'paypal' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Tạm tính:</span>
                <span className="info-value">{convertPrice(priceMemo)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phí vận chuyển:</span>
                <span className="info-value">
                  {diliveryPriceMemo === 0 ? (
                    <span style={{ color: '#52c41a' }}>Miễn phí</span>
                  ) : (
                    convertPrice(diliveryPriceMemo)
                  )}
                </span>
              </div>
            </WrapperInfoCard>
          </WrapperOrderInfo>

          {/* Products List */}
          {successState?.orders && successState.orders.length > 0 && (
            <WrapperProductsList>
              <div className="products-header">
                <ShoppingCartOutlined className="header-icon" />
                <div className="header-title">Sản phẩm đã đặt</div>
                <div className="product-count">{successState.orders.length} sản phẩm</div>
              </div>
              <div className="products-list">
                {successState.orders.map((order, index) => {
                  const selectedColor = order.variation
                    ? Array.isArray(order.variation.color)
                      ? order.variation.color[0]
                      : order.variation.color
                    : null

                  const selectedSize = order.variation
                    ? Array.isArray(order.variation.size)
                      ? order.variation.size[0]
                      : order.variation.size
                    : null

                  return (
                    <WrapperProductItem key={`${order.product}_${index}`}>
                      <img
                        src={order.image}
                        alt={order.name}
                        className="product-image"
                      />
                      <div className="product-info">
                        <div className="product-name">{order.name}</div>
                        <div className="product-details">
                          {selectedColor && (
                            <div className="detail-item">
                              <span>Màu:</span>
                              <span style={{ fontWeight: 600 }}>{String(selectedColor)}</span>
                            </div>
                          )}
                          {selectedSize && (
                            <div className="detail-item">
                              <span>Size:</span>
                              <span style={{ fontWeight: 600 }}>{String(selectedSize)}</span>
                            </div>
                          )}
                          <div className="detail-item">
                            <span>Số lượng:</span>
                            <span style={{ fontWeight: 600 }}>{order.amount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="product-price">
                        <div className="price-value">{convertPrice(order.price * order.amount)}</div>
                        <div className="price-quantity">{convertPrice(order.price)} x {order.amount}</div>
                      </div>
                    </WrapperProductItem>
                  )
                })}
              </div>
            </WrapperProductsList>
          )}

          {/* Total Card */}
          <WrapperTotalCard>
            <div className="total-header">
              <FileTextOutlined className="total-icon" />
              <div className="total-title">Tổng thanh toán</div>
            </div>
            <div className="total-row">
              <span className="total-label">Tạm tính</span>
              <span className="total-value">{convertPrice(priceMemo)}</span>
            </div>
            <div className="total-row">
              <span className="total-label">Phí vận chuyển</span>
              <span className="total-value">
                {diliveryPriceMemo === 0 ? (
                  <span style={{ color: '#52c41a' }}>Miễn phí</span>
                ) : (
                  convertPrice(diliveryPriceMemo)
                )}
              </span>
            </div>
            <div className="total-row final-total">
              <span className="total-label">Tổng cộng</span>
              <span className="total-value">{convertPrice(totalPriceMemo)}</span>
            </div>
          </WrapperTotalCard>

          {/* Action Buttons */}
          <WrapperActions>
            <ButtonComponent
              onClick={() => navigate('/my-order')}
              textbutton={
                <>
                  <EyeOutlined />
                  Xem đơn hàng của tôi
                </>
              }
              styleButton={{
                background: '#1a94ff',
                height: 48,
                width: 'auto',
                border: 'none',
                borderRadius: 12,
                padding: '0 32px',
                minWidth: 200
              }}
              styletextbutton={{
                color: '#fff',
                fontSize: 15,
                fontWeight: 600
              }}
            />
            <ButtonComponent
              onClick={() => navigate('/product')}
              textbutton={
                <>
                  <HomeOutlined />
                  Tiếp tục mua sắm
                </>
              }
              styleButton={{
                background: '#fff',
                height: 48,
                width: 'auto',
                border: '2px solid #1a94ff',
                borderRadius: 12,
                padding: '0 32px',
                minWidth: 200
              }}
              styletextbutton={{
                color: '#1a94ff',
                fontSize: 15,
                fontWeight: 600
              }}
            />
          </WrapperActions>
        </div>
      </Loading>
    </WrapperSuccessContainer>
  )
}

export default OrderSuccess
