import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  WrapperHeader,
  WrapperUploadFile,
  PageWrapper,
  HeaderRow,
  HeaderMeta,
  ActionsGroup,
  StatsGrid,
  StatCard,
  StatLabel,
  StatValue,
  StatHint,
  StatIcon,
  FiltersBar,
  TableCard,
  TableHeader,
  TableTitle,
  TableSubtitle,
  UserCell,
  AvatarCircle,
  UserMeta,
  UserName,
  UserEmail,
  BadgeRow,
  ActionButtons
} from './style'
import { Button, Form, Space, Select, Input, Tag, Tabs, Modal, Switch, Segmented, Tooltip } from 'antd'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import Loading from '../LoadingComponent/Loading'
import ModalComponent from '../ModalComponent/ModalComponent'
import { getBase64, convertPrice } from '../../utils'
import * as message from '../../components/Message/Message'
import { useSelector } from 'react-redux'
import { useMutationHooks } from '../../hooks/useMutationHook'
import * as UserService from '../../services/UserService'
import * as RoleService from '../../services/RoleService'
import { useQuery } from '@tanstack/react-query'
import { DeleteOutlined, EditOutlined, SearchOutlined, LockOutlined, UnlockOutlined, UserOutlined, ShoppingOutlined, ReloadOutlined, TeamOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined, CloseCircleOutlined, FieldTimeOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Option, OptGroup } = Select

const AdminUser = () => {
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [isModalLock, setIsModalLock] = useState(false)
  const user = useSelector((state) => state?.user)
  const searchInput = useRef(null)

  const [stateUserDetails, setStateUserDetails] = useState({
    name: '',
    email: '',
    phone: '',
    isAdmin: false,
    role: 'customer',
    roleId: null,
    isLocked: false,
    createdAt: '',
    updatedAt: '',
    avatar: '',
    address: '',
    totalOrders: 0,
    totalSpent: 0
  })
  const [form] = Form.useForm()
  const [lockForm] = Form.useForm()
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [quickSearch, setQuickSearch] = useState('')

  // Mutations
  const mutationUpdate = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data
      const res = UserService.updateUser(id, { ...rests }, token)
      return res
    }
  )

  const mutationDeletetedMany = useMutationHooks(
    (data) => {
      const { token, ...ids } = data
      const res = UserService.deleteManyUser(ids, token)
      return res
    }
  )

  const mutationDeleteted = useMutationHooks(
    (data) => {
      const { id, token } = data
      const res = UserService.deleteUser(id, token)
      return res
    }
  )

  const mutationLock = useMutationHooks(
    (data) => {
      const { id, lockReason, token } = data
      return UserService.lockUser(id, lockReason, token)
    }
  )

  const mutationUnlock = useMutationHooks(
    (data) => {
      const { id, token } = data
      return UserService.unlockUser(id, token)
    }
  )

  const mutationRole = useMutationHooks(
    (data) => {
      const { id, role, token } = data
      return UserService.updateUserRole(id, role, token)
    }
  )

  const mutationRoleId = useMutationHooks(
    (data) => {
      const { id, roleId, token } = data
      return UserService.updateUserRoleId(id, roleId, token)
    }
  )

  // Queries
  const getAllUsers = async () => {
    const res = await UserService.getAllUser(user?.access_token)
    return res
  }

  const getUserStatistics = async () => {
    const res = await UserService.getUserStatistics(user?.access_token)
    return res
  }

  const getUserOrderHistory = async (userId) => {
    const res = await UserService.getUserOrderHistory(userId, user?.access_token)
    return res
  }

  const queryUser = useQuery({
    queryKey: ['user'],
    queryFn: getAllUsers
  })

  const queryStatistics = useQuery({
    queryKey: ['user-statistics'],
    queryFn: getUserStatistics
  })

  const queryOrderHistory = useQuery({
    queryKey: ['user-order-history', rowSelected],
    queryFn: () => getUserOrderHistory(rowSelected),
    enabled: !!rowSelected && isOpenDrawer
  })

  // Fetch roles để hiển thị dropdown
  const getAllRoles = async () => {
    const res = await RoleService.getAllRoles(user?.access_token, { isActive: true })
    return res
  }

  const queryRoles = useQuery({
    queryKey: ['roles'],
    queryFn: getAllRoles,
    enabled: !!user?.access_token
  })

  const { isPending: isPendingUsers, data: users, dataUpdatedAt, refetch: refetchUsers } = queryUser
  const { data: statistics } = queryStatistics
  const { data: orderHistory } = queryOrderHistory
  const { data: rolesData } = queryRoles

  const fetchGetDetailsUser = async (rowSelected) => {
    const res = await UserService.getDetailsUser(rowSelected)
    if (res?.data) {
      // Fetch order history để tính toán số đơn và tổng chi tiêu
      let totalOrders = 0
      let totalSpent = 0

      try {
        const orderHistoryRes = await getUserOrderHistory(rowSelected)
        if (orderHistoryRes?.data && Array.isArray(orderHistoryRes.data)) {
          // Chỉ tính các đơn đã thành công (delivered, completed, hoặc đã thanh toán)
          const successfulOrders = orderHistoryRes.data.filter(order =>
            order.status === 'delivered' ||
            order.status === 'completed' ||
            (order.isPaid && order.status !== 'cancelled' && order.status !== 'refunded')
          )

          totalOrders = successfulOrders.length
          totalSpent = successfulOrders.reduce((sum, order) => {
            return sum + (order.totalPrice || 0)
          }, 0)
        }
      } catch (error) {
        console.error('Error fetching order history:', error)
        // Fallback to data from user if available
        totalOrders = res?.data?.totalOrders || 0
        totalSpent = res?.data?.totalSpent || 0
      }

      // Xử lý roleId: có thể là object (đã populate) hoặc string
      const roleIdValue = res?.data?.roleId
        ? (typeof res?.data?.roleId === 'object' ? res?.data?.roleId._id : res?.data?.roleId)
        : null

      setStateUserDetails({
        name: res?.data?.name || '',
        email: res?.data?.email || '',
        phone: res?.data?.phone || '',
        isAdmin: res?.data?.isAdmin || false,
        role: res?.data?.role || 'customer',
        roleId: roleIdValue,
        isLocked: res?.data?.isLocked || false,
        updatedAt: res?.data?.updatedAt || '',
        createdAt: res?.data?.createdAt || '',
        address: res?.data?.address || '',
        avatar: res?.data?.avatar || '',
        totalOrders: totalOrders,
        totalSpent: totalSpent
      })
    }
    setIsPendingUpdate(false)
  }

  useEffect(() => {
    form.setFieldsValue(stateUserDetails)
  }, [form, stateUserDetails])

  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      setIsPendingUpdate(true)
      fetchGetDetailsUser(rowSelected)
    }
  }, [rowSelected, isOpenDrawer])

  const handleDetailsUser = () => {
    setIsOpenDrawer(true)
  }

  const handleLockUser = () => {
    // Kiểm tra quyền trước khi khóa
    const userToLock = users?.data?.find(u => u._id === rowSelected)
    if (!userToLock) {
      message.error('Không tìm thấy người dùng')
      return
    }

    // Không cho phép khóa chính mình
    if (rowSelected === user?.id) {
      message.error('Không thể khóa chính mình!')
      return
    }

    // Không cho phép khóa admin
    const isAdminUser = userToLock.role === 'admin' || userToLock.isAdmin === true
    if (isAdminUser) {
      message.error('Không thể khóa tài khoản admin!')
      return
    }

    setIsModalLock(true)
  }

  const handleUnlockUser = () => {
    // Kiểm tra quyền trước khi mở khóa
    const userToUnlock = users?.data?.find(u => u._id === rowSelected)
    if (!userToUnlock) {
      message.error('Không tìm thấy người dùng')
      return
    }

    // Không cho phép tự mở khóa chính mình
    if (rowSelected === user?.id && userToUnlock.isLocked) {
      message.error('Không thể tự mở khóa chính mình!')
      return
    }

    // Không cho phép tự mở khóa admin (nếu đang bị khóa)
    const isAdminUser = userToUnlock.role === 'admin' || userToUnlock.isAdmin === true
    if (isAdminUser && rowSelected === user?.id && userToUnlock.isLocked) {
      message.error('Không thể tự mở khóa tài khoản admin!')
      return
    }

    Modal.confirm({
      title: 'Xác nhận mở khóa',
      content: 'Bạn có chắc muốn mở khóa tài khoản này?',
      onOk: () => {
        mutationUnlock.mutate(
          { id: rowSelected, token: user?.access_token },
          {
            onSuccess: (data) => {
              if (data?.status === 'OK') {
                message.success(data.message || 'Mở khóa tài khoản thành công')
              } else {
                message.error(data?.message || 'Mở khóa tài khoản thất bại')
              }
              queryUser.refetch()
              if (rowSelected && isOpenDrawer) {
                fetchGetDetailsUser(rowSelected)
              }
            },
            onError: (error) => {
              const errorMessage = error?.response?.data?.message || error?.message || 'Mở khóa tài khoản thất bại'
              message.error(errorMessage)
            }
          }
        )
      }
    })
  }

  const onLockUser = () => {
    lockForm.validateFields().then(values => {
      mutationLock.mutate(
        { id: rowSelected, lockReason: values.lockReason, token: user?.access_token },
        {
          onSuccess: (data) => {
            if (data?.status === 'OK') {
              message.success(data.message || 'Khóa tài khoản thành công')
            } else {
              message.error(data?.message || 'Khóa tài khoản thất bại')
            }
            setIsModalLock(false)
            lockForm.resetFields()
            queryUser.refetch()
            if (rowSelected && isOpenDrawer) {
              fetchGetDetailsUser(rowSelected)
            }
          },
          onError: (error) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Khóa tài khoản thất bại'
            message.error(errorMessage)
          }
        }
      )
    })
  }

  // Hàm xử lý khi chọn role từ dropdown thống nhất
  const handleRoleChange = (value) => {
    if (!value) return

    // Phân tích value để biết là roleId hay role
    if (value.startsWith('roleId:')) {
      // Chọn role từ hệ thống phân quyền
      const roleId = value.replace('roleId:', '')
      // Cập nhật state ngay để UI phản hồi nhanh
      setStateUserDetails(prev => ({ ...prev, roleId, role: 'customer' }))
      onUpdateRoleId(roleId)
    } else if (value.startsWith('role:')) {
      // Chọn role cơ bản
      const role = value.replace('role:', '')
      // Cập nhật state ngay để UI phản hồi nhanh
      setStateUserDetails(prev => ({ ...prev, role, roleId: null }))
      onUpdateRole(role)
    }
  }

  const onUpdateRole = (role) => {
    // Check if trying to change own role
    if (rowSelected === user?.id) {
      // Check if current user is admin
      const currentUser = users?.data?.find(u => u._id === user?.id)
      const isCurrentUserAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin === true

      // Admin không được tự thay đổi quyền của chính mình (kể cả giữ nguyên admin)
      if (isCurrentUserAdmin) {
        message.error('Không thể tự thay đổi quyền của chính mình! Bạn đang là quản trị viên, không thể thay đổi vai trò.')
        return
      }
    }

    mutationRole.mutate(
      { id: rowSelected, role, token: user?.access_token },
      {
        onSuccess: () => {
          message.success()
          queryUser.refetch()
          if (rowSelected && isOpenDrawer) {
            fetchGetDetailsUser(rowSelected)
          }
        },
        onError: () => {
          message.error()
        }
      }
    )
  }

  const onUpdateRoleId = (roleId) => {
    // Check if trying to change own role
    if (rowSelected === user?.id) {
      const currentUser = users?.data?.find(u => u._id === user?.id)
      const isCurrentUserAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin === true
      const currentRoleId = currentUser?.roleId
      const isSuperAdmin = currentRoleId && rolesData?.data?.find(r => r._id === currentRoleId)?.code === 'SUPER_ADMIN'

      if (isSuperAdmin || isCurrentUserAdmin) {
        message.error('Không thể tự thay đổi quyền của chính mình! Bạn đang là quản trị viên, không thể thay đổi vai trò.')
        // Reset state nếu bị chặn
        if (rowSelected && isOpenDrawer) {
          fetchGetDetailsUser(rowSelected)
        }
        return
      }
    }

    mutationRoleId.mutate(
      { id: rowSelected, roleId: roleId || null, token: user?.access_token },
      {
        onSuccess: (data) => {
          if (data?.status === 'OK') {
            message.success(data.message || 'Cập nhật vai trò thành công')
            setStateUserDetails(prev => ({ ...prev, roleId, role: 'customer' }))
            // Refetch cả users và roles để cập nhật bảng
            queryUser.refetch()
            queryRoles.refetch()
            if (rowSelected && isOpenDrawer) {
              fetchGetDetailsUser(rowSelected)
            }
          } else {
            message.error(data?.message || 'Cập nhật vai trò thất bại')
            // Reset state nếu thất bại
            if (rowSelected && isOpenDrawer) {
              fetchGetDetailsUser(rowSelected)
            }
          }
        },
        onError: (error) => {
          const errorMessage = error?.response?.data?.message || error?.message || 'Cập nhật vai trò thất bại'
          message.error(errorMessage)
          // Reset state nếu có lỗi
          if (rowSelected && isOpenDrawer) {
            fetchGetDetailsUser(rowSelected)
          }
        }
      }
    )
  }

  const handleDeleteManyUsers = (ids) => {
    if (!ids || ids.length === 0) {
      message.warning('Vui lòng chọn ít nhất một người dùng để xóa')
      return
    }

    // Filter out admin users and self
    const validIds = ids.filter(id => {
      const userToDelete = users?.data?.find(u => u._id === id)
      if (!userToDelete) return false

      // Don't allow deleting self
      if (userToDelete._id === user?.id) {
        return false
      }

      // Don't allow deleting admin
      const isAdminUser = userToDelete.role === 'admin' || userToDelete.isAdmin === true
      if (isAdminUser) {
        return false
      }

      return true
    })

    // Check if any admin or self were selected
    const adminIds = ids.filter(id => {
      const userToDelete = users?.data?.find(u => u._id === id)
      if (!userToDelete) return false
      const isAdminUser = userToDelete.role === 'admin' || userToDelete.isAdmin === true
      return isAdminUser
    })

    const selfId = ids.find(id => id === user?.id)

    if (adminIds.length > 0) {
      message.warning(`Không thể xóa ${adminIds.length} tài khoản admin. Chỉ có thể xóa khách hàng.`)
    }

    if (selfId) {
      message.warning('Không thể xóa chính mình!')
    }

    if (validIds.length === 0) {
      message.error('Không có người dùng hợp lệ để xóa')
      return
    }

    if (validIds.length < ids.length) {
      message.warning(`Chỉ xóa được ${validIds.length}/${ids.length} người dùng (đã loại bỏ admin và chính bạn)`)
    }

    mutationDeletetedMany.mutate({ ids: validIds, token: user?.access_token }, {
      onSettled: () => {
        queryUser.refetch()
      }
    })
  }

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
  }

  const handleReset = clearFilters => {
    clearFilters()
  }

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
        <Inputcomponent
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100)
        }
      }
    }
  })

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'red',
      'manager': 'orange',
      'sale_staff': 'blue',
      'shipper': 'purple',
      'customer': 'green'
    }
    return colors[role] || 'default'
  }

  const getRoleText = (role) => {
    const texts = {
      'admin': 'Quản trị viên',
      'manager': 'Quản lý',
      'sale_staff': 'Nhân viên bán hàng',
      'shipper': 'Nhân viên giao hàng',
      'customer': 'Khách hàng'
    }
    return texts[role] || role
  }

  const renderAction = (_, record) => {
    // Check if user is admin (by role or isAdmin field)
    const isAdminUser = record.role === 'admin' || record.isAdmin === true
    // Check if trying to delete self
    const isSelf = record._id === user?.id
    // Only allow delete for non-admin customers
    const canDelete = !isAdminUser && !isSelf
    // Only allow lock/unlock for non-admin users and not self
    const canLockUnlock = !isAdminUser && !isSelf

    return (
      <ActionButtons>
        <Tooltip title="Chi tiết & Chỉnh sửa">
          <EditOutlined
            className="btn-edit"
            onClick={(e) => {
              e.stopPropagation()
              setRowSelected(record._id)
              handleDetailsUser()
            }}
          />
        </Tooltip>

        {record.isLocked ? (
          <Tooltip title={canLockUnlock ? "Mở khóa tài khoản" : (isSelf ? "Không thể tự mở khóa chính mình" : "Không thể mở khóa admin")}>
            <UnlockOutlined
              className={canLockUnlock ? "btn-unlock" : "btn-disabled"}
              onClick={(e) => {
                if (!canLockUnlock) return
                e.stopPropagation()
                setRowSelected(record._id)
                handleUnlockUser()
              }}
            />
          </Tooltip>
        ) : (
          <Tooltip title={canLockUnlock ? "Khóa tài khoản" : (isSelf ? "Không thể tự khóa chính mình" : "Không thể khóa admin")}>
            <LockOutlined
              className={canLockUnlock ? "btn-lock" : "btn-disabled"}
              onClick={(e) => {
                if (!canLockUnlock) return
                e.stopPropagation()
                setRowSelected(record._id)
                handleLockUser()
              }}
            />
          </Tooltip>
        )}

        <Tooltip title={canDelete ? "Xóa người dùng" : (isSelf ? "Không thể xóa chính mình" : "Không thể xóa admin")}>
          <DeleteOutlined
            className={canDelete ? "btn-delete" : "btn-disabled"}
            onClick={(e) => {
              if (!canDelete) return
              e.stopPropagation()
              setRowSelected(record._id)
              setIsModalOpenDelete(true)
            }}
          />
        </Tooltip>
      </ActionButtons>
    )
  }

  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      ...getColumnSearchProps('name'),
      render: (_, record) => {
        const initial =
          (record?.name && record.name.charAt(0).toUpperCase()) ||
          (record?.email && record.email.charAt(0).toUpperCase()) ||
          'U'
        return (
          <UserCell>
            <AvatarCircle>
              {record?.avatar ? <img src={record.avatar} alt={record.name} /> : initial}
            </AvatarCircle>
            <UserMeta>
              <UserName>{record.name || 'Không tên'}</UserName>
              <BadgeRow>
                <Tag icon={<MailOutlined />} color="geekblue">{record.email || 'N/A'}</Tag>
                {record.isLocked && (
                  <Tag icon={<CloseCircleOutlined />} color="red">Đã khóa</Tag>
                )}
              </BadgeRow>
            </UserMeta>
          </UserCell>
        )
      }
    },
    {
      title: 'Liên hệ',
      dataIndex: 'phone',
      sorter: (a, b) => (a.phone || '').localeCompare(b.phone || ''),
      render: (phone, record) => (
        <Space direction="vertical" size={2}>
          <span><PhoneOutlined style={{ color: '#10b981', marginRight: 6 }} />{phone || 'Chưa có'}</span>
          <span style={{ color: '#6b7280', fontSize: 12 }}>
            <FieldTimeOutlined style={{ marginRight: 6 }} />
            {record.createdAt ? new Date(record.createdAt).toLocaleDateString('vi-VN') : '-'}
          </span>
        </Space>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'roleId',
      render: (roleId, record) => {
        if (roleId && typeof roleId === 'object' && roleId.name) {
          return <Tag color="blue">{roleId.name}</Tag>
        }
        if (roleId && typeof roleId === 'string') {
          const role = rolesData?.data?.find(r => r._id === roleId)
          if (role) {
            return <Tag color="blue">{role.name}</Tag>
          }
          return <Tag color="cyan">Có vai trò</Tag>
        }
        const roleText = getRoleText(record.role || 'customer')
        return (
          <Tag color={getRoleColor(record.role || 'customer')}>
            {roleText}
          </Tag>
        )
      },
      filters: [
        { text: 'Quản trị viên', value: 'admin' },
        { text: 'Quản lý', value: 'manager' },
        { text: 'Nhân viên bán hàng', value: 'sale_staff' },
        { text: 'Nhân viên giao hàng', value: 'shipper' },
        { text: 'Khách hàng', value: 'customer' }
      ],
      onFilter: (value, record) => {
        if (record.roleId) {
          const role = rolesData?.data?.find(r => r._id === record.roleId);
          if (role && role.code) {
            return role.code === value
          }
          return false
        }
        return record.role === value;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isLocked',
      filters: [
        { text: 'Hoạt động', value: false },
        { text: 'Đã khóa', value: true }
      ],
      onFilter: (value, record) => record.isLocked === value,
      render: (isLocked) => (
        <Tag icon={isLocked ? <CloseCircleOutlined /> : <CheckCircleOutlined />} color={isLocked ? 'red' : 'green'}>
          {isLocked ? 'Đã khóa' : 'Hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Số đơn',
      dataIndex: 'totalOrders',
      sorter: (a, b) => (a.totalOrders || 0) - (b.totalOrders || 0),
      render: (totalOrders) => totalOrders || 0
    },

    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-'
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      render: renderAction,
      fixed: 'right',
      width: 200
    }
  ]

  const userList = users?.data || []
  const dataTable = useMemo(() => {
    return userList.map((userItem) => ({
      ...userItem,
      key: userItem._id,
      role: userItem.role || 'customer',
      roleId: userItem.roleId || null,
      isLocked: userItem.isLocked || false
    }))
  }, [userList])

  const computedStats = useMemo(() => {
    const total = statistics?.data?.totalUsers ?? userList.length
    const newWeek = statistics?.data?.newUsersThisWeek ?? 0
    const newMonth = statistics?.data?.newUsersThisMonth ?? 0
    const locked = statistics?.data?.lockedUsers ?? userList.filter((u) => u.isLocked).length
    return { total, newWeek, newMonth, locked }
  }, [statistics?.data, userList])

  const roleFilters = useMemo(() => {
    const predefined = [
      { value: 'admin', label: 'Quản trị viên' },
      { value: 'manager', label: 'Quản lý' },
      { value: 'sale_staff', label: 'Nhân viên bán hàng' },
      { value: 'shipper', label: 'Nhân viên giao hàng' },
      { value: 'customer', label: 'Khách hàng' }
    ]
    const dynamicRoles = rolesData?.data
      ?.filter((r) => r.isActive)
      ?.map((r) => ({ value: r._id, label: r.name || r.code || r._id }))
    return { predefined, dynamicRoles }
  }, [rolesData])

  const filteredData = useMemo(() => {
    const keyword = quickSearch.trim().toLowerCase()
    return dataTable.filter((u) => {
      const matchSearch =
        !keyword ||
        u.name?.toLowerCase().includes(keyword) ||
        u.email?.toLowerCase().includes(keyword) ||
        u.phone?.toLowerCase().includes(keyword)

      if (!matchSearch) return false

      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && !u.isLocked) ||
        (filterStatus === 'locked' && u.isLocked)

      if (!matchStatus) return false

      if (filterRole === 'all') return true

      // Check roleId match
      const matchesDynamic = roleFilters.dynamicRoles?.some(
        (r) => r.value === u.roleId && r.value === filterRole
      )
      if (matchesDynamic) return true

      return u.role === filterRole
    })
  }, [dataTable, filterStatus, filterRole, quickSearch, roleFilters.dynamicRoles])

  const lastUpdatedLabel = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật'
  const totalRows = dataTable.length
  const filteredCount = filteredData.length

  useEffect(() => {
    if (mutationUpdate.isSuccess && mutationUpdate.data?.status === 'OK') {
      message.success()
      handleCloseDrawer()
    } else if (mutationUpdate.isError) {
      message.error()
    }
  }, [mutationUpdate.isSuccess, mutationUpdate.isError])

  useEffect(() => {
    if (mutationDeleteted.isSuccess && mutationDeleteted.data?.status === 'OK') {
      message.success()
      handleCancelDelete()
    } else if (mutationDeleteted.isError) {
      message.error()
    }
  }, [mutationDeleteted.isSuccess, mutationDeleteted.isError])

  useEffect(() => {
    if (mutationDeletetedMany.isSuccess && mutationDeletetedMany.data?.status === 'OK') {
      message.success()
    } else if (mutationDeletetedMany.isError) {
      message.error()
    }
  }, [mutationDeletetedMany.isSuccess, mutationDeletetedMany.isError])

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false)
    setStateUserDetails({
      name: '',
      email: '',
      phone: '',
      isAdmin: false,
      role: 'customer',
      isLocked: false,
      updatedAt: '',
      createdAt: '',
      avatar: '',
      address: '',
      totalOrders: 0,
      totalSpent: 0
    })
    form.resetFields()
  }

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleDeleteUser = () => {
    // Find the user to be deleted
    const userToDelete = users?.data?.find(u => u._id === rowSelected)

    if (!userToDelete) {
      message.error('Không tìm thấy người dùng')
      return
    }

    // Check if trying to delete self
    if (userToDelete._id === user?.id) {
      message.error('Không thể xóa chính mình!')
      setIsModalOpenDelete(false)
      return
    }

    // Check if trying to delete admin
    const isAdminUser = userToDelete.role === 'admin' || userToDelete.isAdmin === true
    if (isAdminUser) {
      message.error('Không thể xóa tài khoản admin!')
      setIsModalOpenDelete(false)
      return
    }

    // Only allow delete for customers
    mutationDeleteted.mutate({ id: rowSelected, token: user?.access_token }, {
      onSettled: () => {
        queryUser.refetch()
      }
    })
  }

  const handleOnchangeDetails = (e) => {
    setStateUserDetails({
      ...stateUserDetails,
      [e.target.name]: e.target.value
    })
  }

  const handleOnchangeAvatarDetails = async ({ fileList }) => {
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    setStateUserDetails({
      ...stateUserDetails,
      avatar: file.preview
    })
  }

  const onUpdateUser = () => {
    mutationUpdate.mutate({ id: rowSelected, token: user?.access_token, ...stateUserDetails }, {
      onSettled: () => {
        queryUser.refetch()
      }
    })
  }

  const orderHistoryColumns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      key: '_id',
      render: (text) => text?.substring(0, 8) + '...'
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : '-'
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => convertPrice(price)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'pending': { text: 'Chờ xử lý', color: 'orange' },
          'confirmed': { text: 'Đã xác nhận', color: 'blue' },
          'shipped': { text: 'Đã giao hàng', color: 'purple' },
          'delivered': { text: 'Đã nhận hàng', color: 'green' },
          'cancelled': { text: 'Đã hủy', color: 'red' },
          'refunded': { text: 'Đã hoàn tiền', color: 'volcano' }
        }
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    }
  ]

  const statCards = [
    { key: 'total', label: 'Tổng người dùng', value: computedStats.total, icon: <StatIcon bg="#4338ca"><TeamOutlined /></StatIcon>, hint: `Cập nhật ${lastUpdatedLabel}` },
    { key: 'week', label: 'Người dùng mới (tuần)', value: computedStats.newWeek, icon: <StatIcon bg="#2563eb"><UserOutlined /></StatIcon>, hint: '7 ngày gần nhất' },
    { key: 'month', label: 'Người dùng mới (tháng)', value: computedStats.newMonth, icon: <StatIcon bg="#0ea5e9"><UserOutlined /></StatIcon>, hint: '30 ngày gần nhất' },
    { key: 'locked', label: 'Tài khoản bị khóa', value: computedStats.locked, icon: <StatIcon bg="#dc2626"><LockOutlined /></StatIcon>, hint: 'Cần xử lý' }
  ]

  return (
    <PageWrapper>
      <HeaderRow>
        <div>
          <WrapperHeader>Quản lý người dùng</WrapperHeader>
          <HeaderMeta>
            <span>Đang hiển thị {filteredCount}/{totalRows} người dùng</span>
            <Tag color="blue">Đồng bộ: {lastUpdatedLabel}</Tag>
          </HeaderMeta>
        </div>
        <ActionsGroup>
          <Button icon={<ReloadOutlined />} onClick={() => refetchUsers()} loading={isPendingUsers}>

          </Button>
        </ActionsGroup>
      </HeaderRow>

      <StatsGrid>
        {statCards.map((card) => (
          <StatCard key={card.key}>
            <StatLabel>{card.label}</StatLabel>
            <StatValue>
              {card.icon}
              {card.value}
            </StatValue>
            <StatHint>{card.hint}</StatHint>
          </StatCard>
        ))}
      </StatsGrid>

      <FiltersBar>
        <Input.Search
          allowClear
          placeholder="Tìm tên, email, số điện thoại"
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          onSearch={(value) => setQuickSearch(value)}
          style={{ minWidth: 240, maxWidth: 360 }}
        />
        <Segmented
          value={filterStatus}
          onChange={(val) => setFilterStatus(val)}
          options={[
            { label: 'Tất cả', value: 'all' },
            { label: 'Hoạt động', value: 'active' },
            { label: 'Đã khóa', value: 'locked' }
          ]}
        />
        <Select
          value={filterRole}
          onChange={(val) => setFilterRole(val)}
          style={{ minWidth: 200 }}
          placeholder="Chọn vai trò"
          allowClear={false}
        >
          <Option value="all">Tất cả vai trò</Option>
          {roleFilters.predefined.map((r) => (
            <Option key={r.value} value={r.value}>{r.label}</Option>
          ))}
          {roleFilters.dynamicRoles?.length > 0 && (
            <OptGroup label="Vai trò tuỳ chỉnh">
              {roleFilters.dynamicRoles.map((r) => (
                <Option key={r.value} value={r.value}>{r.label}</Option>
              ))}
            </OptGroup>
          )}
        </Select>
        <Tag color="geekblue">Đã lọc: {filteredCount}/{totalRows}</Tag>
        <Button type="text" icon={<ReloadOutlined />} onClick={() => { setFilterStatus('all'); setFilterRole('all'); setQuickSearch(''); }}>

        </Button>
      </FiltersBar>

      <TableCard>
        <TableHeader>
          <div>
            <TableTitle>Danh sách người dùng</TableTitle>

          </div>
          <Tag color={filterStatus === 'all' ? 'blue' : filterStatus === 'active' ? 'green' : 'red'}>
            {filteredCount} kết quả
          </Tag>
        </TableHeader>
        <TableComponent
          handleDeleteMany={handleDeleteManyUsers}
          columns={columns}
          isPending={isPendingUsers}
          data={filteredData}
          onRow={(record) => {
            return {
              onClick: () => {
                setRowSelected(record._id)
              }
            }
          }}
        />
      </TableCard>

      {/* Drawer chi tiết user */}
      <DrawerComponent
        title="Chi tiết người dùng"
        isOpen={isOpenDrawer}
        onClose={handleCloseDrawer}
        width="90%"
      >
        <Loading isPending={isPendingUpdate || mutationUpdate.isPending}>
          <Tabs
            items={[
              {
                key: 'info',
                label: 'Thông tin',
                children: (
                  <Form
                    name="basic"
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    onFinish={onUpdateUser}
                    autoComplete="on"
                    form={form}
                  >
                    <Form.Item label="Tên" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                      <Inputcomponent
                        value={stateUserDetails['name']}
                        onChange={handleOnchangeDetails}
                        name="name"
                      />
                    </Form.Item>

                    <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
                      <Inputcomponent
                        value={stateUserDetails['email']}
                        onChange={handleOnchangeDetails}
                        name="email"
                      />
                    </Form.Item>

                    <Form.Item label="Số điện thoại" name="phone">
                      <Inputcomponent
                        value={stateUserDetails.phone}
                        onChange={handleOnchangeDetails}
                        name="phone"
                      />
                    </Form.Item>

                    <Form.Item label="Địa chỉ" name="address">
                      <Inputcomponent
                        value={stateUserDetails.address}
                        onChange={handleOnchangeDetails}
                        name="address"
                      />
                    </Form.Item>

                    <Form.Item label="Vai trò" name="userRole">
                      <Select
                        value={
                          stateUserDetails.roleId
                            ? `roleId:${stateUserDetails.roleId}`
                            : stateUserDetails.role
                              ? `role:${stateUserDetails.role}`
                              : 'role:customer'
                        }
                        onChange={(value) => {
                          handleRoleChange(value)
                        }}
                        style={{ width: '100%' }}
                        placeholder="Chọn vai trò"
                        showSearch
                        optionFilterProp="children"
                        allowClear={false}
                        disabled={
                          rowSelected === user?.id && (
                            stateUserDetails.role === 'admin' ||
                            stateUserDetails.isAdmin === true ||
                            (stateUserDetails.roleId && rolesData?.data?.find(r => r._id === stateUserDetails.roleId)?.code === 'SUPER_ADMIN')
                          )
                        }
                      >
                        <OptGroup label="📋 Vai trò từ hệ thống phân quyền">
                          {rolesData?.data
                            ?.filter(role => role.isActive)
                            .map(role => (
                              <Option key={`roleId:${role._id}`} value={`roleId:${role._id}`}>
                                {role.name} ({role.code})
                                {role.permissions && (
                                  <span style={{ color: '#999', marginLeft: 8 }}>
                                    - {role.permissions.length} quyền
                                  </span>
                                )}
                              </Option>
                            ))}
                        </OptGroup>
                        <OptGroup label="🔧 Vai trò cơ bản (tương thích ngược)">
                          <Option value="role:customer">Khách hàng</Option>
                          <Option value="role:sale_staff">Nhân viên bán hàng</Option>
                          <Option value="role:shipper">Nhân viên giao hàng</Option>
                          <Option value="role:manager">Quản lý</Option>
                          <Option value="role:admin">Quản trị viên</Option>
                        </OptGroup>
                      </Select>
                      {rowSelected === user?.id && (
                        stateUserDetails.role === 'admin' ||
                        stateUserDetails.isAdmin === true ||
                        (stateUserDetails.roleId && rolesData?.data?.find(r => r._id === stateUserDetails.roleId)?.code === 'SUPER_ADMIN')
                      ) && (
                          <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                            Không thể tự thay đổi quyền của chính mình
                          </div>
                        )}
                      {stateUserDetails.roleId && !(rowSelected === user?.id && (
                        stateUserDetails.role === 'admin' ||
                        stateUserDetails.isAdmin === true ||
                        (stateUserDetails.roleId && rolesData?.data?.find(r => r._id === stateUserDetails.roleId)?.code === 'SUPER_ADMIN')
                      )) && (
                          <div style={{ color: '#52c41a', fontSize: '12px', marginTop: '4px' }}>
                            Đang sử dụng vai trò từ hệ thống phân quyền
                          </div>
                        )}
                      {!stateUserDetails.roleId && stateUserDetails.role && (
                        <div style={{ color: '#faad14', fontSize: '12px', marginTop: '4px' }}>
                          Đang sử dụng vai trò cơ bản. Khuyến nghị chuyển sang vai trò từ hệ thống phân quyền để có nhiều quyền hơn.
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item label="Trạng thái khóa" name="isLocked">
                      <Switch
                        checked={stateUserDetails.isLocked}
                        checkedChildren="Đã khóa"
                        unCheckedChildren="Hoạt động"
                        disabled={
                          rowSelected === user?.id ||
                          (stateUserDetails.role === 'admin' || stateUserDetails.isAdmin === true)
                        }
                        onChange={(checked) => {
                          if (checked) {
                            handleLockUser()
                          } else {
                            handleUnlockUser()
                          }
                        }}
                      />
                      {(rowSelected === user?.id || (stateUserDetails.role === 'admin' || stateUserDetails.isAdmin === true)) && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                          {rowSelected === user?.id
                            ? 'Không thể khóa/mở khóa chính mình'
                            : 'Không thể khóa/mở khóa tài khoản admin'}
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item label="Avatar" name="avatar">
                      <WrapperUploadFile onChange={handleOnchangeAvatarDetails} maxCount={1}>
                        <Button>Chọn File</Button>
                        {stateUserDetails?.avatar && (
                          <img
                            src={stateUserDetails?.avatar}
                            style={{
                              height: '60px',
                              width: '60px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              marginLeft: '10px'
                            }}
                            alt="avatar"
                          />
                        )}
                      </WrapperUploadFile>
                    </Form.Item>

                    <Form.Item label="Thống kê">
                      <Space direction="vertical">
                        <div>Số đơn đã đặt: <strong>{stateUserDetails.totalOrders || 0}</strong></div>
                        <div>Tổng chi tiêu: <strong>{convertPrice(stateUserDetails.totalSpent || 0)}</strong></div>
                        <div>Ngày tạo: {stateUserDetails.createdAt ? new Date(stateUserDetails.createdAt).toLocaleString('vi-VN') : '-'}</div>
                      </Space>
                    </Form.Item>

                    <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
                      <Button type="primary" htmlType="submit">
                        Cập nhật
                      </Button>
                    </Form.Item>
                  </Form>
                )
              },
              {
                key: 'orders',
                label: 'Lịch sử đơn hàng',
                icon: <ShoppingOutlined />,
                children: (
                  <TableComponent
                    columns={orderHistoryColumns}
                    isPending={queryOrderHistory.isPending}
                    data={orderHistory?.data?.map((order) => ({
                      ...order,
                      key: order._id
                    }))}
                    pagination={{ pageSize: 10 }}
                  />
                )
              }
            ]}
          />
        </Loading>
      </DrawerComponent>

      {/* Modal Delete */}
      <ModalComponent
        forceRender
        title="Xóa người dùng"
        open={isModalOpenDelete}
        onCancel={handleCancelDelete}
        onOk={handleDeleteUser}
      >
        <Loading isPending={mutationDeleteted.isPending}>
          <div>Bạn có chắc muốn xóa tài khoản này không?</div>
        </Loading>
      </ModalComponent>

      {/* Modal Lock */}
      <ModalComponent
        title="Khóa tài khoản"
        open={isModalLock}
        onCancel={() => {
          setIsModalLock(false)
          lockForm.resetFields()
        }}
        onOk={onLockUser}
        okText="Xác nhận khóa"
        cancelText="Đóng"
      >
        <Form form={lockForm} layout="vertical">
          <Form.Item
            label="Lý do khóa"
            name="lockReason"
            rules={[{ required: true, message: 'Vui lòng nhập lý do khóa!' }]}
          >
            <TextArea rows={3} placeholder="Nhập lý do khóa tài khoản" />
          </Form.Item>
        </Form>
      </ModalComponent>
    </PageWrapper>
  )
}

export default AdminUser
