import React, { useState } from 'react';
import { Card, Tag, Rate, Button, Input, Select, Space, Modal, Form, Image, Statistic, Row, Col, Avatar, message, Tooltip, Popconfirm, Checkbox } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, MessageOutlined, CheckOutlined, SearchOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { WrapperHeader } from '../AdminCategory/style';
import { useSelector } from 'react-redux';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as ReviewService from '../../services/ReviewService';
import Loading from '../LoadingComponent/Loading';
import TableComponent from '../TableComponent/TableComponent';

const { TextArea } = Input;
const { Option } = Select;

const AdminReview = () => {
    const user = useSelector((state) => state?.user);
    const [filters, setFilters] = useState({
        isActive: undefined,
        rating: undefined,
        search: '',
        needsModeration: undefined,
        onlyWithImages: undefined // helper filter to quickly show reviews with photos
    });
    const [page, setPage] = useState(1);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyModalVisible, setReplyModalVisible] = useState(false);
    const [replyForm] = Form.useForm();

    // Fetch all reviews
    const { data: reviewsData, isPending, refetch } = useQuery({
        queryKey: ['admin-reviews', page, filters],
        queryFn: () => ReviewService.getAllReviews(page, 20, filters, user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch statistics
    const { data: statsData } = useQuery({
        queryKey: ['review-statistics'],
        queryFn: () => ReviewService.getReviewStatistics(user?.access_token),
        enabled: !!user?.access_token
    });

    // Toggle review status
    const toggleStatusMutation = useMutation({
        mutationFn: ({ reviewId, isActive }) => 
            ReviewService.toggleReviewStatus(reviewId, isActive, user?.access_token),
        onSuccess: () => {
            message.success('Cập nhật trạng thái thành công');
            refetch();
        },
        onError: (error) => {
            message.error(error?.response?.data?.message || 'Cập nhật thất bại');
        }
    });

    // Reply review
    const replyMutation = useMutation({
        mutationFn: ({ reviewId, content }) => 
            ReviewService.replyReview(reviewId, content, user?.access_token),
        onSuccess: () => {
            message.success('Trả lời review thành công');
            setReplyModalVisible(false);
            replyForm.resetFields();
            refetch();
        },
        onError: (error) => {
            message.error(error?.response?.data?.message || 'Trả lời thất bại');
        }
    });

    // Approve review
    const approveMutation = useMutation({
        mutationFn: (reviewId) => 
            ReviewService.approveReview(reviewId, user?.access_token),
        onSuccess: () => {
            message.success('Duyệt review thành công');
            refetch();
        },
        onError: (error) => {
            message.error(error?.response?.data?.message || 'Duyệt thất bại');
        }
    });

    const handleToggleStatus = (review, isActive) => {
        toggleStatusMutation.mutate({ reviewId: review._id, isActive });
    };

    const handleReply = (review) => {
        setSelectedReview(review);
        replyForm.setFieldsValue({ content: review.adminReply?.content || '' });
        setReplyModalVisible(true);
    };

    const handleSubmitReply = (values) => {
        replyMutation.mutate({
            reviewId: selectedReview._id,
            content: values.content
        });
    };

    const handleApprove = (review) => {
        Modal.confirm({
            title: 'Duyệt review',
            content: 'Bạn có chắc muốn duyệt review này?',
            onOk: () => approveMutation.mutate(review._id)
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // small helper to truncate long review text for compact table rows
    const truncate = (text = '', n = 140) => {
        if (!text) return '(Không có nhận xét)';
        return text.length > n ? `${text.slice(0, n)}...` : text;
    };

    const columns = [ 
        {
            title: 'STT',
            key: 'index',
            render: (_, __, index) => (page - 1) * 20 + index + 1,
            width: 60
        },
        {
            title: 'Khách hàng',
            key: 'user',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar src={record.user?.avatar} icon={<UserOutlined />} size={36} />
                    <div style={{ minWidth: 120 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{record.user?.name || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                            <Tooltip title={record.user?.email}>{record.user?.email}</Tooltip>
                        </div>
                    </div>
                </div>
            ),
            width: 170
        },
        {
            title: 'Sản phẩm',
            key: 'product',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                        src={record.product?.image}
                        alt={record.product?.name}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div style={{ maxWidth: 220 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.product?.name}>{record.product?.name || 'N/A'}</Tooltip>
                        </div>
                        {record.variation && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                {record.variation.size && <Tag size="small">Size: {record.variation.size}</Tag>}
                                {record.variation.color && <Tag size="small">Màu: {record.variation.color}</Tag>}
                            </div>
                        )}
                    </div>
                </div>
            ),
            width: 260
        },
        {
            title: 'Đánh giá',
            key: 'rating',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 84 }}>
                        <Rate disabled value={record.rating} style={{ fontSize: 14 }} />
                        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{record.rating}/5</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Tooltip title={record.content || '(Không có nhận xét)'}>
                            <div style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>
                                {truncate(record.content, 160)}
                            </div>
                        </Tooltip>
                    </div>
                </div>
            ),
            width: 420
        },
        {
            title: 'Ảnh',
            key: 'images',
            render: (_, record) => (
                record.images && record.images.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Image.PreviewGroup>
                            {record.images.slice(0, 3).map((img, idx) => (
                                <Image
                                    key={idx}
                                    src={img}
                                    width={56}
                                    height={56}
                                    style={{ objectFit: 'cover', borderRadius: 6 }}
                                />
                            ))}
                        </Image.PreviewGroup>
                        {record.images.length > 3 && (
                            <div style={{ fontSize: 12, color: '#999' }}>+{record.images.length - 3}</div>
                        )}
                    </div>
                ) : (
                    <div style={{ fontSize: 12, color: '#999' }}>-</div>
                )
            ),
            width: 140
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: 'column' }}>
                    <div>
                        {record.needsModeration ? (
                            <Tag color="orange" style={{ fontWeight: 700 }}>Cần kiểm duyệt</Tag>
                        ) : record.isActive ? (
                            <Tag color="green" style={{ fontWeight: 700 }}>Hiển thị</Tag>
                        ) : (
                            <Tag color="red" style={{ fontWeight: 700 }}>Đã ẩn</Tag>
                        )}
                    </div>
                    <div>
                        {record.adminReply && (
                            <Tag color="blue">Đã trả lời</Tag>
                        )}
                    </div>
                </div>
            ),
            width: 160
        },
        {
            title: 'Thời gian',
            key: 'createdAt',
            render: (_, record) => formatDate(record.createdAt),
            width: 150
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <Popconfirm
                        title={record.isActive ? 'Bạn có chắc muốn ẩn đánh giá này?' : 'Bạn có chắc muốn hiện đánh giá này?'}
                        onConfirm={() => handleToggleStatus(record, !record.isActive)}
                        okText="Có"
                        cancelText="Hủy"
                    >
                        <Button
                            size="small"
                            icon={record.isActive ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            danger={!record.isActive ? false : true}
                            loading={toggleStatusMutation.isPending}
                        >
                            {record.isActive ? 'Ẩn' : 'Hiện'}
                        </Button>
                    </Popconfirm>

                    <Tooltip title="Trả lời nhanh">
                        <Button
                            size="small"
                            icon={<MessageOutlined />}
                            type="primary"
                            onClick={() => handleReply(record)}
                        >
                            Trả lời
                        </Button>
                    </Tooltip>

                    {record.needsModeration && (
                        <Button
                            size="small"
                            type="default"
                            icon={<CheckOutlined />}
                            onClick={() => handleApprove(record)}
                            loading={approveMutation.isPending}
                        >
                            Duyệt
                        </Button>
                    )}
                </Space>
            ),
            width: 170
        }
    ];

    const stats = statsData?.data || {}; 

    return (
        <div>
            <WrapperHeader>Quản lý đánh giá</WrapperHeader>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 20 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Tổng đánh giá"
                            value={stats.total || 0}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Đang hiển thị"
                            value={stats.active || 0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Đã ẩn"
                            value={stats.hidden || 0}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Cần kiểm duyệt"
                            value={stats.needsModeration || 0}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters - compact & scannable */}
            <Card style={{ marginBottom: 20 }}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap>
                        <Input.Search
                            placeholder="Tìm theo nội dung đánh giá..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            onSearch={(val) => setFilters({ ...filters, search: val })}
                            defaultValue={filters.search}
                            style={{ width: 320 }}
                        />

                        <Select
                            placeholder="Trạng thái"
                            value={filters.isActive}
                            onChange={(value) => setFilters({ ...filters, isActive: value })}
                            style={{ width: 150 }}
                            allowClear
                        >
                            <Option value={true}>Đang hiển thị</Option>
                            <Option value={false}>Đã ẩn</Option>
                        </Select>

                        <Select
                            placeholder="Số sao"
                            value={filters.rating}
                            onChange={(value) => setFilters({ ...filters, rating: value })}
                            style={{ width: 120 }}
                            allowClear
                        >
                            <Option value={5}>5 sao</Option>
                            <Option value={4}>4 sao</Option>
                            <Option value={3}>3 sao</Option>
                            <Option value={2}>2 sao</Option>
                            <Option value={1}>1 sao</Option>
                        </Select>

                        <Select
                            placeholder="Kiểm duyệt"
                            value={filters.needsModeration}
                            onChange={(value) => setFilters({ ...filters, needsModeration: value })}
                            style={{ width: 150 }}
                            allowClear
                        >
                            <Option value={true}>Cần kiểm duyệt</Option>
                            <Option value={false}>Đã duyệt</Option>
                        </Select>

                        <Checkbox
                            checked={!!filters.onlyWithImages}
                            onChange={(e) => setFilters({ ...filters, onlyWithImages: e.target.checked ? true : undefined })}
                        >
                            Chỉ có ảnh
                        </Checkbox>
                    </Space>

                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                setFilters({ isActive: undefined, rating: undefined, search: '', needsModeration: undefined, onlyWithImages: undefined });
                                refetch();
                            }}
                        >
                            Làm mới
                        </Button>
                    </Space>
                </Space>
            </Card>

            {/* Reviews Table */}
            <Card>
                <Loading isPending={isPending}>
                    {/* client-side filtering for quick UI-only filters (no backend change needed) */}
                    {(() => {
                        const raw = reviewsData?.data?.reviews || [];
                        const displayData = raw.filter((r) => (filters.onlyWithImages ? r.images && r.images.length > 0 : true));

                        return (
                            <TableComponent
                                columns={columns}
                                data={displayData}
                                isPending={isPending}
                                rowKey="_id"
                                size="middle"
                                pagination={{
                                    current: page,
                                    total: displayData.length || reviewsData?.data?.pagination?.total || 0,
                                    pageSize: 20,
                                    onChange: setPage
                                }}
                            />
                        );
                    })()} 
                </Loading>
            </Card>

            {/* Reply Modal */}
            <Modal
                title="Trả lời đánh giá"
                open={replyModalVisible}
                onCancel={() => {
                    setReplyModalVisible(false);
                    setSelectedReview(null);
                    replyForm.resetFields();
                }}
                footer={null}
                width={640}
            >
                {selectedReview && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                        <div style={{ marginBottom: 8 }}>
                            <strong>Khách hàng:</strong> {selectedReview.user?.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Rate disabled value={selectedReview.rating} />
                            <div style={{ fontSize: 13, color: '#666' }}>{selectedReview.rating}/5</div>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                            <strong>Nội dung:</strong>
                            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>{selectedReview.content || '(Không có nhận xét)'}</div>
                        </div>

                        {selectedReview.images && selectedReview.images.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <strong>Ảnh:</strong>
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    <Image.PreviewGroup>
                                        {selectedReview.images.map((img, idx) => (
                                            <Image key={idx} src={img} width={88} height={88} style={{ objectFit: 'cover', borderRadius: 6 }} />
                                        ))}
                                    </Image.PreviewGroup>
                                </div>
                            </div>
                        )}

                    </div>
                )}
                <Form form={replyForm} onFinish={handleSubmitReply} layout="vertical">
                    <Form.Item
                        name="content"
                        label="Phản hồi của bạn"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung phản hồi' }]}
                    >
                        <TextArea rows={4} placeholder="Nhập phản hồi cho khách hàng..." />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button onClick={() => setReplyModalVisible(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={replyMutation.isPending}>
                                Gửi phản hồi
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminReview;

