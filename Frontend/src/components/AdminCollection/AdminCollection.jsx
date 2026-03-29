import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  ActionsBar,
  CardsRow,
  CollectionMeta,
  CreateCard,
  FilterChip,
  HeaderActions,
  HeaderSubtitle,
  InlineMuted,
  PageHeader,
  PreviewBadge,
  PreviewCard,
  PreviewMeta,
  PreviewTitle,
  StatsGrid,
  StatCard,
  StatLabel,
  StatTrend,
  StatValue,
  TableCard,
  TableHeader,
  TrendPill,
  WrapperContent,
  WrapperHeader
} from './style'
import { Button, Form, Input, Space, DatePicker, Switch, Avatar, Row, Col, Divider, Tooltip } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as CollectionService from '../../services/CollectionService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import { getBase64 } from '../../utils'
import { WrapperUploadFile } from '../AdminProduct/style'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'

const toDayjs = (value) => {
  if (!value) return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

const formatDate = (value) => {
  const parsed = toDayjs(value)
  if (!parsed) return '—'
  return parsed.format('DD/MM/YYYY')
}

const getTimelineLabel = (startDate, endDate) => {
  const start = toDayjs(startDate)
  const end = toDayjs(endDate)
  const now = dayjs()

  if (!start && !end) return 'Không có lịch'
  if (start && start.isAfter(now)) return 'Sắp bắt đầu'
  if (end && end.isBefore(now)) return 'Đã kết thúc'
  return 'Đang diễn ra'
}

const normalizePayloadDates = (payload) => ({
  ...payload,
  startDate: payload.startDate ? toDayjs(payload.startDate)?.toDate() : null,
  endDate: payload.endDate ? toDayjs(payload.endDate)?.toDate() : null
})

const AdminCollection = () => {
  const [isModalOpen, setisModalOpen] = useState(false)
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [trendingFilter, setTrendingFilter] = useState('all')
  const user = useSelector((state) => state?.user)

  const initial = () => ({
    name: '',
    slug: '',
    description: '',
    image: '',
    isTrending: false,
    startDate: null,
    endDate: null
  })

  const [stateCollection, setStateCollection] = useState(initial())
  const [stateCollectionDetails, setStateCollectionDetails] = useState(initial())
  const [formCreate] = Form.useForm()
  const [formUpdate] = Form.useForm()

  const mutation = useMutationHooks((data) => CollectionService.createCollection(data, user?.access_token))

  const mutationUpdate = useMutationHooks((data) => {
    const { id, token, ...rests } = data
    return CollectionService.updateCollection(id, token, rests)
  })

  const mutationDeleteted = useMutationHooks((data) => {
    const { id, token } = data
    return CollectionService.deleteCollection(id, token)
  })

  const getAllCollections = async () => {
    const res = await CollectionService.getAllCollection()
    return res
  }

  const fetchGetDetailsCollection = async (selectedId) => {
    try {
      setIsPendingUpdate(true)
      const res = await CollectionService.getDetailsCollection(selectedId)
      if (res?.data) {
        const collectionData = {
          name: res?.data?.name || '',
          slug: res?.data?.slug || '',
          description: res?.data?.description || '',
          image: res?.data?.image || '',
          isTrending: res?.data?.isTrending || false,
          startDate: toDayjs(res?.data?.startDate),
          endDate: toDayjs(res?.data?.endDate)
        }
        setStateCollectionDetails(collectionData)
        formUpdate.setFieldsValue(collectionData)
      }
    } finally {
      setIsPendingUpdate(false)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      const defaults = initial()
      setStateCollection(defaults)
      formCreate.setFieldsValue(defaults)
    }
  }, [isModalOpen, formCreate])

  useEffect(() => {
    if (!isOpenDrawer) {
      setStateCollectionDetails(initial())
      formUpdate.resetFields()
      return
    }
    if (rowSelected) {
      fetchGetDetailsCollection(rowSelected)
    }
  }, [rowSelected, isOpenDrawer, formUpdate])

  const handleDetailsCollection = () => {
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

  const queryCollection = useQuery({
    queryKey: ['collections'],
    queryFn: getAllCollections
  })

  const { isPending: isPendingCollection, data: collections } = queryCollection
  const collectionList = useMemo(() => (Array.isArray(collections?.data) ? collections.data : []), [collections])

  const totalCollections = collectionList.length
  const trendingCount = collectionList.filter((item) => item?.isTrending).length
  const activeCount = collectionList.filter((item) => item?.isActive !== false).length
  const scheduledCount = collectionList.filter((item) => item?.startDate || item?.endDate).length

  const filteredCollections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return collectionList.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item?.name?.toLowerCase().includes(normalizedSearch) ||
        item?.slug?.toLowerCase().includes(normalizedSearch)
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? item?.isActive !== false
            : item?.isActive === false
      const matchesTrending =
        trendingFilter === 'all' ? true : trendingFilter === 'trending' ? item?.isTrending : !item?.isTrending
      return matchesSearch && matchesStatus && matchesTrending
    })
  }, [collectionList, searchTerm, statusFilter, trendingFilter])

  const dataTable = filteredCollections.map((collection) => ({ ...collection, key: collection._id }))

  useEffect(() => {
    if (isSuccess && data?.status === 'OK') {
      message.success('Tạo bộ sưu tập thành công!')
      handleCancel()
      queryCollection.refetch()
    } else if (isError) {
      message.error('Tạo bộ sưu tập thất bại!')
    }
  }, [isSuccess, isError])

  useEffect(() => {
    if (isSuccessDeleted && dataDeleted?.status === 'OK') {
      message.success('Xoá bộ sưu tập thành công!')
      handleCancelDelete()
      queryCollection.refetch()
    } else if (isErrorDeleted) {
      message.error('Xoá bộ sưu tập thất bại!')
    }
  }, [isSuccessDeleted, isErrorDeleted])

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false)
    setStateCollectionDetails(initial())
    formUpdate.resetFields()
  }

  useEffect(() => {
    if (isSuccessUpdated && dataUpdated?.status === 'OK') {
      message.success('Cập nhật bộ sưu tập thành công!')
      handleCloseDrawer()
      queryCollection.refetch()
    } else if (isErrorUpdated) {
      message.error('Cập nhật bộ sưu tập thất bại!')
    }
  }, [isSuccessUpdated, isErrorUpdated])

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleDeleteCollection = () => {
    mutationDeleteted.mutate(
      { id: rowSelected, token: user?.access_token },
      {
        onSettled: () => {
          queryCollection.refetch()
        }
      }
    )
  }

  const handleCancel = () => {
    setisModalOpen(false)
    setStateCollection(initial())
    formCreate.resetFields()
  }

  const onFinish = () => {
    const submitData = normalizePayloadDates(stateCollection)
    mutation.mutate(submitData, {
      onSettled: () => {
        queryCollection.refetch()
      }
    })
  }

  const handleOnchangeAvatar = async ({ fileList }) => {
    const file = fileList[0]
    if (!file?.url && !file?.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    setStateCollection((prev) => ({ ...prev, image: file?.preview }))
    formCreate.setFieldsValue({ image: file?.preview })
  }

  const handleOnchangeAvatarDetails = async ({ fileList }) => {
    const file = fileList[0]
    if (!file?.url && !file?.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    setStateCollectionDetails((prev) => ({ ...prev, image: file?.preview }))
    formUpdate.setFieldsValue({ image: file?.preview })
  }

  const onUpdateCollection = () => {
    const submitData = normalizePayloadDates(stateCollectionDetails)
    mutationUpdate.mutate(
      { id: rowSelected, token: user?.access_token, ...submitData },
      {
        onSettled: () => {
          queryCollection.refetch()
        }
      }
    )
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTrendingFilter('all')
  }

  const renderAction = (record) => (
    <Space size="small">
      <Tooltip title="Chỉnh sửa">
        <Button
          type="text"
          shape="circle"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            setRowSelected(record._id)
            handleDetailsCollection()
          }}
        />
      </Tooltip>
      <Tooltip title="Xoá">
        <Button
          type="text"
          danger
          shape="circle"
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            setRowSelected(record._id)
            setIsModalOpenDelete(true)
          }}
        />
      </Tooltip>
    </Space>
  )

  const columns = [
    {
      title: 'Bộ sưu tập',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <CollectionMeta>
          <Avatar
            shape="square"
            size={48}
            src={record.image}
            style={{ backgroundColor: '#eef2ff', color: '#4f46e5', fontWeight: 700 }}
          >
            {record?.name?.[0]?.toUpperCase() || 'B'}
          </Avatar>
          <div className="meta">
            <div className="title">
              <span className="name">{record.name}</span>
              {record?.isTrending && <TrendPill>Trending</TrendPill>}
              {record?.isActive === false && <TrendPill $muted>Tạm dừng</TrendPill>}
            </div>
            <InlineMuted>{record.slug || 'Slug sẽ được tạo tự động'}</InlineMuted>
          </div>
        </CollectionMeta>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'startDate',
      render: (_, record) => (
        <div>
          <div>
            {formatDate(record.startDate)} - {formatDate(record.endDate)}
          </div>
          <InlineMuted>{getTimelineLabel(record.startDate, record.endDate)}</InlineMuted>
        </div>
      )
    },
    {
      title: 'Hiển thị',
      dataIndex: 'isActive',
      render: (isActive) => (
        <TrendPill $muted={isActive === false}>{isActive === false ? 'Tạm dừng' : 'Hoạt động'}</TrendPill>
      )
    },
    {
      title: 'Nổi bật',
      dataIndex: 'isTrending',
      render: (isTrending) => <TrendPill $highlight={isTrending}>{isTrending ? 'Trending' : 'Thông thường'}</TrendPill>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => renderAction(record)
    }
  ]

  const selectedCollection = useMemo(
    () => collectionList.find((item) => item._id === rowSelected),
    [collectionList, rowSelected]
  )

  const renderPreview = (data) => (
    <PreviewCard>
      <PreviewBadge $highlight={data?.isTrending}>{data?.isTrending ? 'Trending' : 'Bản nháp'}</PreviewBadge>
      <PreviewTitle>{data?.name || 'Tên bộ sưu tập'}</PreviewTitle>
      <PreviewMeta>{data?.slug || 'Slug sẽ được tạo tự động'}</PreviewMeta>
      <InlineMuted>{data?.description || 'Thêm mô tả để xem preview ngay tại đây.'}</InlineMuted>

      <div className="preview-image">
        {data?.image ? (
          <img src={data.image} alt="collection" />
        ) : (
          <div className="placeholder">Chưa có hình ảnh</div>
        )}
      </div>

      <div className="preview-dates">
        <InlineMuted>
          {formatDate(data?.startDate)} - {formatDate(data?.endDate)}
        </InlineMuted>
        <InlineMuted>{getTimelineLabel(data?.startDate, data?.endDate)}</InlineMuted>
      </div>
    </PreviewCard>
  )

  return (
    <WrapperContent>
      <PageHeader>
        <div>
          <WrapperHeader>Quản lý bộ sưu tập</WrapperHeader>
        </div>
       
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatLabel>Tổng bộ sưu tập</StatLabel>
          <StatValue>{totalCollections}</StatValue>
          <StatTrend>Đang hiển thị: {activeCount}</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Bộ sưu tập trending</StatLabel>
          <StatValue>{trendingCount}</StatValue>
          <StatTrend>{totalCollections ? Math.round((trendingCount / totalCollections) * 100) : 0}% tổng</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Có lịch chạy</StatLabel>
          <StatValue>{scheduledCount}</StatValue>
          <StatTrend>Quản lý thời gian hiển thị</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Đang lọc</StatLabel>
          <StatValue>{filteredCollections.length}</StatValue>
          <StatTrend>Phù hợp bộ lọc hiện tại</StatTrend>
        </StatCard>
      </StatsGrid>

      <ActionsBar>
        <Space wrap>
          <Input.Search
            placeholder="Tìm theo tên hoặc slug"
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={(value) => setSearchTerm(value)}
            style={{ minWidth: 260 }}
          />
        </Space>
        <Space wrap>
          <FilterChip $active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            Tất cả
          </FilterChip>
          <FilterChip $active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>
            Hoạt động
          </FilterChip>
          <FilterChip $active={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')}>
            Tạm dừng
          </FilterChip>
          <FilterChip $active={trendingFilter === 'all'} onClick={() => setTrendingFilter('all')}>
            Mọi trạng thái
          </FilterChip>
          <FilterChip $active={trendingFilter === 'trending'} onClick={() => setTrendingFilter('trending')}>
            Chỉ trending
          </FilterChip>
          <FilterChip $active={trendingFilter === 'regular'} onClick={() => setTrendingFilter('regular')}>
            Không trending
          </FilterChip>
        </Space>
        <Space wrap>
          <Button onClick={handleResetFilters}>Xoá bộ lọc</Button>
        </Space>
      </ActionsBar>

      <CardsRow>
        <CreateCard hoverable onClick={() => setisModalOpen(true)}>
          <div className="card-icon">
            <PlusOutlined />
          </div>
          <div className="card-title">Thêm bộ sưu tập</div>
         
        </CreateCard>
      </CardsRow>

      <TableCard>
        <TableHeader>
          <div>
            <div className="table-title">Danh sách bộ sưu tập</div>
            
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => queryCollection.refetch()} />
        </TableHeader>
        <TableComponent
          columns={columns}
          isPending={isPendingCollection}
          data={dataTable}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showTotal: (total) => `${total} bộ sưu tập`
          }}
          rowClassName={(record) => (record._id === rowSelected ? 'collection-row-active' : '')}
          onRow={(record) => {
            return {
              onClick: () => {
                setRowSelected(record._id)
              },
              onDoubleClick: () => {
                setRowSelected(record._id)
                handleDetailsCollection()
              }
            }
          }}
        />
      </TableCard>

      <ModalComponent
        forceRender
        title="Tạo bộ sưu tập"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={960}
      >
        <Loading isPending={isPending}>
          <Form
            name="createCollection"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="on"
            form={formCreate}
            onValuesChange={(_, allValues) => setStateCollection((prev) => ({ ...prev, ...allValues }))}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Tên bộ sưu tập"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên bộ sưu tập!' }]}
                >
                  <Inputcomponent placeholder="Nhập tên bộ sưu tập" />
                </Form.Item>

                <Form.Item label="Slug" name="slug" tooltip="Đường dẫn URL (để trống để tự động tạo)">
                  <Inputcomponent placeholder="bo-suu-tap-moi" />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                  <Input.TextArea rows={4} placeholder="Nhập mô tả ngắn" showCount maxLength={600} />
                </Form.Item>

                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Form.Item label="Ngày bắt đầu" name="startDate">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Ngày kết thúc" name="endDate">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Trending" name="isTrending" valuePropName="checked">
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>

                <Form.Item label="Hình ảnh" name="image">
                  <WrapperUploadFile onChange={handleOnchangeAvatar} maxCount={1}>
                    <Button>Chọn File</Button>
                    {stateCollection?.image && (
                      <img
                        src={stateCollection?.image}
                        style={{
                          height: '80px',
                          width: '80px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          marginLeft: '12px'
                        }}
                        alt="collection"
                      />
                    )}
                  </WrapperUploadFile>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                {renderPreview(stateCollection)}
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 16px' }} />

            <Form.Item>
              <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <Button onClick={handleCancel}>Huỷ</Button>
                <Button type="primary" htmlType="submit" loading={isPending}>
                  Lưu bộ sưu tập
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>

      <DrawerComponent
        title="Chi tiết bộ sưu tập"
        isOpen={isOpenDrawer}
        onClose={handleCloseDrawer}
        width="82%"
      >
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            name="updateCollection"
            layout="vertical"
            onFinish={onUpdateCollection}
            autoComplete="on"
            form={formUpdate}
            onValuesChange={(_, allValues) => setStateCollectionDetails((prev) => ({ ...prev, ...allValues }))}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Tên bộ sưu tập"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên bộ sưu tập!' }]}
                >
                  <Inputcomponent placeholder="Nhập tên bộ sưu tập" />
                </Form.Item>

                <Form.Item label="Slug" name="slug" tooltip="Đường dẫn URL của bộ sưu tập">
                  <Inputcomponent placeholder="ví dụ: bo-suu-tap" />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                  <Input.TextArea rows={4} placeholder="Nhập mô tả ngắn" showCount maxLength={600} />
                </Form.Item>

                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Form.Item label="Ngày bắt đầu" name="startDate">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Ngày kết thúc" name="endDate">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Trending" name="isTrending" valuePropName="checked">
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>

                <Form.Item label="Hình ảnh" name="image">
                  <WrapperUploadFile onChange={handleOnchangeAvatarDetails} maxCount={1}>
                    <Button>Chọn File</Button>
                    {stateCollectionDetails?.image && (
                      <img
                        src={stateCollectionDetails?.image}
                        style={{
                          height: '80px',
                          width: '80px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          marginLeft: '12px'
                        }}
                        alt="collection"
                      />
                    )}
                  </WrapperUploadFile>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                {renderPreview(stateCollectionDetails)}
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 16px' }} />

            <Form.Item>
              <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <Button onClick={handleCloseDrawer}>Đóng</Button>
                <Button type="primary" htmlType="submit" loading={isPendingUpdated}>
                  Cập nhật
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      <ModalComponent
        title="Xoá bộ sưu tập"
        open={isModalOpenDelete}
        onCancel={handleCancelDelete}
        onOk={handleDeleteCollection}
      >
        <Loading isPending={isPendingDeleted}>
          <div>Bạn có chắc chắn muốn xoá bộ sưu tập này?</div>
        </Loading>
      </ModalComponent>
    </WrapperContent>
  )
}

export default AdminCollection
