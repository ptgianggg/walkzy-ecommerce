import React from 'react';
import { Card, Tag, Badge, Button, Image, Descriptions, Space } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { convertPrice } from '../../utils';
import { useNavigate } from 'react-router-dom';

const ReturnRequestList = ({ supportRequests, onViewOrder }) => {
    const navigate = useNavigate();

    // Status labels
    const statusLabels = {
        PENDING: { label: 'Chờ duyệt', color: '#faad14', bg: '#fff7e6' },
        APPROVED: { label: 'Đang xử lý trả', color: '#1890ff', bg: '#e6f7ff' },
        REJECTED: { label: 'Đã từ chối', color: '#ff4d4f', bg: '#fff1f0' },
        COMPLETED: { label: 'Hoàn tất (Đã hoàn tiền)', color: '#52c41a', bg: '#f6ffed' }
    };

    // Reason labels
    const reasonLabels = {
        WRONG_DESCRIPTION: 'Không đúng mô tả',
        DEFECTIVE_PRODUCT: 'Hàng lỗi',
        MISSING_ITEMS: 'Thiếu hàng',
        SHIPPER_ATTITUDE: 'Thái độ shipper',
        OTHER: 'Khác'
    };

    if (!supportRequests || supportRequests.length === 0) {
        return (
            <Card
                bordered={false}
                style={{ textAlign: 'center', padding: '32px', background: '#f9fbff', borderRadius: 12 }}
            >
                <div style={{ fontSize: 48, color: '#d6e4ff', lineHeight: 1 }}>↺</div>
                <p style={{ fontSize: '16px', color: '#8c8c8c', marginTop: 8 }}>Chưa có yêu cầu trả hàng / hoàn hàng</p>
            </Card>
        );
    }

    return (
        <div style={{ padding: '16px 0' }}>
            {supportRequests.map((request) => {
                const statusInfo = statusLabels[request.status] || { label: request.status, color: '#8c8c8c', bg: '#f5f5f5' };
                const order = request.orderId;
                
                return (
                    <Card
                        key={request._id}
                        style={{ marginBottom: '16px', borderRadius: 12, borderColor: '#edf1f7', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}
                        bodyStyle={{ padding: '12px 16px 16px' }}
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <Tag color="#2f54eb" style={{ fontSize: '13px', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>
                                        {request.requestCode}
                                    </Tag>
                                    <span style={{ fontSize: '13px', color: '#8c8c8c' }}>
                                        Đơn: {order?._id?.toString().slice(-8) || 'N/A'}
                                    </span>
                                </div>
                                <Tag
                                    style={{
                                        background: statusInfo.bg,
                                        color: statusInfo.color,
                                        borderColor: statusInfo.bg,
                                        borderRadius: 14,
                                        padding: '4px 10px',
                                        fontWeight: 700
                                    }}
                                >
                                    {statusInfo.label}
                                </Tag>
                            </div>
                        }
                        extra={
                            <Space>
                                {request.status === 'COMPLETED' && request.isRefunded && (
                                    <Tag color="green" style={{ fontSize: '12px', fontWeight: 600 }}>
                                        Đã hoàn tiền
                                    </Tag>
                                )}
                                {request.status === 'REJECTED' && (
                                    <Tag color="red" style={{ fontSize: '12px', fontWeight: 600 }}>
                                        Đã từ chối - Không thể gửi lại
                                    </Tag>
                                )}
                                {request.status === 'COMPLETED' && request.isRefunded && (
                                    <Button
                                        type="link"
                                        icon={<ReloadOutlined />}
                                        onClick={() => {
                                            if (order?.orderItems?.[0]?.product) {
                                                const productId = order.orderItems[0].product._id || order.orderItems[0].product;
                                                navigate(`/product-details/${productId}`)
                                            } else {
                                                navigate('/product')
                                            }
                                        }}
                                    >
                                        Mua lại
                                    </Button>
                                )}
                                <Button
                                    type="link"
                                    icon={<EyeOutlined />}
                                    onClick={() => onViewOrder?.(order?._id)}
                                >
                                    Xem đơn hàng
                                </Button>
                            </Space>
                        }
                    >
                        <Descriptions column={1} size="small" labelStyle={{ width: 180, color: '#6b7280', fontWeight: 600 }}>
                            <Descriptions.Item label="Lý do">
                                {reasonLabels[request.reason] || request.reason}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ghi chú">
                                {request.description}
                            </Descriptions.Item>
                            {request.images && request.images.length > 0 && (
                                <Descriptions.Item label="Ảnh chứng minh">
                                    <Image.PreviewGroup>
                                        <Space>
                                            {request.images.map((img, index) => (
                                                <Image
                                                    key={index}
                                                    src={img}
                                                    width={80}
                                                    height={80}
                                                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            ))}
                                        </Space>
                                    </Image.PreviewGroup>
                                </Descriptions.Item>
                            )}
                            {request.returnInstructions && (
                                <Descriptions.Item label="Hướng dẫn trả hàng">
                                    <div style={{ 
                                        background: '#e6f7ff', 
                                        padding: '12px', 
                                        borderRadius: '4px',
                                        border: '1px solid #91d5ff'
                                    }}>
                                        {request.returnInstructions}
                                    </div>
                                </Descriptions.Item>
                            )}
                            {request.adminNote && (
                                <Descriptions.Item label="Phản hồi từ admin">
                                    {request.adminNote}
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Ngày tạo">
                                {dayjs(request.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Descriptions.Item>
                            {request.handledAt && (
                                <Descriptions.Item label="Ngày xử lý">
                                    {dayjs(request.handledAt).format('DD/MM/YYYY HH:mm')}
                                </Descriptions.Item>
                            )}
                            {order && (
                                <Descriptions.Item label="Tổng tiền đơn hàng">
                                    <strong>{convertPrice(order.totalPrice || 0)}</strong>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>
                );
            })}
        </div>
    );
};

export default ReturnRequestList;

