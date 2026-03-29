import React, { useEffect, useState } from 'react'
import { Button, Form, Input, Space, Tag, Switch, Tooltip } from 'antd'
import {
  CheckCircleFilled,
  DatabaseOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  StarFilled,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined
} from '@ant-design/icons' 
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import AddressPicker from '../AddressPicker/AddressPicker'
import * as WarehouseService from '../../services/WarehouseService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'
import {
  ActionsBar,
  CardsRow,
  CreateCard,
  FilterChip,
  HeaderActions,
  HeaderSubtitle,
  InlineMuted,
  PageHeader,
  StatCard,
  StatLabel,
  StatTrend,
  StatValue,
  StatusPill,
  StatsGrid,
  TableCard,
  TableHeader,
  TableSubtitle,
  TableTitle,
  WrapperContent,
  WrapperHeader
} from './style'

const { TextArea } = Input

const AdminWarehouse = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [filters, setFilters] = useState({ keyword: '', status: 'all' })
  const user = useSelector((state) => state?.user)

  const initial = () => ({
    name: '',
    code: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    phone: '',
    email: '',
    manager: '',
    description: '',
    isActive: true,
    isDefault: false
  })

  const [stateWarehouse, setStateWarehouse] = useState(initial())
  const [stateWarehouseDetails, setStateWarehouseDetails] = useState(initial())
  const [createForm] = Form.useForm()
  const [updateForm] = Form.useForm()

  const mutation = useMutationHooks((data) => WarehouseService.createWarehouse(data, user?.access_token))

  const mutationUpdate = useMutationHooks((data) => {
    const { id, token, ...rests } = data
    return WarehouseService.updateWarehouse(id, rests, token)
  })

  const mutationDeleted = useMutationHooks((data) => {
    const { id, token } = data
    return WarehouseService.deleteWarehouse(id, token)
  })

  const { data: dataWarehouse, isPending: isPendingWarehouse, isSuccess: isSuccessWarehouse, isError: isErrorWarehouse } = mutation
  const { data: dataUpdated, isPending: isPendingUpdated, isSuccess: isSuccessUpdated, isError: isErrorUpdated } = mutationUpdate
  const { data: dataDeleted, isPending: isPendingDeleted, isSuccess: isSuccessDeleted, isError: isErrorDeleted } = mutationDeleted

  const queryWarehouse = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => WarehouseService.getAllWarehouse(user?.access_token),
    enabled: !!user?.access_token
  })

  const warehouses = queryWarehouse?.data?.data || []
  const totalWarehouses = warehouses.length
  const activeWarehouses = warehouses.filter((w) => w.isActive).length
  const inactiveWarehouses = totalWarehouses - activeWarehouses
  const defaultWarehouses = warehouses.filter((w) => w.isDefault).length
  const cityCoverage = new Set(warehouses.map((w) => (w.city || '').trim()).filter(Boolean)).size
  const defaultWarehouse = warehouses.find((w) => w.isDefault)

  const handleDetailsWarehouse = async () => {
    if (!rowSelected) return
    setIsPendingUpdate(true)
    setIsOpenDrawer(true)
    try {
      const res = await WarehouseService.getDetailsWarehouse(rowSelected, user?.access_token)
      if (res?.data) {
        const data = res.data
        setStateWarehouseDetails(data)
        const addressValue = {
          address: data.address || '',
          city: data.city || '',
          province: data.city || '',
          district: data.district || '',
          ward: data.ward || ''
        }
        setTimeout(() => {
          updateForm.setFieldsValue({
            ...data,
            addressValue
          })
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching warehouse details:', error)
      message.error('Lỗi khi tải thông tin kho')
    } finally {
      setIsPendingUpdate(false)
    }
  }

  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      handleDetailsWarehouse()
    }
  }, [rowSelected, isOpenDrawer])

  useEffect(() => {
    if (isModalOpen) {
      setStateWarehouse(initial())
      createForm.setFieldsValue({
        ...initial(),
        addressValue: {
          address: '',
          city: '',
          district: '',
          ward: ''
        }
      })
    }
  }, [isModalOpen, createForm])

  useEffect(() => {
    if (!isOpenDrawer) {
      setStateWarehouseDetails(initial())
      updateForm.resetFields()
    }
  }, [isOpenDrawer, updateForm])

  const handleOnchange = (e) => {
    if (e.target) {
      setStateWarehouse({
        ...stateWarehouse,
        [e.target.name]: e.target.value
      })
    }
  }

  const handleOnchangeDetails = (e) => {
    if (e.target) {
      setStateWarehouseDetails({
        ...stateWarehouseDetails,
        [e.target.name]: e.target.value
      })
    }
  }

  const onFinish = () => {
    if (!stateWarehouse.name || !stateWarehouse.address || !stateWarehouse.city) {
      message.error('Vui lòng điền đầy đủ thông tin bắt buộc (Tên kho, Địa chỉ, Thành phố)')
      return
    }

    mutation.mutate(stateWarehouse, {
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      }
    })
  }

  const onUpdateWarehouse = () => {
    mutationUpdate.mutate({ id: rowSelected, token: user?.access_token, ...stateWarehouseDetails }, {
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      }
    })
  }

  const handleDeleteWarehouse = () => {
    mutationDeleted.mutate({ id: rowSelected, token: user?.access_token }, {
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      }
    })
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setStateWarehouse(initial())
    createForm.resetFields()
  }

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false)
    setStateWarehouseDetails(initial())
    updateForm.resetFields()
  }

  useEffect(() => {
    if (isSuccessWarehouse) {
      if (dataWarehouse?.status === 'OK') {
        message.success('Tạo kho hàng thành công!')
        handleCancel()
        queryWarehouse.refetch()
      } else {
        message.error(dataWarehouse?.message || 'Tạo kho hàng thất bại!')
      }
    } else if (isErrorWarehouse) {
      message.error(dataWarehouse?.message || 'Tạo kho hàng thất bại!')
    }
  }, [isSuccessWarehouse, isErrorWarehouse, dataWarehouse])

  useEffect(() => {
    if (isSuccessDeleted && dataDeleted?.status === 'OK') {
      message.success('Xóa kho hàng thành công!')
      handleCancelDelete()
      queryWarehouse.refetch()
    } else if (isErrorDeleted) {
      message.error(dataDeleted?.message || 'Xóa kho hàng thất bại!')
    }
  }, [isSuccessDeleted, isErrorDeleted])

  useEffect(() => {
    if (isSuccessUpdated && dataUpdated?.status === 'OK') {
      message.success('Cập nhật kho hàng thành công!')
      handleCloseDrawer()
      queryWarehouse.refetch()
    } else if (isErrorUpdated) {
      message.error('Cập nhật kho hàng thất bại!')
    }
  }, [isSuccessUpdated, isErrorUpdated])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  const renderAction = (_, record) => (
    <Space size="small" onClick={(e) => e.stopPropagation()}>
      <Tooltip title="Chi tiết">
        <Button
          size="small"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            setRowSelected(record._id)
            setIsOpenDrawer(true)
          }}
          aria-label="Chi tiết"
        />
      </Tooltip>
      <Tooltip title="Xóa">
        <Button
          danger
          size="small"
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => {
            setRowSelected(record._id)
            setIsModalOpenDelete(true)
          }}
          aria-label="Xóa kho hàng"
        />
      </Tooltip>
    </Space>
  )

  const columns = [
    {
      title: 'Kho hàng',
      dataIndex: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Space size={8} wrap align="center">
            <DatabaseOutlined style={{ color: '#1d4ed8' }} />
            <span style={{ fontWeight: 700 }}>{text || 'Chưa có tên'}</span>
            {record.isDefault && (
              <Tag color="gold" icon={<StarFilled />}>
                Mặc định
              </Tag>
            )}
          </Space>
        </div>
      )
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      ellipsis: true,
      render: (text, record) => {
        const fullAddress = `${text || ''}${record.ward ? `, ${record.ward}` : ''}${record.district ? `, ${record.district}` : ''}${record.city ? `, ${record.city}` : ''}`.replace(/^,\\s*|,\\s*$/g, '')
        return (
          <div style={{ maxWidth: 320 }}>
            <div style={{ fontWeight: 600 }}>{fullAddress || 'Chưa có địa chỉ'}</div>
            {record.description && <InlineMuted>{record.description}</InlineMuted>}
          </div>
        )
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (isActive, record) => (
        <Space size={8} wrap>
          <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleFilled /> : <StopOutlined />}>
            {isActive ? 'Hoạt động' : 'Tạm dừng'}
          </Tag>
          {record.isDefault && (
            <Tag color="gold" icon={<StarFilled />}>
              Kho mặc định
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      render: renderAction,
      width: 140
    },
  ]

  const keyword = filters.keyword.trim().toLowerCase()
  const filteredWarehouses = warehouses.filter((warehouse) => {
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && warehouse.isActive) ||
      (filters.status === 'inactive' && !warehouse.isActive) ||
      (filters.status === 'default' && warehouse.isDefault)
    const haystack = [
      warehouse.name,
      warehouse.code,
      warehouse.city,
      warehouse.manager,
      warehouse.phone,
      warehouse.email,
      warehouse.address,
      warehouse.district,
      warehouse.ward
    ].map((val) => (val || '').toString().toLowerCase())
    const matchesKeyword = !keyword || haystack.some((v) => v.includes(keyword))
    return matchesStatus && matchesKeyword
  })

  const dataTable = filteredWarehouses.map((warehouse) => ({
    ...warehouse,
    key: warehouse._id || warehouse.id,
  }))

  const noResults = !queryWarehouse.isPending && dataTable.length === 0

  return (
    <WrapperContent>
      <PageHeader>
        <div>
          <WrapperHeader>Quản lý kho hàng</WrapperHeader>
          
         
        </div>
        <HeaderActions>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['warehouses'] })
              queryWarehouse.refetch()
            }}
            loading={queryWarehouse.isPending}
          >
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Tạo kho mới
          </Button>
        </HeaderActions>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <div className="stat-icon" style={{ background: '#1d4ed8' }}>
            <DatabaseOutlined />
          </div>
          <StatLabel>Kho hoạt động</StatLabel>
          <StatValue>{activeWarehouses}</StatValue>
          <StatTrend>Còn {inactiveWarehouses} kho chưa mở</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <CheckCircleFilled />
          </div>
          <StatLabel>Kho mặc định</StatLabel>
          <StatValue>{defaultWarehouses}</StatValue>
          <StatTrend $negative={defaultWarehouses === 0}>{defaultWarehouses > 0 ? 'Đã chọn mặc định' : 'Chưa chọn kho mặc định'}</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#6366f1' }}>
            <EnvironmentOutlined />
          </div>
          <StatLabel>Phạm vi địa lý</StatLabel>
          <StatValue>{cityCoverage}</StatValue>
          <StatTrend>Thành phố / tỉnh</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#ef4444' }}>
            <StopOutlined />
          </div>
          <StatLabel>Kho tạm dừng</StatLabel>
          <StatValue>{inactiveWarehouses}</StatValue>
          <StatTrend $negative={inactiveWarehouses > 0}>{inactiveWarehouses > 0 ? 'Cần xem lại' : 'Tất cả đang mở'}</StatTrend>
        </StatCard>
      </StatsGrid>

      <ActionsBar>
        <Space size="middle" wrap>
          <Input
            allowClear
            placeholder="Tìm kho theo tên, mã, địa chỉ hoặc người phụ trách..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            style={{ width: 320 }}
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
          />
          <Space size={[8, 8]} wrap>
            <FilterChip $active={filters.status === 'all'} onClick={() => handleFilterChange('status', 'all')}>
              Tất cả
            </FilterChip>
            <FilterChip $active={filters.status === 'active'} onClick={() => handleFilterChange('status', 'active')}>
              Hoạt động
            </FilterChip>
            <FilterChip $active={filters.status === 'inactive'} onClick={() => handleFilterChange('status', 'inactive')}>
              Tạm dừng
            </FilterChip>
            <FilterChip $active={filters.status === 'default'} onClick={() => handleFilterChange('status', 'default')}>
              Kho mặc định
            </FilterChip>
          </Space>
        </Space>
      </ActionsBar>



      <TableCard>
        <TableHeader>
          <div>
            <TableTitle>Danh sách kho hàng</TableTitle>
            <TableSubtitle>Đang hiển thị {dataTable.length} / {warehouses.length} kho</TableSubtitle>
          </div>

        </TableHeader>
        <Loading isPending={queryWarehouse.isPending}>
          {dataTable && dataTable.length > 0 ? (
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <TableComponent
                handleDeleteMany={() => {}}
                columns={columns}
                isPending={false}
                data={dataTable}
                scroll={{ x: 1200 }}
                size="small"
                pagination={{ pageSize: 5, showSizeChanger: false }}
                onRow={(record) => {
                  const bg = record.isDefault
                    ? '#fffaf0'
                    : record.isActive
                      ? '#fff'
                      : '#fff1f0'
                  return {
                    onClick: () => {
                      setRowSelected(record._id)
                      setIsOpenDrawer(true)
                    },
                    style: {
                      background: bg,
                      cursor: 'pointer'
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#4b5563',
              fontSize: '15px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px dashed #e5e7eb'
            }}>
              {noResults ? (
                <div>
                  <div>Không tìm thấy kho phù hợp với bộ lọc hiện tại.</div>
                  <Button type="primary" style={{ marginTop: 12 }} onClick={() => setIsModalOpen(true)}>
                    Thêm kho mới
                  </Button>
                </div>
              ) : (
                <div>Đang tải dữ liệu...</div>
              )}
            </div>
          )}
        </Loading>
      </TableCard>

      <ModalComponent
        forceRender
        title="Tạo kho hàng"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Loading isPending={isPendingWarehouse}>
          <Form
            layout="vertical"
            onFinish={onFinish}
            autoComplete="on"
            form={createForm}
          >
            <Form.Item label="Tên kho" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên kho' }]}>
              <Inputcomponent value={stateWarehouse.name} onChange={handleOnchange} name="name" />
            </Form.Item>
            <Form.Item label="Mã kho" name="code">
              <Inputcomponent value={stateWarehouse.code} onChange={handleOnchange} name="code" />
            </Form.Item>
            <Form.Item
              label="Địa chỉ"
              name="addressValue"
              rules={[{ required: true, message: 'Vui lòng chọn địa chỉ' }]}
            >
              <AddressPicker
                value={{
                  address: stateWarehouse.address || '',
                  city: stateWarehouse.city || '',
                  province: stateWarehouse.city || '',
                  district: stateWarehouse.district || '',
                  ward: stateWarehouse.ward || ''
                }}
                onChange={(addressData) => {
                  setStateWarehouse({
                    ...stateWarehouse,
                    ...(addressData.address !== undefined && { address: addressData.address || '' }),
                    city: addressData.city || addressData.province || '',
                    district: addressData.district || '',
                    ward: addressData.ward || ''
                  })
                }}
                form={createForm}
              />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Inputcomponent value={stateWarehouse.phone} onChange={handleOnchange} name="phone" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Inputcomponent value={stateWarehouse.email} onChange={handleOnchange} name="email" />
            </Form.Item>
            <Form.Item label="Người quản lý" name="manager">
              <Inputcomponent value={stateWarehouse.manager} onChange={handleOnchange} name="manager" />
            </Form.Item>
            <Form.Item label="Mô tả" name="description">
              <TextArea value={stateWarehouse.description} onChange={handleOnchange} name="description" rows={3} />
            </Form.Item>
            <Form.Item label="Kho mặc định" name="isDefault" valuePropName="checked">
              <Switch
                checked={stateWarehouse.isDefault}
                onChange={(checked) => setStateWarehouse({ ...stateWarehouse, isDefault: checked })}
              />
            </Form.Item>
            <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
              <Switch
                checked={stateWarehouse.isActive}
                onChange={(checked) => setStateWarehouse({ ...stateWarehouse, isActive: checked })}
              />
            </Form.Item>
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit">
                  Tạo
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>

      <DrawerComponent
        title='Chi tiết kho hàng'
        isOpen={isOpenDrawer}
        onClose={handleCloseDrawer}
        width="90%"
      >
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            layout="vertical"
            onFinish={onUpdateWarehouse}
            autoComplete="on"
            form={updateForm}
          >
            <Form.Item label="Tên kho" name="name" rules={[{ required: true }]}> 
              <Inputcomponent
                value={stateWarehouseDetails.name}
                onChange={handleOnchangeDetails}
                name="name"
              />
            </Form.Item>
            <Form.Item label="Mã kho" name="code">
              <Inputcomponent
                value={stateWarehouseDetails.code}
                onChange={handleOnchangeDetails}
                name="code"
              />
            </Form.Item>
            <Form.Item
              label="Địa chỉ"
              name="addressValue"
              rules={[{ required: true }]}
            >
              <AddressPicker
                value={{
                  address: stateWarehouseDetails.address || '',
                  city: stateWarehouseDetails.city || '',
                  province: stateWarehouseDetails.city || '',
                  district: stateWarehouseDetails.district || '',
                  ward: stateWarehouseDetails.ward || ''
                }}
                onChange={(addressData) => {
                  setStateWarehouseDetails({
                    ...stateWarehouseDetails,
                    ...(addressData.address !== undefined && { address: addressData.address || '' }),
                    city: addressData.city || addressData.province || '',
                    district: addressData.district || '',
                    ward: addressData.ward || ''
                  })
                }}
                form={updateForm}
              />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Inputcomponent
                value={stateWarehouseDetails.phone}
                onChange={handleOnchangeDetails}
                name="phone"
              />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Inputcomponent
                value={stateWarehouseDetails.email}
                onChange={handleOnchangeDetails}
                name="email"
              />
            </Form.Item>
            <Form.Item label="Người quản lý" name="manager">
              <Inputcomponent
                value={stateWarehouseDetails.manager}
                onChange={handleOnchangeDetails}
                name="manager"
              />
            </Form.Item>
            <Form.Item label="Mô tả" name="description">
              <TextArea
                value={stateWarehouseDetails.description}
                onChange={handleOnchangeDetails}
                name="description"
                rows={3}
              />
            </Form.Item>
            <Form.Item label="Kho mặc định" name="isDefault" valuePropName="checked">
              <Switch
                checked={stateWarehouseDetails.isDefault}
                onChange={(checked) => setStateWarehouseDetails({ ...stateWarehouseDetails, isDefault: checked })}
              />
            </Form.Item>
            <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
              <Switch
                checked={stateWarehouseDetails.isActive}
                onChange={(checked) => setStateWarehouseDetails({ ...stateWarehouseDetails, isActive: checked })}
              />
            </Form.Item>
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={handleCloseDrawer}>Hủy</Button>
                <Button type="primary" htmlType="submit">
                  Cập nhật
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      <ModalComponent
        title="Xóa kho hàng"
        open={isModalOpenDelete}
        onOk={handleDeleteWarehouse}
        onCancel={handleCancelDelete}
        okText="Xóa"
        cancelText="Hủy"
        confirmLoading={isPendingDeleted}
      >
        <p>Bạn có chắc chắn muốn xóa kho hàng này?</p>
      </ModalComponent>
    </WrapperContent>
  )
}

export default AdminWarehouse
