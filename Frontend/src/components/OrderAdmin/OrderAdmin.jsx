

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  Button,
  Form,
  Select,
  Input,
  Tag,
  Descriptions,
  Timeline,
  Tabs,
  InputNumber,
  Space,
  Row,
  Col,
  Empty,
  Card,
  Tooltip,
  Modal,
  Spin,
  Badge,
  Divider,
  Statistic,
  message as antMessage,
  Dropdown,
  Drawer
} from 'antd'
import {
  EditOutlined,
  SearchOutlined,
  PrinterOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  TruckOutlined,
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import Loading from '../LoadingComponent/Loading'
import ModalComponent from '../ModalComponent/ModalComponent'
import { convertPrice } from '../../utils'
import * as message from '../Message/Message'
import { useSelector } from 'react-redux'
import * as OrderService from '../../services/OrderService'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMutationHooks } from '../../hooks/useMutationHook'
import { orderContant } from '../../contant'
import { WrapperHeader, WrapperContainer, WrapperSearchSection, WrapperTableSection, WrapperDrawerContent, WrapperProductCard, WrapperModalContent, WrapperStatusBadge, WrapperActionButtons } from './style'

const { TextArea } = Input
const { Option } = Select

const UNIFIED_STATUS_MAP = {
  pending: { status: 'pending', shippingStatus: null, text: 'Chờ xử lý', color: 'orange' },
  confirmed: { status: 'confirmed', shippingStatus: null, text: 'Đã xác nhận', color: 'blue' },
  processing: { status: 'processing', shippingStatus: null, text: 'Đang xử lý', color: 'cyan' },
  waiting_pickup: { status: 'processing', shippingStatus: 'pending', text: 'Chờ lấy hàng', color: 'orange' },
  picked_up: { status: 'shipped', shippingStatus: 'picked_up', text: 'Đã lấy hàng', color: 'blue' },
  shipping: { status: 'shipped', shippingStatus: 'shipping', text: 'Đang vận chuyển', color: 'cyan' },
  delivering: { status: 'shipped', shippingStatus: 'out_for_delivery', text: 'Đang giao hàng', color: 'purple' },
  delivered: { status: 'delivered', shippingStatus: 'delivered', text: 'Đã giao hàng', color: 'green' },
  failed: { status: 'shipped', shippingStatus: 'failed', text: 'Giao thất bại', color: 'red' },
  returned: { status: 'returned', shippingStatus: 'returned', text: 'Đã trả hàng', color: 'volcano' },
  cancelled: { status: 'cancelled', shippingStatus: 'cancelled', text: 'Đã hủy', color: 'red' },
  refunded: { status: 'refunded', shippingStatus: 'cancelled', text: 'Đã hoàn tiền', color: 'volcano' },
  completed: { status: 'completed', shippingStatus: 'delivered', text: 'Đã nhận hoàn thành', color: 'green' },
}

const OrderAdmin = () => {
  const user = useSelector((state) => state?.user)
  const queryClient = useQueryClient()

  const HIGH_VALUE_THRESHOLD = 2000000 // 2 triệu VND
  const LONG_SHIPPING_DAYS = 5

  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isModalCancel, setIsModalCancel] = useState(false)
  const [isModalRefund, setIsModalRefund] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterPaid, setFilterPaid] = useState(null)
  const autoSyncedStatusRef = useRef(new Set())

  const [cancelForm] = Form.useForm()
  const [refundForm] = Form.useForm()

  const handleRefresh = () => queryOrder.refetch()

  const handleExport = () => {
    const rows = filteredDataTable || []
    if (!rows.length) {
      message.info('Không có dữ liệu để xuất')
      return
    }
    const header = ['Mã đơn', 'Khách hàng', 'Trạng thái', 'Thanh toán', 'Tổng tiền', 'Ngày tạo']
    const body = rows.map((o) => ([
      o._id,
      o.userName,
      resolveOrderStatus(o).text,
      o.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán',
      convertPrice(o.totalPrice),
      o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : ''
    ].map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(',')))
    const csv = [header.join(','), ...body].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `orders_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Lấy ghi chú hủy mới nhất gần đây
  const latestCancelNote = orderDetails?.statusHistory
    ?.slice()
    ?.reverse()
    ?.find((h) => h.status === 'cancelled')?.note

  // Lấy danh sách đơn hàng
  const getAllOrder = async () => {
    const res = await OrderService.getAllOrder(user?.access_token)
    return res
  }

  const queryOrder = useQuery({
    queryKey: ['orders'],
    queryFn: getAllOrder
  })

  const { isPending: isPendingOrders, data: orders } = queryOrder

  // Mutation hủy đơn
  const mutationCancel = useMutationHooks((data) => {
    const { id, cancelReason, cancelNote, token } = data
    return OrderService.cancelOrderAdmin(id, cancelReason, cancelNote, token)
  })

  // Mutation hoàn tiền
  const mutationRefund = useMutationHooks((data) => {
    const { id, refundReason, refundAmount, refundTransactionId, token } = data
    return OrderService.refundOrderAdmin(id, refundReason, refundAmount, refundTransactionId, token)
  })

  // Mutation cập nhật vận chuyển
  const mutationTracking = useMutationHooks((data) => {
    const { id, shippingCompany, trackingNumber, trackingUrl, token } = data
    return OrderService.updateTracking(id, shippingCompany, trackingNumber, trackingUrl, token)
  })

  // Mutation thay đổi trạng thái
  const mutationStatus = useMutationHooks((data) => {
    const { id, status, note, token, shippingStatus } = data
    return OrderService.updateOrderStatus(id, status, note, token, shippingStatus)
  })

  // Lấy chi tiết đơn hàng
  const fetchGetDetailsOrder = useCallback(async (orderId) => {
    const res = await OrderService.getDetailsOrder(orderId, user?.access_token)
    if (res?.data) {
      setOrderDetails(res.data)
    }
  }, [user?.access_token])

  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      fetchGetDetailsOrder(rowSelected)
    }
  }, [rowSelected, isOpenDrawer, fetchGetDetailsOrder])

  useEffect(() => {
    if (!orders?.data?.length || !user?.access_token) return

    orders.data.forEach((order) => {
      // 1. Đồng bộ trạng thái theo vận chuyển
      const resolved = resolveOrderStatus(order)
      const targetStatus = UNIFIED_STATUS_MAP[resolved.code]?.status
      const shouldSyncShipping =
        targetStatus &&
        targetStatus !== order.status &&
        !['cancelled', 'refunded', 'completed', 'pending_payment'].includes(order.status)

      if (shouldSyncShipping) {
        const key = `${order._id}-${targetStatus}`
        if (!autoSyncedStatusRef.current.has(key)) {
          autoSyncedStatusRef.current.add(key)
          mutationStatus.mutate(
            {
              id: order._id,
              status: targetStatus,
              note: 'Đồng bộ trạng thái theo vận chuyển',
              token: user?.access_token
            },
            {
              onSuccess: () => {
                queryOrder.refetch()
                if (isOpenDrawer && rowSelected === order._id) fetchGetDetailsOrder(order._id)
              },
              onError: () => {
                autoSyncedStatusRef.current.delete(key)
              }
            }
          )
        }
      }


    })
  }, [orders, user?.access_token, isOpenDrawer, rowSelected, fetchGetDetailsOrder, mutationStatus, queryOrder])

  const handleDetailsOrder = () => setIsOpenDrawer(true)

  const handleCancelOrder = () => setIsModalCancel(true)
  const handleRefundOrder = () => setIsModalRefund(true)

  // Xử lý hủy đơn
  const onCancelOrder = () => {
    const selectedOrder =
      orders?.data?.find((o) => o._id === rowSelected) || orderDetails
    if (!canCancelOrder(selectedOrder?.status, selectedOrder?.shippingStatus)) {
      message.warning('Chỉ hủy đơn ở trạng thái Chờ xử lý/Đã xác nhận và chưa bàn giao vận chuyển')
      setIsModalCancel(false)
      cancelForm.resetFields()
      return
    }

    cancelForm.validateFields().then((values) => {
      mutationCancel.mutate(
        {
          id: rowSelected,
          cancelReason: values.cancelReason,
          cancelNote: values.cancelNote || '',
          token: user?.access_token
        },
        {
          onSuccess: () => {
            message.success('Hủy đơn hàng thành công')
            setIsModalCancel(false)
            cancelForm.resetFields()
            queryOrder.refetch()
            if (isOpenDrawer) fetchGetDetailsOrder(rowSelected)
          },
          onError: (err) => message.error(err?.response?.data?.message || 'Hủy đơn thất bại')
        }
      )
    })
  }

  // Xử lý hoàn tiền
  const onRefundOrder = () => {
    refundForm.validateFields().then((values) => {
      mutationRefund.mutate(
        {
          id: rowSelected,
          refundReason: values.refundReason,
          refundAmount: values.refundAmount,
          refundTransactionId: values.refundTransactionId || '',
          token: user?.access_token
        },
        {
          onSuccess: () => {
            message.success('Hoàn tiền thành công')
            setIsModalRefund(false)
            refundForm.resetFields()
            queryOrder.refetch()
            if (isOpenDrawer) fetchGetDetailsOrder(rowSelected)
          },
          onError: (err) => message.error(err?.response?.message || 'Hoàn tiền thất bại')
        }
      )
    })
  }

  // Thay đổi trạng thái
  // Thay đổi trạng thái đơn hàng, đồng thời đảm bảo sinh/xóa tracking number tự động
  const onUpdateStatus = (viewStatus, note = '') => {
    const config = UNIFIED_STATUS_MAP[viewStatus]
    if (!config) return

    const performUpdate = () => {
      mutationStatus.mutate(
        {
          id: rowSelected,
          status: config.status,
          shippingStatus: config.shippingStatus,
          note,
          token: user?.access_token
        },
        {
          onSuccess: () => {
            message.success('Cập nhật trạng thái thành công')
            queryOrder.refetch()
            if (isOpenDrawer) fetchGetDetailsOrder(rowSelected)
          },
          onError: (err) => message.error(err?.response?.data?.message || 'Cập nhật thất bại')
        }
      )
    }

    const proceedWithStatus = async () => {
      try {
        // Nếu chuyển sang trạng thái liên quan vận chuyển hoặc hủy/hoàn tiền, đảm bảo tracking number tự động
        await ensureAutoTracking(config.status)
        performUpdate()
      } catch {
        // handled in ensureAutoTracking
      }
    }

    if (config.status === 'confirmed') {
      const targetOrder = orderDetails || orders?.data?.find((o) => o._id === rowSelected)
      const uid = targetOrder?.user?._id || targetOrder?.user
      const previousCancels = uid ? cancelCountByUser[uid] || 0 : 0
      if (previousCancels >= 3) {
        Modal.warning({
          title: 'Cảnh báo khách hay hủy đơn',
          content: (
            <div>
              <p>Tài khoản này đã hủy nhiều đơn hàng trước đây.</p>
              <p>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận để tránh bị giới hạn trong tương lai.</p>
            </div>
          ),
          okText: 'Tiếp tục xác nhận',
          onOk: proceedWithStatus
        })
        return
      }
    }

    proceedWithStatus()
  }

  const onPrintInvoice = () => window.print()

  // Helper màu & text trạng thái
  const getStatusColor = (status) => {
    const map = {
      pending: 'orange',
      confirmed: 'blue',
      processing: 'cyan',
      shipped: 'purple',
      delivered: 'green',
      completed: 'green',
      cancelled: 'red',
      refunded: 'volcano',
      returned: 'volcano',
      failed: 'red'
    }
    return map[status] || 'default'
  }

  const getStatusText = (status) => {
    const map = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipped: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
      returned: 'Đã trả hàng',
      failed: 'Giao thất bại'
    }
    return map[status] || status
  }

  // Allowed transitions for UI (strict sequence)
  // Allowed transitions for UI (strict sequence)
  const ALLOWED_ORDER_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['waiting_pickup', 'cancelled'],
    waiting_pickup: ['picked_up', 'cancelled'],
    picked_up: ['shipping', 'delivering', 'delivered', 'cancelled'],
    shipping: ['delivering', 'delivered', 'failed', 'returned', 'cancelled'],
    delivering: ['delivered', 'failed', 'returned', 'cancelled'],
    failed: ['returned', 'cancelled'],
    delivered: ['completed', 'returned'],
    completed: [],
    cancelled: ['refunded'],
    refunded: [],
    returned: [],
  }

  const getShippingStatusText = (status) => {
    if (!status) return 'Chưa có'
    const map = {
      pending: 'Chờ lấy hàng',
      waiting_pickup: 'Chờ lấy hàng',
      ready_to_pick: 'Chờ lấy hàng',
      picked_up: 'Đã lấy hàng',
      shipping: 'Đang vận chuyển',
      in_transit: 'Đang vận chuyển',
      out_for_delivery: 'Đang giao hàng',
      delivered: 'Đã giao',
      failed: 'Giao thất bại',
      returned: 'Đã trả hàng',
      cancelled: 'Đã hủy'
    }
    return map[status] || status
  }

  const getShippingStatusColor = (status) => {
    const map = {
      pending: 'orange',
      waiting_pickup: 'orange',
      ready_to_pick: 'orange',
      picked_up: 'blue',
      shipping: 'cyan',
      in_transit: 'cyan',
      out_for_delivery: 'purple',
      delivered: 'green',
      failed: 'red',
      returned: 'volcano'
    }
    return map[status] || 'default'
  }

  const resolveOrderStatus = (order) => {
    if (!order) return { code: '', text: '', color: 'default' }
    const { status, shippingStatus } = order

    // Terminal statuses take priority
    if (status === 'cancelled') return { code: 'cancelled', ...UNIFIED_STATUS_MAP.cancelled }
    if (status === 'refunded') return { code: 'refunded', ...UNIFIED_STATUS_MAP.refunded }
    if (status === 'completed') return { code: 'completed', ...UNIFIED_STATUS_MAP.completed }
    if (status === 'returned') return { code: 'returned', ...UNIFIED_STATUS_MAP.returned }
    if (status === 'delivered') return { code: 'delivered', ...UNIFIED_STATUS_MAP.delivered }

    // Shipping statuses
    if (shippingStatus === 'delivered') return { code: 'delivered', ...UNIFIED_STATUS_MAP.delivered }
    if (shippingStatus === 'failed') return { code: 'failed', ...UNIFIED_STATUS_MAP.failed }
    if (shippingStatus === 'returned') return { code: 'returned', ...UNIFIED_STATUS_MAP.returned }
    if (shippingStatus === 'out_for_delivery') return { code: 'delivering', ...UNIFIED_STATUS_MAP.delivering }
    if (['shipping', 'in_transit'].includes(shippingStatus)) return { code: 'shipping', ...UNIFIED_STATUS_MAP.shipping }
    if (shippingStatus === 'picked_up') return { code: 'picked_up', ...UNIFIED_STATUS_MAP.picked_up }
    if (shippingStatus === 'pending' || order.trackingNumber) {
      if (status === 'processing') return { code: 'waiting_pickup', ...UNIFIED_STATUS_MAP.waiting_pickup }
    }

    // fallback to status
    if (UNIFIED_STATUS_MAP[status]) return { code: status, ...UNIFIED_STATUS_MAP[status] }
    if (status === 'shipped') return { code: 'shipping', ...UNIFIED_STATUS_MAP.shipping }

    return { code: 'pending', ...UNIFIED_STATUS_MAP.pending }
  }

  const canCancelOrder = (status, shippingStatus) => {
    const disallowShipping = ['picked_up', 'shipping', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed']
    const disallowStatus = ['shipped', 'delivered', 'completed', 'refunded', 'returned']
    return ['pending', 'confirmed', 'processing'].includes(status) && !disallowStatus.includes(status) && !disallowShipping.includes(shippingStatus)
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN')}`
  }

  const generateTrackingNumber = () => {
    const ts = Math.floor(Date.now() / 1000)
    const rand = Math.floor(100000 + Math.random() * 900000) // 6 chữ số ngẫu nhiên
    return `WPZ-${ts}-${rand}`
  }

  const ensureAutoTracking = async (nextStatus) => {
    const targetOrder = orderDetails || orders?.data?.find((o) => o._id === rowSelected)
    if (!targetOrder) return

    const { shippingStatus, trackingNumber, shippingCompany, trackingUrl } = targetOrder
    const hasTracking = !!trackingNumber

    // Chỉ tạo một lần khi đơn chuyển sang trạng thái xử lý (tương ứng chờ lấy hàng) và chưa có mã
    if (nextStatus === 'processing' && !hasTracking) {
      // Không tạo lại nếu đã có
      const newTrackingNumber = generateTrackingNumber()
      const company = shippingCompany || 'GHTK'
      await new Promise((resolve, reject) => {
        mutationTracking.mutate(
          {
            id: targetOrder._id,
            shippingCompany: company,
            trackingNumber: newTrackingNumber,
            trackingUrl: trackingUrl || '',
            token: user?.access_token
          },
          {
            onSuccess: () => {
              queryOrder.refetch()
              if (isOpenDrawer) fetchGetDetailsOrder(targetOrder._id)
              resolve()
            },
            onError: (err) => {
              message.error(err?.response?.data?.message || 'Cập nhật vận chuyển thất bại')
              reject(err)
            }
          }
        )
      })
    }
    // Trường hợp hủy đơn thì xóa mã vận đơn
    else if (nextStatus === 'cancelled' && hasTracking) {
      await new Promise((resolve, reject) => {
        mutationTracking.mutate(
          {
            id: targetOrder._id,
            shippingCompany: '',
            trackingNumber: null,
            trackingUrl: '',
            token: user?.access_token
          },
          {
            onSuccess: () => {
              queryOrder.refetch()
              if (isOpenDrawer) fetchGetDetailsOrder(targetOrder._id)
              resolve()
            },
            onError: (err) => {
              message.error(err?.response?.data?.message || 'Cập nhật vận chuyển thất bại')
              reject(err)
            }
          }
        )
      })
    }
    // Các trường hợp khác giữ nguyên
    else {
      return
    }

  }

  // Đếm số lần hủy theo user
  const cancelCountByUser = useMemo(() => {
    const map = {}
    orders?.data?.forEach((order) => {
      const uid = order?.user?._id || order?.user
      if ((order.status === 'cancelled' || order.isCancelled) && uid) {
        map[uid] = (map[uid] || 0) + 1
      }
    })
    return map
  }, [orders])

  // Phát hiện bất thường
  const getAnomalyReasons = (order) => {
    const reasons = []
    const total = order?.totalPrice || 0
    const uid = order?.user?._id || order?.user
    const resolvedStatus = resolveOrderStatus(order).code

    if (total >= HIGH_VALUE_THRESHOLD && ['pending', 'confirmed'].includes(resolvedStatus)) {
      reasons.push('Đơn giá trị cao chưa xác nhận')
    }
    if (uid && cancelCountByUser[uid] >= 3) {
      reasons.push('Khách hay hủy đơn')
    }
    const created = order.createdAtRaw ? new Date(order.createdAtRaw) : null
    if (created) {
      const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
      if (days >= LONG_SHIPPING_DAYS && !['delivered', 'completed', 'cancelled', 'refunded'].includes(resolvedStatus)) {
        reasons.push('Giao hàng chậm bất thường')
      }
    }
    if (order.shippingStatus === 'pending' && total >= HIGH_VALUE_THRESHOLD) {
      reasons.push('Đơn lớn chưa lấy hàng')
    }
    return reasons
  }

  const getAnomalyLevel = (reasons = []) => {
    if (!reasons.length) return null
    const highKeywords = ['giá trị cao', 'chậm', 'đơn lớn']
    const isHigh = reasons.some((r) => highKeywords.some((k) => r.toLowerCase().includes(k)))
    const isMedium = !isHigh
    return isHigh ? 'high' : isMedium ? 'medium' : 'low'
  }

  // Cột bảng
  const baseColumns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      minWidth: 160,
      width: 160,
      render: (text) => (
        <span style={{ fontWeight: '500', color: '#1890ff', fontFamily: 'monospace' }}>
          {text?.slice(0, 8)}...
        </span>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: 'userName',
      minWidth: 180,
      width: 180,
      render: (text) => <span style={{ fontWeight: '500' }}>{text}</span>
    },
    // Đã xoá cột SĐT để đơn giản bảng
    {
      title: 'Trạng thái đơn hàng',
      dataIndex: 'uiStatus',
      minWidth: 150,
      width: 150,
      render: (_, record) => {
        const resolved = resolveOrderStatus(record)
        return (
          <Tag
            color={resolved.color}
            style={{ borderRadius: '4px', fontWeight: '500' }}
          >
            {resolved.text}
          </Tag>
        )
      },
      filters: [
        { text: 'Chờ xử lý', value: 'pending' },
        { text: 'Đã xác nhận', value: 'confirmed' },
        { text: 'Đang xử lý', value: 'processing' },
        { text: 'Chờ lấy hàng', value: 'waiting_pickup' },
        { text: 'Đã lấy hàng', value: 'picked_up' },
        { text: 'Đang vận chuyển', value: 'shipping' },
        { text: 'Đang giao hàng', value: 'delivering' },
        { text: 'Đã giao hàng', value: 'delivered' },
        { text: 'Hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' },
        { text: 'Đã hoàn tiền', value: 'refunded' },
        { text: 'Đã trả hàng', value: 'returned' },

      ],
      onFilter: (value, record) => resolveOrderStatus(record).code === value
    },
    {
      title: 'Mã vận đơn',
      dataIndex: 'trackingNumber',
      minWidth: 180,
      width: 200,
      render: (tracking) =>
        tracking ? (
          <Tooltip title={tracking}>
            <Tag color="blue" style={{ borderRadius: '4px', fontWeight: '500' }}>
              {tracking}
            </Tag>
          </Tooltip>
        ) : (
          <Tag style={{ borderRadius: '4px', fontWeight: '500' }}>Chưa có</Tag>
        )
    },
    {
      title: 'Cảnh báo',
      key: 'anomalies',
      minWidth: 120,
      width: 120,
      responsive: ['md'],
      render: (_, record) => {
        const reasons = getAnomalyReasons(record)
        if (reasons.length === 0) {
          return (
            <Tooltip title="Bình thường">
              <Tag
                color="green"
                style={{
                  borderRadius: '16px',
                  padding: '2px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 14 }} />
              </Tag>
            </Tooltip>
          )
        }
        const level = getAnomalyLevel(reasons) || 'medium'
        const levelMap = {
          low: { color: '#1890ff', icon: <InfoCircleOutlined style={{ fontSize: 14 }} /> },
          medium: { color: '#faad14', icon: <WarningOutlined style={{ fontSize: 14 }} /> },
          high: { color: '#ff4d4f', icon: <ExclamationCircleOutlined style={{ fontSize: 14 }} /> }
        }
        const cfg = levelMap[level] || levelMap.medium
        const tooltipText = reasons.join('\n')
        return (
          <Tooltip title={<div style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{tooltipText}</div>}>
            <Tag
              color={cfg.color}
              style={{
                borderRadius: '16px',
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {cfg.icon}
            </Tag>
          </Tooltip>
        )
      }
    },
    // Đã xoá cột Thanh toán để đơn giản bảng
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      minWidth: 150,
      width: 160,
      sorter: (a, b) => a.rawTotalPrice - b.rawTotalPrice,
      render: (price) => (
        <span style={{ fontWeight: '600', color: '#d4380d' }}>
          {convertPrice(price)}
        </span>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      minWidth: 140,
      width: 150,
      responsive: ['md'],
      render: (date) => (
        <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
          {date ? new Date(date).toLocaleDateString('vi-VN') : '-'}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: 'Hành động',
      fixed: 'right',
      minWidth: 140,
      width: 140,
      render: (_, record) => (
        <WrapperActionButtons>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              setRowSelected(record._id)
              setIsOpenDrawer(true)
            }}
            style={{ color: '#1890ff', fontSize: '18px' }}
            title="Xem chi tiết"
          />
          {canCancelOrder(record.status, record.shippingStatus) && (
            <Button
              type="text"
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setRowSelected(record._id)
                setIsModalCancel(true)
              }}
              style={{ color: '#ff4d4f', fontSize: '18px' }}
              title="Hủy đơn"
            />
          )}
        </WrapperActionButtons>
      )
    }
  ]

  const columns = baseColumns.map((col) => {
    const minWidth = col.minWidth || col.width || 120
    return {
      ...col,
      onHeaderCell: (column) => {
        const baseCell = col.onHeaderCell ? col.onHeaderCell(column) || {} : {}
        return {
          ...baseCell,
          style: { ...(baseCell.style || {}), minWidth }
        }
      },
      onCell: (record, index) => {
        const baseCell = col.onCell ? col.onCell(record, index) || {} : {}
        return {
          ...baseCell,
          style: { ...(baseCell.style || {}), minWidth }
        }
      }
    }
  })

  const dataTable = orders?.data?.map((order) => {
    const resolvedStatus = resolveOrderStatus(order)
    return {
      ...order,
      key: order._id,
      userName: order?.user?.name || order?.shippingAddress?.fullName || 'Khách lẻ',
      phone: order?.shippingAddress?.phone || 'N/A',
      rawTotalPrice: order.totalPrice || 0,
      totalPrice: order.totalPrice || 0,
      anomalies: getAnomalyReasons(order),
      uiStatus: resolvedStatus.code,
      uiStatusText: resolvedStatus.text,
      uiStatusColor: resolvedStatus.color
    }
  })

  const filteredDataTable = useMemo(() => {
    let result = dataTable

    if (filterStatus) {
      result = result?.filter((order) => order.uiStatus === filterStatus)
    }

    if (filterPaid !== null && filterPaid !== undefined) {
      result = result?.filter((order) => order.isPaid === filterPaid)
    }

    if (!searchText.trim()) return result
    const lower = searchText.toLowerCase()
    return result?.filter((order) => {
      return (
        (order._id && order._id.toLowerCase().includes(lower)) ||
        (order.userName && order.userName.toLowerCase().includes(lower)) ||
        (typeof order.phone === 'string' && order.phone.includes(searchText)) ||
        (order?.user?.email && order.user.email.toLowerCase().includes(lower)) ||
        (order?.shippingAddress?.address && order.shippingAddress.address.toLowerCase().includes(lower)) ||
        (order?.trackingNumber && String(order.trackingNumber).toLowerCase().includes(lower))
      )
    })
  }, [dataTable, filterPaid, filterStatus, searchText])

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false)
    setOrderDetails(null)
    setRowSelected('')
  }

  // Thống kê tổng quát
  const stats = useMemo(() => {
    const allOrders = orders?.data || []
    const resolvedCodes = allOrders.map((o) => resolveOrderStatus(o).code)
    return {
      total: allOrders.length,
      pending: resolvedCodes.filter((s) => ['pending', 'confirmed', 'processing'].includes(s)).length,
      completed: resolvedCodes.filter((s) => ['completed', 'delivered'].includes(s)).length,
      cancelled: resolvedCodes.filter((s) => ['cancelled', 'refunded'].includes(s)).length,
      totalRevenue: allOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
    }
  }, [orders])

  const resolvedDetailStatus = resolveOrderStatus(orderDetails)

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '20px' }}>
      <WrapperHeader>
        <div>
          <h1 style={{ fontWeight: 700 }}>Quản lý Đơn Hàng</h1>

        </div>
      </WrapperHeader>

      {/* Thống kê tổng quát */}
      <WrapperContainer>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={12} md={6}>
            <Card
              style={{ textAlign: 'center', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              hoverable
            >
              <Statistic
                title="Tổng đơn hàng"
                value={stats.total}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card
              style={{ textAlign: 'center', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              hoverable
            >
              <Statistic
                title="Chờ xử lý"
                value={stats.pending}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card
              style={{ textAlign: 'center', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              hoverable
            >
              <Statistic
                title="Hoàn thành"
                value={stats.completed}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card
              style={{ textAlign: 'center', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              hoverable
            >
              <Statistic
                title="Doanh thu"
                value={stats.totalRevenue}
                formatter={(val) => convertPrice(val)}
                valueStyle={{ color: '#eb2f96', fontSize: '16px' }}
              />
            </Card>
          </Col>
        </Row>
      </WrapperContainer>

      <WrapperContainer>
        <WrapperSearchSection>
          <div className="search-input-wrapper">
            <Input
              placeholder="🔍 Tìm kiếm theo mã đơn, tên khách, số điện thoại..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </div>

          <Select
            placeholder="Trạng thái"
            style={{ minWidth: '120px' }}
            allowClear
            size="large"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { label: 'Chờ xử lý', value: 'pending' },
              { label: 'Đã xác nhận', value: 'confirmed' },
              { label: 'Đang xử lý', value: 'processing' },
              { label: 'Chờ lấy hàng', value: 'waiting_pickup' },
              { label: 'Đã lấy hàng', value: 'picked_up' },
              { label: 'Đang vận chuyển', value: 'shipping' },
              { label: 'Đang giao hàng', value: 'delivering' },
              { label: 'Đã giao hàng', value: 'delivered' },
              { label: 'Hoàn thành', value: 'completed' },
              { label: 'Đã hủy', value: 'cancelled' },
              { label: 'Đã hoàn tiền', value: 'refunded' },
              { label: 'Đã trả hàng', value: 'returned' },
            ]}
          />

          <Select
            placeholder="Thanh toán"
            style={{ minWidth: '120px' }}
            allowClear
            size="large"
            value={filterPaid}
            onChange={setFilterPaid}
            options={[
              { label: 'Đã thanh toán', value: true },
              { label: 'Chưa thanh toán', value: false },
            ]}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isPendingOrders}
            size="large"
            style={{ borderRadius: '8px' }}
          >
            Làm mới
          </Button>

          <Button
            icon={<ExportOutlined />}
            type="default"
            size="large"
            style={{ borderRadius: '8px' }}
            onClick={handleExport}
          >
            Xuất
          </Button>
        </WrapperSearchSection>
      </WrapperContainer>

      <WrapperTableSection>
        <Spin spinning={isPendingOrders} tip="Đang tải đơn hàng...">
          <TableComponent
            columns={columns}
            data={filteredDataTable || []}
            loading={isPendingOrders}
            onRow={(record) => ({
              onClick: () => setRowSelected(record._id),
              onDoubleClick: () => {
                setRowSelected(record._id)
                setIsOpenDrawer(true)
              },
              style: { cursor: 'pointer' }
            })}
            scroll={{ x: 'max-content' }}
            tableLayout="auto"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]} - ${range[1]} của ${total} đơn hàng`,
              style: { textAlign: 'right', marginTop: '16px' }
            }}
            locale={{
              emptyText: <Empty description="Không có đơn hàng" style={{ marginTop: '30px' }} />
            }}
          />
        </Spin>
      </WrapperTableSection>

      {/* Drawer chi tiết */}
      <DrawerComponent title="Chi tiết đơn hàng" open={isOpenDrawer} onClose={handleCloseDrawer} width="90%">
        <Spin spinning={!orderDetails} tip="Đang tải...">
          {orderDetails && (
            <Tabs defaultActiveKey="info">
              <Tabs.TabPane tab="Thông tin đơn hàng" key="info">
                <WrapperDrawerContent>
                  <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} md={16}>
                      <Card
                        size="small"
                        title={<strong>Thông tin chung</strong>}
                        style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        <Descriptions column={2} size="small" bordered labelStyle={{ width: 140 }}>
                          <Descriptions.Item label="Mã đơn hàng" span={2}>
                            <strong>{orderDetails._id}</strong>
                          </Descriptions.Item>
                          <Descriptions.Item label="Ngày tạo">{formatDateTime(orderDetails.createdAt)}</Descriptions.Item>
                          <Descriptions.Item label="Cập nhật">{formatDateTime(orderDetails.updatedAt)}</Descriptions.Item>
                          <Descriptions.Item label="Trạng thái đơn hàng">
                            <Tag color={resolvedDetailStatus.color} style={{ padding: '2px 10px' }}>
                              {resolvedDetailStatus.text}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Đơn vị vận chuyển">
                            {orderDetails.shippingCompany || 'Chưa có'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Mã vận đơn">
                            <span style={{ wordBreak: 'break-all', color: '#1890ff', fontWeight: 'bold' }}>
                              {orderDetails.trackingNumber || 'Chưa có'}
                              {orderDetails.trackingUrl && (
                                <Button
                                  type="link"
                                  href={orderDetails.trackingUrl}
                                  target="_blank"
                                  style={{ padding: 0, marginLeft: 6 }}
                                  disabled
                                >
                                  Theo dõi →
                                </Button>
                              )}
                            </span>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card
                        size="small"
                        title={<strong>Khách hàng & giao hàng</strong>}
                        style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <strong>{orderDetails.user?.name || orderDetails.shippingAddress?.fullName}</strong>
                        </div>
                        <div style={{ color: '#595959', marginBottom: 6 }}>
                          📧 {orderDetails.user?.email || 'N/A'}
                        </div>
                        <div style={{ color: '#595959', marginBottom: 6 }}>
                          📞 {orderDetails.shippingAddress?.phone || 'N/A'}
                        </div>
                        <div style={{ color: '#595959', lineHeight: 1.6 }}>
                          📍 {orderDetails.shippingAddress?.address}, {orderDetails.shippingAddress?.city || ''}
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12}>
                      <Card
                        size="small"
                        title={<strong>Thanh toán</strong>}
                        style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ color: '#8c8c8c', fontSize: '13px' }}>Phương thức</span>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#262626', marginTop: '4px' }}>
                            {orderContant.payment[orderDetails.paymentMethod] || orderDetails.paymentMethod}
                          </div>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Trạng thái">
                            <Tag color={orderDetails.isPaid ? 'green' : 'red'} style={{ fontSize: '12px' }}>
                              {orderDetails.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Mã giao dịch">
                            {orderDetails.paymentResult?.id || 'Chưa có'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Thời gian thanh toán">
                            {orderDetails.isPaid ? formatDateTime(orderDetails.paidAt) : '-'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Card
                        size="small"
                        title={<strong>Tổng tiền</strong>}
                        style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Tổng đơn">
                            <strong>{convertPrice(orderDetails.totalPrice)}</strong>
                          </Descriptions.Item>
                          <Descriptions.Item label="Đã thanh toán">
                            {orderDetails.isPaid ? convertPrice(orderDetails.totalPrice) : '0 ₫'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Còn lại">
                            {orderDetails.isPaid ? '0 ₫' : convertPrice(orderDetails.totalPrice)}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>

                  {/* Danh sách sản phẩm */}
                  <Card
                    size="small"
                    title={<strong>Sản phẩm</strong>}
                    style={{ marginBottom: '24px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    {orderDetails.orderItems?.map((item, i) => (
                      <WrapperProductCard key={i}>
                        <img src={item.image} alt={item.name} />
                        <div style={{ flex: 1 }}>
                          <div>{item.name}</div>
                          {item.variation && (
                            <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                              {item.variation.color && `🎨 Màu: ${item.variation.color} `}
                              {item.variation.size && `📏 Size: ${item.variation.size}`}
                            </div>
                          )}
                          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '13px' }}>
                            <span>Giá: <strong>{convertPrice(item.price)}</strong></span>
                            <span>Số lượng: <strong>x{item.amount}</strong></span>
                            <span style={{ color: '#d4380d', fontWeight: '600' }}>
                              Tổng: {convertPrice(item.price * item.amount)}
                            </span>
                          </div>
                        </div>
                      </WrapperProductCard>
                    ))}
                  </Card>

                  {orderDetails.status === 'cancelled' && (
                    <Card
                      size="small"
                      title={<strong>Lý do hủy</strong>}
                      style={{ marginBottom: '24px', border: '1px solid #ffccc7', background: '#fff1f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    >
                      <div style={{ color: '#595959', lineHeight: '1.6' }}>
                        {orderDetails.cancelReason || latestCancelNote || 'Không có'}
                      </div>
                    </Card>
                  )}

                  <Card
                    size="small"
                    title={<strong>Thông tin vận chuyển</strong>}
                    style={{ marginBottom: '24px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: '600' }}>Đơn vị vận chuyển</span>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#262626', marginTop: '4px' }}>
                            {orderDetails.shippingCompany || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: '600' }}>Mã vận đơn</span>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff', marginTop: '4px', wordBreak: 'break-all' }}>
                            {orderDetails.trackingNumber || 'Chưa có'}
                            {orderDetails.trackingUrl && (
                              <Button
                                type="link"
                                href={orderDetails.trackingUrl}
                                target="_blank"
                                style={{ padding: '0', marginLeft: '8px' }}
                                disabled
                              >
                                Theo dõi →
                              </Button>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap'
                  }}>
                    <Button
                      type="primary"
                      onClick={onPrintInvoice}
                      style={{ borderRadius: '6px' }}
                    >
                      In hóa đơn
                    </Button>

                    {orderDetails.status !== 'cancelled' && orderDetails.status !== 'refunded' && (
                      (() => {
                        const allowed = orderDetails && orderDetails.status ? (ALLOWED_ORDER_TRANSITIONS[orderDetails.status] || []) : Object.keys(ALLOWED_ORDER_TRANSITIONS).reduce((acc, k) => acc.concat(ALLOWED_ORDER_TRANSITIONS[k]), [])
                        return (
                          <Select
                            placeholder="Đổi trạng thái"
                            style={{ minWidth: '180px', borderRadius: '6px' }}
                            value={resolvedDetailStatus.code}
                            onChange={(val) =>
                              Modal.confirm({
                                title: '⚠️ Xác nhận thay đổi',
                                content: `Bạn chắc chắn muốn đổi trạng thái sang "${UNIFIED_STATUS_MAP[val]?.text}"?`,
                                okText: 'Xác nhận',
                                cancelText: 'Hủy',
                                onOk: () => onUpdateStatus(val, `Admin đổi trạng thái sang ${UNIFIED_STATUS_MAP[val]?.text}`)
                              })
                            }
                          >
                            {Object.keys(UNIFIED_STATUS_MAP).map(key => (
                              <Option key={key} value={key} disabled={!allowed.includes(key)}>
                                {UNIFIED_STATUS_MAP[key].text}
                              </Option>
                            ))}
                          </Select>
                        )
                      })()
                    )}
                  </div>
                </WrapperDrawerContent>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Lịch sử trạng thái" key="history">
                <WrapperDrawerContent>
                  <Timeline>
                    {orderDetails.statusHistory?.map((h, i) => (
                      <Timeline.Item key={i} color={getStatusColor(h.status)}>
                        <Card
                          size="small"
                          style={{
                            marginBottom: '12px',
                            border: 'none',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#262626', marginBottom: '8px' }}>
                            <Tag color={getStatusColor(h.status)}>
                              {getStatusText(h.status)}
                            </Tag>
                          </div>
                          <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                            🕐 {new Date(h.changedAt).toLocaleString('vi-VN')}
                          </div>
                          {h.note && (
                            <div style={{ fontSize: '13px', color: '#595959', marginTop: '8px', padding: '8px 12px', background: '#fafafa', borderRadius: '4px' }}>
                              <strong>Ghi chú:</strong> {h.note}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px' }}>
                            👤 {h.changedBy?.name || 'Hệ thống'}
                          </div>
                        </Card>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </WrapperDrawerContent>
              </Tabs.TabPane>
            </Tabs>
          )}
        </Spin>
      </DrawerComponent>      {/* Modal hủy đơn */}
      <ModalComponent
        title="❌ Hủy đơn hàng"
        open={isModalCancel}
        onCancel={() => {
          setIsModalCancel(false)
          cancelForm.resetFields()
        }}
        onOk={onCancelOrder}
        okText="Xác nhận hủy"
        cancelText="Không hủy"
      >
        <WrapperModalContent>
          <Form form={cancelForm} layout="vertical">
            <Form.Item name="cancelReason" label="Lý do hủy" rules={[{ required: true, message: 'Vui lòng chọn lý do hủy' }]}>
              <Select placeholder="Chọn lý do">
                <Option value="Không liên hệ được">📞 Không liên hệ được</Option>
                <Option value="Sai địa chỉ">📍 Sai địa chỉ</Option>
                <Option value="Khách yêu cầu hủy">🚫 Khách yêu cầu hủy</Option>
                <Option value="Hết hàng">📦 Hết hàng</Option>
                <Option value="Lỗi hệ thống">⚙️ Lỗi hệ thống</Option>
                <Option value="Khác">❓ Khác</Option>
              </Select>
            </Form.Item>
            <Form.Item name="cancelNote" label="Ghi chú chi tiết">
              <Input.TextArea
                rows={4}
                placeholder="Nhập ghi chú thêm (tùy chọn)..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Form>
        </WrapperModalContent>
      </ModalComponent>

      {/* Modal hoàn tiền */}
      <ModalComponent
        title="💰 Hoàn tiền đơn hàng"
        open={isModalRefund}
        onCancel={() => {
          setIsModalRefund(false)
          refundForm.resetFields()
        }}
        onOk={onRefundOrder}
        okText="Xác nhận hoàn tiền"
        cancelText="Hủy"
      >
        <WrapperModalContent>
          <Form form={refundForm} layout="vertical" initialValues={{ refundAmount: orderDetails?.totalPrice }}>
            <Form.Item name="refundReason" label="Lý do hoàn tiền" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
              <Input.TextArea
                rows={3}
                placeholder="Nhập lý do hoàn tiền..."
                showCount
                maxLength={500}
              />
            </Form.Item>
            <Form.Item name="refundAmount" label="Số tiền hoàn (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập số tiền hoàn' }]}>
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
                max={orderDetails?.totalPrice}
                placeholder="Nhập số tiền hoàn"
              />
            </Form.Item>
            <Form.Item name="refundTransactionId" label="Mã giao dịch hoàn tiền">
              <Input placeholder="Nhập nếu có (tùy chọn)" />
            </Form.Item>
          </Form>
        </WrapperModalContent>
      </ModalComponent>

    </div >
  )
}

export default OrderAdmin
