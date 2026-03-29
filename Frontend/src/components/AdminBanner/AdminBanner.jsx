import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Page,
  HeaderRow,
  TitleBlock,
  Title,
  Subtitle,
  ActionsRow,
  StatGrid,
  StatCard,
  StatIcon,
  StatValue,
  StatLabel,
  CreateCard,
  CreateIcon,
  CreateTitle,
  CreateSubtitle,
  TabWrap,
  FadeWrap,
  TableShell,
  TableHeader,
  EmptyWrap,
  ActionButtons,
  NameCell,
  TypePill,
  StatusBadge,
  ActionIconButton,
  ButtonGroup
} from './style'
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tabs,
  Tooltip
} from 'antd'
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  NotificationOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as BannerService from '../../services/BannerService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import { getBase64 } from '../../utils'
import { WrapperUploadFile } from '../AdminProduct/style'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const TYPE_BADGES = {
  slider: { label: 'Slider', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  popup: { label: 'Popup', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  mini_banner: { label: 'Trang chủ', bg: '#ecfeff', color: '#0d9488', border: '#a5f3fc' },
  announcement: { label: 'Thanh chạy chữ', bg: '#f3e8ff', color: '#7c3aed', border: '#e9d5ff' }
}

const TABS = [
  { key: 'all', label: 'Tất cả', icon: <AppstoreOutlined /> },
  { key: 'slider', label: 'Slider', icon: <PictureOutlined /> },
  { key: 'popup', label: 'Popup', icon: <NotificationOutlined /> },
  { key: 'mini_banner', label: 'Trang chủ', icon: <AppstoreOutlined /> },
  { key: 'announcement', label: 'Thanh chạy chữ', icon: <NotificationOutlined /> }
]

const AdminBanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [bannerType, setBannerType] = useState('slider')
  const [activeTab, setActiveTab] = useState('all')
  const [activeRowKey, setActiveRowKey] = useState('')
  const [lastCreatedId, setLastCreatedId] = useState('')
  const user = useSelector((state) => state?.user)
  const searchInput = useRef(null)

  const initial = () => ({
    name: '',
    type: 'slider',
    image: '',
    imageMobile: '',
    link: '',
    title: '',
    description: '',
    text: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    order: 0,
    isActive: true,
    startDate: null,
    endDate: null,
    showOnPages: [],
    layout: 'single'
  })

  const [stateBanner, setStateBanner] = useState(initial())
  const [stateBannerDetails, setStateBannerDetails] = useState(initial())
  const [form] = Form.useForm()
  const [formUpdate] = Form.useForm()

  const mutation = useMutationHooks((data) => BannerService.createBanner(data, user?.access_token))
  const mutationUpdate = useMutationHooks((data) => {
    const { id, token, ...rests } = data
    return BannerService.updateBanner(id, token, rests)
  })
  const mutationDeleted = useMutationHooks((data) => {
    const { id, token } = data
    return BannerService.deleteBanner(id, token)
  })
  const mutationDeleteMany = useMutationHooks((data) => {
    const { ids, token } = data
    return BannerService.deleteManyBanner(ids, token)
  })

  const getErrorMessage = (error, defaultMessage = 'Đã xảy ra lỗi!') => {
    if (!error) return defaultMessage
    if (typeof error === 'string') return error
    if (typeof error === 'object') {
      if (error?.response?.data?.message) {
        const msg = error.response.data.message
        if (typeof msg === 'string') return msg
      }
      if (error?.response?.data) {
        const data = error.response.data
        if (typeof data === 'string') return data
        if (data?.message && typeof data.message === 'string') return data.message
      }
      if (error?.message && typeof error.message === 'string') return error.message
    }
    return defaultMessage
  }

  const getAllBanners = async () => {
    const res = await BannerService.getAllBanner()
    return res
  }

  const fetchGetDetailsBanner = async (selectedId) => {
    try {
      setIsPendingUpdate(true)
      const res = await BannerService.getDetailsBanner(selectedId)
      if (res?.data) {
        const bannerData = {
          name: res?.data?.name || '',
          type: res?.data?.type || 'slider',
          image: res?.data?.image || '',
          imageMobile: res?.data?.imageMobile || '',
          link: res?.data?.link || '',
          title: res?.data?.title || '',
          description: res?.data?.description || '',
          text: res?.data?.text || '',
          backgroundColor: res?.data?.backgroundColor || '#ffffff',
          textColor: res?.data?.textColor || '#000000',
          order: res?.data?.order || 0,
          isActive: res?.data?.isActive !== undefined ? res?.data?.isActive : true,
          startDate: res?.data?.startDate ? dayjs(res.data.startDate) : null,
          endDate: res?.data?.endDate ? dayjs(res.data.endDate) : null,
          showOnPages: res?.data?.showOnPages || [],
          layout: res?.data?.layout || 'single'
        }
        setStateBannerDetails(bannerData)
        setBannerType(bannerData.type)
        setTimeout(() => {
          formUpdate.setFieldsValue(bannerData)
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching banner details:', error)
      message.error('Không thể tải thông tin banner')
    } finally {
      setIsPendingUpdate(false)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      form.setFieldsValue(initial())
      setStateBanner(initial())
      setBannerType('slider')
    }
  }, [isModalOpen, form])

  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      setIsPendingUpdate(true)
      fetchGetDetailsBanner(rowSelected)
    }
  }, [rowSelected, isOpenDrawer])

  useEffect(() => {
    if (!isOpenDrawer) {
      formUpdate.resetFields()
      setStateBannerDetails(initial())
      setBannerType('slider')
    }
  }, [isOpenDrawer, formUpdate])

  const handleDetailsBanner = () => {
    setIsOpenDrawer(true)
  }

  const { isPending } = mutation
  const { isPending: isPendingUpdated } = mutationUpdate
  const { isPending: isPendingDeleted } = mutationDeleted

  const queryBanner = useQuery({
    queryKey: ['banners', activeTab],
    queryFn: () => {
      if (activeTab === 'all') {
        return getAllBanners()
      }
      return BannerService.getAllBanner(activeTab)
    }
  })

  const { isPending: isPendingBanner, data: banners } = queryBanner

  const resolveId = (record) => record?._id || record?.id || record?.key

  const handleActionEdit = (record) => {
    const targetId = resolveId(record)
    setRowSelected(targetId)
    setActiveRowKey(targetId)
    handleDetailsBanner()
  }

  const handleActionDelete = (record) => {
    const targetId = resolveId(record)
    setRowSelected(targetId)
    setIsModalOpenDelete(true)
    setActiveRowKey(targetId)
  }

  const renderAction = (_, record) => (
    <Space size="small">
      <Tooltip title="Chỉnh sửa">
        <ActionIconButton
          $variant="edit"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleActionEdit(record)
          }}
        />
      </Tooltip>
      <Tooltip title="Xóa">
        <ActionIconButton
          $variant="delete"
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleActionDelete(record)
          }}
        />
      </Tooltip>
    </Space>
  )

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Inputcomponent
          ref={searchInput}
          placeholder={`Tìm ${dataIndex}`}
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
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1d4ed8' : undefined }} />,
    onFilter: (value, record) => record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase())
  })

  const columns = useMemo(
    () => [
      {
        title: 'Tên banner',
        dataIndex: 'name',
        sorter: (a, b) => a.name?.length - b.name?.length,
        ...getColumnSearchProps('name'),
        render: (name, record) => (
          <Tooltip title={record?.description || record?.text || 'Nhấp đôi để chỉnh sửa'}>
            <NameCell>{name || 'Chưa đặt tên'}</NameCell>
          </Tooltip>
        )
      },
      {
        title: 'Loại',
        dataIndex: 'type',
        filters: [
          { text: 'Slider', value: 'slider' },
          { text: 'Popup', value: 'popup' },
          { text: 'Trang chủ', value: 'mini_banner' },
          { text: 'Thanh chạy chữ', value: 'announcement' }
        ],
        onFilter: (value, record) => record.type === value,
        render: (type) => {
          const config = TYPE_BADGES[type] || { label: type, bg: '#f1f5f9', color: '#0f172a', border: '#e2e8f0' }
          return (
            <TypePill style={{ background: config.bg, color: config.color, borderColor: config.border }}>
              {config.label}
            </TypePill>
          )
        }
      },
      {
        title: 'Thứ tự',
        dataIndex: 'order',
        sorter: (a, b) => (a.order || 0) - (b.order || 0),
        width: 110
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        filters: [
          { text: 'Hoạt động', value: true },
          { text: 'Ẩn', value: false }
        ],
        onFilter: (value, record) => record.isActive === value,
        render: (isActive) => <StatusBadge $active={isActive}>{isActive ? 'Hoạt động' : 'Ẩn'}</StatusBadge>
      },
      {
        title: 'Hành động',
        dataIndex: 'action',
        width: 150,
        render: renderAction
      }
    ],
    []
  )

  const filteredBanners = useMemo(() => {
    if (!banners?.data) return []
    if (activeTab === 'all') return banners.data
    return banners.data.filter((banner) => banner.type === activeTab)
  }, [banners?.data, activeTab])

  const dataTable = Array.isArray(filteredBanners)
    ? filteredBanners.map((banner) => ({ ...banner, key: banner._id || banner.id }))
    : []

  useEffect(() => {
    if (lastCreatedId && dataTable.length) {
      requestAnimationFrame(() => {
        const target = document.getElementById(`banner-row-${lastCreatedId}`)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
          target.classList.add('row-just-added')
          setActiveRowKey(lastCreatedId)
          setTimeout(() => target.classList.remove('row-just-added'), 1600)
          setLastCreatedId('')
        }
      })
    }
  }, [lastCreatedId, dataTable])

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false)
    setStateBannerDetails(initial())
    formUpdate.resetFields()
    setRowSelected('')
    setIsPendingUpdate(false)
    setBannerType('slider')
  }

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleDeleteBanner = () => {
    if (!rowSelected) {
      message.error('Không tìm thấy ID banner để xóa!')
      return
    }

    if (!user?.access_token) {
      message.error('Bạn chưa đăng nhập!')
      return
    }

    mutationDeleted.mutate(
      {
        id: rowSelected,
        token: user?.access_token
      },
      {
        onSuccess: (resp) => {
          if (resp?.status === 'OK') {
            message.success('Xóa banner thành công!')
            handleCancelDelete()
            queryBanner.refetch()
            setRowSelected('')
          } else {
            const errorMsg = typeof resp?.message === 'string' ? resp.message : 'Xóa banner thất bại!'
            message.error(errorMsg)
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, 'Xóa banner thất bại!')
          message.error(errorMessage)
        }
      }
    )
  }

  const handleDeleteMany = (ids) => {
    if (!ids || ids.length === 0) {
      message.error('Vui lòng chọn ít nhất một banner để xóa!')
      return
    }

    if (!user?.access_token) {
      message.error('Bạn chưa đăng nhập!')
      return
    }

    mutationDeleteMany.mutate(
      {
        ids,
        token: user?.access_token
      },
      {
        onSuccess: (resp) => {
          if (resp?.status === 'OK') {
            message.success(resp?.message || `Xóa ${ids.length} banner thành công!`)
            queryBanner.refetch()
          } else {
            const errorMsg = typeof resp?.message === 'string' ? resp.message : 'Xóa banner thất bại!'
            message.error(errorMsg)
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, 'Xóa banner thất bại!')
          message.error(errorMessage)
        }
      }
    )
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setStateBanner(initial())
    form.resetFields()
    setBannerType('slider')
  }

  const onFinish = (values) => {
    const bannerData = {
      name: typeof values.name === 'string' ? values.name.trim() : '',
      type: bannerType || values.type || 'slider',
      image: typeof stateBanner.image === 'string' ? stateBanner.image : '',
      imageMobile: typeof stateBanner.imageMobile === 'string' ? stateBanner.imageMobile : '',
      link: typeof values.link === 'string' ? values.link.trim() : '',
      text: typeof values.text === 'string' ? values.text.trim() : '',
      description: typeof values.description === 'string' ? values.description.trim() : '',
      backgroundColor: typeof values.backgroundColor === 'string' ? values.backgroundColor : '#ffffff',
      textColor: typeof values.textColor === 'string' ? values.textColor : '#000000',
      order: typeof values.order === 'number' ? values.order : 0,
      isActive: values.isActive !== undefined ? values.isActive : true,
      startDate: values.startDate ? values.startDate.toDate() : null,
      endDate: values.endDate ? values.endDate.toDate() : null,
      showOnPages: Array.isArray(values.showOnPages) ? values.showOnPages : [],
      layout: bannerType === 'mini_banner' ? values.layout || 'single' : undefined
    }

    if (!bannerData.name) {
      message.error('Vui lòng nhập tên banner!')
      return
    }

    if (bannerType !== 'announcement' && !bannerData.image) {
      message.error('Vui lòng chọn hình ảnh!')
      return
    }

    if (bannerType === 'announcement') {
      if (!bannerData.text || !bannerData.text.trim()) {
        message.error('Vui lòng nhập nội dung text!')
        return
      }
      delete bannerData.image
      delete bannerData.imageMobile
      delete bannerData.link
      delete bannerData.layout
    } else {
      delete bannerData.title
      delete bannerData.description
    }

    mutation.mutate(bannerData, {
      onSuccess: (resp) => {
        if (resp?.status === 'OK') {
          message.success('Tạo banner thành công!')
          setLastCreatedId(resp?.data?._id || '')
          handleCancel()
          queryBanner.refetch()
        } else {
          const errorMsg = typeof resp?.message === 'string' ? resp.message : 'Tạo banner thất bại!'
          message.error(errorMsg)
        }
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error, 'Tạo banner thất bại!')
        message.error(errorMessage)
      }
    })
  }

  const handleOnchangeAvatar = async ({ fileList }) => {
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    const newImage = file.preview
    setStateBanner({
      ...stateBanner,
      image: newImage
    })
    form.setFieldsValue({
      image: newImage
    })
  }

  const handleOnchangeAvatarDetails = async ({ fileList }) => {
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    const newImage = file.preview
    setStateBannerDetails({
      ...stateBannerDetails,
      image: newImage
    })
    formUpdate.setFieldsValue({
      image: newImage
    })
  }

  const handleOnchangeAvatarMobile = async ({ fileList }) => {
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    const newImage = file.preview
    setStateBanner({
      ...stateBanner,
      imageMobile: newImage
    })
    form.setFieldsValue({
      imageMobile: newImage
    })
  }

  const handleOnchangeAvatarMobileDetails = async ({ fileList }) => {
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    const newImage = file.preview
    setStateBannerDetails({
      ...stateBannerDetails,
      imageMobile: newImage
    })
    formUpdate.setFieldsValue({
      imageMobile: newImage
    })
  }

  const onUpdateBanner = (values) => {
    if (!rowSelected) {
      message.error('Không tìm thấy ID banner!')
      return
    }

    if (!user?.access_token) {
      message.error('Bạn chưa đăng nhập!')
      return
    }

    const updateData = {
      name: typeof values.name === 'string' ? values.name.trim() : '',
      type: bannerType || values.type || 'slider',
      image: typeof stateBannerDetails.image === 'string' ? stateBannerDetails.image : '',
      imageMobile: typeof stateBannerDetails.imageMobile === 'string' ? stateBannerDetails.imageMobile : '',
      link: typeof values.link === 'string' ? values.link.trim() : '',
      text: typeof values.text === 'string' ? values.text.trim() : '',
      description: typeof values.description === 'string' ? values.description.trim() : '',
      backgroundColor: typeof values.backgroundColor === 'string' ? values.backgroundColor : '#ffffff',
      textColor: typeof values.textColor === 'string' ? values.textColor : '#000000',
      order: typeof values.order === 'number' ? values.order : 0,
      isActive: values.isActive !== undefined ? values.isActive : true,
      startDate: values.startDate ? values.startDate.toDate() : null,
      endDate: values.endDate ? values.endDate.toDate() : null,
      showOnPages: Array.isArray(values.showOnPages) ? values.showOnPages : [],
      layout: bannerType === 'mini_banner' ? values.layout || 'single' : undefined
    }

    if (!updateData.name) {
      message.error('Vui lòng nhập tên banner!')
      return
    }

    if (bannerType !== 'announcement' && !updateData.image) {
      message.error('Vui lòng chọn hình ảnh!')
      return
    }

    if (bannerType === 'announcement') {
      if (!updateData.text || !updateData.text.trim()) {
        message.error('Vui lòng nhập nội dung text!')
        return
      }
      delete updateData.image
      delete updateData.imageMobile
      delete updateData.link
      delete updateData.layout
    } else {
      delete updateData.title
      delete updateData.description
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
            message.success('Cập nhật banner thành công!')
            handleCloseDrawer()
            queryBanner.refetch()
          } else {
            const errorMsg = typeof resp?.message === 'string' ? resp.message : 'Cập nhật banner thất bại!'
            message.error(errorMsg)
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, 'Cập nhật banner thất bại!')
          message.error(errorMessage)
        }
      }
    )
  }

  const renderBannerForm = (formInstance, state, onChangeAvatar, onChangeAvatarMobile) => (
    <>
      <Form.Item label="Tên banner" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên banner!' }]}>
        <Inputcomponent placeholder="Nhập tên banner" />
      </Form.Item>

      <Form.Item label="Loại banner" name="type" rules={[{ required: true, message: 'Vui lòng chọn loại banner!' }]}>
        <Select
          value={bannerType}
          onChange={(value) => {
            setBannerType(value)
            formInstance.setFieldsValue({ type: value })
            if (formInstance === form) {
              setStateBanner({ ...state, type: value })
            } else {
              setStateBannerDetails({ ...state, type: value })
            }
          }}
        >
          <Option value="slider">Slider</Option>
          <Option value="mini_banner">Trang chủ</Option>
          <Option value="popup">Popup</Option>
          <Option value="announcement">Thanh chạy chữ</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Mô tả ngắn" name="description">
        <TextArea rows={2} placeholder="Gợi ý nội dung / tooltip hiển thị khi hover" />
      </Form.Item>

      {bannerType !== 'announcement' && (
        <>
          <Form.Item label="Hình ảnh" name="image" rules={[{ required: true, message: 'Vui lòng chọn hình ảnh!' }]}>
            <WrapperUploadFile onChange={onChangeAvatar} maxCount={1}>
              <Button icon={<PlusOutlined />}>Chọn File</Button>
              {state?.image && (
                <img
                  src={state?.image}
                  style={{
                    height: '100px',
                    width: '100px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    marginLeft: '16px',
                    border: '1px solid #d9d9d9',
                    padding: '4px'
                  }}
                  alt="banner"
                />
              )}
            </WrapperUploadFile>
          </Form.Item>

          {(bannerType === 'slider' || bannerType === 'mini_banner' || bannerType === 'popup') && (
            <Form.Item
              label="Hình ảnh Mobile"
              name="imageMobile"
              tooltip="Tùy chọn. Nếu bỏ trống sẽ dùng hình desktop."
            >
              <WrapperUploadFile onChange={onChangeAvatarMobile} maxCount={1}>
                <Button icon={<PlusOutlined />}>Chọn File Mobile</Button>
                {state?.imageMobile && (
                  <img
                    src={state?.imageMobile}
                    style={{
                      height: '100px',
                      width: '100px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      marginLeft: '16px',
                      border: '1px solid #d9d9d9',
                      padding: '4px'
                    }}
                    alt="banner mobile"
                  />
                )}
              </WrapperUploadFile>
            </Form.Item>
          )}

          {bannerType === 'mini_banner' && (
            <Form.Item
              label="Layout"
              name="layout"
              tooltip="Single (1 ảnh ngang), Double (2 ảnh), Triple (3 ảnh), Grid (4 ảnh 2x2)"
            >
              <Select>
                <Option value="single">Single - 1 ảnh ngang</Option>
                <Option value="double">Double - 2 ảnh ngang</Option>
                <Option value="triple">Triple - 3 ảnh</Option>
                <Option value="grid">Grid - 4 ảnh (2x2)</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Link" name="link">
            <Inputcomponent placeholder="URL khi click vào banner" />
          </Form.Item>
        </>
      )}

      {bannerType === 'announcement' && (
        <>
          <Form.Item label="Nội dung text" name="text" rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}>
            <Inputcomponent placeholder="Nội dung thanh chạy chữ" />
          </Form.Item>

          <Form.Item label="Màu nền" name="backgroundColor">
            <Input type="color" />
          </Form.Item>

          <Form.Item label="Màu chữ" name="textColor">
            <Input type="color" />
          </Form.Item>
        </>
      )}

      {bannerType === 'popup' && (
        <Form.Item label="Hiển thị trên trang" name="showOnPages">
          <Select mode="multiple" placeholder="Chọn các trang hiển thị">
            <Option value="home">Trang chủ</Option>
            <Option value="product">Trang sản phẩm</Option>
            <Option value="cart">Giỏ hàng</Option>
          </Select>
        </Form.Item>
      )}

      <Form.Item label="Thứ tự" name="order">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item label="Ngày bắt đầu" name="startDate">
        <DatePicker style={{ width: '100%' }} showTime />
      </Form.Item>

      <Form.Item label="Ngày kết thúc" name="endDate">
        <DatePicker style={{ width: '100%' }} showTime />
      </Form.Item>

      <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  )

  const tabItems = TABS.map((tab) => ({
    key: tab.key,
    label: (
      <Space size={8}>
        {tab.icon}
        <span>{tab.label}</span>
      </Space>
    ),
    children: null
  }))

  return (
    <Page>
      <HeaderRow>
        <TitleBlock>
          <Title>Quản lý Banner / Thông báo</Title>
          
        </TitleBlock>
        <ActionsRow>
          <ButtonGroup>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryBanner.refetch()}
              loading={isPendingBanner}
              className="ghost"
              size="large"
            >
             
            </Button>
           
          </ButtonGroup>
        </ActionsRow>
      </HeaderRow>

      <StatGrid>
        <StatCard>
          <StatIcon $tone="blue">
            <PictureOutlined />
          </StatIcon>
          <div>
            <StatLabel>Tổng banner</StatLabel>
            <StatValue>{filteredBanners.length}</StatValue>
          </div>
        </StatCard>
        <StatCard>
          <StatIcon $tone="green">
            <NotificationOutlined />
          </StatIcon>
          <div>
            <StatLabel>Đang hoạt động</StatLabel>
            <StatValue>{filteredBanners.filter((b) => b.isActive).length}</StatValue>
          </div>
        </StatCard>
      </StatGrid>

      <CreateCard
        onClick={() => {
          setBannerType(activeTab === 'all' ? 'slider' : activeTab)
          setIsModalOpen(true)
        }}
      >
        <CreateIcon>
          <PlusOutlined />
        </CreateIcon>
        <div>
          <CreateTitle>Tạo banner mới</CreateTitle>

        </div>
      </CreateCard>

      <TabWrap>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} animated />
      </TabWrap>

      <FadeWrap key={activeTab}>
        <TableShell>
          <TableHeader>
            <div>
              <div className="title">Danh sách banner</div>
             
            </div>
            <Button icon={<ReloadOutlined />} onClick={() => queryBanner.refetch()} />
          </TableHeader>
          <TableComponent
            columns={columns}
            isPending={isPendingBanner}
            data={dataTable}
            handleDeleteMany={handleDeleteMany}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `${total} banner`
            }}
            locale={{
              emptyText: (
                <EmptyWrap>
                  {isPendingBanner
                    ? 'Đang tải dữ liệu...'
                    : `Chưa có banner loại "${TABS.find((t) => t.key === activeTab)?.label || 'này'}". Tạo mới để bắt đầu.`}
                </EmptyWrap>
              )
            }}
            rowClassName={(record) => {
              const rid = resolveId(record)
              return `banner-row ${activeRowKey === rid ? 'is-active' : ''}`
            }}
            onRow={(record) => ({
              id: `banner-row-${resolveId(record)}`,
              onClick: () => {
                const rid = resolveId(record)
                setRowSelected(rid)
                setActiveRowKey(rid)
              },
              onDoubleClick: () => {
                const rid = resolveId(record)
                setRowSelected(rid)
                setActiveRowKey(rid)
                handleDetailsBanner()
              }
            })}
          />
        </TableShell>
      </FadeWrap>

      <ModalComponent forceRender title="Tạo banner" open={isModalOpen} onCancel={handleCancel} footer={null} width={820}>
        <Loading isPending={isPending}>
          <Form
            name="createBanner"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
            autoComplete="off"
            form={form}
            style={{ padding: '20px 0' }}
          >
            {renderBannerForm(form, stateBanner, handleOnchangeAvatar, handleOnchangeAvatarMobile)}

            <Form.Item wrapperCol={{ span: 24 }}>
              <ActionButtons>
                <Button onClick={handleCancel} style={{ marginRight: '12px' }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={isPending} style={{ minWidth: '120px' }}>
                  Tạo mới
                </Button>
              </ActionButtons>
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>

      <DrawerComponent title="Chi tiết banner" isOpen={isOpenDrawer} onClose={handleCloseDrawer} width="90%">
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            name="updateBanner"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            onFinish={onUpdateBanner}
            autoComplete="off"
            form={formUpdate}
            style={{ padding: '20px 0' }}
          >
            {renderBannerForm(formUpdate, stateBannerDetails, handleOnchangeAvatarDetails, handleOnchangeAvatarMobileDetails)}

            <Form.Item wrapperCol={{ span: 24 }}>
              <ActionButtons>
                <Button onClick={handleCloseDrawer} style={{ marginRight: '12px' }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={isPendingUpdated} style={{ minWidth: '120px' }}>
                  Cập nhật
                </Button>
              </ActionButtons>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      <ModalComponent title="Xóa banner" open={isModalOpenDelete} onCancel={handleCancelDelete} onOk={handleDeleteBanner}>
        <Loading isPending={isPendingDeleted}>
          <div>Bạn có chắc muốn xóa banner này không?</div>
        </Loading>
      </ModalComponent>
    </Page>
  )
}

export default AdminBanner
