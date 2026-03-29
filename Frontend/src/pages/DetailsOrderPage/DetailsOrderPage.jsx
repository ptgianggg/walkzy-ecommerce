import React, { useMemo, useState, useEffect } from 'react'
import { WrapperLabel } from '../Profile/style'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import logo from '../../assets/images/Admin.jpg'
import {
    WrapperHeaderUser,
    WrapperInfoUser,
    WrapperContentInfo,
    WrapperStyleContent,
    WrapperItemLabel,
    WrapperProduct,
    WrapperNameProduct,
    WrapperItem,
    WrapperAllPrice
} from './style'
import * as OrderService from '../../services/OrderService'
import * as ReviewService from '../../services/ReviewService'
import * as ShippingService from '../../services/ShippingService'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { orderContant } from '../../contant'
import { convertPrice } from '../../utils'
import Loading from '../../components/LoadingComponent/Loading'
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent'
import ReviewForm from '../../components/ReviewForm/ReviewForm'
import ShippingTracking from '../../components/ShippingTracking/ShippingTracking'
import { useSelector } from 'react-redux'
import { useMutationHooks } from '../../hooks/useMutationHook'
import * as message from '../../components/Message/Message'
import { Tag } from 'antd'
import { LeftOutlined, CreditCardOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import * as PaymentService from '../../services/PaymentService'

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
        <div style={{ color: '#ee4d2d', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ClockCircleOutlined />
            <span>Hết hạn sau: {timeLeft}</span>
        </div>
    )
}


const DetailsOrderPage = () => {
    const params = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { state } = location
    const { id } = params
    const user = useSelector((state) => state?.user)
    const [reviewModalVisible, setReviewModalVisible] = useState(false)
    const [selectedOrderItem, setSelectedOrderItem] = useState(null)
    const [sdkReady, setSdkReady] = useState(false)
    const [isMoMoLoading, setIsMoMoLoading] = useState(false)
    const queryClient = useQueryClient()


    const fetchDetailsOrder = async () => {
        const res = await OrderService.getDetailsOrder(id, state?.token || user?.access_token)
        return res.data
    }

    const queryOrder = useQuery({
        queryKey: ['orders-details', id],
        queryFn: fetchDetailsOrder,
        enabled: Boolean(id && (state?.token || user?.access_token)),
    })

    const { isPending, data } = queryOrder

    // Fetch shipping order
    const { data: shippingOrderData } = useQuery({
        queryKey: ['shipping-order', id],
        queryFn: () => ShippingService.getShippingOrderByOrderId(id, state?.token || user?.access_token),
        enabled: Boolean(id && (state?.token || user?.access_token) && data?._id),
    })

    // Check if can review - allow for both delivered and completed
    const { data: canReviewData } = useQuery({
        queryKey: ['can-review', id],
        queryFn: () => ReviewService.canReviewOrder(id, user?.access_token),
        enabled: Boolean(id && user?.access_token && (data?.status === 'delivered' || data?.status === 'completed'))
    })

    // Request return mutation
    const requestReturnMutation = useMutationHooks(
        (data) => {
            const { orderId, reason } = data
            return OrderService.updateOrderStatus(orderId, 'return_requested', reason || 'Yêu cầu trả hàng', user?.access_token)
        }
    )

    const mutationPayOrder = useMutationHooks(
        (data) => {
            const { id, token, ...rests } = data
            return OrderService.payOrder(id, token, rests)
        }
    )

    const addPaypalScript = async () => {
        const { data } = await PaymentService.getConfig()
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = `https://www.paypal.com/sdk/js?client-id=${data}`
        script.async = true;
        script.onload = () => {
            setSdkReady(true)
        }
        document.body.appendChild(script)
    }

    useEffect(() => {
        if (!window.paypal) {
            addPaypalScript()
        } else {
            setSdkReady(true)
        }
    }, [])

    useEffect(() => {
        if (state?.autoOpenPayment && data?.status === 'pending_payment' && sdkReady) {
            setTimeout(() => {
                const paypalContainer = document.getElementById('paypal-button-container');
                if (paypalContainer) {
                    paypalContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }, [state?.autoOpenPayment, data?.status, sdkReady]);

    const priceMemo = useMemo(() => {
        const result = data?.orderItems?.reduce((total, cur) => {
            return total + ((cur.price * cur.amount))
        }, 0)
        return result
    }, [data])

    useEffect(() => {
        if (requestReturnMutation.isSuccess && requestReturnMutation.data?.status === 'OK') {
            message.success('Yêu cầu trả hàng đã được gửi. Chúng tôi sẽ xử lý trong thời gian sớm nhất.')
            queryOrder.refetch()
        } else if (requestReturnMutation.isError || requestReturnMutation.data?.status === 'ERR') {
            message.error(requestReturnMutation.data?.message || 'Gửi yêu cầu trả hàng thất bại!')
        }
    }, [requestReturnMutation.isSuccess, requestReturnMutation.isError, requestReturnMutation.data])

    const handleRequestReturn = () => {
        const reason = window.prompt('Vui lòng nhập lý do trả hàng:')
        if (!reason || reason.trim() === '') {
            message.warning('Vui lòng nhập lý do trả hàng')
            return
        }
        requestReturnMutation.mutate({ orderId: id, reason: reason.trim() })
    }

    const handleBuyAgain = () => {
        // Lấy sản phẩm đầu tiên trong order để navigate đến trang chi tiết
        if (data?.orderItems && data.orderItems.length > 0) {
            const firstProduct = data.orderItems[0]
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

    const handleReview = () => {
        if (unreviewedItems.length > 0) {
            setReviewModalVisible(true)
            setSelectedOrderItem({
                productId: unreviewedItems[0].product,
                productName: unreviewedItems[0].name,
                image: unreviewedItems[0].image,
                variation: unreviewedItems[0].variation
            })
        }
    }

    const handleReviewClick = (orderItem) => {
        setSelectedOrderItem({
            productId: orderItem.product,
            productName: orderItem.name,
            image: orderItem.image,
            variation: orderItem.variation
        })
        setReviewModalVisible(true)
    }

    const handleReviewSuccess = () => {
        setReviewModalVisible(false)
        setSelectedOrderItem(null)
        // Refetch can review data
        queryOrder.refetch()
    }

    const onSuccessPaypal = (details) => {
        mutationPayOrder.mutate(
            {
                id: id,
                token: user?.access_token,
                paidAt: details.update_time,
                paymentTransactionId: details.id
            },
            {
                onSuccess: (responseData) => {
                    if (responseData?.status === 'OK') {
                        message.success('Thanh toán thành công')

                        // Chuyển sang trang OrderSuccess với dữ liệu tương tự như khi đặt hàng mới
                        const orderSuccessState = {
                            payment: 'paypal',
                            delivery: data?.shippingMethod || 'fast',
                            orders: data?.orderItems?.map(item => ({
                                ...item,
                                product: item.product?._id || item.product
                            })) || [],
                            totalPrice: data?.totalPrice,
                            shippingRateName: data?.shippingRate?.name,
                            shippingProvider: data?.shippingProvider?.name,
                            orderId: data?._id,
                            estimatedDeliveryDate: data?.shippingOrder?.estimated_delivery_time
                        }

                        navigate('/orderSuccess', { state: orderSuccessState })
                    } else {
                        message.error(responseData?.message || 'Xác nhận thanh toán thất bại')
                    }
                },
                onError: (error) => {
                    message.error('Lỗi xác nhận thanh toán: ' + (error?.message || 'Unknown error'))
                }
            }
        )
    }

    const handleMoMoPayment = async () => {
        setIsMoMoLoading(true)
        try {
            // Lưu orderId vào sessionStorage để handle ở return page
            sessionStorage.setItem('momo_temp_orderId', id);

            const paymentData = {
                amount: data?.totalPrice,
                orderInfo: `pay_order_${id}`,
                redirectUrl: `${window.location.origin}/payment/momo/return`,
                ipnUrl: `${process.env.REACT_APP_API_URL}/payment/momo/ipn`,
                orderId: `MOMO_${id}_${new Date().getTime()}`
            }

            const paymentResult = await PaymentService.createMoMoPayment(paymentData)

            if (paymentResult?.status === 'OK' && paymentResult?.data?.payUrl) {
                window.location.href = paymentResult.data.payUrl
            } else {
                message.error(paymentResult?.message || 'Không thể tạo link thanh toán MoMo')
            }
        } catch (error) {
            console.error('MoMo Payment Error:', error)
            message.error('Có lỗi xảy ra khi thanh toán MoMo')
        } finally {
            setIsMoMoLoading(false)
        }
    }


    if (isPending || !data) {
        return <Loading isPending={true} />
    }

    const reviewedProductIds = canReviewData?.data?.reviewedProducts || []
    const unreviewedItems = canReviewData?.data?.unreviewedItems || []

    // If requested to show only cancel details (from "Đã hủy" tab), render a focused cancel-only view
    if (state?.showCancelDetails) {
        return (
            <Loading isPending={isPending}>
                <div style={{ maxWidth: '720px', margin: '60px auto', padding: '0 20px' }}>
                    <div style={{ padding: '28px', background: '#fff', borderRadius: 12, border: '1px solid #ffd6d6', boxShadow: '0 6px 22px rgba(0,0,0,0.06)' }}>
                        <h2 style={{ fontSize: 22, color: '#d32f2f', margin: 0 }}>Thông tin hủy đơn</h2>
                        <div style={{ marginTop: 16, fontSize: 18, color: '#333' }}><strong>Lý do hủy: </strong>{data?.cancelReason || 'Không có'}</div>
                        {data?.cancelledAt && (<div style={{ marginTop: 8, fontSize: 16, color: '#333' }}><strong>Thời gian hủy: </strong>{new Date(data.cancelledAt).toLocaleString('vi-VN')}</div>)}
                        {data?.cancelledBy && (<div style={{ marginTop: 8, fontSize: 16, color: '#333' }}><strong>Hủy bởi: </strong>{data.cancelledBy.name || data.cancelledBy.email || data.cancelledBy}</div>)}

                        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <ButtonComponent
                                onClick={() => navigate(-1)}
                                size={40}
                                styleButton={{
                                    height: 44,
                                    borderRadius: 10,
                                    padding: '0 20px',
                                    background: '#1a94ff',
                                    border: '2px solid #1a94ff',
                                    boxShadow: '0 8px 24px rgba(26,148,255,0.18)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 10
                                }}
                                textbutton={'Quay lại'}
                                styletextbutton={{ color: '#fff', fontWeight: 700, fontSize: 14 }}
                                icon={<LeftOutlined style={{ color: '#fff', fontSize: 16 }} />}
                            />
                        </div>
                    </div>
                </div>
            </Loading>
        )
    }
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
            returned: 'Đã trả hàng'
        }
        return statusMap[status] || status
    }

    const getStatusColor = (status) => {
        const colorMap = {
            completed: 'green',
            delivered: 'green',
            returned: 'volcano',
            refunded: 'orange',
            cancelled: 'red',
            shipped: 'purple',
            processing: 'cyan',
            confirmed: 'blue',
            pending: 'orange',
            pending_payment: 'red'
        }
        return colorMap[status] || 'orange'
    }

    return (
        <Loading isPending={isPending}>
            <div style={{ width: '100%', background: 'linear-gradient(to bottom, #f8f9fa 0%, #f5f5f5 100%)', minHeight: '100vh', padding: '20px 0 40px' }}>
                <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Chi tiết đơn hàng
                        </h2>
                        {data?._id && (
                            <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>
                                Mã đơn: {data._id.slice(-8).toUpperCase()}
                            </span>
                        )}

                        {/* If the order is cancelled and NOT in 'show only cancel details' mode, show small inline cancel details */}
                        {(data?.status === 'cancelled' && !state?.showCancelDetails) && (
                            <div style={{ marginTop: 12, padding: '12px', background: '#fff5f5', border: '1px solid #ffd6d6', borderRadius: 8 }}>
                                <div style={{ fontWeight: 700, color: '#d32f2f', marginBottom: 8 }}>Thông tin hủy đơn</div>
                                <div style={{ color: '#333', marginBottom: 6 }}><strong>Lý do hủy: </strong>{data?.cancelReason || 'Không có'}</div>
                                {data?.cancelledAt && (
                                    <div style={{ color: '#333', marginBottom: 6 }}><strong>Thời gian hủy: </strong>{new Date(data.cancelledAt).toLocaleString('vi-VN')}</div>
                                )}
                                {data?.cancelledBy && (
                                    <div style={{ color: '#333' }}><strong>Hủy bởi: </strong>{data.cancelledBy.name || data.cancelledBy.email || data.cancelledBy}</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Countdown Timer for Pending Payment */}
                    {data?.status === 'pending_payment' && data?.paymentExpiredAt && (
                        <div style={{
                            marginBottom: '24px',
                            padding: '16px 20px',
                            background: '#fffcf5',
                            borderRadius: '12px',
                            border: '1px solid #fff1b8',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ color: '#856404', fontSize: '15px' }}>
                                Vui lòng hoàn tất thanh toán trước <strong>{new Date(data.paymentExpiredAt).toLocaleString('vi-VN')}</strong> để tránh đơn hàng bị hủy tự động.
                            </div>
                            <CountdownTimer expiryDate={data.paymentExpiredAt} />
                        </div>
                    )}

                    {/* Shipping Tracking */}
                    {shippingOrderData?.data?.data && (
                        <div style={{ marginBottom: '24px' }}>
                            <ShippingTracking
                                shippingOrder={shippingOrderData.data.data}
                                order={data}
                            />
                        </div>
                    )}

                    <WrapperHeaderUser>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <WrapperInfoUser>
                                <WrapperLabel>Địa chỉ người nhận</WrapperLabel>
                                <WrapperContentInfo>
                                    <div className='name-info'>{data?.shippingAddress?.fullName}</div>
                                    <div className='address-info'><span>Địa chỉ: </span>{`${data?.shippingAddress?.address} ${data?.shippingAddress?.city}`}</div>
                                    <div className='phone-info'><span>Điện thoại: </span>{data?.shippingAddress?.phone}</div>
                                </WrapperContentInfo>
                            </WrapperInfoUser>

                            <WrapperInfoUser>
                                <WrapperLabel>Hình thức giao hàng</WrapperLabel>
                                <WrapperContentInfo>
                                    <div className='delivery-info'>
                                        <span className='name-delivery'>
                                            {data?.shippingRate?.name || 'Chưa xác định'}
                                        </span>
                                        {data?.shippingProvider?.name && (
                                            <span style={{ marginLeft: '8px', color: '#666', fontSize: '13px' }}>
                                                - {data.shippingProvider.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className='delivery-fee'>
                                        <span>Phí giao hàng: </span>
                                        {data?.shippingPrice === 0 ? (
                                            <span style={{ color: '#52c41a', fontWeight: 600 }}>Miễn phí</span>
                                        ) : (
                                            convertPrice(data?.shippingPrice || 0)
                                        )}
                                    </div>
                                    {data?.shippingRate?.estimatedDays && (
                                        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                            Dự kiến: {data.shippingRate.estimatedDays.min}-{data.shippingRate.estimatedDays.max} ngày
                                        </div>
                                    )}
                                </WrapperContentInfo>
                            </WrapperInfoUser>

                            <WrapperInfoUser>
                                <WrapperLabel>Phương thức thanh toán</WrapperLabel>
                                <WrapperContentInfo>
                                    <div className='payment-info'>{orderContant[data?.paymentMethod]}</div>
                                    <div className='status-payment'>
                                        <Tag color={data?.isPaid ? 'green' : (data?.status === 'pending_payment' ? 'red' : 'orange')}>
                                            {data?.isPaid ? 'Đã thanh toán' : (data?.status === 'pending_payment' ? 'Chờ thanh toán' : 'Chưa thanh toán')}
                                        </Tag>
                                    </div>
                                    {data?.status === 'pending_payment' && data?.paymentMethod === 'paypal' && sdkReady && (
                                        <div id="paypal-button-container" style={{ marginTop: '16px' }}>
                                            <PayPalScriptProvider options={{ "client-id": "AXLsj5MvqdYyJjlDP2D90yIBJn4vVbZU17xz_BwzbjP8G2_ajmNNUDwwJyLc7xa5gBcFY_Ow_fWOnQIX" }}>
                                                <PayPalButtons
                                                    createOrder={(dataPaypal, actions) => {
                                                        return actions.order.create({
                                                            purchase_units: [
                                                                {
                                                                    amount: {
                                                                        value: (data?.totalPrice / 3000).toFixed(2)
                                                                    }
                                                                }
                                                            ]
                                                        });
                                                    }}
                                                    onApprove={(dataPaypal, actions) => {
                                                        return actions.order.capture().then((details) => {
                                                            onSuccessPaypal(details);
                                                        });
                                                    }}
                                                    onError={() => {
                                                        message.error('Có lỗi xảy ra khi thanh toán PayPal')
                                                    }}
                                                />
                                            </PayPalScriptProvider>
                                        </div>
                                    )}
                                    {data?.status === 'pending_payment' && data?.paymentMethod === 'momo' && (
                                        <div style={{ marginTop: '16px' }}>
                                            <ButtonComponent
                                                onClick={handleMoMoPayment}
                                                size={40}
                                                loading={isMoMoLoading}
                                                styleButton={{
                                                    height: '48px',
                                                    width: '100%',
                                                    background: '#A50064',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(165, 0, 100, 0.2)'
                                                }}
                                                textbutton={'Thanh toán lại bằng MoMo'}
                                                styletextbutton={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}
                                            />
                                        </div>
                                    )}
                                </WrapperContentInfo>
                            </WrapperInfoUser>
                        </div>

                        <WrapperStyleContent>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px',
                                background: '#fafafa',
                                borderRadius: '8px 8px 0 0',
                                borderBottom: '2px solid #e8e8e8',
                                fontWeight: 600,
                                fontSize: '15px',
                                color: '#1a1a1a'
                            }}>
                                <div style={{ flex: '2', minWidth: '300px' }}>Sản phẩm</div>
                                <div style={{ flex: '1', textAlign: 'center' }}>Giá</div>
                                <div style={{ flex: '1', textAlign: 'center' }}>Số lượng</div>
                                <div style={{ flex: '1', textAlign: 'center' }}>Thành tiền</div>
                                {(data?.status === 'delivered' || data?.status === 'completed') && (
                                    <div style={{ flex: '1', textAlign: 'center' }}>Đánh giá</div>
                                )}
                            </div>

                            {data?.orderItems?.map((order, index) => {
                                const isReviewed = reviewedProductIds.includes(order.product.toString())
                                const canReview = (data?.status === 'delivered' || data?.status === 'completed') && !isReviewed

                                return (
                                    <WrapperProduct key={index} style={{
                                        padding: '16px',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background 0.2s ease'
                                    }}>
                                        <WrapperNameProduct style={{ flex: '2', minWidth: '300px' }}>
                                            <img
                                                src={order?.image}
                                                onClick={() => navigate(`/product-details/${order.product}`)}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    objectFit: 'cover',
                                                    border: '1px solid #e8e8e8',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                            />
                                            <div style={{
                                                marginLeft: '12px',
                                                flex: 1,
                                                minWidth: 0
                                            }}>
                                                <div
                                                    onClick={() => navigate(`/product-details/${order.product}`)}
                                                    style={{
                                                        fontSize: '15px',
                                                        fontWeight: 500,
                                                        color: '#1a1a1a',
                                                        marginBottom: '8px',
                                                        cursor: 'pointer',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        lineHeight: '1.4'
                                                    }}
                                                >
                                                    {order?.name}
                                                </div>
                                                {order?.variation && (
                                                    <div style={{ fontSize: '13px', color: '#666', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                        {order.variation.color && (
                                                            <span>Màu: <strong>{Array.isArray(order.variation.color) ? order.variation.color[0] : order.variation.color}</strong></span>
                                                        )}
                                                        {order.variation.size && (
                                                            <span>Size: <strong>{Array.isArray(order.variation.size) ? order.variation.size[0] : order.variation.size}</strong></span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </WrapperNameProduct>

                                        <WrapperItem style={{ flex: '1', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>
                                            {convertPrice(order?.price)}
                                        </WrapperItem>
                                        <WrapperItem style={{ flex: '1', textAlign: 'center', fontSize: '15px' }}>
                                            {order?.amount}
                                        </WrapperItem>
                                        <WrapperItem style={{ flex: '1', textAlign: 'center', fontSize: '16px', fontWeight: 600, color: '#ee4d2d' }}>
                                            {convertPrice(order?.price * order?.amount)}
                                        </WrapperItem>

                                        {(data?.status === 'delivered' || data?.status === 'completed') && (
                                            <WrapperItem style={{ flex: '1', textAlign: 'center' }}>
                                                {isReviewed ? (
                                                    <Tag color="green">Đã đánh giá</Tag>
                                                ) : (
                                                    <ButtonComponent
                                                        onClick={() => handleReviewClick(order)}
                                                        size={40}
                                                        styleButton={{
                                                            height: '36px',
                                                            border: '2px solid #1a94ff',
                                                            borderRadius: '8px',
                                                            background: '#fff',
                                                            padding: '0 16px'
                                                        }}
                                                        textbutton={'Đánh giá'}
                                                        styletextbutton={{
                                                            color: '#1a94ff',
                                                            fontSize: '13px',
                                                            fontWeight: '600'
                                                        }}
                                                    />
                                                )}
                                            </WrapperItem>
                                        )}
                                    </WrapperProduct>
                                )
                            })}

                            <div style={{
                                padding: '20px',
                                background: '#fafafa',
                                borderRadius: '0 0 8px 8px',
                                borderTop: '2px solid #e8e8e8'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', fontSize: '15px', color: '#666' }}>
                                        <span>Tạm tính:</span>
                                        <span style={{ fontWeight: 500 }}>{convertPrice(priceMemo)}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', fontSize: '15px', color: '#666' }}>
                                        <span>Phí vận chuyển:</span>
                                        <span style={{ fontWeight: 500 }}>{convertPrice(data?.shippingPrice || 0)}</span>
                                    </div>
                                </div>
                                {data?.voucherDiscount && data.voucherDiscount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', fontSize: '15px', color: '#52c41a' }}>
                                            <span>Giảm giá (Voucher):</span>
                                            <span style={{ fontWeight: 500 }}>-{convertPrice(data.voucherDiscount)}</span>
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '2px solid #e8e8e8' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                                        <span>Tổng cộng:</span>
                                        <span style={{ color: '#ee4d2d', fontSize: '20px' }}>{convertPrice(data?.totalPrice || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </WrapperStyleContent>

                        {/* Action Buttons */}
                        <div style={{
                            marginTop: '24px',
                            padding: '20px',
                            background: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e8e8e8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                                        Trạng thái đơn hàng:
                                    </div>
                                    <Tag
                                        color={getStatusColor(data?.status)}
                                        style={{
                                            fontSize: '14px',
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontWeight: 600
                                        }}
                                    >
                                        {getStatusLabel(data?.status)}
                                    </Tag>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {(data?.status === 'delivered' || data?.status === 'completed') && (
                                        <>
                                            <ButtonComponent
                                                onClick={handleBuyAgain}
                                                size={40}
                                                styleButton={{
                                                    height: '44px',
                                                    border: '2px solid #1a94ff',
                                                    borderRadius: '8px',
                                                    background: '#fff',
                                                    padding: '0 24px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                textbutton={'Mua lại'}
                                                styletextbutton={{
                                                    color: '#1a94ff',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}
                                            />
                                            {unreviewedItems.length > 0 && (
                                                <ButtonComponent
                                                    onClick={handleReview}
                                                    size={40}
                                                    styleButton={{
                                                        height: '44px',
                                                        background: '#1a94ff',
                                                        borderRadius: '8px',
                                                        padding: '0 24px',
                                                        boxShadow: '0 2px 8px rgba(26, 148, 255, 0.3)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    textbutton={'Đánh giá sản phẩm'}
                                                    styletextbutton={{
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        fontWeight: '600'
                                                    }}
                                                />
                                            )}
                                            <ButtonComponent
                                                onClick={handleRequestReturn}
                                                size={40}
                                                styleButton={{
                                                    height: '44px',
                                                    border: '2px solid #ff4d4f',
                                                    borderRadius: '8px',
                                                    background: '#fff',
                                                    padding: '0 24px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                textbutton={'Trả hàng'}
                                                styletextbutton={{
                                                    color: '#ff4d4f',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}
                                                disabled={requestReturnMutation.isPending}
                                            />
                                        </>
                                    )}

                                    {data?.status === 'refunded' && (
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#666',
                                            padding: '12px 20px',
                                            background: '#fff7e6',
                                            borderRadius: '8px',
                                            border: '1px solid #ffd591',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span>⚠️</span>
                                            <span>Đơn hàng đang được xử lý trả hàng. Vui lòng chờ xác nhận từ shop.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </WrapperHeaderUser>
                </div>
            </div>

            {/* Review Modal */}
            {
                selectedOrderItem && (
                    <ReviewForm
                        orderItem={selectedOrderItem}
                        orderId={id}
                        visible={reviewModalVisible}
                        onCancel={() => {
                            setReviewModalVisible(false)
                            setSelectedOrderItem(null)
                        }}
                        onSuccess={handleReviewSuccess}
                    />
                )
            }
        </Loading>
    )
}

export default DetailsOrderPage
