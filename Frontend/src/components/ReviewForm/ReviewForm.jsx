import React, { useState, useEffect } from 'react';
import { Modal, Rate, Input, Upload, Button, Form, message, Tag, Checkbox, Space } from 'antd';
import { UploadOutlined, StarFilled, VideoCameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import * as ReviewService from '../../services/ReviewService';
import { useMutationHooks } from '../../hooks/useMutationHook';
import { getBase64 } from '../../utils';
import styled from 'styled-components';

const { TextArea } = Input;

const ReviewTagsWrapper = styled.div`
    margin-top: 16px;
    .tags-label {
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
    }
    .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
`;

const VideoUploadWrapper = styled.div`
    margin-top: 16px;
    .video-preview {
        margin-top: 8px;
        position: relative;
        display: inline-block;
        video {
            max-width: 200px;
            max-height: 200px;
            border-radius: 4px;
        }
        .remove-video {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff4d4f;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 2px solid white;
        }
    }
`;

const ReviewForm = ({ orderItem, orderId, onSuccess, visible, onCancel }) => {
    const [form] = Form.useForm();
    const user = useSelector((state) => state?.user);
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(5);
    const [fileList, setFileList] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);

    const reviewTags = ['Đúng mô tả', 'Đóng gói đẹp', 'Giao hàng nhanh'];

    // Lấy productId từ orderItem
    const productId = orderItem?.productId || orderItem?.product;

    const mutation = useMutationHooks(
        (data) => ReviewService.createReview(data, user?.access_token)
    );

    const { isPending, isSuccess, isError, data } = mutation;

    useEffect(() => {
        if (isSuccess && data?.status === 'OK') {
            message.success('Đánh giá thành công!');
            form.resetFields();
            setFileList([]);
            setRating(5);
            setSelectedTags([]);
            setVideoFile(null);
            setVideoPreview(null);
            
            // Invalidate cache của product reviews để hiển thị review mới ngay lập tức
            if (productId) {
                queryClient.invalidateQueries({ 
                    queryKey: ['product-reviews', productId] 
                });
            }
            
            // Invalidate cache của product details để cập nhật rating
            queryClient.invalidateQueries({ 
                queryKey: ['product-details', productId] 
            });
            
            onSuccess && onSuccess();
        } else if (isError || (data?.status === 'ERR')) {
            message.error(data?.message || 'Đánh giá thất bại!');
        }
    }, [isSuccess, isError, data, queryClient, productId, onSuccess]);

    useEffect(() => {
        if (!visible) {
            // Reset form when modal closes
            form.resetFields();
            setFileList([]);
            setRating(5);
            setSelectedTags([]);
            setVideoFile(null);
            setVideoPreview(null);
        }
    }, [visible, form]);

    const handleSubmit = async (values) => {
        // Validate rating (bắt buộc >= 1 sao)
        if (!rating || rating < 1) {
            message.error('Vui lòng chọn ít nhất 1 sao');
            return;
        }

        // Validate không được gửi rỗng (phải có rating)
        if (!rating) {
            message.error('Vui lòng chọn số sao đánh giá');
            return;
        }

        const images = fileList.map(file => {
            if (file.url) return file.url;
            if (file.preview) return file.preview;
            return null;
        }).filter(Boolean);

        // Validate images (tối đa 6 ảnh)
        if (images.length > 6) {
            message.error('Tối đa 6 ảnh được phép');
            return;
        }

        const reviewData = {
            product: orderItem.productId || orderItem.product,
            order: orderId,
            rating: rating,
            content: values.content || '',
            images: images,
            video: videoPreview || null,
            tags: selectedTags,
            variation: orderItem.variation || {}
        };

        mutation.mutate(reviewData);
    };

    const handleUploadChange = async ({ fileList: newFileList }) => {
        const updatedFileList = await Promise.all(
            newFileList.map(async (file) => {
                if (!file.url && !file.preview) {
                    file.preview = await getBase64(file.originFileObj);
                }
                return file;
            })
        );
        setFileList(updatedFileList);
    };

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Chỉ có thể upload ảnh!');
            return false;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Ảnh phải nhỏ hơn 5MB!');
            return false;
        }
        return false; // Prevent auto upload
    };

    const handleTagChange = (tag, checked) => {
        if (checked) {
            setSelectedTags([...selectedTags, tag]);
        } else {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate video
        if (!file.type.startsWith('video/')) {
            message.error('Chỉ có thể upload video!');
            return;
        }

        const isLt50M = file.size / 1024 / 1024 < 50;
        if (!isLt50M) {
            message.error('Video phải nhỏ hơn 50MB!');
            return;
        }

        setVideoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setVideoPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveVideo = () => {
        setVideoFile(null);
        setVideoPreview(null);
    };

    return (
        <Modal
            title={<div style={{ fontSize: 20, fontWeight: 700 }}>Đánh giá sản phẩm</div>}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={600}
        >
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <img
                        src={orderItem.image}
                        alt={orderItem.productName}
                        style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 4,
                            marginRight: 12
                        }}
                    />
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                            {orderItem.productName}
                        </div>
                        {orderItem.variation && (
                            <div style={{ fontSize: 12, color: '#666' }}>
                                {orderItem.variation.size && <Tag>Size: {orderItem.variation.size}</Tag>}
                                {orderItem.variation.color && <Tag>Màu: {orderItem.variation.color}</Tag>}
                                {orderItem.variation.material && <Tag>Chất liệu: {orderItem.variation.material}</Tag>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Form form={form} onFinish={handleSubmit} layout="vertical">
                <Form.Item
                    label="Đánh giá của bạn"
                    required
                >
                    <Rate
                        value={rating}
                        onChange={setRating}
                        allowHalf={false}
                        style={{ fontSize: 24 }}
                    />
                    <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                        {rating === 5 && '⭐⭐⭐⭐⭐ Rất hài lòng'}
                        {rating === 4 && '⭐⭐⭐⭐ Hài lòng'}
                        {rating === 3 && '⭐⭐⭐ Bình thường'}
                        {rating === 2 && '⭐⭐ Không hài lòng'}
                        {rating === 1 && '⭐ Rất không hài lòng'}
                    </div>
                </Form.Item>

                <Form.Item
                    label="Nhận xét (tùy chọn)"
                    name="content"
                >
                    <TextArea
                        rows={4}
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                <Form.Item
                    label="Ảnh đánh giá (tùy chọn)"
                >
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={handleUploadChange}
                        beforeUpload={beforeUpload}
                        maxCount={6}
                        accept="image/*"
                    >
                        {fileList.length < 6 && (
                            <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        )}
                    </Upload>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                        Tối đa 6 ảnh, mỗi ảnh &lt; 5MB
                    </div>
                </Form.Item>

                <Form.Item
                    label="Video đánh giá (tùy chọn)"
                >
                    <VideoUploadWrapper>
                        {!videoPreview ? (
                            <div>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoChange}
                                    style={{ display: 'none' }}
                                    id="video-upload"
                                />
                                <label htmlFor="video-upload">
                                    <Button icon={<VideoCameraOutlined />} onClick={() => document.getElementById('video-upload').click()}>
                                        Chọn video
                                    </Button>
                                </label>
                                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                                    Video tùy chọn, tối đa 50MB
                                </div>
                            </div>
                        ) : (
                            <div className="video-preview">
                                <video src={videoPreview} controls />
                                <div className="remove-video" onClick={handleRemoveVideo}>
                                    <DeleteOutlined />
                                </div>
                            </div>
                        )}
                    </VideoUploadWrapper>
                </Form.Item>

                <Form.Item
                    label="Tags đánh giá (tùy chọn)"
                >
                    <ReviewTagsWrapper>
                        <div className="tags-container">
                            {reviewTags.map(tag => (
                                <Checkbox
                                    key={tag}
                                    checked={selectedTags.includes(tag)}
                                    onChange={(e) => handleTagChange(tag, e.target.checked)}
                                >
                                    {tag}
                                </Checkbox>
                            ))}
                        </div>
                    </ReviewTagsWrapper>
                </Form.Item>

                <Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={onCancel}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isPending}
                        >
                            Gửi đánh giá
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ReviewForm;

