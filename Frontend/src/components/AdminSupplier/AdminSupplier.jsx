import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Space, Tag, Switch, Tooltip } from 'antd';
import {
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  DollarCircleOutlined,
  StopOutlined,
  SearchOutlined
} from '@ant-design/icons';
import TableComponent from '../TableComponent/TableComponent';
import Inputcomponent from '../Inputcomponent/Inputcomponent';
import AddressPicker from '../AddressPicker/AddressPicker';
import * as SupplierService from '../../services/SupplierService';
import { useMutationHooks } from '../../hooks/useMutationHook';
import Loading from '../LoadingComponent/Loading';
import * as message from '../Message/Message';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DrawerComponent from '../DrawerComponent/DrawerComponent';
import { useSelector } from 'react-redux';
import ModalComponent from '../ModalComponent/ModalComponent';
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
  CardsRow,
  CreateCard,
  TableCard,
  TableHeader,
  TableTitle,
  TableSubtitle,
  StatusPill,
  InlineMuted
} from './style';

const { TextArea } = Input;

const AdminSupplier = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rowSelected, setRowSelected] = useState('');
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [isPendingUpdate, setIsPendingUpdate] = useState(false);
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);
  const [filters, setFilters] = useState({ keyword: '', status: 'all' });
  const user = useSelector((state) => state?.user);

  const initial = () => ({
    name: '',
    code: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    email: '',
    phone: '',
    contactPerson: '',
    taxCode: '',
    bankAccount: {
      accountNumber: '',
      bankName: '',
      accountHolder: ''
    },
    notes: '',
    isActive: true
  });

  const [stateSupplier, setStateSupplier] = useState(initial());
  const [stateSupplierDetails, setStateSupplierDetails] = useState(initial());
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const mutation = useMutationHooks(
    (data) => SupplierService.createSupplier(data, user?.access_token)
  );

  const mutationUpdate = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data;
      return SupplierService.updateSupplier(id, rests, token);
    }
  );

  const mutationDeleted = useMutationHooks(
    (data) => {
      const { id, token } = data;
      return SupplierService.deleteSupplier(id, token);
    }
  );

  const { data: dataSupplier, isPending: isPendingSupplier, isSuccess: isSuccessSupplier, isError: isErrorSupplier } = mutation;
  const { data: dataUpdated, isPending: isPendingUpdated, isSuccess: isSuccessUpdated, isError: isErrorUpdated } = mutationUpdate;
  const { data: dataDeleted, isPending: isPendingDeleted, isSuccess: isSuccessDeleted, isError: isErrorDeleted } = mutationDeleted;

  const querySupplier = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => SupplierService.getAllSupplier(user?.access_token),
    enabled: !!user?.access_token
  });

  const suppliers = querySupplier?.data?.data || [];

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const inactiveSuppliers = totalSuppliers - activeSuppliers;
  const topValue = suppliers.reduce((acc, s) => acc + (s.totalValue || 0), 0);

  const handleDetailsSupplier = async () => {
    if (!rowSelected) return;
    setIsPendingUpdate(true);
    setIsOpenDrawer(true);
    try {
      const res = await SupplierService.getDetailsSupplier(rowSelected, user?.access_token);
      if (res?.data) {
        const data = res.data;
        setStateSupplierDetails(data);
        const addressValue = {
          address: data.address || '',
          city: data.city || '',
          province: data.city || '',
          district: data.district || '',
          ward: data.ward || ''
        };
        setTimeout(() => {
          updateForm.setFieldsValue({
            ...data,
            addressValue: addressValue
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      message.error('Lỗi khi tải thông tin nhà cung cấp');
    } finally {
      setIsPendingUpdate(false);
    }
  };

  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      handleDetailsSupplier();
    }
  }, [rowSelected, isOpenDrawer]);

  useEffect(() => {
    if (isModalOpen) {
      setStateSupplier(initial());
      createForm.setFieldsValue({
        ...initial(),
        addressValue: {
          address: '',
          city: '',
          district: '',
          ward: ''
        }
      });
    }
  }, [isModalOpen, createForm]);

  useEffect(() => {
    if (!isOpenDrawer) {
      setStateSupplierDetails(initial());
      updateForm.resetFields();
    }
  }, [isOpenDrawer, updateForm]);

  const handleOnchange = (e) => {
    if (e.target) {
      if (e.target.name.startsWith('bankAccount.')) {
        const field = e.target.name.split('.')[1];
        setStateSupplier({
          ...stateSupplier,
          bankAccount: {
            ...stateSupplier.bankAccount,
            [field]: e.target.value
          }
        });
      } else {
        setStateSupplier({
          ...stateSupplier,
          [e.target.name]: e.target.value
        });
      }
    }
  };

  const handleOnchangeDetails = (e) => {
    if (e.target) {
      if (e.target.name.startsWith('bankAccount.')) {
        const field = e.target.name.split('.')[1];
        setStateSupplierDetails({
          ...stateSupplierDetails,
          bankAccount: {
            ...stateSupplierDetails.bankAccount,
            [field]: e.target.value
          }
        });
      } else {
        setStateSupplierDetails({
          ...stateSupplierDetails,
          [e.target.name]: e.target.value
        });
      }
    }
  };

  const onFinish = () => {
    if (!stateSupplier.name || !stateSupplier.address || !stateSupplier.city || !stateSupplier.email) {
      message.error('Vui lòng điền đầy đủ thông tin bắt buộc (Tên nhà cung cấp, Địa chỉ, Thành phố, Email)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(stateSupplier.email)) {
      message.error('Email không hợp lệ');
      return;
    }

    mutation.mutate(stateSupplier, {
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      }
    });
  };

  const onUpdateSupplier = () => {
    mutationUpdate.mutate({ id: rowSelected, token: user?.access_token, ...stateSupplierDetails }, {
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      }
    });
  };

  const handleDeleteSupplier = () => {
    mutationDeleted.mutate({ id: rowSelected, token: user?.access_token }, {
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      }
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setStateSupplier(initial());
    createForm.resetFields();
  };

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false);
  };

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false);
    setStateSupplierDetails(initial());
    updateForm.resetFields();
  };

  useEffect(() => {
    if (isSuccessSupplier) {
      if (dataSupplier?.status === 'OK') {
        message.success('Tạo nhà cung cấp thành công!');
        handleCancel();
        querySupplier.refetch();
      } else {
        message.error(dataSupplier?.message || 'Tạo nhà cung cấp thất bại!');
      }
    } else if (isErrorSupplier) {
      message.error(dataSupplier?.message || 'Tạo nhà cung cấp thất bại!');
    }
  }, [isSuccessSupplier, isErrorSupplier, dataSupplier]);

  useEffect(() => {
    if (isSuccessDeleted && dataDeleted?.status === 'OK') {
      message.success('Xóa nhà cung cấp thành công!');
      handleCancelDelete();
      querySupplier.refetch();
    } else if (isErrorDeleted) {
      message.error(dataDeleted?.message || 'Xóa nhà cung cấp thất bại!');
    }
  }, [isSuccessDeleted, isErrorDeleted]);

  useEffect(() => {
    if (isSuccessUpdated && dataUpdated?.status === 'OK') {
      message.success('Cập nhật nhà cung cấp thành công!');
      handleCloseDrawer();
      querySupplier.refetch();
    } else if (isErrorUpdated) {
      message.error('Cập nhật nhà cung cấp thất bại!');
    }
  }, [isSuccessUpdated, isErrorUpdated]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const renderAction = (_, record) => (
    <Space onClick={(e) => e.stopPropagation()} size="small">
      <Tooltip title="Chi tiết">
        <Button
          size="small"
          type="default"
          icon={<EditOutlined />}
          onClick={() => {
            setRowSelected(record._id);
            setIsOpenDrawer(true);
          }}
          aria-label="Chi tiết"
        />
      </Tooltip>
      <Tooltip title="Xóa">
        <Button
          size="small"
          danger
          type="primary"
          icon={<DeleteOutlined />}
          onClick={() => {
            setRowSelected(record._id);
            setIsModalOpenDelete(true);
          }}
          aria-label="Xóa"
        />
      </Tooltip>
    </Space>
  );

  const columns = [
    {
      title: 'Nhà cung cấp',
      dataIndex: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Space size={8} wrap align="center">
            <UserOutlined style={{ color: '#1d4ed8' }} />
            <span style={{ fontWeight: 700 }}>{text || 'Chưa có tên'}</span>
            {record.code && <Tag color="geekblue">#{record.code}</Tag>}
          </Space>
          <Space size={8} wrap>
            {record.contactPerson && <Tag color="blue">{record.contactPerson}</Tag>}
            {record.phone && <Tag color="success" icon={<PhoneOutlined />}>{record.phone}</Tag>}
            {record.email && <Tag color="processing" icon={<MailOutlined />}>{record.email}</Tag>}
          </Space>
        </div>
      )
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      ellipsis: true,
      render: (text, record) => {
        const fullAddress = `${text || ''}${record.ward ? `, ${record.ward}` : ''}${record.district ? `, ${record.district}` : ''}${record.city ? `, ${record.city}` : ''}`.replace(/^,\s*|,\s*$/g, '');
        return (
          <div style={{ maxWidth: 320 }}>
            <div style={{ fontWeight: 600 }}>{fullAddress || 'Chưa có địa chỉ'}</div>
          </div>
        );
      }
    },

    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleFilled /> : <StopOutlined />}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      render: renderAction
    },
  ];

  const keyword = filters.keyword.trim().toLowerCase();
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && supplier.isActive) ||
      (filters.status === 'inactive' && !supplier.isActive);
    const haystack = [
      supplier.name,
      supplier.code,
      supplier.email,
      supplier.phone,
      supplier.contactPerson,
      supplier.city,
      supplier.address
    ].map((v) => (v || '').toString().toLowerCase());
    const matchesKeyword = !keyword || haystack.some((v) => v.includes(keyword));
    return matchesStatus && matchesKeyword;
  });

  const dataTable = filteredSuppliers.map((supplier) => ({
    ...supplier,
    key: supplier._id || supplier.id,
  }));

  const noResults = !querySupplier.isPending && dataTable.length === 0;

  return (
    <WrapperContent>
      <PageHeader>
        <div>
          <WrapperHeader>Quản lý nhà cung cấp</WrapperHeader>
          
        </div>
        <HeaderActions>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['suppliers'] });
              querySupplier.refetch();
            }}
            loading={querySupplier.isPending}
          >
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Tạo nhà cung cấp mới
          </Button>
        </HeaderActions>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <div className="stat-icon" style={{ background: '#1d4ed8' }}>
            <UserOutlined />
          </div>
          <StatLabel>NCC hoạt động</StatLabel>
          <StatValue>{activeSuppliers}</StatValue>
          <StatTrend $negative={inactiveSuppliers > 0}>{inactiveSuppliers} tạm dừng</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <DollarCircleOutlined />
          </div>
          <StatLabel>Tổng giá trị</StatLabel>
          <StatValue>{new Intl.NumberFormat('vi-VN').format(topValue)} d</StatValue>
          <StatTrend>Giá trị đơn hàng</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#6366f1' }}>
            <EnvironmentOutlined />
          </div>
          <StatLabel>Phân bố</StatLabel>
          <StatValue>{new Set(suppliers.map((s) => s.city || '').filter(Boolean)).size}</StatValue>
          <StatTrend>Tỉnh/Thành</StatTrend>
        </StatCard>
        <StatCard>
          <div className="stat-icon" style={{ background: '#f97316' }}>
            <StopOutlined />
          </div>
          <StatLabel>Đang chọn</StatLabel>
          <StatValue>{rowSelected ? 1 : 0}</StatValue>
          <StatTrend $negative>Dòng đang chọn</StatTrend>
        </StatCard>
      </StatsGrid>

      <ActionsBar>
        <Space size="middle" wrap>
          <Input
            allowClear
            placeholder="Tìm theo tên, mã, email, sđt, liên hệ..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            style={{ width: 320 }}
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
          />
          <Space size={[8, 8]} wrap>
            <Button
              type={filters.status === 'all' ? 'primary' : 'default'}
              onClick={() => handleFilterChange('status', 'all')}
            >
              Tất cả
            </Button>
            <Button
              type={filters.status === 'active' ? 'primary' : 'default'}
              onClick={() => handleFilterChange('status', 'active')}
            >
              Hoạt động
            </Button>
            <Button
              type={filters.status === 'inactive' ? 'primary' : 'default'}
              onClick={() => handleFilterChange('status', 'inactive')}
            >
              Tạm dừng
            </Button>
          </Space>
        </Space>
      </ActionsBar>

     
      <TableCard>
        <TableHeader>
          <div>
            <TableTitle>Danh sách nhà cung cấp</TableTitle>
            <TableSubtitle>Đang hiển thị {dataTable.length} / {suppliers.length} nhà cung cấp</TableSubtitle>
          </div>
          
        </TableHeader>
        <Loading isPending={querySupplier.isPending}>
          {dataTable && dataTable.length > 0 ? (
            <TableComponent
              handleDeleteMany={() => {}}
              columns={columns}
              isPending={false}
              data={dataTable}
              scroll={{ x: 1100 }}
              onRow={(record) => {
                const bg = record.isActive ? '#fff' : '#fff1f0';
                return {
                  onClick: () => {
                    setRowSelected(record._id);
                  },
                  style: { background: bg, cursor: 'pointer' }
                };
              }}
            />
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
                  <div>Không tìm thấy nhà cung cấp phù hợp.</div>
                  <Button type="primary" style={{ marginTop: 12 }} onClick={() => setIsModalOpen(true)}>
                    Thêm nhà cung cấp mới
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
        title="Tạo nhà cung cấp"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Loading isPending={isPendingSupplier}>
          <Form
            layout="vertical"
            onFinish={onFinish}
            autoComplete="on"
            form={createForm}
          >
            <Form.Item label="Tên nhà cung cấp" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp!' }]}>
              <Inputcomponent value={stateSupplier.name} onChange={handleOnchange} name="name" />
            </Form.Item>
            <Form.Item label="Mã NCC" name="code">
              <Inputcomponent value={stateSupplier.code} onChange={handleOnchange} name="code" />
            </Form.Item>
            <Form.Item
              label="Địa chỉ"
              name="addressValue"
              rules={[{ required: true, message: 'Vui lòng chọn địa chỉ!' }]}
            >
              <AddressPicker
                value={{
                  address: stateSupplier.address || '',
                  city: stateSupplier.city || '',
                  province: stateSupplier.city || '',
                  district: stateSupplier.district || '',
                  ward: stateSupplier.ward || ''
                }}
                onChange={(addressData) => {
                  setStateSupplier({
                    ...stateSupplier,
                    ...(addressData.address !== undefined && { address: addressData.address || '' }),
                    city: addressData.city || addressData.province || stateSupplier.city || '',
                    district: addressData.district || stateSupplier.district || '',
                    ward: addressData.ward || stateSupplier.ward || ''
                  });
                }}
                form={createForm}
              />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
              <Inputcomponent value={stateSupplier.email} onChange={handleOnchange} name="email" />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Inputcomponent value={stateSupplier.phone} onChange={handleOnchange} name="phone" />
            </Form.Item>
            <Form.Item label="Người liên hệ" name="contactPerson">
              <Inputcomponent value={stateSupplier.contactPerson} onChange={handleOnchange} name="contactPerson" />
            </Form.Item>
            <Form.Item label="Mã số thuế" name="taxCode">
              <Inputcomponent value={stateSupplier.taxCode} onChange={handleOnchange} name="taxCode" />
            </Form.Item>
            <Form.Item label="Số tài khoản" name="bankAccount.accountNumber">
              <Inputcomponent value={stateSupplier.bankAccount?.accountNumber} onChange={handleOnchange} name="bankAccount.accountNumber" />
            </Form.Item>
            <Form.Item label="Ngân hàng" name="bankAccount.bankName">
              <Inputcomponent value={stateSupplier.bankAccount?.bankName} onChange={handleOnchange} name="bankAccount.bankName" />
            </Form.Item>
            <Form.Item label="Chủ tài khoản" name="bankAccount.accountHolder">
              <Inputcomponent value={stateSupplier.bankAccount?.accountHolder} onChange={handleOnchange} name="bankAccount.accountHolder" />
            </Form.Item>
            <Form.Item label="Ghi chú" name="notes">
              <TextArea value={stateSupplier.notes} onChange={handleOnchange} name="notes" rows={3} />
            </Form.Item>
            <Form.Item label="Trang thai" name="isActive" valuePropName="checked">
              <Switch
                checked={stateSupplier.isActive}
                onChange={(checked) => setStateSupplier({ ...stateSupplier, isActive: checked })}
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
        title='Chi tiết nhà cung cấp'
        isOpen={isOpenDrawer}
        onClose={handleCloseDrawer}
        width="90%"
      >
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            layout="vertical"
            onFinish={onUpdateSupplier}
            autoComplete="on"
            form={updateForm}
          >
            <Form.Item label="Tên nhà cung cấp" name="name" rules={[{ required: true }]}>
              <Inputcomponent
                value={stateSupplierDetails.name}
                onChange={handleOnchangeDetails}
                name="name"
              />
            </Form.Item>
            <Form.Item label="Mã NCC" name="code">
              <Inputcomponent
                value={stateSupplierDetails.code}
                onChange={handleOnchangeDetails}
                name="code"
              />
            </Form.Item>
            <Form.Item
              label="Địa chỉ"
              name="addressValue"
              rules={[{ required: true, message: 'Vui lòng chọn địa chỉ!' }]}
            >
              <AddressPicker
                value={{
                  address: stateSupplierDetails.address || '',
                  city: stateSupplierDetails.city || '',
                  province: stateSupplierDetails.city || '',
                  district: stateSupplierDetails.district || '',
                  ward: stateSupplierDetails.ward || ''
                }}
                onChange={(addressData) => {
                  setStateSupplierDetails({
                    ...stateSupplierDetails,
                    ...(addressData.address !== undefined && { address: addressData.address || '' }),
                    city: addressData.city || addressData.province || stateSupplierDetails.city || '',
                    district: addressData.district || stateSupplierDetails.district || '',
                    ward: addressData.ward || stateSupplierDetails.ward || ''
                  });
                }}
                form={updateForm}
              />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Inputcomponent
                value={stateSupplierDetails.email}
                onChange={handleOnchangeDetails}
                name="email"
              />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Inputcomponent
                value={stateSupplierDetails.phone}
                onChange={handleOnchangeDetails}
                name="phone"
              />
            </Form.Item>
            <Form.Item label="Người liên hệ" name="contactPerson">
              <Inputcomponent
                value={stateSupplierDetails.contactPerson}
                onChange={handleOnchangeDetails}
                name="contactPerson"
              />
            </Form.Item>
            <Form.Item label="Mã số thuế" name="taxCode">
              <Inputcomponent
                value={stateSupplierDetails.taxCode}
                onChange={handleOnchangeDetails}
                name="taxCode"
              />
            </Form.Item>
            <Form.Item label="Số tài khoản" name="bankAccount.accountNumber">
              <Inputcomponent
                value={stateSupplierDetails.bankAccount?.accountNumber}
                onChange={handleOnchangeDetails}
                name="bankAccount.accountNumber"
              />
            </Form.Item>
            <Form.Item label="Ngân hàng" name="bankAccount.bankName">
              <Inputcomponent
                value={stateSupplierDetails.bankAccount?.bankName}
                onChange={handleOnchangeDetails}
                name="bankAccount.bankName"
              />
            </Form.Item>
            <Form.Item label="Chủ tài khoản" name="bankAccount.accountHolder">
              <Inputcomponent
                value={stateSupplierDetails.bankAccount?.accountHolder}
                onChange={handleOnchangeDetails}
                name="bankAccount.accountHolder"
              />
            </Form.Item>
            <Form.Item label="Ghi chú" name="notes">
              <TextArea
                value={stateSupplierDetails.notes}
                onChange={handleOnchangeDetails}
                name="notes"
                rows={3}
              />
            </Form.Item>
            <Form.Item label="Trang thai" name="isActive" valuePropName="checked">
              <Switch
                checked={stateSupplierDetails.isActive}
                onChange={(checked) => setStateSupplierDetails({ ...stateSupplierDetails, isActive: checked })}
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
        title="Xóa nhà cung cấp"
        open={isModalOpenDelete}
        onOk={handleDeleteSupplier}
        onCancel={handleCancelDelete}
        okText="Xóa"
        cancelText="Hủy"
        confirmLoading={isPendingDeleted}
      >
        <p>Bạn có chắc chắn muốn xóa nhà cung cấp này?</p>
      </ModalComponent>
    </WrapperContent>
  );
};

export default AdminSupplier;
