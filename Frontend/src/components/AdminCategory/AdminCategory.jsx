import React, { useEffect, useRef, useState } from 'react'
import {
  ActionsBar,
  CardsRow,
  CategoryCell,
  CategoryMeta,
  CategoryName,
  CategoryUpload,
  CreateCard,
  FilterChip,
  HeaderActions,
  HeaderSubtitle,
  InlineMuted,
  PageHeader,
  PreviewCard,
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
import {
  Avatar,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as CategoryService from '../../services/CategoryService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import { getBase64 } from '../../utils'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'

const { Option } = Select

const normalizeActiveFlag = (value) => (typeof value === 'boolean' ? value : true)

const getErrorMessage = (error, defaultMessage = 'Đã xảy ra lỗi!') => {
  if (!error) return defaultMessage
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    if (error?.response?.data?.message) {
      const msg = error.response.data.message
      if (typeof msg === 'string') return msg
      if (msg && typeof msg === 'object' && msg.message && typeof msg.message === 'string') {
        return msg.message
      }
    }
    if (error?.response?.data) {
      const data = error.response.data
      if (typeof data === 'string') return data
      if (data?.message && typeof data.message === 'string') return data.message
    }
    if (error?.message && typeof error.message === 'string') return error.message
    if (error?.reason || error?.path) return error?.message || error?.reason || defaultMessage
  }
  return defaultMessage
}

const AdminCategory = () => {
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
    image: '',
    parentCategory: '',
    isActive: true
  })

  const [stateCategory, setStateCategory] = useState(initial())
  const [stateCategoryDetails, setStateCategoryDetails] = useState(initial())
  const [form] = Form.useForm()
  const [formUpdate] = Form.useForm()

  const mutation = useMutationHooks((data) => CategoryService.createCategory(data, user?.access_token))

  const mutationUpdate = useMutationHooks((data) => {
    const { id, token, ...rests } = data
    return CategoryService.updateCategory(id, token, rests)
  })

  const mutationDeleteted = useMutationHooks((data) => {
    const { id, token } = data
    return CategoryService.deleteCategory(id, token)
  })

  const mutationDeleteMany = useMutationHooks((data) => {
    const { ids, token } = data
    return CategoryService.deleteManyCategory(ids, token)
  })

  const getAllCategories = async () => {
    const res = await CategoryService.getAllCategory()
    return res
  }

  const fetchGetDetailsCategory = async (selectedId) => {
    try {
      setIsPendingUpdate(true)
      const res = await CategoryService.getDetailsCategory(selectedId)
      if (res?.data) {
        const categoryData = {
          name: res?.data?.name || '',
          slug: res?.data?.slug || '',
          description: res?.data?.description || '',
          image: res?.data?.image || '',
          parentCategory: res?.data?.parentCategory?._id || '',
          isActive: res?.data?.isActive ?? true
        }
        setStateCategoryDetails(categoryData)
        setTimeout(() => {
          formUpdate.setFieldsValue(categoryData)
        }, 80)
      }
    } catch (error) {
      console.error('Error fetching category details:', error)
      message.error('Không thể tải thông tin danh mục')
    } finally {
      setIsPendingUpdate(false)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      form.setFieldsValue(initial())
      setStateCategory(initial())
      // Ensure parent categories are up-to-date when opening create modal
      if (typeof refetchParents === 'function') refetchParents()
    }
  }, [isModalOpen, form])

  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      setIsPendingUpdate(true)
      fetchGetDetailsCategory(rowSelected)
      // Ensure parents list is fresh when opening details drawer
      if (typeof refetchParents === 'function') refetchParents()
    }
  }, [rowSelected, isOpenDrawer])

  useEffect(() => {
    if (isOpenDrawer && !isPendingUpdate && stateCategoryDetails.name) {
      formUpdate.setFieldsValue({
        name: stateCategoryDetails.name || '',
        slug: stateCategoryDetails.slug || '',
        description: stateCategoryDetails.description || '',
        image: stateCategoryDetails.image || '',
        parentCategory: stateCategoryDetails.parentCategory || '',
        isActive: typeof stateCategoryDetails.isActive === 'boolean' ? stateCategoryDetails.isActive : true
      })
    }
  }, [stateCategoryDetails, isOpenDrawer, isPendingUpdate, formUpdate])

  useEffect(() => {
    if (!isOpenDrawer) {
      formUpdate.resetFields()
      setStateCategoryDetails(initial())
    }
  }, [isOpenDrawer, formUpdate])

  const handleDetailsCategory = () => {
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

  const queryCategory = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories
  })

  const { isPending: isPendingCategory, data: categories } = queryCategory

  // Fetch parent (root) categories separately to populate 'Danh mục cha' dropdown
  const { data: parentsData, isPending: isPendingParents, refetch: refetchParents } = useQuery({
    queryKey: ['parent-categories'],
    queryFn: () => CategoryService.getParentCategories()
  })

  const totalCategories = categories?.data?.length || 0
  const activeCategories = (categories?.data || []).filter((c) => normalizeActiveFlag(c?.isActive)).length
  const inactiveCategories = Math.max(totalCategories - activeCategories, 0)
  const rootCategories = (categories?.data || []).filter((c) => !c?.parentCategory).length
  const updatedLabel = queryCategory?.dataUpdatedAt
    ? new Date(queryCategory.dataUpdatedAt).toLocaleTimeString('vi-VN')
    : '--'

  const keyword = searchTerm.trim().toLowerCase()
  const filteredCategories = (categories?.data || []).filter((category) => {
    const isActiveNormalized = normalizeActiveFlag(category?.isActive)
    const matchStatus =
      statusFilter === 'all' ? true : statusFilter === 'active' ? isActiveNormalized : !isActiveNormalized
    const haystack = `${category?.name || ''} ${category?.slug || ''}`.toLowerCase()
    const matchKeyword = keyword ? haystack.includes(keyword) : true
    return matchStatus && matchKeyword
  })

  // Map parentId -> children for quick lookups and rendering
  const parentChildrenMap = React.useMemo(() => {
    const map = {}
    ;(categories?.data || []).forEach((c) => {
      const pid = c.parentCategory && typeof c.parentCategory === 'object' ? String(c.parentCategory._id) : c.parentCategory && String(c.parentCategory)
      if (pid) {
        map[pid] = map[pid] || []
        map[pid].push(c)
      }
    })
    return map
  }, [categories])

  // Expanded parent ids for collapse/expand
  const [expandedParents, setExpandedParents] = useState([])

  // When a row is selected (active), open its parent (or itself if parent) by default — unless searching where we merge with search opens
  useEffect(() => {
    if (!searchTerm) {
      if (!rowSelected) {
        setExpandedParents([])
        return
      }
      const selected = (categories?.data || []).find((c) => String(c._id) === String(rowSelected))
      if (!selected) {
        setExpandedParents([])
        return
      }
      if (selected.parentCategory) {
        const pid = typeof selected.parentCategory === 'object' ? String(selected.parentCategory._id) : String(selected.parentCategory)
        setExpandedParents([pid])
      } else {
        // selected is a parent — open it
        setExpandedParents([String(selected._id)])
      }
    }
  }, [rowSelected, searchTerm, categories])

  // Auto-open parents that contain matching children when searching
  useEffect(() => {
    const kw = keyword
    if (!kw) return
    setExpandedParents((prev) => {
      const toOpen = new Set(prev)
      ;(filteredCategories || []).forEach((cat) => {
        if (cat.parentCategory) {
          const isMatch = (cat.name || '').toLowerCase().includes(kw) || (cat.slug || '').toLowerCase().includes(kw)
          if (isMatch) {
            const pid = typeof cat.parentCategory === 'object' ? String(cat.parentCategory._id) : String(cat.parentCategory)
            if (pid) toOpen.add(pid)
          }
        }
      })
      return Array.from(toOpen)
    })
  }, [keyword, filteredCategories])

  const renderAction = (_, record) => {
    return (
      <Space size={8}>
        <Tooltip title='Chỉnh sửa danh mục'>
          <Button
            type='primary'
            ghost
            size='small'
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setRowSelected(record._id)
              handleDetailsCategory()
            }}
          >
            
          </Button>
        </Tooltip>
        <Tooltip title='Xóa danh mục'>
          <Button
            danger
            ghost
            size='small'
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
          <Button type='primary' onClick={() => confirm()} icon={<SearchOutlined />} size='small' style={{ width: 90 }}>
            Tìm
          </Button>
          <Button onClick={() => clearFilters && clearFilters()} size='small' style={{ width: 90 }}>
            Xóa
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) => record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase())
  })

  const toggleParent = (pid) => {
    const id = String(pid)
    setExpandedParents((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return Array.from(s)
    })
  }

  const highlightText = (text, kw) => {
    if (!kw) return text
    const lower = text.toLowerCase()
    const idx = lower.indexOf(kw)
    if (idx === -1) return text
    const before = text.substring(0, idx)
    const match = text.substring(idx, idx + kw.length)
    const after = text.substring(idx + kw.length)
    return (
      <>
        {before}
        <span className='highlight'>{match}</span>
        {after}
      </>
    )
  }

  const columns = [
    {
      title: 'Danh mục',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps('name'),
      render: (_, record) => {
        const isChild = !!record?.parentCategory;
        let parentName = '';
        if (isChild) {
          if (typeof record.parentCategory === 'object') parentName = record.parentCategory.name || '';
          else parentName = (categories?.data || []).find((c) => String(c._id) === String(record.parentCategory))?.name || '';
        }

        return (
          <CategoryCell>
            <Avatar
              shape='square'
              size={52}
              src={record?.image}
              style={{ border: '1px solid #e5e7eb', background: '#f8fafc' }}
            >
              {(record?.name || 'C').charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <CategoryName style={{ fontWeight: isChild ? 500 : 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                {isChild ? (
                  <span style={{ marginLeft: 12, color: '#6b7280' }}>↳</span>
                ) : null}
                {/* show caret for parents with children */}
                {!isChild && (parentChildrenMap[String(record._id)] || []).length > 0 ? (
                  <span onClick={(e) => { e.stopPropagation(); toggleParent(record._id) }} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', marginRight: 6 }}>
                    {expandedParents.includes(String(record._id)) ? <CaretDownOutlined /> : <CaretRightOutlined />}
                  </span>
                ) : (
                  <span style={{ width: 18, display: 'inline-block' }} />
                )}
                <span>{highlightText(record?.name || 'Chưa đặt tên', keyword)}</span>
              </CategoryName>
              <CategoryMeta>
                <Tag color='blue'>{record?.slug || 'Chưa có slug'}</Tag>
                {isChild && parentName ? <InlineMuted style={{ marginLeft: 8 }}>Thuộc: {parentName}</InlineMuted> : null}
              </CategoryMeta>
            </div>
          </CategoryCell>
        )
      }
    },
      // 'Danh mục con' column removed - children will be shown as indented rows under parents
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

  const dataTable = Array.isArray(filteredCategories)
    ? (() => {
        const parents = filteredCategories.filter((c) => !c?.parentCategory)
        const children = filteredCategories.filter((c) => c?.parentCategory)

        const childrenMap = {}
        children.forEach((c) => {
          const pid = c.parentCategory && typeof c.parentCategory === 'object' ? String(c.parentCategory._id) : String(c.parentCategory)
          childrenMap[pid] = childrenMap[pid] || []
          childrenMap[pid].push(c)
        })

        const ordered = []
        parents.forEach((p) => {
          ordered.push(p)
          const subs = childrenMap[String(p._id)] || []
          subs.forEach((s) => ordered.push(s))
        })

        const included = new Set(ordered.map((it) => String(it._id)))
        filteredCategories.forEach((c) => {
          if (!included.has(String(c._id))) ordered.push(c)
        })

        return ordered.map((category) => ({
          ...category,
          isActive: normalizeActiveFlag(category?.isActive),
          key: category._id
        }))
      })()
    : []

  // Only show child rows if their parent is expanded — keep parents always visible
  const displayData = React.useMemo(() => {
    if (!Array.isArray(dataTable) || dataTable.length === 0) return []
    return dataTable.filter((row) => {
      if (row.parentCategory) {
        const pid = typeof row.parentCategory === 'object' ? String(row.parentCategory._id) : String(row.parentCategory)
        return expandedParents.includes(pid)
      }
      return true
    })
  }, [dataTable, expandedParents])

  useEffect(() => {
    if (isSuccess && data?.status === 'OK') {
      handleCancel()
      queryCategory.refetch()
    } else if (isSuccess && data?.status === 'ERR') {
      const errorMsg = typeof data?.message === 'string' ? data.message : 'Tạo danh mục thất bại!'
      message.error(errorMsg)
    } else if (isError) {
      message.error('Tạo danh mục thất bại!')
    }
  }, [isSuccess, isError, data])

  useEffect(() => {
    if (isSuccessDeleted && dataDeleted?.status === 'OK') {
      handleCancelDelete()
      queryCategory.refetch()
      setRowSelected('')
    } else if (isSuccessDeleted && dataDeleted?.status === 'ERR') {
      const errorMsg =
        typeof dataDeleted?.message === 'string' ? dataDeleted.message : 'Xóa danh mục thất bại!'
      message.error(errorMsg)
    } else if (isErrorDeleted) {
      message.error('Xóa danh mục thất bại!')
    }
  }, [isSuccessDeleted, isErrorDeleted, dataDeleted])

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false)
    setStateCategoryDetails(initial())
    formUpdate.resetFields()
    setRowSelected('')
    setIsPendingUpdate(false)
  }

  useEffect(() => {
    if (isSuccessUpdated && dataUpdated?.status === 'OK') {
      handleCloseDrawer()
      queryCategory.refetch()
    } else if (isSuccessUpdated && dataUpdated?.status === 'ERR') {
      const errorMsg =
        typeof dataUpdated?.message === 'string' ? dataUpdated.message : 'Cập nhật danh mục thất bại!'
      message.error(errorMsg)
    } else if (isErrorUpdated) {
      message.error('Cập nhật danh mục thất bại!')
    }
  }, [isSuccessUpdated, isErrorUpdated, dataUpdated])

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleDeleteCategory = () => {
    if (!rowSelected) {
      message.error('Không tìm thấy danh mục để xóa!')
      return
    }

    if (!user?.access_token) {
      message.error('Vui lòng đăng nhập!')
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
            message.success('Xóa danh mục thành công!')
            handleCancelDelete()
            queryCategory.refetch()
            setRowSelected('')
          } else {
            const errorMsg = typeof resp?.message === 'string' ? resp.message : 'Xóa danh mục thất bại!'
            message.error(errorMsg)
          }
        },
        onError: (error) => {
          console.error('Delete category error:', error)
          const errorMessage = getErrorMessage(error, 'Xóa danh mục thất bại!')
          message.error(errorMessage)
        }
      }
    )
  }

  const handleDeleteMany = (ids) => {
    if (!ids || ids.length === 0) {
      message.error('Vui lòng chọn ít nhất một danh mục để xóa!')
      return
    }

    if (!user?.access_token) {
      message.error('Vui lòng đăng nhập!')
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
            message.success(resp?.message || `Xóa ${ids.length} danh mục thành công!`)
            queryCategory.refetch()
          } else {
            const errorMsg = typeof resp?.message === 'string' ? resp.message : 'Xóa danh mục thất bại!'
            message.error(errorMsg)
          }
        },
        onError: (error) => {
          console.error('Delete many categories error:', error)
          const errorMessage = getErrorMessage(error, 'Xóa danh mục thất bại!')
          message.error(errorMessage)
        }
      }
    )
  }

  const handleCancel = () => {
    setisModalOpen(false)
    setStateCategory(initial())
    form.resetFields()
  }

  const onFinish = (values) => {
    const categoryData = {
      name: typeof values.name === 'string' ? values.name.trim() : '',
      slug: typeof values.slug === 'string' ? values.slug.trim() : '',
      description: typeof values.description === 'string' ? values.description.trim() : '',
      image: typeof stateCategory.image === 'string' ? stateCategory.image : '',
      parentCategory: typeof stateCategory.parentCategory === 'string' ? stateCategory.parentCategory : '',
      isActive: typeof values.isActive === 'boolean' ? values.isActive : true
    }

    if (!categoryData.name) {
      message.error('Vui lòng nhập tên danh mục!')
      return
    }

    // Validate parentCategory is root if provided
    if (categoryData.parentCategory) {
      const parent = (categories?.data || []).find((c) => String(c._id) === String(categoryData.parentCategory))
      if (!parent) {
        message.error('Danh mục cha không tồn tại')
        return
      }
      if (parent.parentCategory) {
        message.error('Danh mục cha phải là danh mục gốc (không thể là danh mục con)')
        return
      }
    }

    mutation.mutate(categoryData, {
      onSuccess: (resp) => {
        if (resp?.status === 'OK') {
          message.success('Tạo danh mục thành công!')
          handleCancel()
          queryCategory.refetch()
        } else {
          const errorMsg = typeof resp?.message === 'string' ? resp.message : 'Tạo danh mục thất bại!'
          message.error(errorMsg)
        }
      },
      onError: (error) => {
        console.error('Create category error:', error)
        const errorMessage = getErrorMessage(error, 'Tạo danh mục thất bại!')
        message.error(errorMessage)
      }
    })
  }

  const handleOnchangeAvatar = async ({ fileList }) => {
    if (!fileList || !fileList.length) return
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    const newImage = file.preview
    setStateCategory((prev) => ({
      ...prev,
      image: newImage
    }))
    form.setFieldsValue({
      image: newImage
    })
  }

  const handleOnchangeAvatarDetails = async ({ fileList }) => {
    if (!fileList || !fileList.length) return
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    const newImage = file.preview
    setStateCategoryDetails((prev) => ({
      ...prev,
      image: newImage
    }))
    formUpdate.setFieldsValue({
      image: newImage
    })
  }

  const onUpdateCategory = (values) => {
    if (!rowSelected) {
      message.error('Không tìm thấy ID danh mục!')
      return
    }

    if (!user?.access_token) {
      message.error('Vui lòng đăng nhập!')
      return
    }

    const updateData = {
      name: typeof values.name === 'string' ? values.name.trim() : '',
      slug: typeof values.slug === 'string' ? values.slug.trim() : '',
      description: typeof values.description === 'string' ? values.description.trim() : '',
      image: typeof stateCategoryDetails.image === 'string' ? stateCategoryDetails.image : '',
      parentCategory:
        stateCategoryDetails.parentCategory && typeof stateCategoryDetails.parentCategory === 'string'
          ? stateCategoryDetails.parentCategory
          : '',
      isActive: typeof values.isActive === 'boolean' ? values.isActive : true
    }

    if (!updateData.name) {
      message.error('Vui lòng nhập tên danh mục!')
      return
    }

    // Validate parentCategory is root (if provided)
    if (updateData.parentCategory) {
      const parent = (categories?.data || []).find((c) => String(c._id) === String(updateData.parentCategory))
      if (!parent) {
        message.error('Danh mục cha không tồn tại')
        return
      }
      if (parent.parentCategory) {
        message.error('Danh mục cha phải là danh mục gốc (không thể là danh mục con)')
        return
      }
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
            message.success('Cập nhật danh mục thành công!')
            handleCloseDrawer()
            queryCategory.refetch()
          } else {
            const errorMsg =
              typeof resp?.message === 'string' ? resp.message : 'Cập nhật danh mục thất bại!'
            message.error(errorMsg)
          }
        },
        onError: (error) => {
          console.error('Update category error:', error)
          const errorMessage = getErrorMessage(error, 'Cập nhật danh mục thất bại!')
          message.error(errorMessage)
        }
      }
    )
  }

  const renderPreview = (categoryState) => (
    <PreviewCard>
      <div className='preview-head'>Xem nhanh</div>
      <div className='preview-body'>
        <Avatar
          shape='square'
          size={64}
          src={categoryState?.image}
          style={{ borderRadius: 14, border: '1px solid #e5e7eb', background: '#f8fafc' }}
        >
          {(categoryState?.name || 'C').charAt(0).toUpperCase()}
        </Avatar>
        <div>
          <CategoryName>{categoryState?.name || 'Tên danh mục'}</CategoryName>
          <CategoryMeta>
            <Tag color='blue'>{categoryState?.slug || 'slug-danh-muc'}</Tag>
            {categoryState?.parentCategory ? (
              <Tag color='purple'>Thuộc danh mục cha</Tag>
            ) : (
              <InlineMuted>Danh mục gốc</InlineMuted>
            )}
            <Tag color={categoryState?.isActive === false ? 'default' : 'success'}>
              {categoryState?.isActive === false ? 'Tạm dừng' : 'Hoạt động'}
            </Tag>
          </CategoryMeta>
        </div>
      </div>
      <InlineMuted style={{ marginTop: 8 }}>
        {categoryState?.description || 'Mô tả danh mục giúp khách hiểu nhanh nhóm sản phẩm.'}
      </InlineMuted>
    </PreviewCard>
  )

  const parentOptions = (parentsData?.data || []).filter((cat) => String(cat._id) !== String(rowSelected));

  return (
    <WrapperContent>
      <PageHeader>
        <div>
          <WrapperHeader>Quản lý danh mục</WrapperHeader>
      
        </div>
        
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatLabel>Tổng danh mục</StatLabel>
          <StatValue>{totalCategories}</StatValue>
          <StatTrend>{updatedLabel === '--' ? 'Chưa đồng bộ' : `Cập nhật lúc ${updatedLabel}`}</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Hoạt động</StatLabel>
          <StatValue>{activeCategories}</StatValue>
          <StatTrend>Đang hiển thị</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Tạm dừng</StatLabel>
          <StatValue>{inactiveCategories}</StatValue>
          <StatTrend $negative={inactiveCategories > 0}>
            {inactiveCategories > 0 ? 'Cần rà soát' : 'Ổn định'}
          </StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Danh mục gốc</StatLabel>
          <StatValue>{rootCategories}</StatValue>
          <StatTrend>Không có danh mục cha</StatTrend>
        </StatCard>
      </StatsGrid>

      <ActionsBar>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder='Tìm danh mục theo tên hoặc slug'
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
          <InlineMuted>{filteredCategories.length} kết quả</InlineMuted>
        </Space>
      </ActionsBar>

      <CardsRow>
        <CreateCard hoverable onClick={() => setisModalOpen(true)}>
          <div className='card-icon'>
            <PlusOutlined />
          </div>
          <div className='card-title'>Thêm danh mục mới</div>
          
        </CreateCard>
      </CardsRow>

      <TableCard>
        <TableHeader>
          <div>
            <TableTitle>Danh sách danh mục</TableTitle>
           
          </div>
          <Tag color='processing'>{filteredCategories.length} danh mục</Tag>
        </TableHeader>
        <TableComponent
          handleDeleteMany={handleDeleteMany}
          columns={columns}
          isPending={isPendingCategory}
          data={displayData}
          size='middle'
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showTotal: (total) => `${total} danh mục`
          }}
          rowClassName={(record) => (record._id === rowSelected ? 'category-row-active' : '')}
          onRow={(record) => ({
            onClick: () => {
              setRowSelected(record._id)
            },
            onDoubleClick: () => {
              setRowSelected(record._id)
              handleDetailsCategory()
            }
          })}
        />
      </TableCard>

      <ModalComponent
        forceRender
        title='Thêm danh mục'
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={900}
      >
        <Loading isPending={isPending}>
          <Form
            name='createCategory'
            layout='vertical'
            onFinish={onFinish}
            autoComplete='off'
            form={form}
            style={{ padding: '12px 0' }}
            onValuesChange={(_, allValues) => setStateCategory((prev) => ({ ...prev, ...allValues }))}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} md={16}>
                <Form.Item
                  label='Tên danh mục'
                  name='name'
                  rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
                >
                  <Inputcomponent placeholder='Nhập tên danh mục' />
                </Form.Item>

                <Form.Item
                  label='Slug'
                  name='slug'
                  tooltip='Đường dẫn URL của danh mục (bỏ trống để tự động tạo)'
                >
                  <Inputcomponent placeholder='danh-muc-san-pham' />
                </Form.Item>

                <Form.Item label='Mô tả' name='description'>
                  <Input.TextArea rows={4} placeholder='Nhập mô tả ngắn cho danh mục' showCount maxLength={500} />
                </Form.Item>

                <Form.Item label='Danh mục cha' name='parentCategory'>
                  <Select
                    allowClear
                    placeholder='Chọn danh mục cha (tùy chọn)'
                    value={stateCategory.parentCategory}
                    onChange={(value) => setStateCategory((prev) => ({ ...prev, parentCategory: value || '' }))}
                  >
                    {parentOptions.map((cat) => (
                      <Option key={cat._id} value={cat._id}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label='Trạng thái' name='isActive' valuePropName='checked' initialValue={true}>
                  <Switch checkedChildren='Bật' unCheckedChildren='Tắt' />
                </Form.Item>

                <Form.Item label='Hình ảnh' name='image'>
                  <CategoryUpload onChange={handleOnchangeAvatar} maxCount={1}>
                    <Button icon={<PlusOutlined />}>Chọn file</Button>
                    {stateCategory?.image && (
                      <img
                        src={stateCategory?.image}
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
                        alt='category'
                      />
                    )}
                  </CategoryUpload>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                {renderPreview(stateCategory)}
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 16px' }} />

            <Form.Item>
              <WrapperActionButtons>
                <Button onClick={handleCancel} style={{ marginRight: '12px' }}>
                  Hủy
                </Button>
                <Button type='primary' htmlType='submit' loading={isPending} style={{ minWidth: '140px' }}>
                  Lưu danh mục
                </Button>
              </WrapperActionButtons>
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>

      <DrawerComponent title='Chi tiết danh mục' isOpen={isOpenDrawer} onClose={handleCloseDrawer} width='78%'>
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            name='updateCategory'
            layout='vertical'
            onFinish={onUpdateCategory}
            autoComplete='off'
            form={formUpdate}
            style={{ padding: '12px 0' }}
            onValuesChange={(_, allValues) => setStateCategoryDetails((prev) => ({ ...prev, ...allValues }))}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} md={16}>
                <Form.Item
                  label='Tên danh mục'
                  name='name'
                  rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
                >
                  <Inputcomponent placeholder='Nhập tên danh mục' />
                </Form.Item>

                <Form.Item label='Slug' name='slug' tooltip='Đường dẫn URL của danh mục'>
                  <Inputcomponent placeholder='ví dụ: danh-muc' />
                </Form.Item>

                <Form.Item label='Mô tả' name='description'>
                  <Input.TextArea rows={4} placeholder='Nhập mô tả ngắn cho danh mục' showCount maxLength={500} />
                </Form.Item>

                <Form.Item label='Danh mục cha' name='parentCategory'>
                  <Select
                    allowClear
                    placeholder='Chọn danh mục cha (tùy chọn)'
                    value={stateCategoryDetails.parentCategory}
                    onChange={(value) => setStateCategoryDetails((prev) => ({ ...prev, parentCategory: value || '' }))}
                  >
                    {parentOptions.map((cat) => (
                      <Option key={cat._id} value={cat._id}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label='Trạng thái' name='isActive' valuePropName='checked' initialValue={true}>
                  <Switch checkedChildren='Bật' unCheckedChildren='Tắt' />
                </Form.Item>

                <Form.Item label='Hình ảnh' name='image'>
                  <CategoryUpload onChange={handleOnchangeAvatarDetails} maxCount={1}>
                    <Button icon={<PlusOutlined />}>Chọn file</Button>
                    {stateCategoryDetails?.image && (
                      <img
                        src={stateCategoryDetails?.image}
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
                        alt='category'
                      />
                    )}
                  </CategoryUpload>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                {renderPreview(stateCategoryDetails)}
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 16px' }} />

            <Form.Item>
              <WrapperActionButtons>
                <Button onClick={handleCloseDrawer} style={{ marginRight: '12px' }}>
                  Hủy
                </Button>
                <Button type='primary' htmlType='submit' loading={isPendingUpdated} style={{ minWidth: '140px' }}>
                  Cập nhật
                </Button>
              </WrapperActionButtons>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      <ModalComponent title='Xóa danh mục' open={isModalOpenDelete} onCancel={handleCancelDelete} onOk={handleDeleteCategory}>
        <Loading isPending={isPendingDeleted}>
          <div>Bạn có chắc chắn muốn xóa danh mục này không?</div>
        </Loading>
      </ModalComponent>
    </WrapperContent>
  )
}

export default AdminCategory
