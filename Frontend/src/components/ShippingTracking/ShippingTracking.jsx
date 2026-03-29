import React from 'react'
import { Steps, Card, Tag, Timeline, Empty } from 'antd'
import {
  WrapperTrackingContainer,
  WrapperTrackingHeader,
  WrapperTrackingContent,
  WrapperTrackingInfo,
  StatusStep,
  TimelineItem
} from './style'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  HomeOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'

const ShippingTracking = ({ shippingOrder, order }) => {
  if (!shippingOrder) {
    return (
      <Card>
        <Empty description="Chưa có thông tin vận chuyển" />
      </Card>
    )
  }

  const statusMap = {
    'pending': {
      label: 'Chờ xử lý',
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      step: 0
    },
    'picked_up': {
      label: 'Đã lấy hàng',
      icon: <TruckOutlined />,
      color: '#1890ff',
      step: 1
    },
    'in_transit': {
      label: 'Đang vận chuyển',
      icon: <TruckOutlined />,
      color: '#1890ff',
      step: 2
    },
    'out_for_delivery': {
      label: 'Đang giao hàng',
      icon: <TruckOutlined />,
      color: '#722ed1',
      step: 3
    },
    'delivered': {
      label: 'Đã giao hàng',
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      step: 4
    },
    'failed': {
      label: 'Giao thất bại',
      icon: <CloseCircleOutlined />,
      color: '#ff4d4f',
      step: -1
    },
    'returned': {
      label: 'Đã trả hàng',
      icon: <CloseCircleOutlined />,
      color: '#ff4d4f',
      step: -1
    },
    'cancelled': {
      label: 'Đã hủy',
      icon: <CloseCircleOutlined />,
      color: '#999',
      step: -1
    }
  }

  const currentStatus = shippingOrder.status || 'pending'
  const statusInfo = statusMap[currentStatus] || statusMap['pending']
  const currentStep = statusInfo.step

  // Tạo steps cho progress bar
  const steps = [
    {
      title: 'Chờ xử lý',
      description: 'Đơn hàng đang chờ xử lý',
      icon: <ClockCircleOutlined />
    },
    {
      title: 'Đã lấy hàng',
      description: 'Đơn vị vận chuyển đã lấy hàng',
      icon: <TruckOutlined />
    },
    {
      title: 'Đang vận chuyển',
      description: 'Hàng đang trên đường vận chuyển',
      icon: <TruckOutlined />
    },
    {
      title: 'Đang giao hàng',
      description: 'Shipper đang giao hàng đến bạn',
      icon: <TruckOutlined />
    },
    {
      title: 'Đã giao hàng',
      description: 'Đã giao hàng thành công',
      icon: <CheckCircleOutlined />
    }
  ]

  // Sắp xếp status history theo thời gian
  const sortedHistory = [...(shippingOrder.statusHistory || [])].sort((a, b) => {
    return new Date(b.changedAt) - new Date(a.changedAt)
  })

  // Format date
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const formatDateOnly = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <WrapperTrackingContainer>
      <WrapperTrackingHeader>
        <div className="header-title">
          <TruckOutlined style={{ fontSize: 24, marginRight: 12, color: '#1a94ff' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Theo dõi đơn hàng</h3>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>
              Mã đơn: {order?._id?.substring(0, 8) || 'N/A'}
            </p>
          </div>
        </div>
        <Tag color={statusInfo.color} style={{ fontSize: 14, padding: '4px 12px' }}>
          {statusInfo.icon} {statusInfo.label}
        </Tag>
      </WrapperTrackingHeader>

      <WrapperTrackingContent>
        {/* Progress Steps */}
        <Card title="Tiến trình vận chuyển" style={{ marginBottom: 20 }}>
          <Steps
            current={currentStep >= 0 ? currentStep : 0}
            status={currentStep === -1 ? 'error' : currentStep === 4 ? 'finish' : 'process'}
            items={steps.map((step, index) => ({
              title: step.title,
              description: step.description,
              icon: step.icon,
              status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait'
            }))}
          />
        </Card>

        {/* Tracking Info */}
        <WrapperTrackingInfo>
          <Card title="Thông tin vận chuyển" style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>Nhà vận chuyển</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {shippingOrder.provider?.name || 'N/A'}
                </div>
              </div>
              {shippingOrder.trackingNumber && (
                <div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>Mã vận đơn</div>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'monospace' }}>
                    {shippingOrder.trackingNumber}
                  </div>
                </div>
              )}
              {shippingOrder.estimatedDeliveryDate && (
                <div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>Dự kiến giao hàng</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {formatDateOnly(shippingOrder.estimatedDeliveryDate)}
                  </div>
                </div>
              )}
              {shippingOrder.actualDeliveryDate && (
                <div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>Ngày giao hàng</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#52c41a' }}>
                    {formatDate(shippingOrder.actualDeliveryDate)}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Shipping Address */}
          {shippingOrder.shippingAddress && (
            <Card title="Địa chỉ giao hàng" style={{ marginBottom: 20 }}>
              <div style={{ lineHeight: 1.8 }}>
                <div><strong>{shippingOrder.shippingAddress.fullName}</strong></div>
                <div>{shippingOrder.shippingAddress.address}</div>
                <div>{shippingOrder.shippingAddress.city}</div>
                <div>SĐT: {shippingOrder.shippingAddress.phone}</div>
              </div>
            </Card>
          )}

          {/* Status History Timeline */}
          {sortedHistory.length > 0 && (
            <Card title="Lịch sử cập nhật">
              <Timeline
                items={sortedHistory.map((historyItem, index) => {
                  const itemStatusInfo = statusMap[historyItem.status] || statusMap['pending']
                  return {
                    color: itemStatusInfo.color,
                    children: (
                      <TimelineItem>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                              {itemStatusInfo.icon} {itemStatusInfo.label}
                            </div>
                            {historyItem.note && (
                              <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                                {historyItem.note}
                              </div>
                            )}
                            {historyItem.location && (
                              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                                📍 {historyItem.location}
                              </div>
                            )}
                          </div>
                          <div style={{ color: '#999', fontSize: 12, marginLeft: 16 }}>
                            {formatDate(historyItem.changedAt)}
                          </div>
                        </div>
                      </TimelineItem>
                    )
                  }
                })}
              />
            </Card>
          )}
        </WrapperTrackingInfo>
      </WrapperTrackingContent>
    </WrapperTrackingContainer>
  )
}

export default ShippingTracking

