import React, { useEffect, useRef, useState } from 'react'
import { WrapperHeader, PageContainer, SectionCard, SectionHeader, SectionTitle, ActionGroup, SubtleText } from './style'
import { Button, Form, Input, Space, Select, InputNumber, Switch, Tabs, Table, Tag, Card, Row, Col, DatePicker, Modal, Upload } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, TruckOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as ShippingService from '../../services/ShippingService'
import * as OrderService from '../../services/OrderService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import { getBase64, convertPrice } from '../../utils'
import { WrapperUploadFile } from '../AdminProduct/style'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'

const { TextArea } = Input
const { Option } = Select

const AdminShipping = () => {
  const [activeTab, setActiveTab] = useState('providers')
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpen, setisModalOpen] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [isModalStatus, setIsModalStatus] = useState(false)
  const user = useSelector((state) => state?.user)
  const searchInput = useRef(null)
  const [providerForm] = Form.useForm()
  const [rateForm] = Form.useForm()
  const [statusForm] = Form.useForm()
  const queryClient = useQueryClient()

  // Allowed shipping transitions for UI
  // Allowed shipping transitions for UI
  const ALLOWED_SHIP_TRANSITIONS = {
    pending: ['picked_up'],
    picked_up: ['in_transit'],
    in_transit: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'failed'],
    delivered: [],
    failed: ['returned'],
    returned: [],
    cancelled: []
  }

  // State cho Providers
  const [stateProvider, setStateProvider] = useState({
    name: '',
    code: '',
    logo: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    isActive: true
  })

  // State cho Rates
  const [stateRate, setStateRate] = useState({
    shippingMethod: 'standard', // Các phương thức: 'express', 'fast', 'standard'
    supportedProviders: [], // Nhà vận chuyển hỗ trợ
    name: '',
    code: '',
    description: '',
    fixedPrice: 0,
    estimatedDays: { min: 1, max: 3 },
    freeShippingThreshold: null,
    isActive: true
  })

  // Mutations
  const mutationProvider = useMutationHooks(
    (data) => ShippingService.createShippingProvider(data, user?.access_token)
  )

  const mutationUpdateProvider = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data
      return ShippingService.updateShippingProvider(id, rests, token)
    }
  )

  const mutationDeleteProvider = useMutationHooks(
    (data) => {
      const { id, token } = data
      return ShippingService.deleteShippingProvider(id, token)
    }
  )

  const mutationRate = useMutationHooks(
    (data) => ShippingService.createShippingRate(data, user?.access_token)
  )

  const mutationUpdateRate = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data
      return ShippingService.updateShippingRate(id, rests, token)
    }
  )

  const mutationDeleteRate = useMutationHooks(
    (data) => {
      const { id, token } = data
      return ShippingService.deleteShippingRate(id, token)
    }
  )

  const mutationUpdateShippingStatus = useMutationHooks(
    (data) => {
      const { id, status, note, trackingNumber, token } = data
      return ShippingService.updateShippingOrderStatus(id, status, note, trackingNumber, token)
    }
  )

  const getSelectedShippingOrder = () => {
    if (!rowSelected || !ordersData?.data) return null
    return ordersData.data.find((o) => o._id === rowSelected) || null
  }

  const resolveTrackingNumber = (record) => {
    if (!record) return ''
    const candidates = [
      record.trackingNumber,
      record.tracking_code,
      record.trackingCode,
      record.tracking?.number,
      record.tracking?.code,
      record.order?.trackingNumber,
      record.order?.tracking_code,
      record.order?.trackingCode,
      record.order?.tracking?.number,
      record.order?.tracking?.code
    ]
    return candidates.find(Boolean) || ''
  }

  // Queries
  const queryProviders = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: () => ShippingService.getAllShippingProviders(user?.access_token)
  })

  const queryRates = useQuery({
    queryKey: ['shipping-rates'],
    queryFn: () => ShippingService.getAllShippingRates({}, user?.access_token)
  })

  const queryShippingOrders = useQuery({
    queryKey: ['shipping-orders'],
    queryFn: () => ShippingService.getAllShippingOrders({}, user?.access_token)
  })

  const { isPending: isPendingProviders, data: providersData } = queryProviders
  const { isPending: isPendingRates, data: ratesData } = queryRates
  const { isPending: isPendingOrders, data: ordersData, refetch: refetchShippingOrders } = queryShippingOrders

  // Sync form với stateProvider khi modal mở
  useEffect(() => {
    if (isModalOpen && stateProvider) {
      providerForm.setFieldsValue(stateProvider)
    }
  }, [isModalOpen])

  // Sync form với stateRate khi drawer mở (chỉ chạy khi mở drawer hoặc khi reset stateRate thủ công)
  useEffect(() => {
    if (isOpenDrawer && stateRate) {
      rateForm.setFieldsValue({
        ...stateRate,
        estimatedDaysMin: stateRate.estimatedDays?.min,
        estimatedDaysMax: stateRate.estimatedDays?.max
      })
    }
  }, [isOpenDrawer]) // Xóa stateRate và rateForm khỏi dependency để tránh reset form khi đang gõ

  useEffect(() => {
    if (activeTab === 'orders') {
      refetchShippingOrders()
    }

    // Reset trạng thái modal/drawer khi chuyển tab
    setIsModalOpenDelete(false)
    setisModalOpen(false)
    setIsOpenDrawer(false)
    setRowSelected('')
  }, [activeTab])


  // ============ PROVIDER HANDLERS ============
  const handleOnchangeLogo = async ({ fileList }) => {
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    const newLogo = file.preview
    setStateProvider({
      ...stateProvider,
      logo: newLogo
    })
    // Sync với form
    providerForm.setFieldsValue({
      logo: newLogo
    })
  }

  const handleCancelProvider = () => {
    setisModalOpen(false)
    setRowSelected('')
    setStateProvider({
      name: '',
      code: '',
      logo: '',
      description: '',
      phone: '',
      email: '',
      website: '',
      isActive: true
    })
    providerForm.resetFields()
  }

  const onFinishProvider = () => {
    if (rowSelected) {
      // Update
      mutationUpdateProvider.mutate(
        { id: rowSelected, token: user?.access_token, ...stateProvider },
        {
          onSuccess: (data) => {
            if (data?.status === 'OK') {
              message.success('Cập nhật nhà vận chuyển thành công')
              handleCancelProvider()
              setRowSelected('')
              queryProviders.refetch()
            } else {
              message.error(data?.message || 'Cập nhật nhà vận chuyển thất bại')
            }
          },
          onError: (error) => {
            message.error(error?.response?.data?.message || 'Cập nhật nhà vận chuyển thất bại')
          }
        }
      )
    } else {
      // Create
      mutationProvider.mutate(stateProvider, {
        onSuccess: (data) => {
          if (data?.status === 'OK') {
            message.success('Tạo nhà vận chuyển thành công')
            handleCancelProvider()
            queryProviders.refetch()
          } else {
            message.error(data?.message || 'Tạo nhà vận chuyển thất bại')
          }
        },
        onError: (error) => {
          message.error(error?.response?.data?.message || 'Tạo nhà vận chuyển thất bại')
        }
      })
    }
  }

  const handleDeleteProvider = () => {
    mutationDeleteProvider.mutate(
      { id: rowSelected, token: user?.access_token },
      {
        onSuccess: (data) => {
          if (data?.status === 'OK') {
            message.success('Xóa nhà vận chuyển thành công')
            setIsModalOpenDelete(false)
            queryProviders.refetch()
          } else {
            message.error(data?.message || 'Xóa nhà vận chuyển thất bại')
          }
        }
      }
    )
  }

  // ============ RATE HANDLERS ============
  const handleCancelRate = () => {
    setIsOpenDrawer(false)
    setRowSelected('')
    setStateRate({
      shippingMethod: 'standard',
      supportedProviders: [],
      name: '',
      code: '',
      description: '',
      fixedPrice: 0,
      estimatedDays: { min: 1, max: 3 },
      freeShippingThreshold: null,
      isActive: true
    })
    rateForm.resetFields()
  }

  const onFinishRate = (values) => {
    // values là dữ liệu ĐÃ QUA VALIDATE từ Form (rất tin cậy)
    const payload = {
      shippingMethod: values.shippingMethod,
      supportedProviders: values.supportedProviders || [],
      name: values.name || values.shippingMethod,
      code: values.code || values.shippingMethod.toUpperCase(),
      description: values.description || '',
      fixedPrice: values.fixedPrice || 0,
      estimatedDays: {
        min: values.estimatedDaysMin || 1,
        max: values.estimatedDaysMax || 3
      },
      freeShippingThreshold: values.freeShippingThreshold || null,
      isActive: values.isActive !== undefined ? values.isActive : true
    }

    console.log('Payload gửi đi:', payload) // để debug

    if (rowSelected) {
      // Update
      mutationUpdateRate.mutate(
        { id: rowSelected, token: user?.access_token, ...payload },
        {
          onSuccess: (data) => {
            if (data?.status === 'OK') {
              message.success('Cập nhật bảng phí thành công')
              handleCancelRate()
              setRowSelected('')
              queryRates.refetch()
            } else {
              message.error(data?.message || 'Cập nhật bảng phí thất bại')
            }
          },
          onError: (error) => {
            message.error(error?.response?.data?.message || 'Cập nhật bảng phí thất bại')
          }
        }
      )
    } else {
      // Create
      mutationRate.mutate(payload, {
        onSuccess: (data) => {
          if (data?.status === 'OK') {
            message.success('Tạo bảng phí thành công')
            handleCancelRate()
            queryRates.refetch()
          } else {
            message.error(data?.message || 'Tạo bảng phí thất bại')
          }
        },
        onError: (error) => {
          message.error(error?.response?.data?.message || 'Tạo bảng phí thất bại')
        }
      })
    }
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
    message.error('Vui lòng kiểm tra lại các trường bắt buộc!')
  }

  const handleDeleteRate = () => {
    mutationDeleteRate.mutate(
      { id: rowSelected, token: user?.access_token },
      {
        onSuccess: (data) => {
          if (data?.status === 'OK') {
            message.success('Xóa bảng phí thành công')
            setIsModalOpenDelete(false)
            queryRates.refetch()
          } else {
            message.error(data?.message || 'Xóa bảng phí thất bại')
          }
        }
      }
    )
  }

  // ============ SHIPPING ORDER STATUS ============
  const handleUpdateShippingStatus = () => {
    statusForm.validateFields().then(values => {
      const currentOrder = getSelectedShippingOrder()
      mutationUpdateShippingStatus.mutate(
        {
          id: rowSelected,
          status: values.status,
          note: values.note,
          trackingNumber: values.trackingNumber || resolveTrackingNumber(currentOrder) || null,
          token: user?.access_token
        },
        {
          onSuccess: (data) => {
            if (data?.status === 'OK') {
              message.success('Cập nhật trạng thái vận chuyển thành công')
              setIsModalStatus(false)
              statusForm.resetFields()
              refetchShippingOrders()
              queryClient.invalidateQueries({ queryKey: ['orders'] })
            } else {
              message.error(data?.message || 'Cập nhật thất bại')
            }
          }
        }
      )
    })
  }

  // Cập nhật trạng thái vận chuyển và đồng bộ trạng thái đơn hàng
  const handleUpdateShippingStatusSync = async (record, newStatus) => {
    try {
      const updatedData = {
        orderId: record.order?._id,
        shippingMethod: record.shippingMethod, // Đồng bộ phương thức giao hàng
        status: newStatus
      };
      await mutationUpdateShippingStatus.mutateAsync(updatedData);
      message.success('Cập nhật trạng thái giao hàng thành công!');
    } catch (error) {
      message.error('Cập nhật trạng thái giao hàng thất bại!');
    }
  };

  // Provider columns
  const providerColumns = [
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      width: 100,
      render: (logo) => (
        logo ? (
          <img
            src={logo}
            alt="logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
              padding: '4px',
              backgroundColor: '#fff'
            }}
          />
        ) : (
          <span style={{ color: '#999' }}>Chưa có logo</span>
        )
      )
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <EditOutlined
            style={{ color: 'blue', fontSize: '20px', cursor: 'pointer' }}
            onClick={() => {
              setRowSelected(record._id)
              const providerData = {
                ...record,
                isActive: record.isActive !== undefined ? record.isActive : true
              }
              setStateProvider(providerData)
              providerForm.setFieldsValue(providerData)
              setisModalOpen(true)
            }}
          />
          <DeleteOutlined
            style={{ color: 'red', fontSize: '20px', cursor: 'pointer' }}
            onClick={() => {
              setRowSelected(record._id)
              setIsModalOpenDelete(true)
            }}
          />
        </Space>
      )
    }
  ]

  // Rate columns
  const rateColumns = [
    {
      title: 'Phương thức',
      dataIndex: 'shippingMethod',
      key: 'shippingMethod',
      render: (method) => {
        const map = { standard: 'Standard', express: 'Express', fast: 'Fast', custom: 'Custom' }
        return map[method] || method || 'N/A'
      }
    },
    {
      title: 'Nhà vận chuyển hỗ trợ',
      dataIndex: 'supportedProviders',
      key: 'supportedProviders',
      render: (providers) => {
        if (!providers || providers.length === 0) return 'N/A'
        return providers.map(p => p?.name || p).join(', ')
      }
    },
    {
      title: 'Phí cố định',
      dataIndex: 'fixedPrice',
      key: 'fixedPrice',
      render: (price) => convertPrice(price || 0)
    },
    {
      title: 'Thời gian (ngày)',
      dataIndex: 'estimatedDays',
      key: 'estimatedDays',
      render: (days) => days ? `${days.min}-${days.max}` : 'N/A'
    },
    {
      title: 'Miễn phí từ',
      dataIndex: 'freeShippingThreshold',
      key: 'freeShippingThreshold',
      render: (value) => value ? convertPrice(value) : 'Không'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <EditOutlined
            style={{ color: 'blue', fontSize: '20px', cursor: 'pointer' }}
            onClick={() => {
              setRowSelected(record._id)
              const rateData = {
                ...record,
                shippingMethod: record.shippingMethod || 'standard',
                supportedProviders: (record.supportedProviders || []).map(p => p?._id || p),
                estimatedDaysMin: record.estimatedDays?.min || 1,
                estimatedDaysMax: record.estimatedDays?.max || 3
              }
              setStateRate(rateData)
              rateForm.setFieldsValue({
                shippingMethod: rateData.shippingMethod,
                supportedProviders: rateData.supportedProviders,
                fixedPrice: rateData.fixedPrice,
                freeShippingThreshold: rateData.freeShippingThreshold,
                estimatedDaysMin: rateData.estimatedDaysMin,
                estimatedDaysMax: rateData.estimatedDaysMax,
                isActive: rateData.isActive
              })
              setIsOpenDrawer(true)
            }}
          />
          <DeleteOutlined
            style={{ color: 'red', fontSize: '20px', cursor: 'pointer' }}
            onClick={() => {
              setRowSelected(record._id)
              setIsModalOpenDelete(true)
            }}
          />
        </Space>
      )
    }
  ]

  // Shipping Order columns
  const shippingOrderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order',
      key: 'order',
      render: (order) => order?._id?.substring(0, 8) || 'N/A'
    },
    {
      title: 'Phương thức',
      dataIndex: 'shippingMethod',
      key: 'shippingMethod',
      render: (method) => {
        switch (method) {
          case 'express':
            return 'Giao nhanh';
          case 'fast':
            return 'Giao hoả tốc';
          case 'standard':
            return 'Giao tiêu chuẩn';
          default:
            return 'Không xác định';
        }
      }
    },
    {
      title: 'Nhà vận chuyển',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider) => provider?.name || 'N/A'
    },
    {
      title: 'Mã vận đơn',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      render: (tracking, record) => {
        const value = tracking || resolveTrackingNumber(record)
        return value ? (
          <Tag color="blue" style={{ borderRadius: '4px', fontWeight: '500' }}>
            {value}
          </Tag>
        ) : (
          <Tag style={{ borderRadius: '4px', fontWeight: '500' }}>Chưa có</Tag>
        )
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'pending': { text: 'Chờ lấy hàng', color: 'orange' },
          'picked_up': { text: 'Đã lấy hàng', color: 'blue' },
          'in_transit': { text: 'Đang vận chuyển', color: 'cyan' },
          'out_for_delivery': { text: 'Đang giao hàng', color: 'purple' },
          'delivered': { text: 'Đã giao hàng', color: 'green' },
          'failed': { text: 'Giao thất bại', color: 'red' },
          'returned': { text: 'Đã trả hàng', color: 'volcano' },
          'cancelled': { text: 'Đã hủy', color: 'default' }
        }
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: 'Phí ship',
      dataIndex: 'shippingPrice',
      key: 'shippingPrice',
      render: (price) => convertPrice(price || 0)
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setRowSelected(record._id)
            statusForm.setFieldsValue({
              status: record.status,
              trackingNumber: resolveTrackingNumber(record),
              note: ''
            })
            setIsModalStatus(true)
          }}
        >
          Cập nhật
        </Button>
      )
    }
  ]

  return (
    <PageContainer>
      <WrapperHeader>Quản lý Vận chuyển</WrapperHeader>

      <SectionCard>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'providers',
              label: (
                <span>
                  <TruckOutlined /> Nhà vận chuyển
                </span>
              ),
              children: (
                <div>
                  <SectionHeader>
                    <div>
                      <SectionTitle>Danh sách nhà vận chuyển</SectionTitle>

                    </div>
                    <ActionGroup>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setRowSelected('')
                          setStateProvider({
                            name: '',
                            code: '',
                            logo: '',
                            description: '',
                            phone: '',
                            email: '',
                            website: '',
                            isActive: true
                          })
                          setisModalOpen(true)
                        }}
                      >
                        Tạo nhà vận chuyển
                      </Button>
                    </ActionGroup>
                  </SectionHeader>

                  <TableComponent
                    columns={providerColumns}
                    isPending={isPendingProviders}
                    data={providersData?.data?.map(item => ({ ...item, key: item._id }))}
                  />

                  <ModalComponent
                    title={rowSelected ? "Cập nhật nhà vận chuyển" : "Tạo nhà vận chuyển"}
                    open={isModalOpen}
                    onCancel={handleCancelProvider}
                    footer={null}
                    width={800}
                  >
                    <Form
                      form={providerForm}
                      layout="vertical"
                      onFinish={onFinishProvider}
                    >
                      <Form.Item label="Tên nhà vận chuyển" name="name" rules={[{ required: true }]}>
                        <Inputcomponent
                          value={stateProvider.name}
                          onChange={(e) => setStateProvider({ ...stateProvider, name: e.target.value })}
                          name="name"
                        />
                      </Form.Item>

                      <Form.Item label="Mã code" name="code" rules={[{ required: true }]}>
                        <Inputcomponent
                          value={stateProvider.code}
                          onChange={(e) => setStateProvider({ ...stateProvider, code: e.target.value.toUpperCase() })}
                          name="code"
                        />
                      </Form.Item>

                      <Form.Item label="Logo" name="logo">
                        <div>
                          <WrapperUploadFile onChange={handleOnchangeLogo} maxCount={1}>
                            <Button icon={<PlusOutlined />}>Chọn ảnh từ máy tính</Button>
                          </WrapperUploadFile>
                          {stateProvider?.logo && (
                            <div style={{ marginTop: '12px' }}>
                              <img
                                src={stateProvider?.logo}
                                style={{
                                  height: '100px',
                                  width: '100px',
                                  borderRadius: '8px',
                                  objectFit: 'contain',
                                  border: '1px solid #d9d9d9',
                                  padding: '4px',
                                  backgroundColor: '#fafafa'
                                }}
                                alt="logo"
                              />
                            </div>
                          )}
                          <div style={{ marginTop: '12px' }}>
                            <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>
                              Hoặc nhập URL logo:
                            </div>
                            <Inputcomponent
                              value={stateProvider.logo}
                              onChange={(e) => setStateProvider({ ...stateProvider, logo: e.target.value })}
                              name="logoUrl"
                              placeholder="https://example.com/logo.png"
                            />
                          </div>
                        </div>
                      </Form.Item>

                      <Form.Item label="Mô tả" name="description">
                        <TextArea
                          value={stateProvider.description}
                          onChange={(e) => setStateProvider({ ...stateProvider, description: e.target.value })}
                          rows={3}
                        />
                      </Form.Item>

                      <Form.Item label="Số điện thoại" name="phone">
                        <Inputcomponent
                          value={stateProvider.phone}
                          onChange={(e) => setStateProvider({ ...stateProvider, phone: e.target.value })}
                          name="phone"
                        />
                      </Form.Item>

                      <Form.Item label="Email" name="email">
                        <Inputcomponent
                          value={stateProvider.email}
                          onChange={(e) => setStateProvider({ ...stateProvider, email: e.target.value })}
                          name="email"
                        />
                      </Form.Item>

                      <Form.Item label="Website" name="website">
                        <Inputcomponent
                          value={stateProvider.website}
                          onChange={(e) => setStateProvider({ ...stateProvider, website: e.target.value })}
                          name="website"
                        />
                      </Form.Item>

                      <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
                        <Switch
                          checked={stateProvider.isActive}
                          onChange={(checked) => setStateProvider({ ...stateProvider, isActive: checked })}
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button type="primary" htmlType="submit" loading={mutationProvider.isPending}>
                          {rowSelected ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                      </Form.Item>
                    </Form>
                  </ModalComponent>
                </div>
              )
            },
            {
              key: 'rates',
              label: (
                <span>
                  <DollarOutlined /> Phương thức vận chuyển
                </span>
              ),
              children: (
                <div>
                  <SectionHeader>
                    <div>
                      <SectionTitle>Phương thức & bảng phí</SectionTitle>

                    </div>
                    <ActionGroup>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setRowSelected('')
                          setStateRate({
                            shippingMethod: 'standard',
                            supportedProviders: [],
                            name: '',
                            code: '',
                            description: '',
                            fixedPrice: 0,
                            estimatedDays: { min: 1, max: 3 },
                            freeShippingThreshold: null,
                            isActive: true
                          })
                          setIsOpenDrawer(true)
                        }}
                      >
                        Tạo phương thức
                      </Button>
                    </ActionGroup>
                  </SectionHeader>

                  <TableComponent
                    columns={rateColumns}
                    isPending={isPendingRates}
                    data={ratesData?.data?.map(item => ({ ...item, key: item._id }))}
                  />

                  <DrawerComponent
                    title={rowSelected ? "Cập nhật phương thức vận chuyển" : "Tạo phương thức vận chuyển"}
                    isOpen={isOpenDrawer}
                    onClose={handleCancelRate}
                    width="90%"
                  >
                    <Form
                      form={rateForm}
                      layout="vertical"
                      onFinish={onFinishRate}
                      onFinishFailed={onFinishFailed}
                    >
                      <Form.Item label="Phương thức vận chuyển" name="shippingMethod" rules={[{ required: true, message: 'Chọn phương thức vận chuyển' }]}>
                        <Select
                          onChange={(value) => setStateRate({ ...stateRate, shippingMethod: value })}
                          placeholder="Chọn phương thức (Standard/Express/Fast)"
                        >
                          <Option value="standard">Standard</Option>
                          <Option value="express">Express</Option>
                          <Option value="fast">Fast</Option>
                          <Option value="custom">Custom</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item label="Danh sách nhà vận chuyển hỗ trợ" name="supportedProviders" rules={[{ required: true, message: 'Chọn ít nhất 1 nhà vận chuyển' }]}>
                        <Select
                          mode="multiple"
                          onChange={(value) => setStateRate({ ...stateRate, supportedProviders: value })}
                          placeholder="Chọn nhà vận chuyển hỗ trợ"
                        >
                          {providersData?.data?.map(provider => (
                            <Option key={provider._id} value={provider._id}>
                              {provider.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item label="Phí cố định (VNĐ)" name="fixedPrice" rules={[{ required: true, message: 'Vui lòng nhập phí cố định!' }]}>
                        <InputNumber
                          min={0}
                          style={{ width: '100%' }}
                          onChange={(value) => setStateRate({ ...stateRate, fixedPrice: value || 0 })}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                          parser={(value) => value.replace(/\$\s?|(\.*)/g, '')}
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="Thời gian tối thiểu (ngày)" name="estimatedDaysMin" rules={[{ required: true, message: 'Bắt buộc' }]}>
                            <InputNumber
                              onChange={(value) => setStateRate({
                                ...stateRate,
                                estimatedDays: { ...stateRate.estimatedDays, min: value || 1 }
                              })}
                              min={1}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Thời gian tối đa (ngày)" name="estimatedDaysMax" rules={[{ required: true, message: 'Bắt buộc' }]}>
                            <InputNumber
                              onChange={(value) => setStateRate({
                                ...stateRate,
                                estimatedDays: { ...stateRate.estimatedDays, max: value || 3 }
                              })}
                              min={1}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="Miễn phí ship từ (VNĐ)" name="freeShippingThreshold">
                        <InputNumber
                          onChange={(value) => setStateRate({ ...stateRate, freeShippingThreshold: value || null })}
                          min={0}
                          style={{ width: '100%' }}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                          parser={(value) => value.replace(/\$\s?|(\.*)/g, '')}
                          placeholder="Để trống nếu không có"
                        />
                      </Form.Item>

                      <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
                        <Switch
                          onChange={(checked) => setStateRate({ ...stateRate, isActive: checked })}
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button type="primary" htmlType="submit" loading={mutationRate.isPending}>
                          {rowSelected ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                      </Form.Item>
                    </Form>
                  </DrawerComponent>
                </div>
              )
            },
            {
              key: 'orders',
              label: (
                <span>
                  <FileTextOutlined /> Vận đơn
                </span>
              ),
              children: (
                <div style={{ marginTop: '8px' }}>
                  <SectionHeader>
                    <div>
                      <SectionTitle>Vận đơn</SectionTitle>

                    </div>
                  </SectionHeader>
                  <TableComponent
                    columns={shippingOrderColumns}
                    isPending={isPendingOrders}
                    data={ordersData?.data?.map(item => {
                      const tracking = resolveTrackingNumber(item)
                      return { ...item, key: item._id, trackingNumber: tracking }
                    })}
                  />

                  <ModalComponent
                    title="Cập nhật trạng thái vận chuyển"
                    open={isModalStatus}
                    onCancel={() => {
                      setIsModalStatus(false)
                      statusForm.resetFields()
                    }}
                    onOk={handleUpdateShippingStatus}
                    okText="Cập nhật"
                    width={600}
                  >
                    <Form form={statusForm} layout="vertical">
                      <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
                        {(() => {
                          const currentOrder = getSelectedShippingOrder()
                          const currentShipStatus = currentOrder?.status
                          // If unknown current status, allow all options
                          const allowed = currentShipStatus ? (ALLOWED_SHIP_TRANSITIONS[currentShipStatus] || []) : Object.keys(ALLOWED_SHIP_TRANSITIONS).reduce((acc, k) => acc.concat(ALLOWED_SHIP_TRANSITIONS[k]), [])
                          return (
                            <Select placeholder="Chọn trạng thái">
                              <Option value="pending" disabled={!allowed.includes('pending')}>Chờ lấy hàng</Option>
                              <Option value="picked_up" disabled={!allowed.includes('picked_up')}>Đã lấy hàng</Option>
                              <Option value="in_transit" disabled={!allowed.includes('in_transit')}>Đang vận chuyển</Option>
                              <Option value="out_for_delivery" disabled={!allowed.includes('out_for_delivery')}>Đang giao hàng</Option>
                              <Option value="delivered" disabled={!allowed.includes('delivered')}>Đã giao hàng</Option>
                              <Option value="failed" disabled={!allowed.includes('failed')}>Giao thất bại</Option>
                              <Option value="returned" disabled={!allowed.includes('returned')}>Đã trả hàng</Option>
                              <Option value="cancelled" disabled={!allowed.includes('cancelled')}>Đã hủy</Option>
                            </Select>
                          )
                        })()}
                      </Form.Item>

                      <Form.Item label="Mã vận đơn" name="trackingNumber">
                        <Input
                          disabled
                          readOnly
                          placeholder="Chưa có"
                        />
                      </Form.Item>

                      <Form.Item label="Ghi chú" name="note">
                        <TextArea rows={3} placeholder="Ghi chú (tùy chọn)" />
                      </Form.Item>
                    </Form>
                  </ModalComponent>
                </div>
              )
            }
          ]}
        />
      </SectionCard>

      {/* Modal Delete */}
      <ModalComponent
        title="Xác nhận xóa"
        open={isModalOpenDelete}
        onCancel={() => setIsModalOpenDelete(false)}
        onOk={activeTab === 'providers' ? handleDeleteProvider : handleDeleteRate}
      >
        <div>Bạn có chắc muốn xóa?</div>
      </ModalComponent>
    </PageContainer>
  )
}

export default AdminShipping
