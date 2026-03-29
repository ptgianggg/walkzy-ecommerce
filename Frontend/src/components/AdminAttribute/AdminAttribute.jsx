import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionsBar,
  AttributePreview,
  CardsRow,
  CreateCard,
  FilterChip,
  HeaderActions,
  HeaderSubtitle,
  PageHeader,
  StatsGrid,
  StatCard,
  StatLabel,
  StatTrend,
  StatValue,
  TableCard,
  TableHeader,
  WrapperContent,
  WrapperHeader,
  CellStack,
  ColorSwatch,
  TypePill
} from './style'
import { Button, Col, Form, Input, InputNumber, Row, Select, Space, Tooltip, Tag } from 'antd'
import {
  BgColorsOutlined,
  DeleteOutlined,
  EditOutlined,
  FontSizeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SkinOutlined
} from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as AttributeService from '../../services/AttributeService'
import * as CategoryService from '../../services/CategoryService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'

const { Option } = Select

const TYPE_OPTIONS = [
  {
    key: 'color',
    label: 'Màu sắc',
    tone: '#2563eb',
    icon: <BgColorsOutlined />
  },
  {
    key: 'size',
    label: 'Kích cỡ',
    tone: '#0ea5e9',
    icon: <FontSizeOutlined />
  },
  {
    key: 'material',
    label: 'Chất liệu',
    tone: '#10b981',
    icon: <SkinOutlined />
  }
]

const TYPE_KEYS = TYPE_OPTIONS.map((opt) => opt.key)

const ALL_CATEGORIES_VALUE = '__ALL__'

const normalizeCategoryId = (category) => {
  if (!category) return ''
  if (typeof category === 'string') return category
  if (typeof category === 'object') {
    const raw = category._id || category.id || category.value
    if (raw) {
      return typeof raw === 'string' ? raw : raw?.toString?.() || ''
    }
    const objectString = category?.toString?.()
    if (objectString && objectString !== '[object Object]') return objectString
  }
  return ''
}

const normalizeCategoryIds = (categories) => {
  if (!categories) return []
  if (Array.isArray(categories)) {
    return categories.map((cat) => normalizeCategoryId(cat)).filter(Boolean)
  }
  const single = normalizeCategoryId(categories)
  return single ? [single] : []
}

const toCategorySelection = (categories) => {
  const ids = normalizeCategoryIds(categories)
  return ids.length ? ids : [ALL_CATEGORIES_VALUE]
}

const extractCategoryIds = (selection) => {
  if (!Array.isArray(selection)) return []
  if (selection.includes(ALL_CATEGORIES_VALUE)) return []
  return selection.filter((item) => item && item !== ALL_CATEGORIES_VALUE)
}

const formatMessage = (msg, fallback) => {
  if (!msg) return fallback
  if (typeof msg === 'string') return msg
  if (typeof msg === 'object') {
    try {
      return msg.message || JSON.stringify(msg)
    } catch (e) {
      return fallback
    }
  }
  return String(msg)
}

const getErrorMessage = (error, fallback) => {
  if (!error) return fallback
  return (
    formatMessage(error?.response?.data?.message, null) ||
    formatMessage(error?.message, null) ||
    fallback
  )
}

const AdminAttribute = () => {
  const [isModalOpen, setisModalOpen] = useState(false)
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [activeTab, setActiveTab] = useState('color')
  const [attributeType, setAttributeType] = useState('color')
  const user = useSelector((state) => state?.user)
  const searchInput = useRef(null)

  const initial = () => ({
    name: '',
    type: 'color',
    value: '',
    hexCode: '',
    image: '',
    order: 0,
    categories: [ALL_CATEGORIES_VALUE]
  })

  const [stateAttribute, setStateAttribute] = useState(initial())
  const [stateAttributeDetails, setStateAttributeDetails] = useState(initial())
  const [createForm] = Form.useForm()
  const [updateForm] = Form.useForm()

  const mutation = useMutationHooks((data) => AttributeService.createAttribute(data, user?.access_token))

  const mutationUpdate = useMutationHooks((data) => {
    const { id, token, ...rests } = data
    return AttributeService.updateAttribute(id, token, rests)
  })

  const mutationDeleteted = useMutationHooks((data) => {
    const { id, token } = data
    return AttributeService.deleteAttribute(id, token)
  })

  const mutationDeleteMany = useMutationHooks((data) => {
    const { ids, token } = data
    return AttributeService.deleteManyAttribute(ids, token)
  })

  const getAllAttributes = async () => {
    const res = await AttributeService.getAllAttribute(activeTab)
    return res
  }

  const fetchGetDetailsAttribute = async (selectedId) => {
    setIsPendingUpdate(true)
    const res = await AttributeService.getDetailsAttribute(selectedId)
    if (res?.data) {
      const detailData = {
        name: res?.data?.name || '',
        type: res?.data?.type || 'color',
        value: res?.data?.value || '',
        hexCode: res?.data?.hexCode || '',
        image: res?.data?.image || '',
        order: res?.data?.order || 0,
        categories: toCategorySelection(res?.data?.categories ?? res?.data?.category)
      }
      setStateAttributeDetails(detailData)
      setAttributeType(detailData.type)
      updateForm.setFieldsValue(detailData)
    }
    setIsPendingUpdate(false)
  }

  useEffect(() => {
    if (!isOpenDrawer) {
      updateForm.resetFields()
      setStateAttributeDetails(initial())
    } else if (rowSelected) {
      fetchGetDetailsAttribute(rowSelected)
    }
  }, [isOpenDrawer, rowSelected, updateForm])

  useEffect(() => {
    if (isModalOpen) {
      const initState = initial()
      initState.type = activeTab
      if (activeTab === 'color') {
        initState.hexCode = '#000000'
        initState.image = createColorImage('#000000')
      } else if (activeTab === 'material') {
        initState.image = createMaterialImage()
      }
      initState.order = getAutoOrder(activeTab)
      setStateAttribute(initState)
      setAttributeType(activeTab)
      createForm.setFieldsValue(initState)
    }
  }, [isModalOpen, activeTab, createForm])

  const {
    isPending: isPendingAttribute,
    data: attributes,
    refetch: refetchAttributes
  } = useQuery({
    queryKey: ['attributes', activeTab],
    queryFn: getAllAttributes
  })

  useEffect(() => {
    if (!isModalOpen) return
    const autoOrderValue = getAutoOrder(attributeType)
    if (stateAttribute.order === autoOrderValue) {
      createForm.setFieldsValue({ order: autoOrderValue })
      return
    }
    setStateAttribute((prev) => ({ ...prev, order: autoOrderValue }))
    createForm.setFieldsValue({ order: autoOrderValue })
  }, [isModalOpen, attributeType, attributes, createForm, stateAttribute.order])

  const handleDetailsAttribute = () => {
    setIsOpenDrawer(true)
  }

  const {
    data,
    isPending,
    isSuccess,
    isError,
    error: createError,
    reset: resetCreateMutation
  } = mutation
  const {
    data: dataUpdated,
    isPending: isPendingUpdated,
    isSuccess: isSuccessUpdated,
    isError: isErrorUpdated,
    error: updateError,
    reset: resetUpdateMutation
  } = mutationUpdate
  const {
    data: dataDeleted,
    isPending: isPendingDeleted,
    isSuccess: isSuccessDeleted,
    isError: isErrorDeleted,
    error: deleteError,
    reset: resetDeleteMutation
  } = mutationDeleteted
  const {
    data: dataDeletedMany,
    isPending: isPendingDeletedMany,
    isSuccess: isSuccessDeletedMany,
    isError: isErrorDeletedMany,
    error: deleteManyError,
    reset: resetDeleteManyMutation
  } = mutationDeleteMany

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoryService.getAllCategory(),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })

  const { data: parentCategoriesData, isLoading: isLoadingParentCategories } = useQuery({
    queryKey: ['parent-categories'],
    queryFn: () => CategoryService.getParentCategories(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })

  const syncTypeOrder = useCallback(
    async (typeKey) => {
      if (!user?.access_token || !typeKey) return false
      try {
        const res = await AttributeService.getAllAttribute(typeKey)
        const list = Array.isArray(res?.data) ? res.data : []
        if (!list.length) return false

        const sorted = [...list].sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
          const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
          if (orderA !== orderB) return orderA - orderB
          const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          if (createdA !== createdB) return createdA - createdB
          const valueA = a.value || ''
          const valueB = b.value || ''
          return valueA.localeCompare(valueB)
        })

        let changed = false
        for (let index = 0; index < sorted.length; index += 1) {
          const attribute = sorted[index]
          const desiredOrder = index
          const currentOrder = typeof attribute.order === 'number' ? attribute.order : desiredOrder
          if (currentOrder !== desiredOrder) {
            changed = true
            await AttributeService.updateAttribute(attribute._id, user.access_token, { order: desiredOrder })
          }
        }
        return changed
      } catch (error) {
        console.error('Failed to sync attribute order for type', typeKey, error)
        return false
      }
    },
    [user?.access_token]
  )

  const syncAllTypeOrders = useCallback(async () => {
    let hasChanges = false
    for (const typeKey of TYPE_KEYS) {
      const changed = await syncTypeOrder(typeKey)
      if (changed) {
        hasChanges = true
      }
    }
    return hasChanges
  }, [syncTypeOrder])

  const categoriesList = useMemo(() => (Array.isArray(categoriesData?.data) ? categoriesData.data : []), [categoriesData])

  const parentCategoryOptions = useMemo(() => {
    const rawParents = Array.isArray(parentCategoriesData?.data) ? parentCategoriesData.data : []
    const fallbackParents = categoriesList.filter((cat) => !normalizeCategoryId(cat.parentCategory))
    const baseList = rawParents.length > 0 ? rawParents : fallbackParents
    return baseList
      .map((cat) => ({
        value: normalizeCategoryId(cat),
        label: cat?.name || 'Danh m ¯c'
      }))
      .filter((item) => !!item.value)
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
  }, [parentCategoriesData, categoriesList])

  const parentCategoryFilterOptions = useMemo(() => {
    if (!parentCategoryOptions.length) return []
    return [...parentCategoryOptions]
      .map((cat) => ({
        text: cat.label || 'Danh mục',
        value: cat.value
      }))
      .sort((a, b) => (a.text || '').localeCompare(b.text || ''))
  }, [parentCategoryOptions])

  const renderAction = (record) => (
    <Space>
      <Tooltip title="Chỉnh sửa">
        <Button
          type="text"
          shape="circle"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            setRowSelected(record._id)
            handleDetailsAttribute()
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
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 100 }}
          >
            Tìm kiếm
          </Button>
          <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 100 }}>
            Đặt lại
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) => record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase())
  })

  const renderTypeCell = (type) => {
    const meta = TYPE_OPTIONS.find((t) => t.key === type)
    return (
      <TypePill $tone={meta?.tone}>
        <span className="pill-icon">{meta?.icon}</span>
        <span className="pill-label">{meta?.label}</span>
      </TypePill>
    )
  }

  const columns = [
    {
      title: 'Tên hiển thị',
      dataIndex: 'name',
      sorter: (a, b) => a.name?.length - b.name?.length,
      ...getColumnSearchProps('name')
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      filters: TYPE_OPTIONS.map((opt) => ({ text: opt.label, value: opt.key })),
      onFilter: (value, record) => record.type === value,
      render: (type) => renderTypeCell(type),
      width: 150
    },
    {
      title: 'Giá trị hiển thị',
      dataIndex: 'value',
      render: (value, record) => {
        if (record.type === 'color' && record.hexCode) {
          return (
            <CellStack>
              <ColorSwatch style={{ background: record.hexCode }} />
              <Tag color="geekblue">{value}</Tag>
            </CellStack>
          )
        }
        return (
          <CellStack>
            <Tag color="blue">{value}</Tag>
          </CellStack>
        )
      }
    },
    {
      title: 'Danh mục',
      dataIndex: 'categories',
      filters: [{ text: 'Tất cả', value: null }, ...parentCategoryFilterOptions],
      onFilter: (value, record) => {
        const assigned = Array.isArray(record.categories) ? record.categories : []
        if (!value) return assigned.length === 0
        return assigned.some((item) => (item?._id || item) === value)
      },
      filterSearch: true,
      render: (categories) => {
        const items = Array.isArray(categories) ? categories : categories ? [categories] : []
        if (!items.length) return <Tag>Tất cả</Tag>
        return items.map((item) => (
          <Tag key={item._id || item} color="processing">
            {item.name || item}
          </Tag>
        ))
      }
    },
    {
      title: 'Thứ tự',
      dataIndex: 'order',
      sorter: (a, b) => a.order - b.order,
      render: (order) => <Tag color="geekblue">{order ?? '—'}</Tag>,
      width: 100
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => renderAction(record),
      width: 140
    }
  ]

  const dataTable = Array.isArray(attributes?.data)
    ? attributes.data.map((attribute) => {
        const normalizedCategories = Array.isArray(attribute.categories)
          ? attribute.categories
          : attribute.category
            ? [attribute.category]
            : []
        return { ...attribute, categories: normalizedCategories, key: attribute._id }
      })
    : []

  useEffect(() => {
    if (!isSuccess && !isError) return
    if (isSuccess) {
      if (data?.status === 'OK') {
        message.success('T?o thu?c t?nh th?nh c?ng!')
        handleCancel()
        refetchAttributes()
      } else {
        message.error(formatMessage(data?.message, 'Thu?c t?nh ?? t?n t?i ho?c kh?ng h?p l?.'))
      }
    } else if (isError) {
      message.error(getErrorMessage(createError, 'T?o thu?c t?nh th?t b?i!'))
    }
    resetCreateMutation()
  }, [isSuccess, isError, data, createError, refetchAttributes, resetCreateMutation])

  useEffect(() => {
    if (isSuccessDeleted) {
      if (dataDeleted?.status === 'OK') {
        message.success('Xoá thuộc tính thành công!')
        handleCancelDelete()
        const syncAfterDelete = async () => {
          await syncTypeOrder(activeTab)
          refetchAttributes()
        }
        syncAfterDelete()
      } else {
        message.error(formatMessage(dataDeleted?.message, 'Không thể xoá thuộc tính.'))
      }
    } else if (isErrorDeleted) {
      message.error(getErrorMessage(deleteError, 'Xoá thuộc tính thất bại!'))
    }
    if (isSuccessDeleted || isErrorDeleted) {
      resetDeleteMutation()
    }
  }, [isSuccessDeleted, isErrorDeleted, dataDeleted, deleteError, syncTypeOrder, activeTab, refetchAttributes, resetDeleteMutation])

  useEffect(() => {
    if (isSuccessDeletedMany) {
      if (dataDeletedMany?.status === 'OK') {
        message.success(`Xoá ${dataDeletedMany?.count || 0} thuộc tính thành công!`)
        const syncAfterDeleteMany = async () => {
          await syncTypeOrder(activeTab)
          refetchAttributes()
        }
        syncAfterDeleteMany()
      } else {
        message.error(formatMessage(dataDeletedMany?.message, 'Không thể xoá các thuộc tính đã chọn.'))
      }
    } else if (isErrorDeletedMany) {
      message.error(getErrorMessage(deleteManyError, 'Xoá thuộc tính thất bại!'))
    }
    if (isSuccessDeletedMany || isErrorDeletedMany) {
      resetDeleteManyMutation()
    }
  }, [isSuccessDeletedMany, isErrorDeletedMany, dataDeletedMany, deleteManyError, syncTypeOrder, activeTab, refetchAttributes, resetDeleteManyMutation])

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false)
    setStateAttributeDetails(initial())
    setAttributeType(activeTab)
    updateForm.resetFields()
  }

  useEffect(() => {
    if (!isSuccessUpdated && !isErrorUpdated) return
    if (isSuccessUpdated) {
      if (dataUpdated?.status === 'OK') {
        message.success('Cập nhật thuộc tính thành công!')
        handleCloseDrawer()
        const syncAfterUpdate = async () => {
          await syncAllTypeOrders()
          refetchAttributes()
        }
        syncAfterUpdate()
      } else {
        message.error(formatMessage(dataUpdated?.message, 'Thuộc tính đã tồn tại hoặc không hợp lệ.'))
      }
    } else if (isErrorUpdated) {
      message.error(getErrorMessage(updateError, 'Cập nhật thuộc tính thất bại!'))
    }
    resetUpdateMutation()
  }, [isSuccessUpdated, isErrorUpdated, dataUpdated, updateError, syncAllTypeOrders, refetchAttributes, resetUpdateMutation])

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleDeleteAttribute = () => {
    mutationDeleteted.mutate(
      { id: rowSelected, token: user?.access_token },
      {
        onSettled: () => {
          refetchAttributes()
        }
      }
    )
  }

  const handleCancel = () => {
    setisModalOpen(false)
    const initState = initial()
    initState.type = activeTab
    if (activeTab === 'material') {
      initState.image = createMaterialImage()
    } else if (activeTab === 'color') {
      initState.hexCode = '#000000'
      initState.image = createColorImage('#000000')
    }
    initState.order = getAutoOrder(activeTab)
    setStateAttribute(initState)
    setAttributeType(activeTab)
    createForm.resetFields()
  }

  const handleDeleteMany = (ids) => {
    if (!ids || ids.length === 0) {
      message.warning('Vui lòng chọn thuộc tính cần xoá!')
      return
    }
    mutationDeleteMany.mutate(
      { ids, token: user?.access_token },
      {
        onSettled: () => {
          refetchAttributes()
        }
      }
    )
  }

  const handleTypeChange = (key) => {
    setActiveTab(key)
    setAttributeType(key)
    setRowSelected('')
    setIsOpenDrawer(false)
  }

  const onFinish = () => {
    let finalState = { ...stateAttribute }

    if (attributeType === 'color' && stateAttribute.hexCode && !stateAttribute.image) {
      finalState.image = createColorImage(stateAttribute.hexCode)
    } else if (attributeType === 'material' && !stateAttribute.image) {
      finalState.image = createMaterialImage()
    }

    finalState.order = getAutoOrder(attributeType)

    if (!finalState.name || finalState.name.trim() === '') {
      finalState.name = finalState.value
    }

    finalState.categories = extractCategoryIds(stateAttribute.categories)

    mutation.mutate(finalState, {
      onSettled: () => {
        refetchAttributes()
      }
    })
  }

  const createColorImage = (hexCode) => {
    if (!hexCode) return ''
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = hexCode
    ctx.fillRect(0, 0, 100, 100)
    return canvas.toDataURL('image/png')
  }

  const createMaterialImage = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#e8e8e8'
    ctx.fillRect(0, 0, 100, 100)
    ctx.strokeStyle = '#d9d9d9'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, 98, 98)
    return canvas.toDataURL('image/png')
  }

  const getAutoOrder = (type) => {
    if (!attributes?.data) return 0
    const sameTypeAttributes = attributes.data.filter((attr) => attr.type === type)
    if (sameTypeAttributes.length === 0) return 0
    const maxOrder = Math.max(...sameTypeAttributes.map((attr) => attr.order || 0))
    return maxOrder + 1
  }

const sanitizeCategories = (value) => {
  const list = Array.isArray(value) ? value.filter(Boolean) : []
  if (list.includes(ALL_CATEGORIES_VALUE)) return [ALL_CATEGORIES_VALUE]
  return list
}

  const handleOnchange = (e) => {
    if (e?.target) {
      const newState = {
        ...stateAttribute,
        [e.target.name]: e.target.value
      }

      if (e.target.name === 'hexCode' && attributeType === 'color' && e.target.value) {
        newState.image = createColorImage(e.target.value)
      }

      if (attributeType === 'material' && !newState.image) {
        newState.image = createMaterialImage()
      }

      setStateAttribute(newState)
    } else {
      const newState = { ...stateAttribute }

      if (e.name === 'categories') {
        newState.categories = sanitizeCategories(e.value || e || [], stateAttribute.categories)
      } else {
        newState[e.name] = e.value || e
      }

      if (e.name === 'type') {
        if (e.value === 'color' && stateAttribute.hexCode) {
          newState.image = createColorImage(stateAttribute.hexCode)
        } else if (e.value === 'material') {
          newState.image = createMaterialImage()
        }
      }

      setStateAttribute(newState)
    }
  }

  const handleOnchangeDetails = (e) => {
    if (e?.target) {
      const newState = {
        ...stateAttributeDetails,
        [e.target.name]: e.target.value
      }

      if (e.target.name === 'hexCode' && attributeType === 'color' && e.target.value) {
        newState.image = createColorImage(e.target.value)
      }

      if (attributeType === 'material' && !newState.image) {
        newState.image = createMaterialImage()
      }

      setStateAttributeDetails(newState)
    } else {
      const newState = { ...stateAttributeDetails }

      if (e.name === 'categories') {
        newState.categories = sanitizeCategories(e.value || e || [], stateAttributeDetails.categories)
      } else {
        newState[e.name] = e.value || e
      }

      if (e.name === 'type') {
        if (e.value === 'color' && stateAttributeDetails.hexCode) {
          newState.image = createColorImage(stateAttributeDetails.hexCode)
        } else if (e.value === 'material') {
          newState.image = createMaterialImage()
        } else if (e.value === 'size') {
          newState.image = ''
        }
      }

      setStateAttributeDetails(newState)
    }
  }

  const onUpdateAttribute = () => {
    const payload = {
      ...stateAttributeDetails,
      categories: extractCategoryIds(stateAttributeDetails.categories)
    }

    mutationUpdate.mutate(
      { id: rowSelected, token: user?.access_token, ...payload },
      {
        onSettled: () => {
          refetchAttributes()
        }
      }
    )
  }

  const openCreateModal = (type) => {
    setAttributeType(type)
    const initState = initial()
    initState.type = type
    if (type === 'color') {
      initState.hexCode = '#000000'
      initState.image = createColorImage('#000000')
    } else if (type === 'material') {
      initState.image = createMaterialImage()
    }
    initState.order = getAutoOrder(type)
    setStateAttribute(initState)
    createForm.setFieldsValue(initState)
    setisModalOpen(true)
  }

  const typeMeta = useMemo(() => TYPE_OPTIONS.find((opt) => opt.key === activeTab) || TYPE_OPTIONS[0], [activeTab])
  const totalAttributes = useMemo(() => (Array.isArray(attributes?.data) ? attributes.data.length : 0), [attributes])
  const nextOrder = useMemo(() => getAutoOrder(activeTab), [attributes, activeTab])
  const highestOrder = useMemo(() => {
    if (!Array.isArray(attributes?.data) || attributes.data.length === 0) return 0
    return Math.max(...attributes.data.map((attr) => attr.order || 0))
  }, [attributes])
  const categoryCount = useMemo(() => {
    if (!Array.isArray(attributes?.data)) return 0
    const ids = new Set()
    attributes.data.forEach((attr) => {
      if (Array.isArray(attr.categories)) {
        attr.categories.forEach((cat) => {
          const id = cat?._id || cat
          if (id) ids.add(id)
        })
      }
    })
    return ids.size
  }, [attributes])

  const renderPreview = (image, type) => {
    if (!image) return null
    return (
      <AttributePreview>
        <img
          src={image}
          style={{
            height: 64,
            width: 64,
            borderRadius: 12,
            objectFit: 'cover',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)'
          }}
          alt="attribute"
        />
        <div>
          <div className="preview-title">Ảnh hiển thị</div>
          <div className="preview-desc">
            {type === 'color' ? 'Sinh tự động từ mã màu' : 'Sinh tự động từ chất liệu'}
          </div>
        </div>
      </AttributePreview>
    )
  }

  return (
    <WrapperContent>
      <PageHeader>
        <div>
          <WrapperHeader>Quản lý thuộc tính</WrapperHeader>
         
          <Space size="small" style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap' }}>           
          </Space>
        </div>
       
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatLabel>Tổng thuộc tính</StatLabel>
          <StatValue>{totalAttributes}</StatValue>
          <StatTrend>Loại đang lọc: {typeMeta.label}</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Thứ tự kế tiếp</StatLabel>
          <StatValue>{nextOrder}</StatValue>
          <StatTrend>Giá trị cao nhất: {highestOrder}</StatTrend>
        </StatCard>
        <StatCard>
          <StatLabel>Danh mục liên quan</StatLabel>
          <StatValue>{categoryCount}</StatValue>
          <StatTrend $negative={!categoryCount && totalAttributes > 0}>
            {categoryCount ? 'Đã gắn danh mục' : 'Chưa gắn danh mục'}
          </StatTrend>
        </StatCard>
      </StatsGrid>

      <ActionsBar>
        <div className="actions-block">
          
          <Space wrap>
            {TYPE_OPTIONS.map((item) => (
              <Tooltip key={item.key} title={`${item.label}${item.hint ? ` — ${item.hint}` : ''}`}>
                <FilterChip $active={activeTab === item.key} onClick={() => handleTypeChange(item.key)} aria-label={item.label}>
                  <span className="chip-icon">{item.icon}</span>
                </FilterChip>
              </Tooltip>
            ))}
          </Space>
        </div>
        
      </ActionsBar>

      <CardsRow>
        <CreateCard hoverable onClick={() => openCreateModal(activeTab)}>
          <div className="card-icon">
            <PlusOutlined />
          </div>
          <div className="card-title">Thêm {typeMeta.label.toLowerCase()}</div>
          
          <div className="card-meta">
           
            <span>Gợi ý thứ tự: {nextOrder}</span>
          </div>
        </CreateCard>
      </CardsRow>

      <TableCard>
        <TableHeader>
          <div>
            <div className="table-title">Danh sách thuộc tính</div>
            
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => refetchAttributes()}>
            
          </Button>
        </TableHeader>
        <TableComponent
          handleDeleteMany={handleDeleteMany}
          columns={columns}
          isPending={isPendingAttribute}
          data={dataTable}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showTotal: (total) => `${total} thuộc tính`
          }}
          rowClassName={(record) => (record._id === rowSelected ? 'attribute-row-active' : '')}
          onRow={(record) => {
            return {
              onClick: () => {
                setRowSelected(record._id)
              },
              onDoubleClick: () => {
                setRowSelected(record._id)
                handleDetailsAttribute()
              }
            }
          }}
        />
      </TableCard>

      <ModalComponent
        forceRender
        title="Thêm thuộc tính"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={960}
      >
        <Loading isPending={isPending}>
          <Form
            name="createAttribute"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="on"
            form={createForm}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Loại thuộc tính" name="type" rules={[{ required: true, message: 'Chọn loại thuộc tính!' }]}>
                  <Select
                    value={attributeType}
                    onChange={(value) => {
                      setAttributeType(value)
                      handleOnchange({ name: 'type', value })
                    }}
                  >
                    <Option value="color">Màu sắc</Option>
                    <Option value="size">Kích cỡ</Option>
                    <Option value="material">Chất liệu</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Giá trị hiển thị" name="value" rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}>
                  <Inputcomponent value={stateAttribute.value} onChange={handleOnchange} name="value" placeholder="Ví dụ: Đỏ, 42, Cotton" />
                </Form.Item>

                <Form.Item label="Tên rút gọn" name="name" extra="Để trống sẽ dùng giá trị hiển thị.">
                  <Inputcomponent value={stateAttribute.name} onChange={handleOnchange} name="name" placeholder="Tên quản trị (tuỳ chọn)" />
                </Form.Item>

                <Form.Item label="Thứ tự ưu tiên" name="order">
                  <InputNumber
                    value={stateAttribute.order}
                    style={{ width: '100%' }}
                    min={0}
                    disabled
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Thu tu uu tien duoc he thong tu dong tang (khong can nhap).
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Danh mục áp dụng"
                  name="categories"
                  tooltip="Chọn một hoặc nhiều danh mục áp dụng cho thuộc tính (để trống nếu áp dụng toàn bộ)"
                >
                  <Select
                    mode="multiple"
                    value={stateAttribute.categories}
                    onChange={(value) => handleOnchange({ name: 'categories', value })}
                    placeholder="Chọn danh mục (tuỳ chọn)"
                    allowClear
                    showSearch
                    filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                    loading={isLoadingCategories || isLoadingParentCategories}
                    notFoundContent={
                      isLoadingCategories || isLoadingParentCategories ? 'Đang tải...' : 'Không thấy danh mục'
                    }
                  >
                    <Option value={ALL_CATEGORIES_VALUE}>Tất cả danh mục</Option>
                    {parentCategoryOptions.map((cat) => (
                      <Option
                        key={cat.value}
                        value={cat.value}
                        disabled={stateAttribute.categories.includes(ALL_CATEGORIES_VALUE)}
                      >
                        {cat.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {attributeType === 'color' && (
                  <Form.Item
                    label="Mã màu"
                    name="hexCode"
                    rules={[{ required: true, message: 'Vui lòng chọn mã màu!' }]}
                  >
                    <Input
                      type="color"
                      value={stateAttribute.hexCode || '#000000'}
                    onChange={(e) => {
                      const hexCode = e.target.value
                      const image = createColorImage(hexCode)
                      setStateAttribute({
                        ...stateAttribute,
                        hexCode,
                        image
                      })
                      createForm.setFieldsValue({ hexCode })
                    }}
                    style={{ width: '100%', height: '40px' }}
                  />
                </Form.Item>
              )}

                {(attributeType === 'color' || attributeType === 'material') && stateAttribute?.image && (
                  <Form.Item label="Xem trước">
                    {renderPreview(stateAttribute?.image, attributeType)}
                  </Form.Item>
                )}
              </Col>
            </Row>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleCancel}>Huỷ</Button>
                <Button type="primary" htmlType="submit">
                  Tạo thuộc tính
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>

      <DrawerComponent
        title="Chi tiết thuộc tính"
        isOpen={isOpenDrawer}
        onClose={handleCloseDrawer}
        width="90%"
      >
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            name="updateAttribute"
            layout="vertical"
            onFinish={onUpdateAttribute}
            autoComplete="on"
            form={updateForm}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Loại thuộc tính" name="type" rules={[{ required: true }]}>
                  <Select
                    value={stateAttributeDetails.type}
                    onChange={(value) => {
                      setAttributeType(value)
                      let newState = {
                        ...stateAttributeDetails,
                        type: value
                      }

                      if (value === 'color' && stateAttributeDetails.hexCode) {
                        newState.image = createColorImage(stateAttributeDetails.hexCode)
                      } else if (value === 'material') {
                        newState.image = createMaterialImage()
                      } else if (value === 'size') {
                        newState.image = ''
                      }

                      setStateAttributeDetails(newState)
                      updateForm.setFieldsValue(newState)
                    }}
                  >
                    <Option value="color">Màu sắc</Option>
                    <Option value="size">Kích cỡ</Option>
                    <Option value="material">Chất liệu</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Giá trị hiển thị" name="value" rules={[{ required: true }]}>
                  <Inputcomponent value={stateAttributeDetails.value} onChange={handleOnchangeDetails} name="value" />
                </Form.Item>

                <Form.Item label="Tên rút gọn" name="name">
                  <Inputcomponent value={stateAttributeDetails.name} onChange={handleOnchangeDetails} name="name" />
                </Form.Item>

                <Form.Item
                  label="Danh mục áp dụng"
                  name="categories"
                  tooltip="Chọn một hoặc nhiều danh mục áp dụng (để trống nếu áp dụng toàn bộ)"
                >
                  <Select
                    mode="multiple"
                    value={stateAttributeDetails.categories}
                    onChange={(value) => handleOnchangeDetails({ name: 'categories', value })}
                    placeholder="Chọn danh mục (tuỳ chọn)"
                    allowClear
                    showSearch
                    filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                    loading={isLoadingCategories || isLoadingParentCategories}
                    notFoundContent={
                      isLoadingCategories || isLoadingParentCategories ? 'Đang tải...' : 'Không thấy danh mục'
                    }
                  >
                    <Option value={ALL_CATEGORIES_VALUE}>Tất cả danh mục</Option>
                    {parentCategoryOptions.map((cat) => (
                      <Option
                        key={cat.value}
                        value={cat.value}
                        disabled={stateAttributeDetails.categories?.includes(ALL_CATEGORIES_VALUE)}
                      >
                        {cat.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                {attributeType === 'color' && (
                  <Form.Item label="Mã màu" name="hexCode">
                    <Input
                      type="color"
                      value={stateAttributeDetails.hexCode || '#000000'}
                      onChange={(e) => {
                        const hexCode = e.target.value
                        const image = createColorImage(hexCode)
                        setStateAttributeDetails({
                          ...stateAttributeDetails,
                          hexCode,
                          image
                        })
                        updateForm.setFieldsValue({ hexCode })
                      }}
                      style={{ width: '100%', height: '40px' }}
                    />
                  </Form.Item>
                )}

                {(attributeType === 'color' || attributeType === 'material') && stateAttributeDetails?.image && (
                  <Form.Item label="Xem trước">
                    {renderPreview(stateAttributeDetails?.image, attributeType)}
                  </Form.Item>
                )}

                <Form.Item label="Thứ tự ưu tiên" name="order">
                  <InputNumber
                    value={stateAttributeDetails.order}
                    onChange={(value) => handleOnchangeDetails({ name: 'order', value })}
                    style={{ width: '100%' }}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleCloseDrawer}>Đóng</Button>
                <Button type="primary" htmlType="submit">
                  Lưu thay đổi
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      <ModalComponent
        title="Xoá thuộc tính"
        open={isModalOpenDelete}
        onCancel={handleCancelDelete}
        onOk={handleDeleteAttribute}
      >
        <Loading isPending={isPendingDeleted}>
          <div>Bạn có chắc chắn muốn xoá thuộc tính này?</div>
        </Loading>
      </ModalComponent>
    </WrapperContent>
  )
}

export default AdminAttribute
