import React, { useEffect, useRef, useState } from 'react'
import {
  ActionsBar,
  BrandCell,
  BrandMeta,
  BrandName,
  BrandUpload,
  CardsRow,
  FilterChip,
  HeaderActions,
  HeaderSubtitle,
  InlineMuted,
  PageHeader,
  PreviewCard,
  CreateCard,
  StatCard,
  StatLabel,
  StatTrend,
  StatValue,
  StatsGrid,
  TableCard,
  TableHeader,
  TableSubtitle,
  TableTitle,
  WrapperActionButtons,
  WrapperContent,
  WrapperHeader
} from './style'
import { Avatar, Button, Col, Divider, Form, Input, Row, Space, Switch, Tag, Tooltip } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as BrandService from '../../services/BrandService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import { getBase64 } from '../../utils'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'

const normalizeWebsite = (website) => {
  if (!website) return ''
  if (website.startsWith('http')) return website
  return `https://${website}`
}

const compactWebsite = (website) => normalizeWebsite(website).replace(/^https?:\/\//, '')
const normalizeActiveFlag = (value) => (typeof value === 'boolean' ? value : true)

const AdminBrand = () => {
  const [isModalOpen, setisModalOpen] = useState(false)
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const user = useSelector((state) => state?.user)
  const searchInput = useRef(null)

  const initial = () => ({
    name: '',
    slug: '',
    description: '',
    logo: '',
    website: '',
    isActive: true
  })

  const [stateBrand, setStateBrand] = useState(initial())
  const [stateBrandDetails, setStateBrandDetails] = useState(initial())
  const [form] = Form.useForm()
  const [formUpdate] = Form.useForm()

  const mutation = useMutationHooks((data) => BrandService.createBrand(data, user?.access_token))

  const mutationUpdate = useMutationHooks((data) => {
    const { id, token, ...rests } = data
    return BrandService.updateBrand(id, token, rests)
  })

  const mutationDeleteted = useMutationHooks((data) => {
    const { id, token } = data
    return BrandService.deleteBrand(id, token)
  })

  const getAllBrands = async () => {
    const res = await BrandService.getAllBrand()
    return res
  }

  const fetchGetDetailsBrand = async (selectedId) => {
    try {
      setIsPendingUpdate(true)
      const res = await BrandService.getDetailsBrand(selectedId)
      if (res?.data) {
        const brandData = {
          name: res?.data?.name || '',
          slug: res?.data?.slug || '',
          description: res?.data?.description || '',
          logo: res?.data?.logo || '',
          website: res?.data?.website || '',
          isActive: res?.data?.isActive ?? true
        }
        setStateBrandDetails(brandData)
        setTimeout(() => {
          formUpdate.setFieldsValue(brandData)
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching brand details:', error)
      message.error('Không thể tải thông tin thương hiệu')
    } finally {
      setIsPendingUpdate(false)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      form.setFieldsValue(initial())
      setStateBrand(initial())
    }
  }, [isModalOpen, form])

  useEffect(() => {
    if (isOpenDrawer && !isPendingUpdate && stateBrandDetails.name) {
      formUpdate.setFieldsValue({
        name: stateBrandDetails.name || '',
        slug: stateBrandDetails.slug || '',
        description: stateBrandDetails.description || '',
        website: stateBrandDetails.website || '',
        isActive: typeof stateBrandDetails.isActive === 'boolean' ? stateBrandDetails.isActive : true
      })
    }
  }, [stateBrandDetails, isOpenDrawer, isPendingUpdate, formUpdate])

  useEffect(() => {
    if (!isOpenDrawer) {
      formUpdate.resetFields()
      setStateBrandDetails(initial())
    }
  }, [isOpenDrawer, formUpdate])

  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      setIsPendingUpdate(true)
      fetchGetDetailsBrand(rowSelected)
    }
  }, [rowSelected, isOpenDrawer])

  const handleDetailsBrand = () => {
    setIsOpenDrawer(true)
  }

  const { data, isPending, isSuccess, isError } = mutation
  const {
    data: dataUpdated,
    isPending: isPendingUpdated,
    isSuccess: isSuccessUpdated,
    isError: isErrorUpdated
  } = mutationUpdate
  const {
    data: dataDeleted,
    isPending: isPendingDeleted,
    isSuccess: isSuccessDeleted,
    isError: isErrorDeleted
  } = mutationDeleteted

  const queryBrand = useQuery({
    queryKey: ['brands'],
    queryFn: getAllBrands
  })

  const { isPending: isPendingBrand, data: brands } = queryBrand

  const totalBrands = brands?.data?.length || 0
  const activeBrands = (brands?.data || []).filter((brand) => normalizeActiveFlag(brand?.isActive)).length
  const inactiveBrands = Math.max(totalBrands - activeBrands, 0)
  const activeRate = totalBrands ? Math.round((activeBrands / totalBrands) * 100) : 0
  const lastUpdatedLabel = queryBrand?.dataUpdatedAt
    ? new Date(queryBrand.dataUpdatedAt).toLocaleTimeString('vi-VN')
    : '--'

  const keyword = searchTerm.trim().toLowerCase()
  const filteredBrands = (brands?.data || []).filter((brand) => {
    const isActiveNormalized = normalizeActiveFlag(brand?.isActive)
    const matchStatus =
      statusFilter === 'all' ? true : statusFilter === 'active' ? isActiveNormalized : !isActiveNormalized
    const haystack = `${brand?.name || ''} ${brand?.slug || ''} ${brand?.website || ''}`.toLowerCase()
    const matchKeyword = keyword ? haystack.includes(keyword) : true
    return matchStatus && matchKeyword
  })

  const renderAction = (_, record) => {
    return (
      <Space size={8}>
        <Tooltip title="Chỉnh sửa thương hiệu">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setRowSelected(record._id)
              handleDetailsBrand()
            }}
          >
            
          </Button>
        </Tooltip>
        <Tooltip title="Xóa thương hiệu">
          <Button
            danger
            ghost
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setRowSelected(record._id)
              setIsModalOpenDelete(true)
            }}
          >
            
          </Button>
        </Tooltip>
      </Space>
    )
  }

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Inputcomponent
          ref={searchInput}
          placeholder={`Tìm kiếm ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
            Tìm
          </Button>
          <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) => record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase())
  })

  const columns = [
    {
      title: 'Thương hiệu',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps('name'),
      render: (_, record) => (
        <BrandCell>
          <Avatar
            shape="square"
            size={52}
            src={record?.logo}
            style={{ border: '1px solid #e5e7eb', background: '#f8fafc' }}
          >
            {(record?.name || '?').charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <BrandName>{record?.name || 'Chưa đặt tên'}</BrandName>
            <BrandMeta>
              <Tag color="blue">{record?.slug || 'Chưa có slug'}</Tag>
              {record?.website ? (
                <a
                  href={normalizeWebsite(record.website)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0ea5e9', display: 'inline-flex', gap: 6, alignItems: 'center' }}
                >
                  <GlobalOutlined />
                  {compactWebsite(record.website)}
                </a>
              ) : (
                <InlineMuted>Chưa thêm website</InlineMuted>
              )}
            </BrandMeta>
          </div>
        </BrandCell>
      )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      ellipsis: true,
      render: (description) =>
        description ? <span>{description}</span> : <Tag color="default">Chưa có mô tả</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Hoạt động' : 'Tạm dừng'}</Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Tạm dừng', value: false }
      ],
      onFilter: (value, record) => record.isActive === value
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 170,
      render: renderAction
    }
  ]

  const dataTable = Array.isArray(filteredBrands)
    ? filteredBrands.map((brand) => {
        const isActiveNormalized = normalizeActiveFlag(brand?.isActive)
        return {
          ...brand,
          isActive: isActiveNormalized,
          key: brand._id
        }
      })
    : []

  useEffect(() => {
    if (isSuccess && data?.status === 'OK') {
      handleCancel()
      queryBrand.refetch()
    } else if (isSuccess && data?.status === 'ERR') {
      const errorMsg =
        typeof data?.message === 'string' ? data.message : 'Tạo thương hiệu thất bại, vui lòng thử lại!'
      message.error(errorMsg)
    } else if (isError) {
      message.error('Tạo thương hiệu thất bại, vui lòng thử lại!')
    }
  }, [isSuccess, isError, data])

  useEffect(() => {
    if (isSuccessDeleted && dataDeleted?.status === 'OK') {
      handleCancelDelete()
      queryBrand.refetch()
      setRowSelected('')
    } else if (isSuccessDeleted && dataDeleted?.status === 'ERR') {
      const errorMsg =
        typeof dataDeleted?.message === 'string' ? dataDeleted.message : 'Xóa thương hiệu thất bại, vui lòng thử lại!'
      message.error(errorMsg)
    } else if (isErrorDeleted) {
      message.error('Xóa thương hiệu thất bại, vui lòng thử lại!')
    }
  }, [isSuccessDeleted, isErrorDeleted, dataDeleted])

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false)
    setStateBrandDetails(initial())
    formUpdate.resetFields()
    setRowSelected('')
    setIsPendingUpdate(false)
  }

  useEffect(() => {
    if (isSuccessUpdated && dataUpdated?.status === 'OK') {
      handleCloseDrawer()
      queryBrand.refetch()
    } else if (isSuccessUpdated && dataUpdated?.status === 'ERR') {
      const errorMsg =
        typeof dataUpdated?.message === 'string' ? dataUpdated.message : 'Cập nhật thương hiệu thất bại, vui lòng thử lại!'
      message.error(errorMsg)
    } else if (isErrorUpdated) {
      message.error('Cập nhật thương hiệu thất bại, vui lòng thử lại!')
    }
  }, [isSuccessUpdated, isErrorUpdated, dataUpdated])

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleDeleteBrand = () => {
    if (!rowSelected) {
      message.error('Không tìm thấy thương hiệu để xóa!')
      return
    }

    if (!user?.access_token) {
      message.error('Vui lòng đăng nhập để tiếp tục!')
      return
    }

    mutationDeleteted.mutate(
      {
        id: rowSelected,
        token: user?.access_token
      },
      {
        onSuccess: (resp) => {
          if (resp?.status === 'OK') {
            message.success('Xóa thương hiệu thành công!')
            handleCancelDelete()
            queryBrand.refetch()
            setRowSelected('')
          } else {
            const errorMsg =
              typeof resp?.message === 'string'
                ? resp.message
                : 'Xóa thương hiệu thất bại, vui lòng thử lại!'
            message.error(errorMsg)
          }
        },
        onError: (error) => {
          console.error('Delete brand error:', error)
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Xóa thương hiệu thất bại, vui lòng thử lại!'
          message.error(errorMessage)
        }
      }
    )
  }

  const handleCancel = () => {
    setisModalOpen(false)
    setStateBrand(initial())
    form.resetFields()
  }

  const onFinish = (values) => {
    const existingBrand = brands?.data?.find(
      (brand) => brand.name?.toLowerCase().trim() === values.name?.toLowerCase().trim()
    )

    if (existingBrand) {
      message.error('Tên thương hiệu đã tồn tại!')
      return
    }

    const brandData = {
      name: typeof values.name === 'string' ? values.name.trim() : '',
      slug: typeof values.slug === 'string' ? values.slug.trim() : '',
      description: typeof values.description === 'string' ? values.description.trim() : '',
      website: typeof values.website === 'string' ? values.website.trim() : '',
      logo: typeof stateBrand.logo === 'string' ? stateBrand.logo : '',
      isActive: typeof values.isActive === 'boolean' ? values.isActive : true
    }

    if (!brandData.name) {
      message.error('Vui lòng nhập tên thương hiệu!')
      return
    }

    mutation.mutate(brandData, {
      onSuccess: (resp) => {
        if (resp?.status === 'OK') {
          message.success('Tạo thương hiệu thành công!')
          handleCancel()
          queryBrand.refetch()
        } else {
          const errorMsg =
            typeof resp?.message === 'string' ? resp.message : 'Tạo thương hiệu thất bại, vui lòng thử lại!'
          message.error(errorMsg)
        }
      },
      onError: (error) => {
        console.error('Create brand error:', error)
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Tạo thương hiệu thất bại, vui lòng thử lại!'
        message.error(errorMessage)
      }
    })
  }

  const handleOnchangeLogo = async ({ fileList }) => {
    if (!fileList || !fileList.length) return
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    const newLogo = file.preview
    setStateBrand({
      ...stateBrand,
      logo: newLogo
    })
    form.setFieldsValue({
      logo: newLogo
    })
  }

  const handleOnchangeLogoDetails = async ({ fileList }) => {
    if (!fileList || !fileList.length) return
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    const newLogo = file.preview
    setStateBrandDetails({
      ...stateBrandDetails,
      logo: newLogo
    })
    formUpdate.setFieldsValue({
      logo: newLogo
    })
  }

  const onUpdateBrand = (values) => {
    if (!rowSelected) {
      message.error('Không tìm thấy ID thương hiệu!')
      return
    }

    if (!user?.access_token) {
      message.error('Vui lòng đăng nhập để tiếp tục!')
      return
    }

    const existingBrand = brands?.data?.find(
      (brand) =>
        brand._id !== rowSelected && brand.name?.toLowerCase().trim() === values.name?.toLowerCase().trim()
    )

    if (existingBrand) {
      message.error('Tên thương hiệu đã tồn tại!')
      return
    }

    const updateData = {
      name: typeof values.name === 'string' ? values.name.trim() : '',
      slug: typeof values.slug === 'string' ? values.slug.trim() : '',
      description: typeof values.description === 'string' ? values.description.trim() : '',
      website: typeof values.website === 'string' ? values.website.trim() : '',
      logo: typeof stateBrandDetails.logo === 'string' ? stateBrandDetails.logo : '',
      isActive: typeof values.isActive === 'boolean' ? values.isActive : true
    }

    if (!updateData.name) {
      message.error('Vui lòng nhập tên thương hiệu!')
      return
    }

    mutationUpdate.mutate(
      {
        id: rowSelected,
        token: user?.access_token,
        ...updateData
      },
      {
        onSuccess: (resp) => {
          if (resp?.status === 'OK') {
            message.success('Cập nhật thương hiệu thành công!')
            handleCloseDrawer()
            queryBrand.refetch()
          } else {
            const errorMsg =
              typeof resp?.message === 'string'
                ? resp.message
                : 'Cập nhật thương hiệu thất bại, vui lòng thử lại!'
            message.error(errorMsg)
          }
        },
        onError: (error) => {
          console.error('Update brand error:', error)
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Cập nhật thương hiệu thất bại, vui lòng thử lại!'
          message.error(errorMessage)
        }
      }
    )
  }

  const renderPreview = (brandState) => (
    <PreviewCard>
      <div className="preview-head">Xem nhanh</div>
      <div className="preview-body">
        <Avatar
          shape="square"
          size={64}
          src={brandState?.logo}
          style={{ borderRadius: 14, border: '1px solid #e5e7eb', background: '#f8fafc' }}
        >
          {(brandState?.name || 'B').charAt(0).toUpperCase()}
        </Avatar>
        <div>
          <BrandName>{brandState?.name || 'Tên thương hiệu'}</BrandName>
          <BrandMeta>
            <Tag color="blue">{brandState?.slug || 'slug-thuong-hieu'}</Tag>
            {brandState?.website ? (
              <Space size={6} align="center">
                <LinkOutlined />
                <InlineMuted>{compactWebsite(brandState.website)}</InlineMuted>
              </Space>
            ) : (
              <InlineMuted>Chưa thêm website</InlineMuted>
            )}
            <Tag color={brandState?.isActive === false ? 'default' : 'success'}>
              {brandState?.isActive === false ? 'Tạm dừng' : 'Hoạt động'}
            </Tag>
          </BrandMeta>
        </div>
      </div>
      <InlineMuted style={{ marginTop: 8 }}>
        {brandState?.description || 'Mô tả thương hiệu sẽ xuất hiện ở trang hiển thị và kết quả tìm kiếm.'}
      </InlineMuted>
    </PreviewCard>
  )

  return (
    <WrapperContent>
      <PageHeader>
        <div>
          <WrapperHeader>Quản lý thương hiệu</WrapperHeader>

        </div>
        
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatLabel>Tổng thương hiệu</StatLabel>
          <StatValue>{totalBrands}</StatValue>
          <StatTrend>{lastUpdatedLabel === '--' ? 'Chưa đồng bộ' : `Cập nhật lúc ${lastUpdatedLabel}`}</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Hoạt động</StatLabel>
          <StatValue>{activeBrands}</StatValue>
          <StatTrend>Đang mở hiển thị</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Tạm dừng</StatLabel>
          <StatValue>{inactiveBrands}</StatValue>
          <StatTrend $negative={inactiveBrands > 0}>
            {inactiveBrands > 0 ? 'Cần kiểm tra' : 'Ổn định'}
          </StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Tỷ lệ hiển thị</StatLabel>
          <StatValue>{activeRate}%</StatValue>
          <StatTrend>Thương hiệu hoạt động / tổng</StatTrend>
        </StatCard>
      </StatsGrid>

      <ActionsBar>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm thương hiệu theo tên, slug, website"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: 280, maxWidth: 420 }}
        />
        <Space size={8} wrap>
          <FilterChip $active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            Tất cả
          </FilterChip>
          <FilterChip $active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>
            Hoạt động
          </FilterChip>
          <FilterChip $active={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')}>
            Tạm dừng
          </FilterChip>
          <InlineMuted>{filteredBrands.length} kết quả</InlineMuted>
        </Space>
      </ActionsBar>

      <CardsRow>
        <CreateCard hoverable onClick={() => setisModalOpen(true)}>
          <div className="card-icon">
            <PlusOutlined />
          </div>
          <div className="card-title">Thêm thương hiệu mới</div>
         
        </CreateCard>
      </CardsRow>

      <TableCard>
        <TableHeader>
          <div>
            <TableTitle>Danh sách thương hiệu</TableTitle>
            
          </div>
          <Tag color="processing">{filteredBrands.length} thương hiệu</Tag>
        </TableHeader>
        <TableComponent
          columns={columns}
          isPending={isPendingBrand}
          data={dataTable}
          size="middle"
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showTotal: (total) => `${total} thương hiệu`
          }}
          rowClassName={(record) => (record._id === rowSelected ? 'brand-row-active' : '')}
          onRow={(record) => {
            return {
              onClick: () => {
                setRowSelected(record._id)
              },
              onDoubleClick: () => {
                setRowSelected(record._id)
                handleDetailsBrand()
              }
            }
          }}
        />
      </TableCard>

      <ModalComponent
        forceRender
        title="Thêm thương hiệu"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={900}
      >
        <Loading isPending={isPending}>
          <Form
            name="createBrand"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            form={form}
            style={{ padding: '12px 0' }}
            onValuesChange={(_, allValues) => setStateBrand((prev) => ({ ...prev, ...allValues }))}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Tên thương hiệu"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên thương hiệu!' }]}
                >
                  <Inputcomponent placeholder="Nhập tên thương hiệu" />
                </Form.Item>

                <Form.Item
                  label="Slug"
                  name="slug"
                  tooltip="Đường dẫn URL của thương hiệu (bỏ trống để tự động tạo)"
                >
                  <Inputcomponent placeholder="thuong-hieu-cua-ban" />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                  <Input.TextArea
                    rows={4}
                    placeholder="Nhập mô tả ngắn cho thương hiệu"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>

              <Form.Item label="Website" name="website">
                <Inputcomponent placeholder="https://example.com" />
              </Form.Item>

              <Form.Item label="Trạng thái" name="isActive" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>

              <Form.Item label="Logo" name="logo">
                <BrandUpload onChange={handleOnchangeLogo} maxCount={1}>
                  <Button icon={<PlusOutlined />}>Chọn file</Button>
                  {stateBrand?.logo && (
                    <img
                        src={stateBrand?.logo}
                        style={{
                          height: '108px',
                          width: '108px',
                          borderRadius: '14px',
                          objectFit: 'cover',
                          marginLeft: '16px',
                          border: '1px solid #e5e7eb',
                          padding: '6px',
                          background: '#fff'
                        }}
                        alt="brand"
                      />
                    )}
                  </BrandUpload>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                {renderPreview(stateBrand)}
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 16px' }} />

            <Form.Item>
              <WrapperActionButtons>
                <Button onClick={handleCancel} style={{ marginRight: '12px' }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={isPending} style={{ minWidth: '140px' }}>
                  Lưu thương hiệu
                </Button>
              </WrapperActionButtons>
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>

      <DrawerComponent
        title="Chi tiết thương hiệu"
        isOpen={isOpenDrawer}
        onClose={handleCloseDrawer}
        width="78%"
      >
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            name="updateBrand"
            layout="vertical"
            onFinish={onUpdateBrand}
            autoComplete="off"
            form={formUpdate}
            style={{ padding: '12px 0' }}
            onValuesChange={(_, allValues) => setStateBrandDetails((prev) => ({ ...prev, ...allValues }))}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Tên thương hiệu"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên thương hiệu!' }]}
                >
                  <Inputcomponent placeholder="Nhập tên thương hiệu" />
                </Form.Item>

                <Form.Item label="Slug" name="slug" tooltip="Đường dẫn URL của thương hiệu">
                  <Inputcomponent placeholder="ví dụ: thuong-hieu" />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                  <Input.TextArea
                    rows={4}
                    placeholder="Nhập mô tả ngắn cho thương hiệu"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>

              <Form.Item label="Website" name="website">
                <Inputcomponent placeholder="https://example.com" />
              </Form.Item>

              <Form.Item label="Trạng thái" name="isActive" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>

              <Form.Item label="Logo" name="logo">
                <BrandUpload onChange={handleOnchangeLogoDetails} maxCount={1}>
                  <Button icon={<PlusOutlined />}>Chọn file</Button>
                  {stateBrandDetails?.logo && (
                    <img
                        src={stateBrandDetails?.logo}
                        style={{
                          height: '108px',
                          width: '108px',
                          borderRadius: '14px',
                          objectFit: 'cover',
                          marginLeft: '16px',
                          border: '1px solid #e5e7eb',
                          padding: '6px',
                          background: '#fff'
                        }}
                        alt="brand"
                      />
                    )}
                  </BrandUpload>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                {renderPreview(stateBrandDetails)}
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 16px' }} />

            <Form.Item>
              <WrapperActionButtons>
                <Button onClick={handleCloseDrawer} style={{ marginRight: '12px' }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={isPendingUpdated} style={{ minWidth: '140px' }}>
                  Cập nhật
                </Button>
              </WrapperActionButtons>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      <ModalComponent
        title="Xóa thương hiệu"
        open={isModalOpenDelete}
        onCancel={handleCancelDelete}
        onOk={handleDeleteBrand}
      >
        <Loading isPending={isPendingDeleted}>
          <div>Bạn có chắc chắn muốn xóa thương hiệu này không?</div>
        </Loading>
      </ModalComponent>
    </WrapperContent>
  )
}

export default AdminBrand
