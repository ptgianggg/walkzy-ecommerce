import { useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import * as OrderService from '../../services/OrderService'
import * as ReviewService from '../../services/ReviewService'
import * as SupportRequestService from '../../services/SupportRequestService'
import Loading from '../../components/LoadingComponent/Loading'
import { useSelector } from 'react-redux'
import {
  WrapperMyOrderContainer,
  WrapperTabs,
  WrapperListOrder,
  WrapperItemOrder,
  WrapperOrderHeader,
  WrapperProductsList,
  WrapperProductItem,
  WrapperOrderFooter,
  StatusBadge,
  ActionButton,
  WrapperEmptyState
} from './style'
import { convertPrice } from '../../utils'
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent'
import { useLocation, useNavigate } from 'react-router-dom'
import { message, Modal, Input, Radio, Space, Card, Button } from 'antd'
import { useMutationHooks } from '../../hooks/useMutationHook'
import ReviewForm from '../../components/ReviewForm/ReviewForm'
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  StarOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  UndoOutlined,
  CreditCardOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import OrderTracking from '../../components/OrderTracking/OrderTracking'
import ModalComponent from '../../components/ModalComponent/ModalComponent'
import ReturnRequestModal from '../../components/ReturnRequestModal/ReturnRequestModal'
import ReturnRequestList from '../../components/ReturnRequestList/ReturnRequestList'

const WALKZY_BLUE = '#1a94ff'

const CANCEL_REASONS = [
  'Tôi không muốn mua nữa',
  'Giá quá cao',
  'Thời gian giao hàng quá lâu',
  'Chất lượng sản phẩm không như mô tả',
  'Đặt nhầm',
  'Lý do khác'
]

const CountdownTimer = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const expiry = new Date(expiryDate)
      const diff = expiry - now

      if (diff <= 0) return 'Đã hết hạn'

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`
      }
      return `${minutes}m ${seconds}s`
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [expiryDate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ff4d4f', fontWeight: 500, fontSize: '13px' }}>
      <ClockCircleOutlined />
      <span>Hết hạn sau: {timeLeft}</span>
    </div>
  )
}

const MyOrderPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { state } = location
  const [activeTab, setActiveTab] = useState('all')
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const autoSyncedStatusRef = React.useRef(new Set())
  const [trackingModalVisible, setTrackingModalVisible] = useState(false)
  const [currentTrackingOrder, setCurrentTrackingOrder] = useState(null)
  const [currentReviewOrder, setCurrentReviewOrder] = useState(null)
  const [currentReviewItem, setCurrentReviewItem] = useState(null)
  const [unreviewedItems, setUnreviewedItems] = useState([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [returnRequestModalVisible, setReturnRequestModalVisible] = useState(false)
  const [currentReturnOrder, setCurrentReturnOrder] = useState(null)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [currentCancelOrder, setCurrentCancelOrder] = useState(null)
  const [selectedCancelReason, setSelectedCancelReason] = useState('')
  const [cancelReasonInput, setCancelReasonInput] = useState('')

  const token = state?.token || user?.access_token
  const userId = state?.id || user?.id

  // Map status to Vietnamese
  const getStatusLabel = (status) => {
    const statusMap = {
      pending_payment: 'Chờ thanh toán',
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipped: 'Đang vận chuyển',
      delivered: 'Đã giao hàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
      returned: 'Đã trả hàng',
      return_requested: 'Yêu cầu trả hàng'
    }
    return statusMap[status] || status
  }

  // Map shipping status to Vietnamese
  const getShippingStatusLabel = (shippingStatus) => {
    if (!shippingStatus) return null
    const statusMap = {
      pending: 'Chờ lấy hàng',
      waiting_pickup: 'Chờ lấy hàng',
      ready_to_pick: 'Chờ lấy hàng',
      picked_up: 'Đã lấy hàng',
      shipping: 'Đang vận chuyển',
      in_transit: 'Đang vận chuyển',
      out_for_delivery: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      failed: 'Giao thất bại',
      returned: 'Đã trả hàng',
      cancelled: 'Đã hủy'
    }
    return statusMap[shippingStatus] || shippingStatus
  }


  const getStatusClass = (status) => {
    // Map refunded to returned for styling
    if (status === 'refunded') return 'returned'
    if (status === 'return_requested') return 'pending'
    if (status === 'pending_payment') return 'pending_payment'
    return status || 'pending'
  }

  const canViewTracking = (order) => {
    const status = order?.status
    const shippingStatus = order?.shippingStatus
    const trackingExists = order?.trackingNumber || order?.shippingOrder?.trackingNumber

    if (!order) return false
    if (status === 'cancelled' || order?.isCancelled || shippingStatus === 'cancelled') return false
    if (status === 'return_requested') return false
    // Hide tracking once the user confirms receipt (completed)
    if (status === 'completed') return false
    if (order?.hasSupportRequest) return false
    if (status === 'pending') return false

    const shippingActiveStatuses = [
      'pending',
      'waiting_pickup',
      'ready_to_pick',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'shipping',
      'delivered'
    ]

    // 'completed' intentionally omitted so tracking is not shown after confirmation
    const orderActiveStatuses = ['confirmed', 'processing', 'shipped', 'delivered']

    if (shippingActiveStatuses.includes(shippingStatus)) return true
    if (orderActiveStatuses.includes(status) && (shippingStatus || trackingExists)) return true

    return false
  }


  const mapOrderToTab = (order) => {
    const status = order?.status
    const shippingStatus = order?.shippingStatus
    const isCancelled = status === 'cancelled' || order?.isCancelled || shippingStatus === 'cancelled'

    if (isCancelled) return 'cancelled'
    if (status === 'return_requested') return 'delivered_completed'
    if (status === 'refunded' || shippingStatus === 'returned') {
      return 'returned'
    }
    if (status === 'delivered' || status === 'completed' || shippingStatus === 'delivered') {
      return 'delivered_completed'
    }
    if (
      ['picked_up', 'in_transit', 'out_for_delivery', 'shipping', 'ready_to_pick', 'waiting_pickup'].includes(shippingStatus) ||
      status === 'shipped'
    ) {
      return shippingStatus === 'ready_to_pick' || shippingStatus === 'waiting_pickup' ? 'waiting_pickup' : 'delivering'
    }
    if (
      status === 'confirmed' ||
      status === 'processing' ||
      shippingStatus === 'pending'
    ) {
      return 'waiting_pickup'
    }
    if (status === 'pending' || status === 'pending_payment') return 'pending'
    return 'all'
  }

  // Filter orders by status theo y?u c?u m?i
  const filterOrdersByStatus = (orders, status) => {
    if (status === 'all') return orders

    if (status === 'returned') {
      return [] // Tab n?y s? hi?n th? support requests
    }

    return orders.filter(o => mapOrderToTab(o) === status)
  }
  const handleDetailsOrder = (id, options = {}) => {
    // Pass token and any additional options to the details page
    navigate(`/details-order/${id}`, {
      state: {
        token,
        ...options
      }
    })
  }

  // Cancel order mutation
  const mutationCancel = useMutationHooks(
    (data) => {
      const { id, token, orderItems, cancelReason } = data
      return OrderService.cancelOrder(id, token, orderItems, cancelReason)
    }
  )

  // Confirm received order mutation (chuyển từ delivered -> completed)
  const mutationConfirmReceived = useMutationHooks(
    (data) => {
      const { id, token } = data
      return OrderService.completeOrder(id, token)
    }
  )

  // Request return/refund mutation
  const mutationRequestReturn = useMutationHooks(
    (data) => {
      const { id, reason, token } = data
      // Đánh dấu trạng thái return_requested để ẩn hành động hoàn tất cho tới khi xử lý
      return OrderService.updateOrderStatus(id, 'return_requested', reason || 'Yêu cầu trả hàng', token)
    }
  )

  const handleCancelOrder = (order) => {
    setCurrentCancelOrder(order)
    setSelectedCancelReason('')
    setCancelReasonInput('')
    setCancelModalVisible(true)
  }

  const handleConfirmCancel = () => {
    if (!selectedCancelReason && !cancelReasonInput) {
      message.warning('Vui lòng chọn hoặc nhập lý do hủy')
      return
    }

    const reason = selectedCancelReason || cancelReasonInput
    console.log('=== Handle Confirm Cancel ===');
    console.log('Current Cancel Order:', currentCancelOrder);
    console.log('Order Items:', currentCancelOrder?.orderItems);
    console.log('Cancel Reason:', reason);
    console.log('==============================');

    mutationCancel.mutate(
      { id: currentCancelOrder._id, token, orderItems: currentCancelOrder?.orderItems, cancelReason: reason },
      {
        onSuccess: (data) => {
          console.log('Cancel Success:', data);
          if (data?.status === 'OK') {
            message.success('Hủy đơn hàng thành công')
            setCancelModalVisible(false)
            setCurrentCancelOrder(null)
            queryOrder.refetch()
            // Invalidate cache của promotions để cập nhật số lượng voucher còn lại
            if (currentCancelOrder?.promotion) {
              queryClient.invalidateQueries({
                queryKey: ['promotions']
              });
            }
          } else {
            message.error(data?.message || 'Hủy đơn hàng thất bại')
          }
        },
        onError: (error) => {
          console.error('Cancel Error:', error);
          message.error('Hủy đơn hàng thất bại')
        }
      }
    )
  }

  const handleCancelModalCancel = () => {
    setCancelModalVisible(false)
    setCurrentCancelOrder(null)
    setSelectedCancelReason('')
    setCancelReasonInput('')
  }

  const handleConfirmReceived = (order) => {
    if (!window.confirm('Bạn đã nhận được hàng? Xác nhận để tiếp tục.')) {
      return
    }
    mutationConfirmReceived.mutate(
      { id: order._id, token },
      {
        onSuccess: (data) => {
          if (data?.status === 'OK') {
            message.success('Xác nhận nhận hàng thành công! Bạn có thể đánh giá sản phẩm ngay bây giờ.')
            queryOrder.refetch()
          } else {
            message.error(data?.message || 'Xác nhận thất bại')
          }
        },
        onError: (error) => {
          const errorMsg = error?.response?.data?.message || 'Xác nhận thất bại'
          message.error(errorMsg)
        }
      }
    )
  }

  const handleReviewSuccess = () => {
    // Chuyển sang sản phẩm tiếp theo
    if (reviewIndex < unreviewedItems.length - 1) {
      setReviewIndex(reviewIndex + 1)
      setCurrentReviewItem(unreviewedItems[reviewIndex + 1])
    } else {
      // Đã đánh giá hết, đóng modal
      setReviewModalVisible(false)
      setCurrentReviewOrder(null)
      setCurrentReviewItem(null)
      setReviewIndex(0)
      setUnreviewedItems([])
      // Refresh orders để cập nhật trạng thái đánh giá
      queryOrder.refetch()
      message.success('Cảm ơn bạn đã đánh giá!')
    }
  }

  const handleReviewCancel = () => {
    setReviewModalVisible(false)
    setCurrentReviewOrder(null)
    setCurrentReviewItem(null)
    setReviewIndex(0)
    setUnreviewedItems([])
  }

  const handleBuyAgain = (order) => {
    // Lấy sản phẩm đầu tiên trong order để navigate đến trang chi tiết
    if (order?.orderItems && order.orderItems.length > 0) {
      const firstProduct = order.orderItems[0]
      const productId = firstProduct.product?._id || firstProduct.product
      if (productId) {
        navigate(`/product-details/${productId}`)
      } else {
        navigate('/product')
        message.info('Vui lòng chọn sản phẩm để mua lại')
      }
    } else {
      navigate('/product')
      message.info('Không có sản phẩm trong đơn hàng này')
    }
  }

  const handleReview = async (order) => {
    // Kiểm tra sản phẩm chưa đánh giá
    try {
      // Lấy token mới nhất từ user state
      const currentToken = user?.access_token || token

      if (!currentToken) {
        message.error('Vui lòng đăng nhập để đánh giá')
        return
      }

      if (!order._id) {
        message.error('Không tìm thấy thông tin đơn hàng')
        return
      }

      const canReviewData = await ReviewService.canReviewOrder(order._id, currentToken)

      if (canReviewData?.status === 'OK') {
        if (canReviewData.data?.canReview) {
          const unreviewed = canReviewData.data.unreviewedItems || []

          if (unreviewed.length > 0) {
            setCurrentReviewOrder(order)
            setUnreviewedItems(unreviewed)
            setReviewIndex(0)
            setCurrentReviewItem(unreviewed[0])
            setReviewModalVisible(true)
          } else {
            message.info('Bạn đã đánh giá tất cả sản phẩm trong đơn hàng này')
            // Refresh orders để cập nhật trạng thái
            queryOrder.refetch()
          }
        } else {
          const errorMsg = canReviewData.data?.message || `Chỉ có thể đánh giá khi đơn hàng đã được giao. Trạng thái hiện tại: ${canReviewData.data?.orderStatus || order.status}`
          message.warning(errorMsg)
        }
      } else {
        message.error(canReviewData?.message || 'Có lỗi xảy ra khi kiểm tra quyền đánh giá')
      }
    } catch (error) {
      console.error('Error in handleReview:', error)
      message.error('Có lỗi xảy ra khi kiểm tra quyền đánh giá: ' + (error.message || 'Unknown error'))
    }
  }

  // Hàm để kiểm tra đơn hàng đã đánh giá hết chưa
  const checkOrderReviewStatus = async (order) => {
    try {
      const currentToken = user?.access_token || token
      if (!currentToken || !order._id) return null

      const canReviewData = await ReviewService.canReviewOrder(order._id, currentToken)
      if (canReviewData?.status === 'OK' && canReviewData.data) {
        return {
          allItemsReviewed: canReviewData.data.allItemsReviewed || false,
          hasUnreviewedItems: canReviewData.data.hasUnreviewedItems || false
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  const handleRequestReturn = (order) => {
    const reason = window.prompt('Vui lòng nhập lý do trả hàng:')
    if (!reason || reason.trim() === '') {
      message.warning('Vui lòng nhập lý do trả hàng')
      return
    }

    mutationRequestReturn.mutate(
      { id: order._id, reason: reason.trim(), token },
      {
        onSuccess: (data) => {
          if (data?.status === 'OK') {
            message.success('Yêu cầu trả hàng đã được gửi. Chúng tôi sẽ xử lý trong thời gian sớm nhất.')
            queryOrder.refetch()
          } else {
            message.error(data?.message || 'Gửi yêu cầu trả hàng thất bại')
          }
        },
        onError: () => {
          message.error('Gửi yêu cầu trả hàng thất bại')
        }
      }
    )
  }

  const { isPending: isPendingCancel } = mutationCancel
  const { isPending: isPendingConfirm } = mutationConfirmReceived
  const { isPending: isPendingReturn } = mutationRequestReturn

  useEffect(() => {
    if (mutationCancel.isSuccess && mutationCancel.data?.status === 'OK') {
      message.success('Hủy đơn hàng thành công')
    }
    if (mutationCancel.isError) {
      message.error('Hủy đơn hàng thất bại')
    }
  }, [mutationCancel.isSuccess, mutationCancel.isError, mutationCancel.data])

  const fetchMyOrder = async () => {
    if (!userId || !token) return []
    const res = await OrderService.getOrderByUserId(userId, token)
    if (res?.data && Array.isArray(res.data)) {
      return res.data
    }
    if (res?.data?.data && Array.isArray(res.data.data)) {
      return res.data.data
    }
    return []
  }

  const queryOrder = useQuery({
    queryKey: ['orders', userId],
    queryFn: fetchMyOrder,
    enabled: Boolean(userId && token)
  })

  const { isPending, data } = queryOrder
  const ordersData = Array.isArray(data) ? data : []



  // Thêm thông tin đánh giá vào mỗi order
  const [ordersWithReviewStatus, setOrdersWithReviewStatus] = useState([])
  const prevDataKeyRef = React.useRef(null)

  // Fetch support requests để kiểm tra đơn hàng đã có yêu cầu trả hàng chưa
  const { data: supportRequestsData } = useQuery({
    queryKey: ['support-requests', userId],
    queryFn: () => SupportRequestService.getSupportRequestsByUser(user?.access_token || token),
    enabled: Boolean((user?.access_token || token) && userId),
    staleTime: 60000 // Cache for 1 min to prevent frequent refetches
  })

  // Support requests list stable derived state
  const supportRequests = React.useMemo(() => {
    return supportRequestsData?.data || []
  }, [supportRequestsData])

  // Kiểm tra đơn hàng đã có yêu cầu trả hàng chưa
  const hasSupportRequest = (orderId) => {
    if (!orderId || !supportRequests || supportRequests.length === 0) return false
    const orderIdStr = orderId.toString()
    // Chỉ khi yêu cầu bị REJECTED mới coi là hết hiệu lực; các trạng thái khác (đang xử lý/đã hoàn tiền) vẫn ẩn nút
    const activeStatuses = ['PENDING', 'APPROVED', 'RETURN_REQUESTED', 'COMPLETED']
    return supportRequests.some(req => {
      const reqOrderId = req.orderId?._id?.toString() || req.orderId?.toString()
      return reqOrderId === orderIdStr && activeStatuses.includes(req.status)
    })
  }

  // Kiểm tra đơn hàng có thể trả hàng không (7 ngày)
  const checkOrderCanReturn = async (order) => {
    if (!order || !order._id) return false
    if (order.status !== 'delivered') return false;

    try {
      const currentToken = user?.access_token || token
      if (!currentToken) return false

      const result = await SupportRequestService.checkCanReturn(order._id, currentToken)
      return result?.canReturn || false
    } catch (error) {
      console.error('Error checking can return:', error)
      return false
    }
  }

  // Tối ưu hóa: Gộp các useEffect xử lý trạng thái bổ sung của đơn hàng
  useEffect(() => {
    let isMounted = true;
    const syncAdditionalStatus = async () => {
      // Create a unique key based on orders content and support requests count
      const dataKey = JSON.stringify(ordersData?.map(o => o._id + o.status)) + supportRequests.length;

      if (prevDataKeyRef.current === dataKey) return;
      prevDataKeyRef.current = dataKey;

      if (ordersData.length > 0 && (user?.access_token || token)) {
        try {
          const currentToken = user?.access_token || token;

          const updatedOrders = await Promise.all(
            ordersData.map(async (order) => {
              let updatedOrder = { ...order }

              // Check review status if delivered
              if (order.status === 'delivered' || order.status === 'completed') {
                const [reviewStatus, canReturn] = await Promise.all([
                  checkOrderReviewStatus(order),
                  checkOrderCanReturn(order)
                ]);

                updatedOrder.allItemsReviewed = reviewStatus?.allItemsReviewed || false;
                updatedOrder.hasUnreviewedItems = reviewStatus?.hasUnreviewedItems !== false;
                updatedOrder.canReturn = canReturn && !hasSupportRequest(order._id);
              } else {
                updatedOrder.canReturn = false;
              }

              updatedOrder.hasSupportRequest = hasSupportRequest(order._id);
              return updatedOrder;
            })
          );

          if (isMounted) {
            setOrdersWithReviewStatus(updatedOrders);
          }
        } catch (error) {
          console.error("Error syncing status:", error);
        }
      } else if (ordersData.length === 0 && ordersWithReviewStatus.length > 0) {
        if (isMounted) setOrdersWithReviewStatus([]);
      }
    };

    syncAdditionalStatus();
    return () => { isMounted = false; };
  }, [ordersData, user?.access_token, token, supportRequests]);

  const displayOrders = React.useMemo(() => {
    return ordersWithReviewStatus.length > 0 ? ordersWithReviewStatus : ordersData;
  }, [ordersWithReviewStatus, ordersData]);

  // Tab items memoized
  const tabItems = React.useMemo(() => [
    {
      key: 'all',
      label: `Tất cả (${ordersData.length})`,
    },
    {
      key: 'pending',
      label: `Chờ xác nhận (${ordersData.filter(o => mapOrderToTab(o) === 'pending').length})`,
    },
    {
      key: 'waiting_pickup',
      label: `Chờ lấy hàng (${ordersData.filter(o => mapOrderToTab(o) === 'waiting_pickup').length})`,
    },
    {
      key: 'delivering',
      label: `Đang giao (${ordersData.filter(o => mapOrderToTab(o) === 'delivering').length})`,
    },
    {
      key: 'delivered_completed',
      label: `Đã giao / Hoàn thành (${ordersData.filter(o => mapOrderToTab(o) === 'delivered_completed').length})`,
    },
    {
      key: 'cancelled',
      label: `Đã hủy (${ordersData.filter(o => mapOrderToTab(o) === 'cancelled').length})`,
    },
    {
      key: 'returned',
      label: `Trả hàng / Hoàn hàng (${supportRequests.length})`,
    },
  ], [ordersData, supportRequests]);

  const renderProduct = (orderItems, orderStatus, orderId) => {
    if (!orderItems || !Array.isArray(orderItems)) return null

    const canViewDetails = orderStatus === 'delivered' || orderStatus === 'completed' || orderStatus === 'return_requested'

    return orderItems.map((item, index) => {
      const selectedColor = item.variation
        ? Array.isArray(item.variation.color)
          ? item.variation.color[0]
          : item.variation.color
        : null

      const selectedSize = item.variation
        ? Array.isArray(item.variation.size)
          ? item.variation.size[0]
          : item.variation.size
        : null

      return (
        <WrapperProductItem key={`${item.product}_${index}`}>
          <img
            src={item.image}
            alt={item.name}
            className="product-image"
            onClick={() => navigate(`/product-details/${item.product}`)}
          />
          <div className="product-info">
            <div
              className="product-name"
              onClick={() => navigate(`/product-details/${item.product}`)}
            >
              {item.name}
            </div>
            <div className="product-variation">
              {selectedColor && (
                <div className="variation-item">
                  <span>Màu:</span>
                  <span style={{ fontWeight: 600 }}>{String(selectedColor)}</span>
                </div>
              )}
              {selectedSize && (
                <div className="variation-item">
                  <span>Size:</span>
                  <span style={{ fontWeight: 600 }}>{String(selectedSize)}</span>
                </div>
              )}
            </div>
            <div className="product-quantity">Số lượng: {item.amount}</div>
            {canViewDetails && (
              <div className="product-actions" style={{ marginTop: '8px' }}>
                <ActionButton
                  className="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDetailsOrder(orderId)
                  }}
                  style={{
                    minWidth: 'auto',
                    padding: '6px 12px',
                    fontSize: '12px',
                    height: 'auto'
                  }}
                >
                  <EyeOutlined />
                  Xem chi tiết đơn
                </ActionButton>
              </div>
            )}
          </div>
          <div className="product-price">
            <div className="price-value">{convertPrice(item.price * item.amount)}</div>
            <div className="price-unit">{convertPrice(item.price)} x {item.amount}</div>
          </div>
        </WrapperProductItem>
      )
    })
  }

  const renderOrderActions = (order) => {
    const status = order.status || 'pending'
    const shippingStatus = order.shippingStatus
    const actions = []

    const isReturnFlow = status === 'return_requested' || order.hasSupportRequest

    // Yêu cầu trả hàng đang chờ duyệt: chỉ cho xem chi tiết (ẩn các hành động hoàn tất)
    if (isReturnFlow) {
      actions.push(
        <ActionButton
          key="view-details"
          className="secondary"
          onClick={() => handleDetailsOrder(order._id)}
        >
          <EyeOutlined />
          Xem chi tiết
        </ActionButton>
      )
      return actions
    }

    // 1. TAB "Chờ xác nhận" - Order Status = "pending"
    // Nút: Xem chi tiết, Hủy đơn
    if (status === 'pending') {
      actions.push(
        <ActionButton
          key="view-details"
          className="secondary"
          onClick={() => handleDetailsOrder(order._id)}
        >
          <EyeOutlined />
          Xem chi tiết
        </ActionButton>,
        <ActionButton
          key="cancel"
          className="danger"
          onClick={() => handleCancelOrder(order)}
          disabled={isPendingCancel}
        >
          <CloseCircleOutlined />
          Hủy đơn
        </ActionButton>
      )
    }

    if (status === 'pending_payment') {
      actions.push(
        <ActionButton
          key="pay-now"
          className="success"
          onClick={() => handleDetailsOrder(order._id, { autoOpenPayment: true })}
        >
          <CreditCardOutlined />
          Thanh toán ngay
        </ActionButton>,
        <ActionButton
          key="view-details"
          className="secondary"
          onClick={() => handleDetailsOrder(order._id)}
        >
          <EyeOutlined />
          Xem chi tiết
        </ActionButton>,
        <ActionButton
          key="cancel"
          className="danger"
          onClick={() => handleCancelOrder(order)}
          disabled={isPendingCancel}
        >
          <CloseCircleOutlined />
          Hủy đơn
        </ActionButton>
      )
    }

    // 2. TAB "Chờ lấy hàng"
    if (
      status === 'confirmed' ||
      status === 'processing' ||
      shippingStatus === 'pending' ||
      shippingStatus === 'ready_to_pick' ||
      shippingStatus === 'waiting_pickup'
    ) {
      actions.push(
        <ActionButton
          key="view-details"
          className="secondary"
          onClick={() => handleDetailsOrder(order._id)}
        >
          <EyeOutlined />
          Xem chi tiết
        </ActionButton>
      )
    }

    // 3. TAB "Đang giao"
    if (
      status === 'shipped' ||
      ['picked_up', 'in_transit', 'out_for_delivery', 'shipping'].includes(shippingStatus)
    ) {
      actions.push(
        <ActionButton
          key="view-details"
          className="secondary"
          onClick={() => handleDetailsOrder(order._id)}
        >
          <EyeOutlined />
          Xem chi tiết
        </ActionButton>
      )
    }

    // 4. TAB "Đã giao / Hoàn thành" - Order Status = "delivered" OR "completed"
    if (status === 'delivered' || status === 'completed') {
      // Luôn cho phép xem chi tiết
      actions.push(
        <ActionButton
          key="view-details"
          className="secondary"
          onClick={() => handleDetailsOrder(order._id)}
        >
          <EyeOutlined />
          Xem chi tiết
        </ActionButton>
      )

      // Tính toán xem đơn hàng đã quá 7 ngày chưa (để xử lý UI cho trường hợp delivered nhưng quá hạn)
      const deliveredHistory = order.statusHistory?.filter(h => h.status === 'delivered').sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))[0]
      const deliveredDate = deliveredHistory?.changedAt || order.deliveredAt || order.updatedAt
      const diffDays = deliveredDate ? Math.floor((new Date() - new Date(deliveredDate)) / (1000 * 60 * 60 * 24)) : 0
      const isTooOldToReturn = diffDays >= 7

      // NÚT TRẢ HÀNG: Chỉ hiện nếu đơn chưa quá hạn 7 ngày và chưa có yêu cầu trả hàng
      if (!isTooOldToReturn && !order.hasSupportRequest && order.canReturn) {
        actions.push(
          <ActionButton
            key="return"
            className="secondary"
            onClick={() => {
              setCurrentReturnOrder(order)
              setReturnRequestModalVisible(true)
            }}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            <UndoOutlined />
            Trả hàng
          </ActionButton>
        )
      }

      // TRƯỜNG HỢP: Đã giao nhưng CHƯA quá 7 ngày -> Hiện nút xác nhận nhận hàng
      if (status === 'delivered' && !isTooOldToReturn) {
        actions.push(
          <ActionButton
            key="confirm-received"
            className="success"
            onClick={() => handleConfirmReceived(order)}
            disabled={mutationConfirmReceived.isPending}
          >
            <CheckCircleOutlined />
            Đã nhận hàng
          </ActionButton>
        )
      }

      // TRƯỜNG HỢP: Đã hoàn thành (completed) HOẶC Đã giao nhưng quá 7 ngày
      if (status === 'completed' || (status === 'delivered' && isTooOldToReturn)) {
        // NÚT MUA LẠI: Luôn hiện
        actions.push(
          <ActionButton
            key="buy-again"
            className="secondary"
            onClick={() => handleBuyAgain(order)}
          >
            <ReloadOutlined />
            Mua lại
          </ActionButton>
        )

        // NÚT ĐÁNH GIÁ: Chỉ hiện nếu chưa đánh giá hết
        if (!order.allItemsReviewed) {
          actions.push(
            <ActionButton
              key="review"
              className="primary"
              onClick={() => handleReview(order)}
            >
              <StarOutlined />
              Đánh giá
            </ActionButton>
          )
        }
      }
    }

    // 6. TAB "Đã hủy" - Order Status = "cancelled"
    if (status === 'cancelled' || order.isCancelled) {
      actions.push(
        <ActionButton
          key="view-details"
          className="secondary"
          onClick={() => handleDetailsOrder(order._id, { showCancelDetails: status === 'cancelled' || order.isCancelled })}
        >
          <EyeOutlined />
          {status === 'cancelled' || order.isCancelled ? 'Xem chi tiết đơn hủy' : 'Xem chi tiết'}
        </ActionButton>,
        <ActionButton
          key="buy-again"
          className="secondary"
          onClick={() => handleBuyAgain(order)}
        >
          <ReloadOutlined />
          Mua lại
        </ActionButton>
      )
    }

    // 7. TAB "Trả hàng / Hoàn hàng" - Shipping Status = "returned" OR Order Status = "refunded"
    // Nút: Xem chi tiết, Mua lại
    if (shippingStatus === 'returned' || status === 'refunded' || order.isRefunded) {
      actions.push(
        <ActionButton
          key="view-details"
          className="secondary"
          onClick={() => handleDetailsOrder(order._id)}
        >
          <EyeOutlined />
          Xem chi tiết
        </ActionButton>,
        <ActionButton
          key="buy-again"
          className="secondary"
          onClick={() => handleBuyAgain(order)}
        >
          <ReloadOutlined />
          Mua lại
        </ActionButton>
      )
    }

    // Tracking button (chỉ khi đủ điều kiện hiển thị)
    if (canViewTracking(order)) {
      actions.push(
        <ActionButton
          key="track"
          className="primary"
          onClick={() => {
            setCurrentTrackingOrder(order)
            setTrackingModalVisible(true)
          }}
        >
          <TruckOutlined />
          Theo dõi đơn hàng
        </ActionButton>
      )
    }

    const uniqueActions = []
    const seenKeys = new Set()
    actions.forEach((action) => {
      const k = action?.key
      if (!k || !seenKeys.has(k)) {
        if (k) seenKeys.add(k)
        uniqueActions.push(action)
      }
    })

    return uniqueActions
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  // =================== TRẠNG THÁI HIỂN THỊ DUY NHẤT ===================
  const getMainStatus = (order) => {
    if (!order) return { text: "Đang xử lý", className: "processing" };

    const orderStatus = order.status;
    const shippingStatus = order.shippingStatus;

    // 1. Trả hàng → Ưu tiên cao nhất
    if (orderStatus === "refunded" || orderStatus === "return_requested" || shippingStatus === "returned") {
      return { text: "Đã trả hàng", className: "returned" };
    }

    // 2. Đã giao / Hoàn thành
    if (orderStatus === "delivered" || orderStatus === "completed" || shippingStatus === "delivered") {
      return { text: "Đã giao hàng", className: "delivered" };
    }

    // 3. Đang vận chuyển
    if (shippingStatus) {
      return {
        text: getShippingStatusLabel(shippingStatus),
        className: shippingStatus
      };
    }

    // 4. Fallback về order.status
    return {
      text: getStatusLabel(orderStatus),
      className: orderStatus
    };
  };

  if (!userId || !token) {
    return (
      <WrapperMyOrderContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 0' }}>
        <Card style={{ width: '600px', borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
          <ClockCircleOutlined style={{ fontSize: '64px', color: WALKZY_BLUE, marginBottom: '24px' }} />
          <h2 style={{ marginBottom: '16px' }}>Đơn hàng của tôi</h2>
          <p style={{ color: '#666', marginBottom: '32px' }}>Vui lòng đăng nhập để xem lịch sử mua hàng và theo dõi các đơn hàng của bạn</p>
          <Button
            type="primary"
            size="large"
            style={{ borderRadius: '10px', height: 'auto', padding: '12px 48px', fontWeight: 600, background: WALKZY_BLUE, border: 'none' }}
            onClick={() => navigate('/sign-in', { state: { from: '/my-order' } })}
          >
            Đăng nhập ngay
          </Button>
        </Card>
      </WrapperMyOrderContainer>
    )
  }

  return (
    <Loading isPending={isPending || isPendingCancel || isPendingConfirm || isPendingReturn}>
      <WrapperMyOrderContainer>
        <div className="my-order-content">
          <div className="page-header">
            <h2 className="page-title">
              <ShoppingCartOutlined style={{ color: WALKZY_BLUE, fontSize: 28 }} />
              Đơn hàng của tôi
            </h2>
          </div>

          <WrapperTabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems.map(tab => {
              // Tab "Trả hàng / Hoàn hàng" hiển thị support requests
              if (tab.key === 'returned') {
                return {
                  key: tab.key,
                  label: tab.label,
                  children: <ReturnRequestList
                    supportRequests={supportRequests}
                    onViewOrder={(orderId) => handleDetailsOrder(orderId)}
                  />
                }
              }

              // Các tab khác hiển thị orders
              const tabFilteredOrders = filterOrdersByStatus(
                displayOrders,
                tab.key
              )
              return {
                key: tab.key,
                label: tab.label,
                children: tabFilteredOrders.length > 0 ? (
                  <WrapperListOrder>
                    {tabFilteredOrders.map((order) => {
                      const mainStatus = getMainStatus(order);

                      return (
                        <WrapperItemOrder key={order._id}>
                          <WrapperOrderHeader>
                            <div className="order-info">
                              <div className="order-id">
                                <span className="order-id-label">Mã đơn:</span>
                                <span>{order._id?.slice(-8).toUpperCase()}</span>
                              </div>
                              <div className="order-date">{formatDate(order.createdAt)}</div>
                            </div>

                            <div className="order-status">
                              <StatusBadge className={mainStatus.className}>
                                {mainStatus.text}
                              </StatusBadge>
                            </div>
                          </WrapperOrderHeader>

                          {order.status === 'pending_payment' && order.paymentExpiredAt && (
                            <div style={{
                              padding: '12px 20px',
                              background: '#fffcf5',
                              borderBottom: '1px solid #fff1b8',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxShadow: 'inset 0 -1px 0 rgba(255, 241, 184, 0.5)'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: '#856404',
                                fontSize: '14px',
                                fontWeight: 500
                              }}>
                                <ClockCircleOutlined style={{ fontSize: '16px' }} />
                                <span>Vui lòng thanh toán để tránh đơn hàng bị hủy tự động</span>
                              </div>
                              <CountdownTimer expiryDate={order.paymentExpiredAt} />
                            </div>
                          )}

                          <WrapperProductsList>
                            {renderProduct(order.orderItems, order.status, order._id)}
                          </WrapperProductsList>

                          <WrapperOrderFooter>
                            <div className="total-section">
                              <span className="total-label">Tổng tiền:</span>
                              <span className="total-price">{convertPrice(order.totalPrice)}</span>
                            </div>
                            <div className="action-buttons">
                              {renderOrderActions(order)}
                            </div>
                          </WrapperOrderFooter>
                        </WrapperItemOrder>
                      );
                    })}
                  </WrapperListOrder>
                ) : (
                  <WrapperEmptyState>
                    <ShoppingCartOutlined className="empty-icon" />
                    <div className="empty-text">
                      {tab.key === 'all'
                        ? 'Chưa có đơn hàng nào'
                        : `Chưa có đơn hàng ${tab.label.split('(')[0].trim()}`}
                    </div>
                    <ButtonComponent
                      onClick={() => navigate('/product')}
                      textbutton="Tiếp tục mua sắm"
                      styleButton={{
                        background: WALKZY_BLUE,
                        height: 48,
                        width: 'auto',
                        border: 'none',
                        borderRadius: 12,
                        padding: '0 32px'
                      }}
                      styletextbutton={{
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600
                      }}
                    />
                  </WrapperEmptyState>
                )
              }
            })}
            size="large"
          />
        </div>
      </WrapperMyOrderContainer>

      {/* Review Modal */}
      {currentReviewItem && currentReviewOrder && reviewModalVisible && (
        <ReviewForm
          visible={reviewModalVisible}
          onCancel={handleReviewCancel}
          onSuccess={handleReviewSuccess}
          orderItem={{
            productId: currentReviewItem.productId || currentReviewItem.product,
            product: currentReviewItem.productId || currentReviewItem.product,
            productName: currentReviewItem.productName || currentReviewItem.name,
            image: currentReviewItem.image,
            variation: currentReviewItem.variation || {}
          }}
          orderId={currentReviewOrder._id}
        />
      )}

      {/* Tracking Modal */}
      <ModalComponent
        title="Theo dõi đơn hàng"
        open={trackingModalVisible}
        onCancel={() => {
          setTrackingModalVisible(false)
          setCurrentTrackingOrder(null)
        }}
        footer={null}
        width={800}
      >
        {currentTrackingOrder && (
          <OrderTracking
            order={currentTrackingOrder}
            shippingOrder={currentTrackingOrder.shippingOrder}
          />
        )}
      </ModalComponent>

      {/* Return Request Modal */}
      <ReturnRequestModal
        visible={returnRequestModalVisible}
        onCancel={() => {
          setReturnRequestModalVisible(false)
          setCurrentReturnOrder(null)
        }}
        orderId={currentReturnOrder?._id}
        onSuccess={() => {
          queryClient.invalidateQueries(['orders'])
          queryClient.invalidateQueries(['support-requests'])
        }}
        onSwitchTab={(tab) => {
          setActiveTab(tab)
        }}
      />

      {/* Cancel Order Modal */}
      <Modal
        title="Hủy đơn hàng"
        open={cancelModalVisible}
        onCancel={handleCancelModalCancel}
        width={450}
        footer={[
          <button
            key="back"
            onClick={handleCancelModalCancel}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: '1px solid #d9d9d9',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Để lại
          </button>,
          <button
            key="submit"
            onClick={handleConfirmCancel}
            disabled={isPendingCancel || (!selectedCancelReason && !cancelReasonInput)}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: WALKZY_BLUE,
              color: '#fff',
              cursor: isPendingCancel || (!selectedCancelReason && !cancelReasonInput) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: isPendingCancel || (!selectedCancelReason && !cancelReasonInput) ? 0.6 : 1,
              marginLeft: '8px'
            }}
          >
            {isPendingCancel ? 'Đang xử lý...' : 'Xác nhận hủy'}
          </button>
        ]}
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ marginBottom: '12px', fontWeight: '500', fontSize: '14px' }}>
            Vui lòng chọn lý do hủy đơn hàng:
          </p>
          <Radio.Group
            value={selectedCancelReason}
            onChange={(e) => {
              setSelectedCancelReason(e.target.value)
              if (e.target.value !== 'Lý do khác') {
                setCancelReasonInput('')
              }
            }}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {CANCEL_REASONS.map((reason) => (
                <Radio key={reason} value={reason} style={{ fontSize: '14px' }}>
                  {reason}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {selectedCancelReason === 'Lý do khác' && (
          <div style={{ marginTop: '12px' }}>
            <Input.TextArea
              placeholder="Nhập lý do hủy của bạn..."
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              rows={3}
              maxLength={200}
              style={{ fontSize: '14px' }}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {cancelReasonInput.length}/200
            </div>
          </div>
        )}
      </Modal>
    </Loading>
  )
}

export default MyOrderPage
