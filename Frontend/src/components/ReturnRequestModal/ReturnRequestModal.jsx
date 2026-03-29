import React, { useState } from 'react';
import { Modal, Form, Select, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import * as SupportRequestService from '../../services/SupportRequestService';
import { useSelector } from 'react-redux';

const { Option } = Select;
const { TextArea } = Input;

const ReturnRequestModal = ({ visible, onCancel, orderId, onSuccess, onSwitchTab }) => {
    const [form] = Form.useForm();
    const user = useSelector((state) => state?.user);
    const [fileList, setFileList] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            
            // Upload images if any
            const images = [];
            if (fileList.length > 0) {
                // In a real app, you would upload images to a server first
                // For now, we'll use base64 or image URLs
                for (const file of fileList) {
                    if (file.originFileObj) {
                        const reader = new FileReader();
                        const imageUrl = await new Promise((resolve) => {
                            reader.onload = (e) => resolve(e.target.result);
                            reader.readAsDataURL(file.originFileObj);
                        });
                        images.push(imageUrl);
                    } else if (file.url) {
                        images.push(file.url);
                    }
                }
            }

            const data = {
                orderId,
                requestType: values.requestType,
                reason: values.reason,
                description: values.description,
                images
            };

            const res = await SupportRequestService.createSupportRequest(
                data,
                user?.access_token
            );

            if (res?.status === 'OK') {
                message.success('Yêu cầu của bạn đã được gửi thành công!');
                form.resetFields();
                setFileList([]);
                onSuccess?.();
                onCancel();
                // Chuyển sang tab trả hàng/hoàn hàng
                if (onSwitchTab) {
                    setTimeout(() => {
                        onSwitchTab('returned');
                    }, 300);
                }
            } else {
                message.error(res?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
            }
        } catch (error) {
            console.error('Error creating support request:', error);
            message.error('Có lỗi xảy ra khi gửi yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setFileList([]);
        onCancel();
    };

    const uploadProps = {
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Chỉ có thể upload file ảnh!');
                return false;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Ảnh phải nhỏ hơn 5MB!');
                return false;
            }
            return false; // Prevent auto upload
        },
        fileList,
        onChange: ({ fileList: newFileList }) => {
            setFileList(newFileList);
        },
        maxCount: 3
    };

    return (
        <Modal
            title="Yêu cầu trả hàng / Khiếu nại"
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    requestType: 'RETURN_REFUND'
                }}
            >
                <Form.Item
                    name="requestType"
                    label="Loại yêu cầu"
                    rules={[{ required: true, message: 'Vui lòng chọn loại yêu cầu' }]}
                >
                    <Select placeholder="Chọn loại yêu cầu">
                        <Option value="RETURN_REFUND">Trả hàng / Hoàn tiền</Option>
                        <Option value="OTHER_COMPLAINT">Khiếu nại khác</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="reason"
                    label="Lý do"
                    rules={[{ required: true, message: 'Vui lòng chọn lý do' }]}
                >
                    <Select placeholder="Chọn lý do">
                        <Option value="WRONG_DESCRIPTION">Không đúng mô tả</Option>
                        <Option value="DEFECTIVE_PRODUCT">Hàng lỗi</Option>
                        <Option value="MISSING_ITEMS">Thiếu hàng</Option>
                        <Option value="SHIPPER_ATTITUDE">Thái độ shipper</Option>
                        <Option value="OTHER">Khác</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Ghi chú chi tiết"
                    rules={[{ required: true, message: 'Vui lòng nhập ghi chú chi tiết' }]}
                >
                    <TextArea
                        rows={4}
                        placeholder="Mô tả chi tiết vấn đề của bạn..."
                    />
                </Form.Item>

                <Form.Item
                    label="Ảnh chứng minh (tùy chọn, tối đa 3 ảnh)"
                >
                    <Upload {...uploadProps} listType="picture-card">
                        {fileList.length < 3 && (
                            <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        )}
                    </Upload>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                    >
                        Gửi yêu cầu
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ReturnRequestModal;

