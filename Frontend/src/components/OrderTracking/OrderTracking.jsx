import React from 'react'
import { Timeline, Card, Tag, Space } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  EnvironmentOutlined,
  HomeOutlined
} from '@ant-design/icons'
import {
  WrapperTrackingContainer,
  TrackingCard,
  TrackingHeader,
  TrackingInfo,
  TimelineItem
} from './style'

const OrderTracking = ({ order, shippingOrder }) => {
  if (!order && !shippingOrder) return null

  const shippingStatus = shippingOrder?.status || order?.shippingStatus
  const trackingNumber = shippingOrder?.trackingNumber || order?.trackingNumber
  const provider = shippingOrder?.provider || order?.shippingProvider
  const statusHistory = shippingOrder?.statusHistory || []

  // Map shipping status to timeline steps
  const getTimelineSteps = () => {
    const steps = [
      {
        key: 'pending',
        title: 'Chờ lấy hàng',
        status: 'wait',
        icon: <ClockCircleOutlined />,
        description: 'Đơn hàng đang chờ tài xế đến lấy'
      },
      {
        key: 'picked_up',
        title: 'Đã lấy hàng',
        status: 'wait',
        icon: <TruckOutlined />,
        description: 'Tài xế đã lấy hàng từ kho'
      },
      {
        key: 'in_transit',
        title: 'Đang vận chuyển',
        status: 'wait',
        icon: <TruckOutlined />,
        description: 'Hàng đang được vận chuyển'
      },
      {
        key: 'out_for_delivery',
        title: 'Đang giao hàng',
        status: 'wait',
        icon: <EnvironmentOutlined />,
        description: 'Tài xế đang trên đường giao hàng'
      },
      {
        key: 'delivered',
        title: 'Đã giao hàng',
        status: 'wait',
        icon: <CheckCircleOutlined />,
        description: 'Hàng đã được giao thành công'
      }
    ]

    // Update status based on current shipping status and history
    const statusMap = {
      'pending': 0,
      'picked_up': 1,
      'in_transit': 2,
      'out_for_delivery': 3,
      'delivered': 4
    }

    const currentStep = statusMap[shippingStatus] || 0

    // Tìm thời gian từ statusHistory
    const getStatusTime = (statusKey) => {
      const historyItem = statusHistory.find(h => h.status === statusKey)
      return historyItem ? new Date(historyItem.changedAt) : null
    }

    steps.forEach((step, index) => {
      if (index < currentStep) {
        step.status = 'finish'
        step.icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />
        step.time = getStatusTime(step.key)
      } else if (index === currentStep) {
        step.status = 'process'
        step.icon = <ClockCircleOutlined style={{ color: '#1890ff' }} />
        step.time = getStatusTime(step.key)
      } else {
        step.status = 'wait'
        step.time = null
      }
    })

    return steps
  }

  const timelineSteps = getTimelineSteps()

  return (
    <WrapperTrackingContainer>
      <TrackingCard>
        <TrackingHeader>
          <div className="header-left">
            <TruckOutlined className="header-icon" />
            <div>
              <h3 className="header-title">Theo dõi đơn hàng</h3>
              {trackingNumber && (
                <div className="tracking-number">
                  Mã vận đơn: <strong>{trackingNumber}</strong>
                </div>
              )}
            </div>
          </div>
          {provider && (
            <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
              {provider.name || provider}
            </Tag>
          )}
        </TrackingHeader>

        <TrackingInfo>
          <Timeline
            items={timelineSteps.map((step, index) => ({
              dot: step.icon,
              color: step.status === 'finish' ? '#52c41a' : step.status === 'process' ? '#1890ff' : '#d9d9d9',
              children: (
                <TimelineItem>
                  <div className="timeline-title">{step.title}</div>
                  <div className="timeline-description">{step.description}</div>
                  {step.time && (
                    <div className="timeline-time">
                      {step.time.toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </TimelineItem>
              )
            }))}
          />
        </TrackingInfo>

        {order?.shippingAddress && (
          <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HomeOutlined style={{ color: '#1890ff' }} />
              <strong>Địa chỉ giao hàng:</strong>
            </div>
            <div style={{ color: '#666', lineHeight: '1.6' }}>
              {order.shippingAddress.fullName || order.shippingAddress.address}
              <br />
              {order.shippingAddress.address}
              <br />
              {order.shippingAddress.city}
              {order.shippingAddress.phone && (
                <>
                  <br />
                  ĐT: {order.shippingAddress.phone}
                </>
              )}
            </div>
          </div>
        )}
      </TrackingCard>
    </WrapperTrackingContainer>
  )
}

export default OrderTracking

