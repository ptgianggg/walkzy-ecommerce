import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Tabs,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Divider,
  Checkbox,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyOutlined,
  UserSwitchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useMutationHooks } from '../../hooks/useMutationHook';
import * as RoleService from '../../services/RoleService';
import * as PermissionService from '../../services/PermissionService';
import Loading from '../LoadingComponent/Loading';
import {
  WrapperContent,
  PageHeader,
  WrapperHeader,
  HeaderSubtitle,
  HeaderActions,
  StatsGrid,
  StatCard,
  StatLabel,
  StatValue,
  StatTrend,
  ActionsBar,
  TableCard,
  TableHeader,
  TableTitle,
  TableSubtitle,
  InlineMuted
} from './style';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const AdminRolePermission = () => {
  const user = useSelector((state) => state?.user);
  // Current user's role identifiers (roleId may be object or string)
  const currentUserRoleId = user?.roleId && (typeof user.roleId === 'object' ? user.roleId._id : user.roleId);
  const currentUserRoleCode = (user?.roleId && typeof user.roleId === 'object' ? user.roleId.code : null) || user?.role;
  const isUserSuperAdminFlag = !!user?.isAdmin;

  const [activeTab, setActiveTab] = useState('roles');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState([]);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState([]);
  const [roleForm] = Form.useForm();
  const [permissionForm] = Form.useForm();

  // Fetch Roles
  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => RoleService.getAllRoles(user?.access_token),
    enabled: !!user?.access_token && activeTab === 'roles'
  });

  // Fetch Permissions
  const { data: permissionsData, isLoading: permissionsLoading, refetch: refetchPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => PermissionService.getAllPermissions(user?.access_token),
    enabled: !!user?.access_token && activeTab === 'permissions'
  });

  // Fetch Modules
  const { data: modulesData } = useQuery({
    queryKey: ['modules'],
    queryFn: () => PermissionService.getModules(user?.access_token),
    enabled: !!user?.access_token
  });

  // Role Mutations
  const mutationCreateRole = useMutationHooks(
    (data) => RoleService.createRole(data, user?.access_token)
  );

  const mutationUpdateRole = useMutationHooks(
    (data) => RoleService.updateRole(data.id, data, user?.access_token)
  );

  const mutationDeleteRole = useMutationHooks(
    (id) => RoleService.deleteRole(id, user?.access_token)
  );

  const mutationDeleteManyRoles = useMutationHooks(
    (ids) => RoleService.deleteManyRoles(ids, user?.access_token)
  );

  // Permission Mutations
  const mutationCreatePermission = useMutationHooks(
    (data) => PermissionService.createPermission(data, user?.access_token)
  );

  const mutationUpdatePermission = useMutationHooks(
    (data) => PermissionService.updatePermission(data.id, data, user?.access_token)
  );

  const mutationDeletePermission = useMutationHooks(
    (id) => PermissionService.deletePermission(id, user?.access_token)
  );

  const mutationDeleteManyPermissions = useMutationHooks(
    (ids) => PermissionService.deleteManyPermissions(ids, user?.access_token)
  );

  const mutationInitPermissions = useMutationHooks(
    () => PermissionService.initializeDefaultPermissions(user?.access_token)
  );

  // Handle Role Operations
  const handleCreateRole = () => {
    setEditingRole(null);
    setSelectedPermissions([]);
    roleForm.resetFields();
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (record) => {
    // Defensive: prevent editing the role the current user is using
    const roleId = record._id;
    const roleCode = record.code;
    const isCurrentUserRole = (currentUserRoleId && roleId === currentUserRoleId) || (currentUserRoleCode && roleCode === currentUserRoleCode) || (isUserSuperAdminFlag && roleCode === 'SUPER_ADMIN');
    if (isCurrentUserRole) {
      message.warning('Bạn không thể chỉnh sửa quyền của vai trò đang đăng nhập');
      return;
    }

    setEditingRole(record);
    setSelectedPermissions(record.permissions?.map(p => p._id) || []);
    roleForm.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      isActive: record.isActive
    });
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = async (id) => {
    // Defensive: prevent deleting the role the current user is using
    if (currentUserRoleId && id === currentUserRoleId) {
      message.warning('Bạn không thể xóa vai trò đang đăng nhập');
      return;
    }

    try {
      const result = await mutationDeleteRole.mutateAsync(id);
      if (result.status === 'OK') {
        message.success('Xóa vai trò thành công!');
        refetchRoles();
      } else {
        message.error(result.message || 'Xóa vai trò thất bại!');
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Xóa vai trò thất bại!';
      message.error(errorMessage);
      console.error('Error deleting role:', error);
    }
  };

  const handleDeleteManyRoles = async () => {
    if (selectedRoleKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một vai trò để xóa');
      return;
    }

    if (currentUserRoleId && selectedRoleKeys.includes(currentUserRoleId)) {
      message.warning('Bạn không thể xóa vai trò đang đăng nhập');
      return;
    }

    try {
      const result = await mutationDeleteManyRoles.mutateAsync(selectedRoleKeys);
      if (result.status === 'OK') {
        message.success(result.message || `Xóa ${selectedRoleKeys.length} vai trò thành công!`);
        setSelectedRoleKeys([]);
        refetchRoles();
      } else {
        message.error(result.message || 'Xóa vai trò thất bại!');
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Xóa vai trò thất bại!';
      message.error(errorMessage);
      console.error('Error deleting roles:', error);
    }
  };

  const handleRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields();
      const roleData = {
        ...values,
        permissions: selectedPermissions
      };

      let result;
      if (editingRole) {
        result = await mutationUpdateRole.mutateAsync({ id: editingRole._id, ...roleData });
      } else {
        result = await mutationCreateRole.mutateAsync(roleData);
      }

      if (result.status === 'OK') {
        message.success(editingRole ? 'Cập nhật vai trò thành công!' : 'Tạo vai trò thành công!');
        setIsRoleModalOpen(false);
        refetchRoles();
      } else {
        message.error(result.message || 'Thao tác thất bại!');
      }
    } catch (error) {
      message.error('Thao tác thất bại!');
    }
  };

  // Handle Permission Operations
  const handleCreatePermission = () => {
    setEditingPermission(null);
    permissionForm.resetFields();
    setIsPermissionModalOpen(true);
  };

  const handleEditPermission = (record) => {
    setEditingPermission(record);
    permissionForm.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      module: record.module,
      action: record.action,
      isSensitive: record.isSensitive,
      isActive: record.isActive
    });
    setIsPermissionModalOpen(true);
  };

  const handleDeletePermission = async (id) => {
    try {
      const result = await mutationDeletePermission.mutateAsync(id);
      if (result.status === 'OK') {
        message.success('Xóa quyền thành công!');
        refetchPermissions();
      } else {
        message.error(result.message || 'Xóa quyền thất bại!');
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Xóa quyền thất bại!';
      message.error(errorMessage);
      console.error('Error deleting permission:', error);
    }
  };

  const handleDeleteManyPermissions = async () => {
    if (selectedPermissionKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một quyền để xóa');
      return;
    }

    try {
      const result = await mutationDeleteManyPermissions.mutateAsync(selectedPermissionKeys);
      if (result.status === 'OK') {
        message.success(result.message || `Xóa ${selectedPermissionKeys.length} quyền thành công!`);
        setSelectedPermissionKeys([]);
        refetchPermissions();
      } else {
        message.error(result.message || 'Xóa quyền thất bại!');
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Xóa quyền thất bại!';
      message.error(errorMessage);
      console.error('Error deleting permissions:', error);
    }
  };

  const handlePermissionSubmit = async () => {
    try {
      const values = await permissionForm.validateFields();
      let result;
      if (editingPermission) {
        result = await mutationUpdatePermission.mutateAsync({ id: editingPermission._id, ...values });
      } else {
        result = await mutationCreatePermission.mutateAsync(values);
      }

      if (result.status === 'OK') {
        message.success(editingPermission ? 'Cập nhật quyền thành công!' : 'Tạo quyền thành công!');
        setIsPermissionModalOpen(false);
        refetchPermissions();
      } else {
        message.error(result.message || 'Thao tác thất bại!');
      }
    } catch (error) {
      message.error('Thao tác thất bại!');
    }
  };

  const handleInitPermissions = async () => {
    try {
      const result = await mutationInitPermissions.mutateAsync();
      if (result.status === 'OK') {
        message.success(result.message || 'Khởi tạo quyền mặc định thành công!');
        refetchPermissions();
      } else {
        message.error(result.message || 'Khởi tạo thất bại!');
      }
    } catch (error) {
      message.error('Khởi tạo thất bại!');
    }
  };

  // X- lA modules - cA3 th lA array string hoc array object
  const modules = (modulesData?.data || []).map(m =>
    typeof m === 'string' ? { code: m, label: m } : m
  );
  const permissions = permissionsData?.data || [];
  const roles = rolesData?.data || [];
  const totalRoles = roles.length;
  const activeRoles = roles.filter((r) => r.isActive).length;
  const totalPermissions = permissions.length;
  const sensitivePermissions = permissions.filter((p) => p.isSensitive).length;
  const modulesCount = modules.length;
  const batchDeleteDisabled = selectedRoleKeys.length === 0 ||
    (currentUserRoleId && selectedRoleKeys.includes(currentUserRoleId)) ||
    (currentUserRoleCode && roles.some(r => selectedRoleKeys.includes(r._id) && r.code === currentUserRoleCode));
  const batchDeleteTooltip = (currentUserRoleId && selectedRoleKeys.includes(currentUserRoleId)) ||
    (currentUserRoleCode && roles.some(r => selectedRoleKeys.includes(r._id) && r.code === currentUserRoleCode))
    ? 'Bạn không thể xóa vai trò đang đăng nhập'
    : '';


  const roleColumns = [
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700 }}>{text}</div>
          <InlineMuted style={{ marginTop: 4 }}>{record.code}</InlineMuted>
        </div>
      )
    },
    {
      title: 'Số quyền',
      key: 'permissionCount',
      width: 100,
      render: (_, record) => (
        <Tag>{record.permissions?.length || 0}</Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm khóa'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const roleId = record._id;
        const roleCode = record.code;
        const isCurrentUserRole = (currentUserRoleId && roleId === currentUserRoleId) || (currentUserRoleCode && roleCode === currentUserRoleCode) || (isUserSuperAdminFlag && roleCode === 'SUPER_ADMIN');
        const disableReason = isCurrentUserRole ? 'Bạn không thể chỉnh sửa quyền của vai trò đang đăng nhập' : '';
        return (
          <Space>
            <Tooltip title={isCurrentUserRole ? disableReason : 'Chỉnh sửa'}>
              <Button
                size="small"
                type="default"
                icon={<EditOutlined />}
                onClick={() => handleEditRole(record)}
                disabled={record.isSystem || isCurrentUserRole}
                aria-label="Chỉnh sửa"
              />
            </Tooltip>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc muốn xóa vai trò này?"
              onConfirm={() => handleDeleteRole(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              disabled={record.isSystem || isCurrentUserRole}
            >
              <Tooltip title={isCurrentUserRole ? disableReason : 'Xóa'}>
                <Button
                  size="small"
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  disabled={record.isSystem || isCurrentUserRole}
                  aria-label="Xóa"
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      }
    }
  ];

  const permissionColumns = [
    {
      title: 'Tên quyền',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Mã quyền',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code) => <Tag color="purple">{code}</Tag>
    },
    {
      title: 'Mô-đun',
      dataIndex: 'module',
      key: 'module',
      width: 150,
      render: (module) => <Tag color="cyan">{module}</Tag>
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Nhạy cảm',
      dataIndex: 'isSensitive',
      key: 'isSensitive',
      width: 100,
      render: (isSensitive) => (
        isSensitive ? (
          <Tag color="red">
            Nhạy cảm
          </Tag>
        ) : (
          <Tag>Bình thường</Tag>
        )
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm khóa'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              type="default"
              icon={<EditOutlined />}
              onClick={() => handleEditPermission(record)}
              aria-label="Chỉnh sửa"
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa quyền này?"
            onConfirm={() => handleDeletePermission(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                size="small"
                danger
                type="primary"
                icon={<DeleteOutlined />}
                aria-label="Xóa"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <WrapperContent>
      <PageHeader>
        <div>
          <WrapperHeader>Phân quyền / Vai trò</WrapperHeader>
         
        </div>
        <HeaderActions>
          <Button icon={<ReloadOutlined />} onClick={() => { refetchRoles(); refetchPermissions(); }}>
            Làm mới
          </Button>
        </HeaderActions>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <div className="stat-icon" style={{ background: '#1d4ed8' }}>
            <UserSwitchOutlined />
          </div>
          <StatLabel>Tổng vai trò</StatLabel>
          <StatValue>{totalRoles}</StatValue>
          <StatTrend $negative={activeRoles === 0}>{activeRoles} hoạt động</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <SafetyOutlined />
          </div>
          <StatLabel>Tổng quyền</StatLabel>
          <StatValue>{totalPermissions}</StatValue>
          <StatTrend>+{sensitivePermissions} nhạy cảm</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#6366f1' }}>
            <ReloadOutlined />
          </div>
          <StatLabel>Module</StatLabel>
          <StatValue>{modulesCount}</StatValue>
          <StatTrend>Phạm vi module</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#f97316' }}>
            <ExclamationCircleOutlined />
          </div>
          <StatLabel>Đang chọn</StatLabel>
          <StatValue>{selectedRoleKeys.length + selectedPermissionKeys.length}</StatValue>
          <StatTrend $negative>{selectedRoleKeys.length} vai trò, {selectedPermissionKeys.length} quyền</StatTrend>
        </StatCard>
      </StatsGrid>

      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <UserSwitchOutlined /> Vai trò
            </span>
          }
          key="roles"
        >
          <ActionsBar>
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateRole}
              >
                Tạo vai trò mới
              </Button>
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa ${selectedRoleKeys.length} vai trò đã chọn?`}
                onConfirm={handleDeleteManyRoles}
                okText="Xóa"
                cancelText="Hủy"
                disabled={batchDeleteDisabled}
              >
                <Tooltip title={batchDeleteDisabled ? batchDeleteTooltip : `Xóa tất cả (${selectedRoleKeys.length})`}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={batchDeleteDisabled}
                    loading={mutationDeleteManyRoles.isPending}
                  >
                    Xóa tất cả ({selectedRoleKeys.length})
                  </Button>
                </Tooltip>
              </Popconfirm>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetchRoles()}
              >
                Làm mới
              </Button>
            </Space>
            <InlineMuted>{selectedRoleKeys.length} vai trò đã chọn</InlineMuted>
          </ActionsBar>

          <TableCard>
            <TableHeader>
              <div>
                <TableTitle>Danh sách vai trò</TableTitle>
                
              </div>
            </TableHeader>
            {rolesLoading ? (
              <Loading />
            ) : (
              <Table
                columns={roleColumns}
                dataSource={roles}
                rowKey="_id"
                pagination={{ pageSize: 8 }}
                scroll={{ x: 900 }}
                rowSelection={{
                  selectedRowKeys: selectedRoleKeys,
                  onChange: (selectedKeys) => {
                    setSelectedRoleKeys(selectedKeys);
                  },
                  getCheckboxProps: (record) => ({
                    disabled: record.isSystem,
                  }),
                }}
              />
            )}
          </TableCard>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SafetyOutlined /> Quyền
            </span>
          }
          key="permissions"
        >
          <ActionsBar>
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePermission}
              >
                Tạo quyền mới
              </Button>
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa ${selectedPermissionKeys.length} quyền đã chọn?`}
                onConfirm={handleDeleteManyPermissions}
                okText="Xóa"
                cancelText="Hủy"
                disabled={selectedPermissionKeys.length === 0}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={selectedPermissionKeys.length === 0}
                  loading={mutationDeleteManyPermissions.isPending}
                >
                  Xóa tất cả ({selectedPermissionKeys.length})
                </Button>
              </Popconfirm>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetchPermissions()}
              >
                Làm mới
              </Button>
              <Button
                icon={<SafetyOutlined />}
                onClick={handleInitPermissions}
                loading={mutationInitPermissions.isPending}
              >
                Khởi tạo quyền mặc định
              </Button>
            </Space>
            <InlineMuted>{selectedPermissionKeys.length} quyền đã chọn</InlineMuted>
          </ActionsBar>

          <TableCard>
            <TableHeader>
              <div>
                <TableTitle>Danh sách quyền</TableTitle>
                
              </div>
            </TableHeader>
            {permissionsLoading ? (
              <Loading />
            ) : (
              <Table
                columns={permissionColumns}
                dataSource={permissions}
                rowKey="_id"
                pagination={{ pageSize: 8 }}
                scroll={{ x: 900 }}
                rowSelection={{
                  selectedRowKeys: selectedPermissionKeys,
                  onChange: (selectedKeys) => {
                    setSelectedPermissionKeys(selectedKeys);
                  },
                }}
              />
            )}
          </TableCard>
        </TabPane>
      </Tabs>


      {/* Role Modal */}
      <Modal
        title={editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
        open={isRoleModalOpen}
        onOk={handleRoleSubmit}
        onCancel={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
          setSelectedPermissions([]);
        }}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={mutationCreateRole.isPending || mutationUpdateRole.isPending}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tên vai trò"
            rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
          >
            <Input placeholder="VD: Admin tổng, Nhân viên CSKH" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Mã vai trò"
            rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }]}
          >
            <Input placeholder="VD: SUPER_ADMIN, CSKH_STAFF" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Mô tả về vai trò này" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Hoạt" unCheckedChildren="Tạm khóa" />
          </Form.Item>

          <Divider>Quyền</Divider>

          <Form.Item label="Chọn quyền">
            <Checkbox.Group
              value={selectedPermissions}
              onChange={setSelectedPermissions}
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 16]}>
                {permissions
                  .filter(p => p.isActive)
                  .map(perm => (
                    <Col span={8} key={perm._id}>
                      <Checkbox value={perm._id}>
                        <Space>
                          {perm.name}
                          {perm.isSensitive && (
                            <Tag color="red" size="small">Nhạy cảm</Tag>
                          )}
                        </Space>
                      </Checkbox>
                    </Col>
                  ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Modal */}
      <Modal
        title={editingPermission ? 'Chỉnh sửa quyền' : 'Tạo quyền mới'}
        open={isPermissionModalOpen}
        onOk={handlePermissionSubmit}
        onCancel={() => {
          setIsPermissionModalOpen(false);
          setEditingPermission(null);
        }}
        width={600}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={mutationCreatePermission.isPending || mutationUpdatePermission.isPending}
      >
        <Form form={permissionForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tên quyền"
            rules={[{ required: true, message: 'Vui lòng nhập tên quyền' }]}
          >
            <Input placeholder="VD: Xem đơn hàng, Xóa sản phẩm" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Mã quyền"
            rules={[{ required: true, message: 'Vui lòng nhập mã quyền' }]}
          >
            <Input placeholder="VD: ORDER_READ, PRODUCT_DELETE" />
          </Form.Item>

            <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="module"
                label="Mô-đun"
                rules={[{ required: true, message: 'Vui lòng chọn mô-đun' }]}
              >
                <Select placeholder="Chọn mô-đun" showSearch>
                  {modules.map(module => (
                    <Option key={module.code || module} value={module.code || module}>
                      {module.label || module.code || module}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="action"
                label="Hành động"
                rules={[{ required: true, message: 'Vui lòng chọn hành động' }]}
              >
                <Select placeholder="Chọn hành động">
                  <Option value="create">Tạo</Option>
                  <Option value="read">Xem</Option>
                  <Option value="update">Cập nhật</Option>
                  <Option value="delete">Xóa</Option>
                  <Option value="manage">Quản lý</Option>
                  <Option value="export">Xuất</Option>
                  <Option value="import">Nhập</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Mô tả về quyền này" />
          </Form.Item>

          <Form.Item
            name="isSensitive"
            label="Quyền nhạy cảm"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Có" unCheckedChildren="Không" />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Quyền nhạy cảm cần giới hạn (ví dụ: xóa đơn, chỉnh giá)
            </Text>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Hoạt" unCheckedChildren="Tạm khóa" />
          </Form.Item>
        </Form>
      </Modal>
    </WrapperContent>
  );
};

export default AdminRolePermission;
