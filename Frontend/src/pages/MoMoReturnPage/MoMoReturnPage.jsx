import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import * as PaymentService from '../../services/PaymentService'
import * as OrderService from '../../services/OrderService'
import * as message from '../../components/Message/Message'
import { useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { clearCart } from '../../redux/slides/orderSlide'

const MoMoReturnPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useSelector((state) => state.user)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy orderId từ sessionStorage
        const savedOrderId = sessionStorage.getItem('momo_temp_orderId')

        if (!savedOrderId) {
          setStatus('error')
          message.error('Không tìm thấy thông tin đơn hàng')
          setTimeout(() => navigate('/my-order'), 3000)
          return
        }

        // Lấy tất cả query params từ MoMo
        const queryData = {}
        searchParams.forEach((value, key) => {
          queryData[key] = value
        })

        // Verify payment với backend
        const verifyResult = await PaymentService.verifyMoMoPayment(queryData)

        if (verifyResult?.status === 'OK') {
          // Payment thành công, cập nhật đơn hàng thành đã thanh toán
          try {
            const updateResult = await OrderService.payOrder(savedOrderId, user?.access_token, {
              paidAt: new Date().toISOString(),
              paymentTransactionId: queryData.transId || queryData.orderId
            })

            if (updateResult?.status === 'OK') {
              const finalOrder = updateResult.data
              setOrderId(savedOrderId)
              setStatus('success')
              message.success('Thanh toán thành công!')

              // Xóa temp orderId
              sessionStorage.removeItem('momo_temp_orderId')

              // Invalidate cache
              queryClient.invalidateQueries({ queryKey: ['orders'] })
              queryClient.invalidateQueries({ queryKey: ['order-details', savedOrderId] })
              queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
              queryClient.invalidateQueries({ queryKey: ['unread-count', user?.access_token] })

              const successState = {
                payment: 'momo',
                orderId: savedOrderId,
                isPaid: true,
                orders: finalOrder.orderItems,
                totalPriceMemo: finalOrder.totalPrice,
                delivery: finalOrder.shippingMethod || 'standard'
              }

              try {
                sessionStorage.setItem('last_order_success', JSON.stringify(successState))
              } catch (error) {
                console.warn('Could not cache MoMo success state', error)
              }

              // Redirect đến OrderSuccess sau 2 giây
              setTimeout(() => {
                navigate('/orderSuccess', {
                  replace: true,
                  state: successState
                })
              }, 2000)
            } else {
              setStatus('error')
              message.error(updateResult?.message || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng')
              setTimeout(() => navigate(`/details-order/${savedOrderId}`), 3000)
            }
          } catch (error) {
            console.error('Error updating order:', error)
            setStatus('error')
            message.error('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng')
            setTimeout(() => navigate(`/details-order/${savedOrderId}`), 3000)
          }
        } else {
          // Thanh toán thất bại hoặc user hủy
          setStatus('error')
          const errorCode = queryData.resultCode
          const errorMsg = errorCode === '1006' ? 'Bạn đã hủy thanh toán MoMo' : (verifyResult?.message || 'Thanh toán thất bại')
          message.error(errorMsg)

          // Xóa temp orderId
          sessionStorage.removeItem('momo_temp_orderId')

          // Chuyển về chi tiết đơn hàng (vì đơn đã tồn tại ở trạng thái chờ thanh toán)
          setTimeout(() => navigate(`/details-order/${savedOrderId}`), 3000)
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setStatus('error')
        message.error('Có lỗi xảy ra khi xác thực thanh toán')
        setTimeout(() => navigate('/my-order'), 3000)
      }
    }

    // Chỉ verify nếu user đã đăng nhập
    if (user?.access_token) {
      verifyPayment()
    } else {
      setStatus('error')
      message.error('Vui lòng đăng nhập')
      setTimeout(() => navigate('/sign-in'), 3000)
    }
  }, [searchParams, navigate, dispatch, queryClient, user?.access_token, user?.id])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: '#f5f5f5'
    }}>
      {status === 'loading' && (
        <>
          <LoadingOutlined style={{ fontSize: 64, color: '#1a94ff', marginBottom: 24 }} spin />
          <h2 style={{ color: '#1a94ff', marginBottom: 12 }}>Đang xử lý thanh toán...</h2>
          <p style={{ color: '#666' }}>Vui lòng đợi trong giây lát</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
          <h2 style={{ color: '#52c41a', marginBottom: 12 }}>Thanh toán thành công!</h2>
          <p style={{ color: '#666', marginBottom: 8 }}>Đơn hàng của bạn đã được thanh toán</p>
          {orderId && (
            <p style={{ color: '#999', fontSize: 14 }}>Mã đơn hàng: {orderId}</p>
          )}
          <p style={{ color: '#999', fontSize: 14, marginTop: 24 }}>Đang chuyển hướng...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <CloseCircleOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 24 }} />
          <h2 style={{ color: '#ff4d4f', marginBottom: 12 }}>Thanh toán thất bại</h2>
          <p style={{ color: '#666' }}>Vui lòng thử lại hoặc chọn phương thức thanh toán khác</p>
          <p style={{ color: '#999', fontSize: 14, marginTop: 24 }}>Đang chuyển hướng...</p>
        </>
      )}
    </div>
  )
}

export default MoMoReturnPage

