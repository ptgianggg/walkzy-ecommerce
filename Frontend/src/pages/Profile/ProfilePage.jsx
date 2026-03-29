import React, { useEffect, useState } from 'react'
import { WrapperContentProfile, WrapperHeader, WrapperInput, WrapperLabel, WrapperUploadFile, WrapperSection, WrapperAvatarSection, WrapperButtonGroup } from './style'
import InputForm from '../../components/InputForm/InputForm'
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import * as UserService from '../../services/UserService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import Loading from '../../components/LoadingComponent/Loading'
import * as message from '../../components/Message/Message'
import { updateUser } from '../../redux/slides/userSlide'
import { Button, Upload, Card, Row, Col } from 'antd'
import { UploadOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons'
import { getBase64 } from '../../utils'
import AddressPicker from '../../components/AddressPicker/AddressPicker'

const ProfilePage = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector((state) => state.user)
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [province, setProvince] = useState('')
    const [district, setDistrict] = useState('')
    const [ward, setWard] = useState('')
    const [avatar, setAvatar] = useState('')

    const mutation = useMutationHooks(
        (data) => {
            const { id, access_token, ...rests } = data
            return UserService.updateUser(id, rests, access_token)
        }
    )

    const { data, isPending, isSuccess, isError } = mutation

    //set để khi load trang ko mất email đã đăng nhập
    useEffect(() => {
        setEmail(user?.email || '')
        setName(user?.name || '')
        setPhone(user?.phone || '')
        setAddress(user?.address || '')
        setCity(user?.city || '')
        setProvince(user?.province || '')
        setDistrict(user?.district || '')
        setWard(user?.ward || '')
        setAvatar(user?.avatar || '')
    }, [user])

    useEffect(() => {
        if (isSuccess) {
            message.success('Cập nhật thông tin thành công!')
            handleGetDetailsUser(user?.id, user?.access_token)
        } else if (isError) {
            message.error('Cập nhật thông tin thất bại!')
        }
    }, [isSuccess, isError])

    const handleGetDetailsUser = async (id, token) => {
        const res = await UserService.getDetailsUser(id, token)
        dispatch(updateUser({ ...res?.data, access_token: token }))
    }

    const handleOnchangeEmail = (value) => {
        setEmail(value)
    }

    const handleOnchangeName = (value) => {
        setName(value)
    }

    const handleOnchangePhone = (value) => {
        setPhone(value)
    }

    const handleOnchangeAvatar = async ({ fileList }) => {
        const file = fileList[0]
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setAvatar(file.preview)
    }

    const handleAddressChange = (addressData) => {
        setAddress(addressData.address || '')
        setCity(addressData.city || '')
        setProvince(addressData.province || '')
        setDistrict(addressData.district || '')
        setWard(addressData.ward || '')
    }

    const handleUpdate = () => {
        if (!name || !email || !phone) {
            message.error('Vui lòng điền đầy đủ thông tin bắt buộc!')
            return
        }
        mutation.mutate({
            id: user?.id,
            email,
            name,
            phone,
            address,
            city,
            province,
            district,
            ward,
            avatar,
            access_token: user?.access_token
        })
    }

    if (!user?.id) {
        return (
            <div style={{ width: '100%', minHeight: '100vh', background: '#f5f5f5', padding: '100px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card style={{ width: '500px', borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
                    <UserOutlined style={{ fontSize: '64px', color: '#1a94ff', marginBottom: '24px' }} />
                    <h2 style={{ marginBottom: '16px' }}>Hồ sơ người dùng</h2>
                    <p style={{ color: '#666', marginBottom: '32px' }}>Vui lòng đăng nhập để xem và cập nhật thông tin cá nhân của bạn</p>
                    <Button
                        type="primary"
                        size="large"
                        style={{ borderRadius: '10px', height: 'auto', padding: '12px 48px', fontWeight: 600 }}
                        onClick={() => navigate('/sign-in', { state: { from: '/profile-user' } })}
                    >
                        Đăng nhập ngay
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div style={{ width: '100%', minHeight: '100vh', background: '#f5f5f5', padding: '40px 0' }}>
            <div style={{ width: '1270px', margin: '0 auto', padding: '0 20px' }}>
                <WrapperHeader>
                    <UserOutlined style={{ marginRight: '12px', fontSize: '28px' }} />
                    Thông tin người dùng
                </WrapperHeader>
                <Loading isPending={isPending}>
                    <Row gutter={[24, 24]}>
                        {/* Avatar Section */}
                        <Col xs={24} md={8}>
                            <Card
                                style={{
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    textAlign: 'center'
                                }}
                            >
                                <WrapperAvatarSection>
                                    {avatar ? (
                                        <img
                                            src={avatar}
                                            alt="avatar"
                                            style={{
                                                height: '150px',
                                                width: '150px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '4px solid #1a94ff',
                                                boxShadow: '0 4px 12px rgba(26, 148, 255, 0.3)'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            height: '150px',
                                            width: '150px',
                                            borderRadius: '50%',
                                            background: '#f0f0f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            border: '4px solid #1a94ff'
                                        }}>
                                            <UserOutlined style={{ fontSize: '80px', color: '#999' }} />
                                        </div>
                                    )}
                                    <WrapperUploadFile onChange={handleOnchangeAvatar} maxCount={1} style={{ marginTop: '20px' }}>
                                        <Button
                                            icon={<UploadOutlined />}
                                            type="primary"
                                            style={{
                                                borderRadius: '8px',
                                                height: '40px',
                                                padding: '0 24px'
                                            }}
                                        >
                                            Chọn ảnh đại diện
                                        </Button>
                                    </WrapperUploadFile>
                                </WrapperAvatarSection>
                            </Card>
                        </Col>

                        {/* Info Section */}
                        <Col xs={24} md={16}>
                            <Card
                                style={{
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                }}
                            >
                                <WrapperContentProfile>
                                    {/* Name */}
                                    <WrapperSection>
                                        <WrapperLabel>
                                            <UserOutlined style={{ marginRight: '8px' }} />
                                            Họ và tên
                                        </WrapperLabel>
                                        <InputForm
                                            style={{
                                                width: '100%',
                                                borderRadius: '8px',
                                                height: '44px',
                                                fontSize: '15px'
                                            }}
                                            id="name"
                                            value={name}
                                            onChange={handleOnchangeName}
                                            placeholder="Nhập họ và tên"
                                        />
                                    </WrapperSection>

                                    {/* Email */}
                                    <WrapperSection>
                                        <WrapperLabel>
                                            <MailOutlined style={{ marginRight: '8px' }} />
                                            Email
                                        </WrapperLabel>
                                        <InputForm
                                            style={{
                                                width: '100%',
                                                borderRadius: '8px',
                                                height: '44px',
                                                fontSize: '15px'
                                            }}
                                            id="email"
                                            value={email}
                                            onChange={handleOnchangeEmail}
                                            placeholder="Nhập email"
                                        />
                                    </WrapperSection>

                                    {/* Phone */}
                                    <WrapperSection>
                                        <WrapperLabel>
                                            <PhoneOutlined style={{ marginRight: '8px' }} />
                                            Số điện thoại
                                        </WrapperLabel>
                                        <InputForm
                                            style={{
                                                width: '100%',
                                                borderRadius: '8px',
                                                height: '44px',
                                                fontSize: '15px'
                                            }}
                                            id="phone"
                                            value={phone}
                                            onChange={handleOnchangePhone}
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </WrapperSection>

                                    {/* Address */}
                                    <WrapperSection>
                                        <WrapperLabel>
                                            <HomeOutlined style={{ marginRight: '8px' }} />
                                            Địa chỉ
                                        </WrapperLabel>
                                        <AddressPicker
                                            value={{
                                                address: address,
                                                city: city,
                                                province: province,
                                                district: district,
                                                ward: ward
                                            }}
                                            onChange={handleAddressChange}
                                        />
                                    </WrapperSection>

                                    {/* Update Button */}
                                    <WrapperButtonGroup>
                                        <ButtonComponent
                                            onClick={handleUpdate}
                                            size={40}
                                            styleButton={{
                                                height: '48px',
                                                width: '100%',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, #1a94ff 0%, #0d7ae8 100%)',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(26, 148, 255, 0.3)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            textbutton={'Cập nhật thông tin'}
                                            styletextbutton={{
                                                color: '#fff',
                                                fontSize: '16px',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </WrapperButtonGroup>
                                </WrapperContentProfile>
                            </Card>
                        </Col>
                    </Row>
                </Loading>
            </div>
        </div>
    )
}

export default ProfilePage