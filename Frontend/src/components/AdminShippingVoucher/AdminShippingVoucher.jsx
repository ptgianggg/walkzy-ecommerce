import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Button, Form, Input, Space, Select, DatePicker, InputNumber, Switch, Tag, Tabs } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as ShippingVoucherService from '../../services/ShippingVoucherService'
import * as ShippingService from '../../services/ShippingService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'
import dayjs from 'dayjs'
import { Section, CardGrid, QuickCard, TabWrap, TableShell, TableHeader, EmptyWrap } from './style'

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminShippingVoucher = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'percentage', 'fixed', 'free'
  const [refreshKey, setRefreshKey] = useState(0)
  const user = useSelector((state) => state?.user)
  const searchInput = useRef(null);

  const initial = () => ({
    name: '',
    code: '',
    description: '',
    type: 'percentage', // 'percentage', 'fixed', 'free'
    value: 0,
    minPurchase: 0,
    maxDiscount: null,
    shippingProviders: [],
    startDate: null,
    endDate: null,
    usageLimit: null,
    userLimit: 1,
    isActive: true
  })

  const [stateShippingVoucher, setStateShippingVoucher] = useState(initial())
  const [stateShippingVoucherDetails, setStateShippingVoucherDetails] = useState(initial())
  const [form] = Form.useForm();

  // Queries
  const getAllShippingVouchers = async () => {
    try {
      const res = await ShippingVoucherService.getAllShippingVoucher(user?.access_token);
      if (res?.status === 'OK' && res?.data) {
        return res;
      }
      return { status: 'OK', data: [] };
    } catch (error) {
      console.error('Error fetching shipping vouchers:', error);
      return { status: 'OK', data: [] };
    }
  };

  const queryShippingVoucher = useQuery({
    queryKey: ['shipping-vouchers'],
    queryFn: getAllShippingVouchers,
    enabled: !!user?.access_token
  });

  const { isPending: isPendingShippingVoucher, data: shippingVouchers } = queryShippingVoucher

  // Shipping Providers query
  const { data: shippingProvidersData } = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: () => ShippingService.getAllShippingProviders(user?.access_token),
    enabled: !!user?.access_token
  });

  // Mutations
  const mutation = useMutationHooks(
    (data) => ShippingVoucherService.createShippingVoucher(data, user?.access_token)
  )

  const mutationUpdate = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data
      return ShippingVoucherService.updateShippingVoucher(id, token, rests)
    },
  )

  const mutationDeleted = useMutationHooks(
    (data) => {
      const { id, token } = data
      return ShippingVoucherService.deleteShippingVoucher(id, token)
    },
  )

  const { data: dataSV, isPending: isPendingSV, isSuccess: isSuccessSV, isError: isErrorSV } = mutation
  const { data: dataUpdatedSV, isPending: isPendingUpdatedSV, isSuccess: isSuccessUpdatedSV, isError: isErrorUpdatedSV } = mutationUpdate
  const { data: dataDeletedSV, isPending: isPendingDeletedSV, isSuccess: isSuccessDeletedSV, isError: isErrorDeletedSV } = mutationDeleted

  // Handlers
  const handleDetailsShippingVoucher = async (voucherId) => {
    const id = voucherId || rowSelected
    if (!id) return

    setIsPendingUpdate(true)
    try {
      const res = await ShippingVoucherService.getDetailsShippingVoucher(id, user?.access_token)
      if (res?.data) {
        const data = res.data
        const stateData = {
          name: data.name || '',
          code: data.code || '',
          description: data.description || '',
          type: data.type || 'percentage',
          value: data.value || 0,
          minPurchase: data.minPurchase || 0,
          maxDiscount: data.maxDiscount || null,
          shippingProviders: data.shippingProviders?.map(p => (typeof p === 'object' ? p._id : p)) || [],
          startDate: data.startDate ? dayjs(data.startDate) : null,
          endDate: data.endDate ? dayjs(data.endDate) : null,
          usageLimit: data.usageLimit || null,
          userLimit: data.userLimit || 1,
          isActive: data.isActive !== undefined ? data.isActive : true
        }

        // Update state - useEffect sẽ tự động populate form
        setStateShippingVoucherDetails(stateData)
      }
    } catch (error) {
      console.error('Error fetching shipping voucher details:', error)
      message.error('Lỗi khi tải thông tin voucher')
    } finally {
      setIsPendingUpdate(false)
    }
  }

  const handleOnchange = (e) => {
    if (e.target) {
      setStateShippingVoucher({
        ...stateShippingVoucher,
        [e.target.name]: e.target.value
      })
    } else {
      setStateShippingVoucher({
        ...stateShippingVoucher,
        [e.name]: e.value || e
      })
    }
  }

  const handleOnchangeDetails = (e) => {
    if (e.target) {
      setStateShippingVoucherDetails({
        ...stateShippingVoucherDetails,
        [e.target.name]: e.target.value
      })
    } else {
      setStateShippingVoucherDetails({
        ...stateShippingVoucherDetails,
        [e.name]: e.value || e
      })
    }
  }

  const onFinish = () => {
    const submitData = {
      ...stateShippingVoucher,
      startDate: stateShippingVoucher.startDate ? dayjs(stateShippingVoucher.startDate).toDate().toISOString() : null,
      endDate: stateShippingVoucher.endDate ? dayjs(stateShippingVoucher.endDate).toDate().toISOString() : null,
    }
    mutation.mutate(submitData, {
      onSettled: () => {
        queryShippingVoucher.refetch()
      }
    })
  }

  const onUpdateShippingVoucher = () => {
    // Loại bỏ usageCount và totalDiscountAmount khỏi data update (được quản lý tự động bởi backend)
    const { usageCount, totalDiscountAmount, ...dataWithoutUsageFields } = stateShippingVoucherDetails;

    const submitData = {
      ...dataWithoutUsageFields,
      startDate: stateShippingVoucherDetails.startDate ? dayjs(stateShippingVoucherDetails.startDate).toDate().toISOString() : null,
      endDate: stateShippingVoucherDetails.endDate ? dayjs(stateShippingVoucherDetails.endDate).toDate().toISOString() : null,
    }
    mutationUpdate.mutate({ id: rowSelected, token: user?.access_token, ...submitData }, {
      onSettled: () => {
        queryShippingVoucher.refetch()
      }
    })
  }

  const handleDeleteShippingVoucher = () => {
    mutationDeleted.mutate({ id: rowSelected, token: user?.access_token }, {
      onSettled: () => {
        queryShippingVoucher.refetch()
      }
    })
  }

  const handleCancel = () => {
    setIsModalOpen(false);
    setStateShippingVoucher(initial())
    form.resetFields()
  }

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false);
  };

  useEffect(() => {
    if (isSuccessSV) {
      if (dataSV?.status === 'OK') {
        message.success('Tạo voucher vận chuyển thành công!')
        handleCancel()
        queryShippingVoucher.refetch()
      } else {
        message.error(dataSV?.message || 'Tạo voucher vận chuyển thất bại!')
      }
    } else if (isErrorSV) {
      message.error('Lỗi khi kết nối đến máy chủ!')
    }
  }, [isSuccessSV, isErrorSV, dataSV])

  useEffect(() => {
    if (isSuccessDeletedSV) {
      if (dataDeletedSV?.status === 'OK') {
        message.success('Xóa voucher vận chuyển thành công!')
        handleCancelDelete()
        queryShippingVoucher.refetch()
      } else {
        message.error(dataDeletedSV?.message || 'Xóa voucher vận chuyển thất bại!')
      }
    } else if (isErrorDeletedSV) {
      message.error('Lỗi khi xóa voucher vận chuyển!')
    }
  }, [isSuccessDeletedSV, isErrorDeletedSV, dataDeletedSV])

  useEffect(() => {
    if (isSuccessUpdatedSV) {
      if (dataUpdatedSV?.status === 'OK') {
        message.success('Cập nhật voucher vận chuyển thành công!')
        handleCloseDrawer()
        queryShippingVoucher.refetch()
      } else {
        message.error(dataUpdatedSV?.message || 'Cập nhật voucher vận chuyển thất bại!')
      }
    } else if (isErrorUpdatedSV) {
      message.error('Lỗi khi cập nhật voucher vận chuyển!')
    }
  }, [isSuccessUpdatedSV, isErrorUpdatedSV, dataUpdatedSV])

  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      // Chỉ load data khi drawer mở và có rowSelected
      handleDetailsShippingVoucher(rowSelected)
    }
  }, [rowSelected, isOpenDrawer])

  // Reset form và state khi drawer đóng
  useEffect(() => {
    if (!isOpenDrawer) {
      setStateShippingVoucherDetails(initial())
      form.resetFields()
    }
  }, [isOpenDrawer])

  // Populate form khi stateShippingVoucherDetails thay đổi và drawer đang mở
  useEffect(() => {
    if (isOpenDrawer && stateShippingVoucherDetails.name) {
      // Delay nhỏ để đảm bảo form đã render hoàn toàn
      const timer = setTimeout(() => {
        form.setFieldsValue({
          name: stateShippingVoucherDetails.name,
          code: stateShippingVoucherDetails.code,
          description: stateShippingVoucherDetails.description,
          type: stateShippingVoucherDetails.type,
          value: stateShippingVoucherDetails.value,
          minPurchase: stateShippingVoucherDetails.minPurchase,
          maxDiscount: stateShippingVoucherDetails.maxDiscount,
          shippingProviders: stateShippingVoucherDetails.shippingProviders,
          dateRange: stateShippingVoucherDetails.startDate && stateShippingVoucherDetails.endDate
            ? [stateShippingVoucherDetails.startDate, stateShippingVoucherDetails.endDate]
            : null,
          usageLimit: stateShippingVoucherDetails.usageLimit,
          userLimit: stateShippingVoucherDetails.userLimit,
          isActive: stateShippingVoucherDetails.isActive
        })
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [stateShippingVoucherDetails, isOpenDrawer])

  // Table columns
  const renderAction = (_, record) => {
    return (
      <Space size="middle">
        <EditOutlined
          style={{ color: '#1890ff', fontSize: '20px', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            setRowSelected(record._id)
            setIsOpenDrawer(true)
          }}
        />
        <DeleteOutlined
          style={{ color: '#ff4d4f', fontSize: '20px', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            setRowSelected(record._id)
            setIsModalOpenDelete(true)
          }}
        />
      </Space>
    )
  }

  const columns = [
    {
      title: 'Tên voucher',
      dataIndex: 'name',
      sorter: (a, b) => a.name?.length - b.name?.length,
    },
    {
      title: 'Mã voucher',
      dataIndex: 'code',
      render: (code) => code ? <Tag color="blue">{code}</Tag> : '-'
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (type) => {
        const typeMap = {
          'percentage': { label: 'Giảm %', color: 'green' },
          'fixed': { label: 'Giảm tiền', color: 'blue' },
          'free': { label: 'Miễn phí ship', color: 'orange' }
        }
        const typeInfo = typeMap[type] || { label: type, color: 'default' }
        return <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
      }
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      render: (value, record) => {
        if (record.type === 'free') return <Tag color="orange">Miễn phí</Tag>
        if (record.type === 'percentage') return `${value}%`
        return `${value.toLocaleString()} VNĐ`
      }
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'minPurchase',
      render: (minPurchase) => minPurchase > 0 ? `${minPurchase.toLocaleString()} VNĐ` : 'Không'
    },
    {
      title: 'Nhà vận chuyển',
      dataIndex: 'shippingProviders',
      render: (providers) => {
        if (!providers || providers.length === 0) return <Tag color="default">Tất cả</Tag>
        return (
          <Space>
            {providers.map((p, idx) => (
              <Tag key={idx} color="cyan">{typeof p === 'object' ? p.name : p}</Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: 'Thời gian',
      dataIndex: 'dateRange',
      render: (_, record) => {
        const start = record.startDate ? dayjs(record.startDate).format('DD/MM/YYYY') : '-'
        const end = record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : '-'
        return `${start} - ${end}`
      }
    },
    {
      title: 'Đã dùng',
      dataIndex: 'usageCount',
      render: (_, record) => {
        const usageLimit = record.usageLimit || null
        const usageCount = record.usageCount || 0

        if (!usageLimit) {
          return <span style={{ color: '#999' }}>-</span>
        }

        return (
          <span style={{ fontWeight: 500 }}>
            {usageCount.toLocaleString()} / {usageLimit.toLocaleString()}
          </span>
        )
      },
      sorter: (a, b) => {
        const countA = a.usageCount || 0
        const countB = b.usageCount || 0
        return countA - countB
      }
    },
    {
      title: 'Còn lại',
      dataIndex: 'remaining',
      render: (_, record) => {
        const usageLimit = record.usageLimit || null
        const usageCount = record.usageCount || 0

        if (!usageLimit) {
          return <Tag color="default">Không giới hạn</Tag>
        }

        const remaining = usageLimit - usageCount
        if (remaining <= 0) {
          return (
            <Tag color="red" style={{ fontWeight: 'bold' }}>
              Hết ({usageCount.toLocaleString()}/{usageLimit.toLocaleString()})
            </Tag>
          )
        }

        return (
          <Tag color={remaining <= 10 ? 'orange' : 'green'} style={{ fontWeight: 'bold' }}>
            {remaining.toLocaleString()} / {usageLimit.toLocaleString()}
          </Tag>
        )
      },
      sorter: (a, b) => {
        const getRemaining = (record) => {
          if (!record.usageLimit) return Infinity
          return (record.usageLimit || 0) - (record.usageCount || 0)
        }
        return getRemaining(a) - getRemaining(b)
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (isActive) => isActive ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Tạm dừng</Tag>
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      render: renderAction
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: 'Tất cả',
      children: null
    },
    {
      key: 'percentage',
      label: 'Giảm %',
      children: null
    },
    {
      key: 'fixed',
      label: 'Giảm tiền',
      children: null
    },
    {
      key: 'free',
      label: 'Miễn phí ship',
      children: null
    }
  ];

  const dataTable = useMemo(() => {
    if (!shippingVouchers || !shippingVouchers.data) return [];
    let vouchersList = Array.isArray(shippingVouchers.data) ? shippingVouchers.data : [];

    // Filter theo tab
    if (activeTab !== 'all') {
      vouchersList = vouchersList.filter(voucher => voucher.type === activeTab);
    }

    return vouchersList.map((voucher) => {
      const usageLimitRaw = voucher.usageLimit ?? voucher.limit ?? voucher.maxUsage
      const usageLimitParsed = Number(usageLimitRaw)
      const usageLimit = Number.isFinite(usageLimitParsed) && usageLimitParsed >= 0 ? usageLimitParsed : null

      const usageCountRaw = voucher.usageCount ?? voucher.usedCount ?? 0
      const usageCountParsed = Number(usageCountRaw)
      const usageCount = Number.isFinite(usageCountParsed) && usageCountParsed >= 0 ? usageCountParsed : 0

      const remaining = usageLimit !== null ? Math.max(usageLimit - usageCount, 0) : null

      return {
        ...voucher,
        key: voucher._id || voucher.id,
        usageLimit,
        usageCount,
        remaining
      }
    });
  }, [shippingVouchers, activeTab, refreshKey]);

  return (
    <Section>
      <CardGrid>
        <QuickCard onClick={() => setIsModalOpen(true)}>
          <div className="icon-pill">
            <PlusOutlined />
          </div>
          <div className="title">Tạo voucher vận chuyển</div>

        </QuickCard>
      </CardGrid>

      <TabWrap>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ flex: 1 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['shipping-vouchers'] })
              queryShippingVoucher.refetch()
              setRefreshKey(prev => prev + 1)
            }}
            loading={isPendingShippingVoucher}
          >
            Làm mới
          </Button>
        </div>
      </TabWrap>

      <TableShell>
        <TableHeader>
          <div>
            <div className="title">Danh sách voucher vận chuyển</div>

          </div>
        </TableHeader>
        <Loading isPending={isPendingShippingVoucher}>
          {dataTable && dataTable.length > 0 ? (
            <TableComponent
              handleDeleteMany={() => { }}
              columns={columns}
              isPending={false}
              data={dataTable}
              onRow={(record) => {
                return {
                  onClick: () => {
                    setRowSelected(record._id)
                  },
                  onDoubleClick: () => {
                    setRowSelected(record._id)
                    setIsOpenDrawer(true)
                  }
                };
              }}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                showTotal: (total) => `${total} voucher`
              }}
            />
          ) : (
            <EmptyWrap>
              {isPendingShippingVoucher ? 'Đang tải dữ liệu...' : `Chưa có voucher vận chuyển loại "${tabItems.find(t => t.key === activeTab)?.label || 'này'}". Tạo mới để bắt đầu.`}
            </EmptyWrap>
          )}
        </Loading>
      </TableShell>

      {/* Create Modal */}
      <ModalComponent
        forceRender
        title="Tạo voucher vận chuyển"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Loading isPending={isPendingSV}>
          <Form
            name="basic"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
            autoComplete="on"
            form={form}
          >
            <Form.Item
              label="Tên voucher"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên voucher!' }]}
            >
              <Inputcomponent
                value={stateShippingVoucher.name}
                onChange={handleOnchange}
                name="name"
              />
            </Form.Item>

            <Form.Item
              label="Mã voucher"
              name="code"
            >
              <Inputcomponent
                value={stateShippingVoucher.code}
                onChange={handleOnchange}
                name="code"
                placeholder="Để trống để tự động tạo mã"
              />
            </Form.Item>

            <Form.Item
              label="Loại voucher"
              name="type"
              rules={[{ required: true }]}
            >
              <Select
                value={stateShippingVoucher.type}
                onChange={(value) => setStateShippingVoucher({ ...stateShippingVoucher, type: value })}
              >
                <Option value="percentage">Giảm phí ship theo %</Option>
                <Option value="fixed">Giảm phí ship theo số tiền</Option>
                <Option value="free">Miễn phí ship</Option>
              </Select>
            </Form.Item>

            {stateShippingVoucher.type !== 'free' && (
              <Form.Item
                label="Giá trị giảm"
                name="value"
                rules={[{ required: true, message: 'Vui lòng nhập giá trị giảm!' }]}
              >
                <InputNumber
                  value={stateShippingVoucher.value}
                  onChange={(value) => setStateShippingVoucher({ ...stateShippingVoucher, value: value || 0 })}
                  style={{ width: '100%' }}
                  min={0}
                  max={stateShippingVoucher.type === 'percentage' ? 100 : undefined}
                  formatter={stateShippingVoucher.type === 'percentage' ? value => `${value}%` : value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder={stateShippingVoucher.type === 'percentage' ? 'Nhập % (0-100)' : 'Nhập số tiền (VNĐ)'}
                />
              </Form.Item>
            )}

            {stateShippingVoucher.type === 'percentage' && (
              <Form.Item
                label="Giảm tối đa"
                name="maxDiscount"
              >
                <InputNumber
                  value={stateShippingVoucher.maxDiscount}
                  onChange={(value) => setStateShippingVoucher({ ...stateShippingVoucher, maxDiscount: value || null })}
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="VNĐ (tùy chọn)"
                />
              </Form.Item>
            )}

            <Form.Item
              label="Đơn hàng tối thiểu"
              name="minPurchase"
            >
              <InputNumber
                value={stateShippingVoucher.minPurchase}
                onChange={(value) => setStateShippingVoucher({ ...stateShippingVoucher, minPurchase: value || 0 })}
                style={{ width: '100%' }}
                min={0}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                placeholder="VNĐ"
              />
            </Form.Item>

            <Form.Item
              label="Nhà vận chuyển"
              name="shippingProviders"
            >
              <Select
                mode="multiple"
                value={stateShippingVoucher.shippingProviders}
                onChange={(value) => setStateShippingVoucher({ ...stateShippingVoucher, shippingProviders: value })}
                placeholder="Chọn nhà vận chuyển (để trống = tất cả)"
                allowClear
              >
                {shippingProvidersData?.data?.map(provider => (
                  <Option key={provider._id} value={provider._id}>{provider.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Thời gian hiệu lực"
              name="dateRange"
              rules={[{ required: true, message: 'Vui lòng chọn thời gian hiệu lực!' }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                value={stateShippingVoucher.startDate && stateShippingVoucher.endDate
                  ? [dayjs(stateShippingVoucher.startDate), dayjs(stateShippingVoucher.endDate)]
                  : null
                }
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setStateShippingVoucher({
                      ...stateShippingVoucher,
                      startDate: dates[0],
                      endDate: dates[1]
                    })
                  } else {
                    setStateShippingVoucher({
                      ...stateShippingVoucher,
                      startDate: null,
                      endDate: null
                    })
                  }
                }}
                showTime
                format="DD/MM/YYYY HH:mm"
              />
            </Form.Item>

            <Form.Item
              label="Giới hạn sử dụng"
              name="usageLimit"
            >
              <InputNumber
                value={stateShippingVoucher.usageLimit}
                onChange={(value) => setStateShippingVoucher({ ...stateShippingVoucher, usageLimit: value || null })}
                style={{ width: '100%' }}
                min={1}
                placeholder="Để trống = không giới hạn"
              />
            </Form.Item>

            <Form.Item
              label="Mỗi user sử dụng tối đa"
              name="userLimit"
            >
              <InputNumber
                value={stateShippingVoucher.userLimit}
                onChange={(value) => setStateShippingVoucher({ ...stateShippingVoucher, userLimit: value || 1 })}
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <TextArea
                value={stateShippingVoucher.description}
                onChange={(e) => setStateShippingVoucher({ ...stateShippingVoucher, description: e.target.value })}
                rows={4}
                placeholder="Mô tả ngắn về voucher"
              />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="isActive"
              valuePropName="checked"
            >
              <Switch
                checked={stateShippingVoucher.isActive}
                onChange={(checked) => setStateShippingVoucher({ ...stateShippingVoucher, isActive: checked })}
              />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Tạo
              </Button>
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>

      {/* Update Drawer */}
      <DrawerComponent
        title='Chi tiết voucher vận chuyển'
        isOpen={isOpenDrawer}
        onClose={handleCloseDrawer}
        width="90%"
      >
        <Loading isPending={isPendingUpdate || isPendingUpdatedSV}>
          <Form
            name="basic"
            labelCol={{ span: 2 }}
            wrapperCol={{ span: 22 }}
            onFinish={onUpdateShippingVoucher}
            autoComplete="on"
            form={form}
          >
            {/* Similar form fields as create modal */}
            <Form.Item
              label="Tên voucher"
              name="name"
              rules={[{ required: true }]}
            >
              <Inputcomponent
                value={stateShippingVoucherDetails.name}
                onChange={handleOnchangeDetails}
                name="name"
              />
            </Form.Item>

            <Form.Item
              label="Mã voucher"
              name="code"
            >
              <Inputcomponent
                value={stateShippingVoucherDetails.code}
                onChange={handleOnchangeDetails}
                name="code"
              />
            </Form.Item>

            <Form.Item
              label="Loại voucher"
              name="type"
              rules={[{ required: true }]}
            >
              <Select
                value={stateShippingVoucherDetails.type}
                onChange={(value) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, type: value })}
              >
                <Option value="percentage">Giảm phí ship theo %</Option>
                <Option value="fixed">Giảm phí ship theo số tiền</Option>
                <Option value="free">Miễn phí ship</Option>
              </Select>
            </Form.Item>

            {stateShippingVoucherDetails.type !== 'free' && (
              <Form.Item
                label="Giá trị giảm"
                name="value"
                rules={[{ required: true }]}
              >
                <InputNumber
                  value={stateShippingVoucherDetails.value}
                  onChange={(value) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, value: value || 0 })}
                  style={{ width: '100%' }}
                  min={0}
                  max={stateShippingVoucherDetails.type === 'percentage' ? 100 : undefined}
                />
              </Form.Item>
            )}

            {stateShippingVoucherDetails.type === 'percentage' && (
              <Form.Item
                label="Giảm tối đa"
                name="maxDiscount"
              >
                <InputNumber
                  value={stateShippingVoucherDetails.maxDiscount}
                  onChange={(value) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, maxDiscount: value || null })}
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            )}

            <Form.Item
              label="Đơn hàng tối thiểu"
              name="minPurchase"
            >
              <InputNumber
                value={stateShippingVoucherDetails.minPurchase}
                onChange={(value) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, minPurchase: value || 0 })}
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>

            <Form.Item
              label="Nhà vận chuyển"
              name="shippingProviders"
            >
              <Select
                mode="multiple"
                value={stateShippingVoucherDetails.shippingProviders}
                onChange={(value) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, shippingProviders: value })}
                placeholder="Chọn nhà vận chuyển (để trống = tất cả)"
                allowClear
              >
                {shippingProvidersData?.data?.map(provider => (
                  <Option key={provider._id} value={provider._id}>{provider.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Thời gian hiệu lực"
              name="dateRange"
              rules={[{ required: true }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                value={stateShippingVoucherDetails.startDate && stateShippingVoucherDetails.endDate
                  ? [dayjs(stateShippingVoucherDetails.startDate), dayjs(stateShippingVoucherDetails.endDate)]
                  : null
                }
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setStateShippingVoucherDetails({
                      ...stateShippingVoucherDetails,
                      startDate: dates[0],
                      endDate: dates[1]
                    })
                  } else {
                    setStateShippingVoucherDetails({
                      ...stateShippingVoucherDetails,
                      startDate: null,
                      endDate: null
                    })
                  }
                }}
                showTime
                format="DD/MM/YYYY HH:mm"
              />
            </Form.Item>

            <Form.Item
              label="Giới hạn sử dụng"
              name="usageLimit"
            >
              <InputNumber
                value={stateShippingVoucherDetails.usageLimit}
                onChange={(value) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, usageLimit: value || null })}
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>

            <Form.Item
              label="Mỗi user sử dụng tối đa"
              name="userLimit"
            >
              <InputNumber
                value={stateShippingVoucherDetails.userLimit}
                onChange={(value) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, userLimit: value || 1 })}
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <TextArea
                value={stateShippingVoucherDetails.description}
                onChange={(e) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, description: e.target.value })}
                rows={4}
              />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="isActive"
              valuePropName="checked"
            >
              <Switch
                checked={stateShippingVoucherDetails.isActive}
                onChange={(checked) => setStateShippingVoucherDetails({ ...stateShippingVoucherDetails, isActive: checked })}
              />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      {/* Delete Modal */}
      <ModalComponent
        title="Xóa voucher vận chuyển"
        open={isModalOpenDelete}
        onOk={handleDeleteShippingVoucher}
        onCancel={handleCancelDelete}
        okText="Xóa"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn xóa voucher vận chuyển này không?</p>
      </ModalComponent>
    </Section>
  )
}

export default AdminShippingVoucher

