import React, { useState } from 'react';
import { Table, Tag, Select, Button, Modal, Descriptions, Image, Form, Input, message, Space, Badge, Radio } from 'antd';
import { EyeOutlined, ReloadOutlined, DollarOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SupportRequestService from '../../services/SupportRequestService';
import { useSelector } from 'react-redux';
import Loading from '../LoadingComponent/Loading';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const AdminSupport = () => {
    const user = useSelector((state) => state?.user);
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [refundForm] = Form.useForm();
    const [filters, setFilters] = useState({ status: '' });

    // Fetch support requests
    const { data: requestsData, isPending, refetch } = useQuery({
        queryKey: ['support-requests', filters],
        queryFn: () => SupportRequestService.getAllSupportRequests(
            filters,
            user?.access_token
        ),
        enabled: !!user?.access_token && !!user?.isAdmin
    });

    const requests = requestsData?.data || [];
    const total = requestsData?.total || 0;

    // Status labels
    const statusLabels = {
        PENDING: { label: 'Chờ duyệt', color: 'orange' },
        APPROVED: { label: 'Đã chấp nhận', color: 'blue' },
        REJECTED: { label: 'Đã từ chối', color: 'red' },
        COMPLETED: { label: 'Hoàn tất', color: 'green' }
    };

    // Request type labels
    const requestTypeLabels = {
        RETURN_REFUND: 'Trả hàng / Hoàn tiền',
        OTHER_COMPLAINT: 'Khiếu nại khác'
    };

    // Reason labels
    const reasonLabels = {
        WRONG_DESCRIPTION: 'Không đúng mô tả',
        DEFECTIVE_PRODUCT: 'Hàng lỗi',
        MISSING_ITEMS: 'Thiếu hàng',
        SHIPPER_ATTITUDE: 'Thái độ shipper',
        OTHER: 'Khác'
    };

    // Columns
    const statusCounts = requests.reduce((acc, item) => {
        const key = item.status || 'UNKNOWN';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const resolvedRate = total ? Math.round(((statusCounts.COMPLETED || 0) / total) * 100) : 0;
    const palette = {
        orange: '#fff7e6',
        blue: '#e6f4ff',
        green: '#f6ffed',
        red: '#fff1f0'
    };

    const summaryCards = [
        {
            label: 'Tổng yêu cầu',
            value: total,
            highlight: '+ tất cả',
            bg: 'linear-gradient(135deg, #e0f2ff, #f5f7ff)',
            color: '#0f172a'
        },
        {
            label: 'Chờ duyệt',
            value: statusCounts.PENDING || 0,
            highlight: 'Cần xử lý',
            bg: 'linear-gradient(135deg, #fff3e6, #fff9f0)',
            color: '#d97706'
        },
        {
            label: 'Đã chấp nhận',
            value: statusCounts.APPROVED || 0,
            highlight: 'Đang tiến hành',
            bg: 'linear-gradient(135deg, #e0f2fe, #e0f7ff)',
            color: '#2563eb'
        },
        {
            label: 'Hoàn tất',
            value: statusCounts.COMPLETED || 0,
            highlight: `${resolvedRate}% đã xử lý`,
            bg: 'linear-gradient(135deg, #e6fffb, #f0fff4)',
            color: '#047857'
        }
    ];

    const columns = [
        {
            title: 'Mã yêu cầu',
            dataIndex: 'requestCode',
            key: 'requestCode',
            width: 150,
            render: (code) => <Tag color="blue">{code}</Tag>
        },
        {
            title: 'Mã đơn hàng',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 150,
            render: (order) => order?._id?.toString().slice(-8) || order?._id || 'N/A'
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 200,
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>
                        {record.userId?.name || 'N/A'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                        {record.userId?.email || 'N/A'}
                    </div>
                </div>
            )
        },
        {
            title: 'Loại',
            dataIndex: 'requestType',
            key: 'requestType',
            width: 150,
            render: (type) => (
                <Tag color={type === 'RETURN_REFUND' ? 'geekblue' : 'purple'}>
                    {requestTypeLabels[type] || type}
                </Tag>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status, record) => {
                const statusInfo = statusLabels[status] || { label: status, color: 'default' };
                return (
                    <Space direction="vertical" size="small">
                        <Badge
                            status={statusInfo.color === 'green' ? 'success' : 
                                   statusInfo.color === 'red' ? 'error' : 
                                   statusInfo.color === 'blue' ? 'processing' : 'warning'}
                            text={statusInfo.label}
                        />
                        {status === 'COMPLETED' && record.isRefunded && (
                            <Tag color="green" style={{ fontSize: '11px', marginTop: '4px' }}>
                                Đã hoàn tiền
                            </Tag>
                        )}
                    </Space>
                );
            }
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record)}
                >
                    Xem
                </Button>
            )
        }
    ];

    const handleViewDetail = (request) => {
        setSelectedRequest(request);
        setIsDetailModalOpen(true);
        form.setFieldsValue({
            status: request.status,
            adminNote: request.adminNote || '',
            returnInstructions: request.returnInstructions || ''
        });
    };

    const handleStatusChange = async (values) => {
        try {
            // Chỉ gửi returnInstructions nếu status là APPROVED
            const updateData = {
                status: values.status,
                adminNote: values.adminNote
            };
            
            // Chỉ thêm returnInstructions khi status là APPROVED
            if (values.status === 'APPROVED' && values.returnInstructions) {
                updateData.returnInstructions = values.returnInstructions;
            }
            
            const res = await SupportRequestService.updateSupportRequestStatus(
                selectedRequest._id,
                updateData,
                user?.access_token
            );

            if (res?.status === 'OK') {
                message.success('Cập nhật trạng thái thành công');
                queryClient.invalidateQueries(['support-requests']);
                setIsStatusModalOpen(false);
                setIsDetailModalOpen(false);
                form.resetFields();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const handleCompleteRefund = async (productCondition) => {
        try {
            const res = await SupportRequestService.completeRefund(
                selectedRequest._id,
                productCondition,
                user?.access_token
            );

            if (res?.status === 'OK') {
                message.success('Hoàn tiền thành công');
                queryClient.invalidateQueries(['support-requests']);
                setIsDetailModalOpen(false);
                form.resetFields();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error completing refund:', error);
            message.error('Có lỗi xảy ra khi hoàn tiền');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
    };

    return (
        <div style={{ padding: '24px', background: '#f7f9fc', minHeight: '100vh' }}>
            <div
                style={{
                    background: 'linear-gradient(135deg, #141e30, #243b55)',
                    borderRadius: 16,
                    padding: 20,
                    color: '#e5e7eb',
                    marginBottom: 16,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.12)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: 13, opacity: 0.85, letterSpacing: 0.5 }}>Admin Dashboard</div>
                        <h1 style={{ margin: '2px 0 6px', fontSize: 24, fontWeight: 700, color: '#fff' }}>
                            Hỗ trợ / Khiếu nại
                        </h1>
                       
                    </div>
                   
                </div>
            </div>

            <div style={gridStyle}>
                {summaryCards.map((card, idx) => (
                    <div
                        key={idx}
                        style={{
                            background: card.bg,
                            borderRadius: 12,
                            padding: 16,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.04)'
                        }}
                    >
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{card.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: card.color }}>{card.value}</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#4b5563' }}>{card.highlight}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div
                style={{
                    margin: '18px 0',
                    background: '#fff',
                    borderRadius: 12,
                    padding: 14,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap'
                }}
            >
                <Space size="middle" wrap>
                    <Select
                        placeholder="Lọc theo trạng thái"
                        style={{ width: 220 }}
                        allowClear
                        value={filters.status || undefined}
                        onChange={(value) => handleFilterChange('status', value || '')}
                    >
                        {Object.keys(statusLabels).map(key => (
                            <Option key={key} value={key}>
                                {statusLabels[key].label}
                            </Option>
                        ))}
                    </Select>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Tag color="orange">Chờ duyệt: {statusCounts.PENDING || 0}</Tag>
                        <Tag color="blue">Chấp nhận: {statusCounts.APPROVED || 0}</Tag>
                        <Tag color="green">Hoàn tất: {statusCounts.COMPLETED || 0}</Tag>
                    </div>
                </Space>
                <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                    Làm mới
                </Button>
            </div>

            {/* Table */}
            <Loading isPending={isPending}>
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="_id"
                    pagination={{
                        total,
                        pageSize: 50,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} yêu cầu`,
                        pageSizeOptions: ['20', '50', '100']
                    }}
                    scroll={{ x: 1200 }}
                    onRow={(record) => {
                        const bg =
                            record.status === 'PENDING'
                                ? palette.orange
                                : record.status === 'APPROVED'
                                ? palette.blue
                                : record.status === 'REJECTED'
                                ? palette.red
                                : record.status === 'COMPLETED'
                                ? palette.green
                                : '#fff';
                        return { style: { background: bg } };
                    }}
                    style={{ background: '#fff', borderRadius: 12, padding: 4 }}
                />
            </Loading>

            {/* Detail Modal */}
            <Modal
                title="Chi tiết yêu cầu hỗ trợ"
                open={isDetailModalOpen}
                onCancel={() => {
                    setIsDetailModalOpen(false);
                    setIsStatusModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
                width={800}
            >
                {selectedRequest && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                marginBottom: 12
                            }}
                        >
                            <Tag color="blue" style={{ fontSize: 13, padding: '6px 10px' }}>
                                Mã: {selectedRequest.requestCode}
                            </Tag>
                            <Tag color="gold" style={{ fontSize: 13, padding: '6px 10px' }}>
                                {requestTypeLabels[selectedRequest.requestType] || selectedRequest.requestType}
                            </Tag>
                            <Tag color={statusLabels[selectedRequest.status]?.color || 'default'} style={{ fontSize: 13, padding: '6px 10px' }}>
                                {statusLabels[selectedRequest.status]?.label || selectedRequest.status}
                            </Tag>
                            <span style={{ color: '#6b7280', fontSize: 12 }}>
                                Tạo lúc {dayjs(selectedRequest.createdAt).format('DD/MM/YYYY HH:mm')}
                            </span>
                        </div>

                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Mã yêu cầu">
                                <Tag color="blue">{selectedRequest.requestCode}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã đơn hàng">
                                {selectedRequest.orderId?._id?.toString().slice(-8) || selectedRequest.orderId?._id || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khách hàng">
                                <div>
                                    <div><strong>{selectedRequest.userId?.name || 'N/A'}</strong></div>
                                    <div style={{ color: '#999', fontSize: 12 }}>
                                        {selectedRequest.userId?.email || 'N/A'}
                                    </div>
                                    <div style={{ color: '#999', fontSize: 12 }}>
                                        {selectedRequest.userId?.phone || 'N/A'}
                                    </div>
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại yêu cầu">
                                <Tag>{requestTypeLabels[selectedRequest.requestType] || selectedRequest.requestType}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Lý do">
                                {reasonLabels[selectedRequest.reason] || selectedRequest.reason}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ghi chú chi tiết">
                                {selectedRequest.description}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {(() => {
                                    const statusInfo = statusLabels[selectedRequest.status] || { label: selectedRequest.status, color: 'default' };
                                    return (
                                        <Badge
                                            status={statusInfo.color === 'green' ? 'success' : 
                                                   statusInfo.color === 'red' ? 'error' : 
                                                   statusInfo.color === 'blue' ? 'processing' : 'warning'}
                                            text={statusInfo.label}
                                        />
                                    );
                                })()}
                            </Descriptions.Item>
                            {selectedRequest.images && selectedRequest.images.length > 0 && (
                                <Descriptions.Item label="Ảnh chứng minh">
                                    <Image.PreviewGroup>
                                        <Space>
                                            {selectedRequest.images.map((img, index) => (
                                                <Image
                                                    key={index}
                                                    src={img}
                                                    width={100}
                                                    height={100}
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            ))}
                                        </Space>
                                    </Image.PreviewGroup>
                                </Descriptions.Item>
                            )}
                            {selectedRequest.returnInstructions && (
                                <Descriptions.Item label="Hướng dẫn trả hàng">
                                    <div style={{ 
                                        background: '#e6f7ff', 
                                        padding: '12px', 
                                        borderRadius: '4px',
                                        border: '1px solid #91d5ff'
                                    }}>
                                        {selectedRequest.returnInstructions}
                                    </div>
                                </Descriptions.Item>
                            )}
                            {selectedRequest.adminNote && (
                                <Descriptions.Item label="Ghi chú nội bộ / Phản hồi">
                                    {selectedRequest.adminNote}
                                </Descriptions.Item>
                            )}
                            {selectedRequest.isRefunded && (
                                <Descriptions.Item label="Đã hoàn tiền">
                                    <Tag color="green">Đã hoàn tiền</Tag>
                                    {selectedRequest.refundedAt && (
                                        <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }}>
                                            ({dayjs(selectedRequest.refundedAt).format('DD/MM/YYYY HH:mm')})
                                        </span>
                                    )}
                                </Descriptions.Item>
                            )}
                            {selectedRequest.handledBy && (
                                <Descriptions.Item label="Người xử lý">
                                    {selectedRequest.handledBy?.name || 'N/A'}
                                </Descriptions.Item>
                            )}
                            {selectedRequest.handledAt && (
                                <Descriptions.Item label="Ngày xử lý">
                                    {dayjs(selectedRequest.handledAt).format('DD/MM/YYYY HH:mm')}
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Ngày tạo">
                                {dayjs(selectedRequest.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Order Info */}
                        {selectedRequest.orderId && (
                            <div style={{ marginTop: '24px' }}>
                                <h3>Thông tin đơn hàng</h3>
                                <Descriptions column={1} bordered>
                                    <Descriptions.Item label="Tổng tiền">
                                        {selectedRequest.orderId.totalPrice?.toLocaleString('vi-VN')} đ
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái đơn">
                                        {selectedRequest.orderId.status}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        )}

                        {/* Status Update Form */}
                        <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                            <h3>Cập nhật trạng thái</h3>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleStatusChange}
                            >
                                <Form.Item
                                    name="status"
                                    label="Trạng thái"
                                    rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                                >
                                    <Select
                                        onChange={(value) => {
                                            // Reset returnInstructions khi chọn REJECTED hoặc PENDING
                                            if (value !== 'APPROVED') {
                                                form.setFieldsValue({ returnInstructions: '' });
                                            }
                                            // Force form re-render để cập nhật label và validation
                                            form.validateFields(['adminNote', 'returnInstructions']);
                                        }}
                                    >
                                        {Object.keys(statusLabels).map(key => (
                                            <Option key={key} value={key}>
                                                {statusLabels[key].label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {/* Chỉ hiển thị hướng dẫn trả hàng khi chọn APPROVED */}
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
                                >
                                    {({ getFieldValue }) => 
                                        getFieldValue('status') === 'APPROVED' ? (
                                            <Form.Item
                                                name="returnInstructions"
                                                label="Hướng dẫn trả hàng"
                                                rules={[{ required: true, message: 'Vui lòng nhập hướng dẫn trả hàng' }]}
                                            >
                                                <TextArea
                                                    rows={3}
                                                    placeholder="Ví dụ: Vui lòng đóng gói hàng cẩn thận và gửi về địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM. Mã vận đơn: ABC123"
                                                />
                                            </Form.Item>
                                        ) : null
                                    }
                                </Form.Item>

                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
                                >
                                    {({ getFieldValue }) => (
                                        <Form.Item
                                            name="adminNote"
                                            label={getFieldValue('status') === 'REJECTED' 
                                                ? 'Lý do từ chối / Phản hồi cho khách' 
                                                : 'Ghi chú nội bộ / Phản hồi cho khách'}
                                            rules={getFieldValue('status') === 'REJECTED' 
                                                ? [{ required: true, message: 'Vui lòng nhập lý do từ chối' }]
                                                : []}
                                        >
                                            <TextArea
                                                rows={4}
                                                placeholder={
                                                    getFieldValue('status') === 'REJECTED'
                                                        ? 'Vui lòng giải thích lý do từ chối yêu cầu trả hàng...'
                                                        : 'Ghi chú nội bộ hoặc phản hồi cho khách hàng'
                                                }
                                            />
                                        </Form.Item>
                                    )}
                                </Form.Item>

                                <Form.Item>
                                    <Space style={{ width: '100%' }}>
                                        <Button type="primary" htmlType="submit" style={{ flex: 1 }}>
                                            Cập nhật trạng thái
                                        </Button>
                                        {selectedRequest.status === 'APPROVED' && !selectedRequest.isRefunded && (
                                            <Button
                                                type="default"
                                                icon={<DollarOutlined />}
                                                onClick={() => setIsRefundModalOpen(true)}
                                                style={{ background: '#52c41a', color: 'white', border: 'none' }}
                                            >
                                                Hoàn tiền
                                            </Button>
                                        )}
                                    </Space>
                                </Form.Item>
                            </Form>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Refund Modal */}
            <Modal
                title="Hoàn tiền"
                open={isRefundModalOpen}
                onCancel={() => {
                    setIsRefundModalOpen(false);
                    refundForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={refundForm}
                    layout="vertical"
                    onFinish={(values) => {
                        handleCompleteRefund(values.productCondition);
                        setIsRefundModalOpen(false);
                        refundForm.resetFields();
                    }}
                >
                    <Form.Item
                        name="productCondition"
                        label="Tình trạng hàng khi nhận về"
                        rules={[{ required: true, message: 'Vui lòng chọn tình trạng hàng' }]}
                    >
                        <Radio.Group>
                            <Radio value="NEW">
                                <div>
                                    <div style={{ fontWeight: 500 }}>Hàng còn mới</div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Cập nhật tồn kho +1 và giảm số lượng đã bán
                                    </div>
                                </div>
                            </Radio>
                            <Radio value="DAMAGED_IN_TRANSIT" style={{ marginTop: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: 500 }}>Hàng hư hỏng nhẹ trong quá trình vận chuyển</div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Cập nhật tồn kho +1 nhưng không giảm số lượng đã bán
                                    </div>
                                </div>
                            </Radio>
                            <Radio value="DEFECTIVE" style={{ marginTop: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: 500 }}>Hàng lỗi</div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Không cập nhật tồn kho
                                    </div>
                                </div>
                            </Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={() => {
                                setIsRefundModalOpen(false);
                                refundForm.resetFields();
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Xác nhận hoàn tiền
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminSupport;

