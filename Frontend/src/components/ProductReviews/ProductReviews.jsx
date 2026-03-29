import React, { useState } from 'react';
import { Card, Rate, Avatar, Tag, Image, Pagination, Select, Empty, Divider } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import * as ReviewService from '../../services/ReviewService';
import Loading from '../LoadingComponent/Loading';
import styled from 'styled-components';

const { Option } = Select;

const WrapperReviews = styled.div`
    margin-top: 20px;
    padding: 20px;
    background: #fff;
    border-radius: 4px;
`;

const WrapperReviewItem = styled.div`
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
        border-bottom: none;
    }
`;

const WrapperReviewHeader = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .user-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .user-name {
        font-weight: bold;
        margin-right: 8px;
        font-size: 14px;
        color: #222;
        line-height: 1.2;
    }
    
    .review-date {
        color: #777;
        font-size: 13px;
    }
`;

const WrapperReviewContent = styled.div`
    margin-bottom: 12px;
    color: #333;
    line-height: 1.6;
    font-size: 14px;

    @media (max-width: 768px) {
        font-size: 13px;
    }
`;

const WrapperReviewImages = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
`;

const WrapperVariation = styled.div`
    margin-top: 8px;
    font-size: 12px;
    color: #666;
`;

const WrapperStats = styled.div`
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 4px;
`;

const ProductReviews = ({ productId }) => {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [ratingFilter, setRatingFilter] = useState(null);

    // Validate và normalize ID
    const validProductId = productId?.trim() || null;

    const { data: reviewsData, isPending } = useQuery({
        queryKey: ['product-reviews', validProductId, page, limit, ratingFilter],
        queryFn: () => {
            // Double check để đảm bảo an toàn
            if (!validProductId) {
                throw new Error('Product ID is required');
            }
            return ReviewService.getProductReviews(validProductId, page, limit, ratingFilter);
        },
        enabled: !!validProductId,
        retry: false // Không retry nếu lỗi
    });

    const reviews = reviewsData?.data?.reviews || [];
    const pagination = reviewsData?.data?.pagination || {};
    const ratingStats = reviewsData?.data?.ratingStats || [];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate rating distribution
    const ratingDistribution = {};
    ratingStats.forEach(stat => {
        ratingDistribution[stat._id] = stat.count;
    });

    const totalReviews = pagination.total || 0;
    const averageRating = reviewsData?.data?.reviews?.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <WrapperReviews>
            <h3 style={{ marginBottom: 20, fontSize: 20, fontWeight: 700 }}>Đánh giá sản phẩm</h3>

            {totalReviews > 0 && (
                <WrapperStats>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>
                            {averageRating}
                        </div>
                        <div style={{ fontSize: 14, color: '#666' }}>
                            <Rate disabled value={parseFloat(averageRating)} allowHalf style={{ fontSize: '13px' }} />
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            {totalReviews} đánh giá
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>Phân bố đánh giá</div>
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <span style={{ width: 70, fontSize: 14, fontWeight: 600 }}>{star} sao</span>
                                <div style={{ flex: 1, height: 12, background: '#e9e9ea', borderRadius: 6, overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            width: `${totalReviews > 0 ? (ratingDistribution[star] || 0) / totalReviews * 100 : 0}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #1890ff 0%, #00c2ff 100%)'
                                        }}
                                    />
                                </div>
                                <span style={{ width: 48, fontSize: 13, color: '#666', fontWeight: 600, textAlign: 'right' }}>
                                    {ratingDistribution[star] || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                </WrapperStats>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                    Tất cả đánh giá ({totalReviews})
                </div>
                <Select
                    value={ratingFilter}
                    onChange={setRatingFilter}
                    placeholder="Lọc theo sao"
                    style={{ width: 150 }}
                    allowClear
                >
                    <Option value={5}>5 sao</Option>
                    <Option value={4}>4 sao</Option>
                    <Option value={3}>3 sao</Option>
                    <Option value={2}>2 sao</Option>
                    <Option value={1}>1 sao</Option>
                </Select>
            </div>

            <Loading isPending={isPending}>
                {reviews.length === 0 ? (
                    <Empty description="Chưa có đánh giá nào" />
                ) : (
                    <>
                        {reviews.map((review) => (
                            <WrapperReviewItem key={review._id}>
                                <WrapperReviewHeader>
                                    <div className="user-info">
                                        <Avatar
                                            src={review.user?.avatar}
                                            icon={<UserOutlined />}
                                            size={40}
                                        />
                                        <div>
                                            <span className="user-name">
                                                {review.user?.name || 'Khách hàng'}
                                            </span>
                                            <Rate
                                                disabled
                                                value={review.rating}
                                                style={{ fontSize: '13px', marginLeft: 8 }}
                                            />
                                        </div>
                                    </div>
                                    <div className="review-date">
                                        {formatDate(review.createdAt)}
                                    </div>
                                </WrapperReviewHeader>

                                {review.variation && (review.variation.size || review.variation.color || review.variation.material) && (
                                    <WrapperVariation>
                                        Đã mua: {' '}
                                        {review.variation.size && <Tag>Size: {review.variation.size}</Tag>}
                                        {review.variation.color && <Tag>Màu: {review.variation.color}</Tag>}
                                        {review.variation.material && <Tag>Chất liệu: {review.variation.material}</Tag>}
                                    </WrapperVariation>
                                )}

                                {review.content && (
                                    <WrapperReviewContent>
                                        {review.content}
                                    </WrapperReviewContent>
                                )}

                                {review.tags && review.tags.length > 0 && (
                                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                                        {review.tags.map((tag, idx) => (
                                            <Tag key={idx} color="blue" style={{ marginRight: 4 }}>
                                                {tag}
                                            </Tag>
                                        ))}
                                    </div>
                                )}

                                {review.images && review.images.length > 0 && (
                                    <WrapperReviewImages>
                                        <Image.PreviewGroup>
                                            {review.images.map((img, idx) => (
                                                <Image
                                                    key={idx}
                                                    src={img}
                                                    width={80}
                                                    height={80}
                                                    style={{ objectFit: 'cover', borderRadius: 4 }}
                                                />
                                            ))}
                                        </Image.PreviewGroup>
                                    </WrapperReviewImages>
                                )}

                                {review.video && (
                                    <div style={{ marginTop: 12 }}>
                                        <video
                                            src={review.video}
                                            controls
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '400px',
                                                borderRadius: 4
                                            }}
                                        />
                                    </div>
                                )}

                                {review.adminReply && (
                                    <div style={{
                                        marginTop: 12,
                                        padding: 12,
                                        background: '#f5f5f5',
                                        borderRadius: 4,
                                        borderLeft: '3px solid #1890ff'
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#1890ff', fontSize: 14 }}>
                                            Phản hồi từ cửa hàng:
                                        </div>
                                        <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                                            {review.adminReply.content}
                                        </div>
                                    </div>
                                )}
                            </WrapperReviewItem>
                        ))}

                        {pagination.pages > 1 && (
                            <div style={{ marginTop: 20, textAlign: 'center' }}>
                                <Pagination
                                    current={page}
                                    total={pagination.total}
                                    pageSize={limit}
                                    onChange={setPage}
                                    showSizeChanger={false}
                                />
                            </div>
                        )}
                    </>
                )}
            </Loading>
        </WrapperReviews>
    );
};

export default ProductReviews;

