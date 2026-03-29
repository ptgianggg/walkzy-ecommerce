import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Divider,
  Tabs,
  Row,
  Col,
  Upload,
  InputNumber,
  Select,
  DatePicker,
  message as antdMessage,
  Space,
  Alert,
  Radio
} from 'antd'
import {
  SettingOutlined,
  GlobalOutlined,
  MailOutlined,


  SaveOutlined,
  ReloadOutlined,
  NotificationOutlined,
  CustomerServiceOutlined,
  PlayCircleOutlined,
  UploadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as message from '../Message/Message'
import * as SettingsService from '../../services/SettingsService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import { getBase64 } from '../../utils'
import Loading from '../LoadingComponent/Loading'
import styled from 'styled-components'
import { Image as AntImage } from 'antd'
import SeasonalEffects from '../SeasonalEffects/SeasonalEffects'
import dayjs from 'dayjs'

const { TabPane } = Tabs
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const SettingsContainer = styled.div`
  padding: 24px;
  
  .settings-header {
    margin-bottom: 24px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    p {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 14px;
    }
  }
  
  .settings-card {
    margin-bottom: 24px;
    
    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1a1a1a;
    }
    
    .card-description {
      color: #666;
      font-size: 14px;
      margin-bottom: 24px;
    }
  }
  
  .form-actions {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
`

const AdminSettings = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [settings, setSettings] = useState({
    // Website Settings
    websiteName: 'WALKZY',
    websiteDescription: 'Cửa hàng thời trang uy tín',
    websiteLogo: '',
    websiteLogoMobile: '',
    websiteFavicon: '',
    websiteFavicon16: '',
    websiteFavicon32: '',
    websiteOgImage: '',
    websiteUrl: 'http://localhost:3000',
    contactEmail: 'support@walkzy.com',
    contactPhone: '0123456789',
    contactAddress: '',
    facebookUrl: '',
    facebookIcon: '',
    instagramUrl: '',
    instagramIcon: '',
    youtubeUrl: '',
    youtubeIcon: '',
    tiktokUrl: '',
    tiktokIcon: '',
    zaloUrl: '',
    businessHours: '',
    aboutBrandTitle: '',
    aboutBrandContent: '',
    aboutVisionTitle: '',
    aboutVisionContent: '',
    aboutValuesTitle: '',
    aboutValuesContent: '',
    aboutCommitmentTitle: '',
    aboutCommitmentContent: '',
    aboutStoryTitle: '',
    aboutStoryContent: '',
    aboutJourneyTitle: '',
    aboutJourneyContent: '',
    aboutStoryImageUrl: '',
    aboutStoryImageLabel: '',

    // Email Settings
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    emailFrom: 'noreply@walkzy.com',
    emailFromName: 'WALKZY',
    enableEmailOrder: true,
    enableEmailWelcome: true,
    enableEmailPasswordReset: true,
    enableEmailOrderConfirmation: true,
    enableEmailShipping: true,
    enableEmailPromotion: true,
    enableEmailNewsletter: true,




    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: 'Website đang bảo trì. Vui lòng quay lại sau!',

    // UI/Theme Settings
    primaryColor: '#e91e63',
    secondaryColor: '#667eea',
    textColor: '#333333',
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
    fontSize: 'normal',
    borderRadius: 'normal',

    // Seasonal Effects Settings
    seasonalEffectsEnabled: false,
    seasonalEffectType: 'snow',
    seasonalEffectDensity: 80,
    seasonalEffectPages: ['home'],
    seasonalEffectStart: null,
    seasonalEffectEnd: null,
    seasonalEffectIcon: ''
  })

  const user = useSelector((state) => state?.user)
  const queryClient = useQueryClient()

  // Load settings from API
  const { data: settingsData, isPending: isLoadingSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => SettingsService.getSettings(user?.access_token),
    enabled: !!user?.access_token && !!user?.isAdmin,
    staleTime: 0, // Always fetch fresh data
  })

  // Update settings mutation
  const mutationUpdate = useMutationHooks(
    (data) => SettingsService.updateSettings(data, user?.access_token)
  )

  // Load settings vào form khi có data
  useEffect(() => {
    if (settingsData?.status === 'OK' && settingsData?.data) {
      const loadedSettings = settingsData.data

      const formData = {
        ...loadedSettings,
      }

      // Map start/end -> RangePicker cho seasonal effect (nếu có)
      if (loadedSettings.seasonalEffectStart && loadedSettings.seasonalEffectEnd) {
        formData.seasonalEffectRange = [
          dayjs(loadedSettings.seasonalEffectStart),
          dayjs(loadedSettings.seasonalEffectEnd)
        ]
      }

      setSettings(formData)
      form.setFieldsValue(formData)
    } else if (settingsData?.status === 'ERR') {
      // Nếu có lỗi, vẫn set default values
      form.setFieldsValue(settings)
    }
  }, [settingsData, form])

  const handleSave = async (values) => {
    // Map RangePicker -> start/end cho seasonal effect
    if (values.seasonalEffectRange && Array.isArray(values.seasonalEffectRange)) {
      const [start, end] = values.seasonalEffectRange
      values.seasonalEffectStart = start ? start.toDate() : null
      values.seasonalEffectEnd = end ? end.toDate() : null
    }

    setLoading(true)
    try {
      const updateData = {
        ...values,
      }
      delete updateData.seasonalEffectRange

      mutationUpdate.mutate(updateData, {
        onSuccess: (result) => {
          if (result?.status === 'OK') {
            setSettings(prev => ({ ...prev, ...values }))
            // Invalidate cache để refetch ngay lập tức
            queryClient.invalidateQueries(['admin-settings'])
            queryClient.invalidateQueries(['public-settings'])
            message.success('Lưu cài đặt thành công!')

            // Cập nhật favicon và title ngay lập tức không cần reload
            if (values.websiteName) {
              document.title = values.websiteName
            }

            // Lưu settings vào localStorage TRƯỚC KHI reload để hook có thể load ngay
            localStorage.setItem('websiteSettings', JSON.stringify({
              websiteFavicon16: values.websiteFavicon16,
              websiteFavicon32: values.websiteFavicon32,
              websiteName: values.websiteName,
              websiteDescription: values.websiteDescription,
              websiteLogo: values.websiteLogo,
              updatedAt: Date.now()
            }))

            // Cập nhật favicon và title ngay lập tức
            if (values.websiteName) {
              document.title = values.websiteName
            }

            // Cập nhật favicon động
            if (values.websiteFavicon16 || values.websiteFavicon32) {
              // Xóa tất cả favicon cũ
              const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
              existingFavicons.forEach(favicon => favicon.remove())

              // Hàm tạo favicon link
              const createFaviconLink = (href, sizes = null) => {
                if (!href) return
                const link = document.createElement('link')
                link.rel = 'icon'
                if (sizes) {
                  link.sizes = sizes
                }
                link.type = href.includes('.ico') ? 'image/x-icon' : 'image/png'
                // Nếu là data URL (base64) thì không thêm timestamp (query) vì sẽ làm hỏng URL
                if (href.startsWith('data:')) {
                  link.href = href
                } else {
                  // Thêm timestamp để tránh cache
                  const separator = href.includes('?') ? '&' : '?'
                  link.href = `${href}${separator}_t=${Date.now()}`
                }
                document.head.appendChild(link)
              }

              // Thêm favicon mới
              if (values.websiteFavicon16) {
                createFaviconLink(values.websiteFavicon16, '16x16')
              }

              if (values.websiteFavicon32) {
                createFaviconLink(values.websiteFavicon32, '32x32')
                // Nếu không có favicon16, dùng favicon32 làm favicon chính
                if (!values.websiteFavicon16) {
                  createFaviconLink(values.websiteFavicon32)
                }
              } else if (values.websiteFavicon16) {
                // Nếu chỉ có favicon16, dùng nó làm favicon chính
                createFaviconLink(values.websiteFavicon16)
              }
            }

            // Reload page sau 2 giây để đảm bảo localStorage đã được lưu
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          } else {
            message.error(result?.message || 'Lưu cài đặt thất bại!')
          }
        },
        onError: (error) => {
          console.error('Error saving settings:', error)
          message.error('Lưu cài đặt thất bại! Vui lòng thử lại')
        },
        onSettled: () => {
          setLoading(false)
        }
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      message.error('Lưu cài đặt thất bại!')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mutationUpdate.isSuccess) {
      refetchSettings()
    }
  }, [mutationUpdate.isSuccess, refetchSettings])

  const handleReset = () => {
    if (settingsData?.status === 'OK' && settingsData?.data) {
      const loadedSettings = settingsData.data
      const formData = {
        ...loadedSettings,
      }
      form.setFieldsValue(formData)
      message.info('Đã khôi phục về giá trị ban đầu')
    } else {
      form.setFieldsValue(settings)
      message.info('Đã khôi phục về giá trị mặc định')
    }
  }

  // Image upload handlers
  const handleLogoUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ websiteLogo: file.preview || file.url })
      setSettings(prev => ({ ...prev, websiteLogo: file.preview || file.url }))
    }
  }

  const handleLogoMobileUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ websiteLogoMobile: file.preview || file.url })
      setSettings(prev => ({ ...prev, websiteLogoMobile: file.preview || file.url }))
    }
  }

  const handleFavicon16Upload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ websiteFavicon16: file.preview || file.url })
      setSettings(prev => ({ ...prev, websiteFavicon16: file.preview || file.url }))
    }
  }

  const handleFavicon32Upload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ websiteFavicon32: file.preview || file.url })
      setSettings(prev => ({ ...prev, websiteFavicon32: file.preview || file.url }))
    }
  }

  const handleOgImageUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ websiteOgImage: file.preview || file.url })
      setSettings(prev => ({ ...prev, websiteOgImage: file.preview || file.url }))
    }
  }

  const handleAboutStoryImageUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ aboutStoryImageUrl: file.preview || file.url })
      setSettings(prev => ({ ...prev, aboutStoryImageUrl: file.preview || file.url }))
    }
  }

  // Social icon upload handlers
  const handleFacebookIconUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ facebookIcon: file.preview || file.url })
      setSettings(prev => ({ ...prev, facebookIcon: file.preview || file.url }))
    }
  }

  const handleInstagramIconUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ instagramIcon: file.preview || file.url })
      setSettings(prev => ({ ...prev, instagramIcon: file.preview || file.url }))
    }
  }

  const handleYouTubeIconUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ youtubeIcon: file.preview || file.url })
      setSettings(prev => ({ ...prev, youtubeIcon: file.preview || file.url }))
    }
  }

  const handleTiktokIconUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ tiktokIcon: file.preview || file.url })
      setSettings(prev => ({ ...prev, tiktokIcon: file.preview || file.url }))
    }
  }

  const handleSeasonalIconUpload = async ({ fileList }) => {
    const file = fileList[0]
    if (file) {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      form.setFieldsValue({ seasonalEffectIcon: file.preview || file.url })
      setSettings(prev => ({ ...prev, seasonalEffectIcon: file.preview || file.url }))
    }
  }

  return (
    <SettingsContainer>
      <div className="settings-header">
        <h2><SettingOutlined /> Cài đặt hệ thống</h2>

      </div>

      <Loading isPending={isLoadingSettings || loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={settings}
        >
          <Tabs defaultActiveKey="website" type="card">
            {/* Website Settings */}
            <TabPane
              tab={<span><GlobalOutlined /> Thông tin website</span>}
              key="website"
            >
              <Row gutter={24}>
                <Col xs={24} lg={14}>
                  <Card className="settings-card">
                    <div className="card-title">Thông tin cơ bản</div>


                    <Row gutter={24}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Tên website"
                          name="websiteName"
                          rules={[{ required: true, message: 'Vui lòng nhập tên website' }]}
                        >
                          <Input placeholder="Nhập tên website" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="URL website"
                          name="websiteUrl"
                          rules={[
                            { required: true, message: 'Vui lòng nhập URL' },
                            { type: 'url', message: 'URL không hợp lệ' }
                          ]}
                        >
                          <Input placeholder="https://walkzy.com" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      label="Mô tả website"
                      name="websiteDescription"
                    >
                      <TextArea
                        rows={3}
                        placeholder="Mô tả ngắn gọn về website"
                        maxLength={200}
                        showCount
                      />
                    </Form.Item>
                  </Card>

                  <Card className="settings-card" style={{ marginTop: 16 }}>
                    <div className="card-title">Liên hệ & mạng xã hội</div>


                    <Row gutter={24}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Email liên hệ"
                          name="contactEmail"
                          rules={[
                            { type: 'email', message: 'Email không hợp lệ' }
                          ]}
                        >
                          <Input placeholder="support@walkzy.com" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Số điện thoại"
                          name="contactPhone"
                        >
                          <Input placeholder="0123456789" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Địa chỉ"
                          name="contactAddress"
                        >
                          <Input placeholder="Địa chỉ cửa hàng" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={24}>
                      <Col xs={24} md={12}>
                        <Form.Item label="Giờ làm việc" name="businessHours">
                          <Input placeholder="VD: T2-T6: 8:30 - 17:30, T7: 8:30 - 12:00" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label="Facebook URL" name="facebookUrl" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
                          <Input placeholder="https://facebook.com/yourpage" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={24}>
                      <Col xs={24} md={8}>
                        <Form.Item label="Instagram URL" name="instagramUrl" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
                          <Input placeholder="https://instagram.com/yourhandle" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={8}>
                        <Form.Item label="YouTube URL" name="youtubeUrl" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
                          <Input placeholder="https://youtube.com/channel/.." />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={8}>
                        <Form.Item label="Tiktok URL" name="tiktokUrl" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
                          <Input placeholder="https://tiktok.com/@yourhandle" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={24}>
                      <Col xs={24} md={8}>
                        <Form.Item label="Zalo URL" name="zaloUrl" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}>
                          <Input placeholder="Zalo page URL (nếu có)" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider plain orientation="left">Icon mạng xã hội (tuỳ chọn)</Divider>

                    <Row gutter={24}>
                      <Col xs={24} md={6}>
                        <Form.Item label="Icon Facebook" name="facebookIcon">
                          <Upload accept="image/*" listType="picture-card" maxCount={1} beforeUpload={() => false} onChange={handleFacebookIconUpload}>
                            {form.getFieldValue('facebookIcon') ? (
                              <img src={form.getFieldValue('facebookIcon')} alt="Facebook icon" style={{ width: '100%' }} />
                            ) : (
                              <div>
                                <UploadOutlined />
                                <div style={{ fontSize: 12 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={6}>
                        <Form.Item label="Icon Instagram" name="instagramIcon">
                          <Upload accept="image/*" listType="picture-card" maxCount={1} beforeUpload={() => false} onChange={handleInstagramIconUpload}>
                            {form.getFieldValue('instagramIcon') ? (
                              <img src={form.getFieldValue('instagramIcon')} alt="Instagram icon" style={{ width: '100%' }} />
                            ) : (
                              <div>
                                <UploadOutlined />
                                <div style={{ fontSize: 12 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={6}>
                        <Form.Item label="Icon YouTube" name="youtubeIcon">
                          <Upload accept="image/*" listType="picture-card" maxCount={1} beforeUpload={() => false} onChange={handleYouTubeIconUpload}>
                            {form.getFieldValue('youtubeIcon') ? (
                              <img src={form.getFieldValue('youtubeIcon')} alt="YouTube icon" style={{ width: '100%' }} />
                            ) : (
                              <div>
                                <UploadOutlined />
                                <div style={{ fontSize: 12 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={6}>
                        <Form.Item label="Icon Tiktok" name="tiktokIcon">
                          <Upload accept="image/*" listType="picture-card" maxCount={1} beforeUpload={() => false} onChange={handleTiktokIconUpload}>
                            {form.getFieldValue('tiktokIcon') ? (
                              <img src={form.getFieldValue('tiktokIcon')} alt="Tiktok icon" style={{ width: '100%' }} />
                            ) : (
                              <div>
                                <UploadOutlined />
                                <div style={{ fontSize: 12 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                <Col xs={24} lg={10}>
                  <Card className="settings-card">
                    <div className="card-title">Logo & Icon</div>


                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Logo website (PNG)"
                          name="websiteLogo"
                        >
                          <Upload
                            listType="picture-card"
                            maxCount={1}
                            onChange={handleLogoUpload}
                            beforeUpload={() => false}
                            accept="image/png"
                          >
                            {settings.websiteLogo ? (
                              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <AntImage
                                  src={settings.websiteLogo}
                                  alt="Logo"
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                  preview={false}
                                />
                              </div>
                            ) : (
                              <div>
                                <div style={{ marginTop: 8 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                            Khuyến nghị: 200x60px, PNG nền trong suốt.
                          </div>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Logo cho mobile"
                          name="websiteLogoMobile"
                        >
                          <Upload
                            listType="picture-card"
                            maxCount={1}
                            onChange={handleLogoMobileUpload}
                            beforeUpload={() => false}
                            accept="image/png"
                          >
                            {settings.websiteLogoMobile ? (
                              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <AntImage
                                  src={settings.websiteLogoMobile}
                                  alt="Logo Mobile"
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                  preview={false}
                                />
                              </div>
                            ) : (
                              <div>
                                <div style={{ marginTop: 8 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                            Khuyến nghị: 120x40px, PNG nền trong suốt.
                          </div>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Favicon 16x16"
                          name="websiteFavicon16"
                        >
                          <Upload
                            listType="picture-card"
                            maxCount={1}
                            onChange={handleFavicon16Upload}
                            beforeUpload={() => false}
                            accept="image/png,image/x-icon"
                          >
                            {settings.websiteFavicon16 ? (
                              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <AntImage
                                  src={settings.websiteFavicon16}
                                  alt="Favicon 16x16"
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                  preview={false}
                                />
                              </div>
                            ) : (
                              <div>
                                <div style={{ marginTop: 8 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                            16x16px, PNG hoặc ICO.
                          </div>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Favicon 32x32"
                          name="websiteFavicon32"
                        >
                          <Upload
                            listType="picture-card"
                            maxCount={1}
                            onChange={handleFavicon32Upload}
                            beforeUpload={() => false}
                            accept="image/png,image/x-icon"
                          >
                            {settings.websiteFavicon32 ? (
                              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <AntImage
                                  src={settings.websiteFavicon32}
                                  alt="Favicon 32x32"
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                  preview={false}
                                />
                              </div>
                            ) : (
                              <div>
                                <div style={{ marginTop: 8 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                            32x32px, PNG hoặc ICO.
                          </div>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      label="Ảnh OG-Sharing (Facebook/Zalo)"
                      name="websiteOgImage"
                    >
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        onChange={handleOgImageUpload}
                        beforeUpload={() => false}
                        accept="image/png,image/jpeg"
                      >
                        {settings.websiteOgImage ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <AntImage
                              src={settings.websiteOgImage}
                              alt="OG Image"
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              preview={false}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ marginTop: 8 }}>Upload</div>
                          </div>
                        )}
                      </Upload>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                        Khuyến nghị: 1200x630px, PNG hoặc JPEG.
                      </div>
                    </Form.Item>
                  </Card>

                  <Card className="settings-card" style={{ marginTop: 16 }}>
                    <div className="card-title">Xem nhanh thương hiệu</div>


                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 12,
                        padding: 16,
                        background: '#f9fafb',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {settings.websiteLogo ? (
                          <AntImage
                            src={settings.websiteLogo}
                            alt="Logo preview"
                            width={64}
                            height={32}
                            style={{ objectFit: 'contain' }}
                            preview={false}
                          />
                        ) : (
                          <div
                            style={{
                              width: 64,
                              height: 32,
                              borderRadius: 6,
                              background: '#fff',
                              border: '1px dashed #d9d9d9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              color: '#999'
                            }}
                          >
                            Logo
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700 }}>
                            {settings.websiteName || 'Website chưa đặt tên'}
                          </div>
                          <div style={{ color: '#4b5563', fontSize: 13 }}>
                            {settings.websiteDescription || 'Thêm mô tả để hiển thị cho SEO và trang chủ.'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', fontSize: 13 }}>
                          <GlobalOutlined />
                          <span>{settings.websiteUrl || 'Chưa có URL'}</span>
                        </div>
                        {settings.contactEmail && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 13 }}>
                            <MailOutlined />
                            <span>{settings.contactEmail}</span>
                          </div>
                        )}
                        {settings.contactPhone && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f97316', fontSize: 13 }}>
                            <InfoCircleOutlined />
                            <span>{settings.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            {/* About Page Settings */}
            {/* About Page Settings */}
            <TabPane
              tab={<span><InfoCircleOutlined /> Thông tin giới thiệu</span>}
              key="about"
            >
              <Card className="settings-card">
                <div className="card-title">Nội dung trang Giới thiệu</div>


                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tiêu đề giới thiệu thương hiệu" name="aboutBrandTitle">
                      <Input placeholder="Giới thiệu thương hiệu" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tiêu đề tầm nhìn – sứ mệnh" name="aboutVisionTitle">
                      <Input placeholder="Tầm nhìn – sứ mệnh" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Nội dung giới thiệu thương hiệu" name="aboutBrandContent">
                  <TextArea rows={4} placeholder="Nhập nội dung giới thiệu thương hiệu" />
                </Form.Item>

                <Form.Item label="Nội dung tầm nhìn – sứ mệnh" name="aboutVisionContent">
                  <TextArea rows={4} placeholder="Nhập nội dung tầm nhìn – sứ mệnh" />
                </Form.Item>

                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tiêu đề giá trị cốt lõi" name="aboutValuesTitle">
                      <Input placeholder="Giá trị cốt lõi" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tiêu đề cam kết sản phẩm" name="aboutCommitmentTitle">
                      <Input placeholder="Cam kết sản phẩm" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Giá trị cốt lõi (mỗi dòng 1 ý)" name="aboutValuesContent">
                  <TextArea rows={4} placeholder="Chất lượng bền vững&#10;Thiết kế tối giản&#10;Trải nghiệm khách hàng" />
                </Form.Item>

                <Form.Item label="Nội dung cam kết sản phẩm" name="aboutCommitmentContent">
                  <TextArea rows={4} placeholder="Nhập nội dung cam kết sản phẩm" />
                </Form.Item>

                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tiêu đề hình ảnh / story" name="aboutStoryTitle">
                      <Input placeholder="Hình ảnh / Story" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tiêu đề hành trình thương hiệu" name="aboutJourneyTitle">
                      <Input placeholder="Hành trình thương hiệu" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Nội dung hình ảnh / story" name="aboutStoryContent">
                  <TextArea rows={4} placeholder="Nhập nội dung story" />
                </Form.Item>

                <Form.Item label="Nội dung hành trình thương hiệu" name="aboutJourneyContent">
                  <TextArea rows={4} placeholder="Nhập nội dung hành trình thương hiệu" />
                </Form.Item>

                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Ảnh story (URL)" name="aboutStoryImageUrl">
                      <Input placeholder="https://..." />
                    </Form.Item>
                    <Form.Item label="Chọn ảnh từ thiết bị">
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        onChange={handleAboutStoryImageUpload}
                        beforeUpload={() => false}
                        accept="image/*"
                      >
                        {settings.aboutStoryImageUrl ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <AntImage
                              src={settings.aboutStoryImageUrl}
                              alt="Story"
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                              preview={false}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ marginTop: 8 }}>Upload</div>
                          </div>
                        )}
                      </Upload>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        Ảnh sẽ tự lưu dưới dạng URL base64.
                      </div>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Nhãn ảnh story" name="aboutStoryImageLabel">
                      <Input placeholder="Hình ảnh / Story" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            {/* Email Settings removed (not in use) */}







            {/* Seasonal Effects Settings */}
            <TabPane
              tab={<span><CustomerServiceOutlined /> Cài đặt hiệu ứng</span>}
              key="seasonal-effects"
            >
              <Card className="settings-card">
                <div className="card-title">Hiệu ứng</div>


                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item

                      name="seasonalEffectsEnabled"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>

                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Loại hiệu ứng"
                      name="seasonalEffectType"
                    >
                      <Select placeholder="Chọn hiệu ứng">
                        {/* ===== 4 MÙA ===== */}
                        <Select.OptGroup label="🌸 Hiệu ứng theo mùa">
                          <Option value="spring">🌸 Mùa xuân (hoa rơi, sinh khí mới)</Option>
                          <Option value="summer">☀️ Mùa hè (ánh sáng, bong bóng)</Option>
                          <Option value="autumn">🍁 Mùa thu (lá vàng rơi)</Option>
                          <Option value="winter">❄️ Mùa đông (bông tuyết)</Option>
                        </Select.OptGroup>

                        {/* ===== SỰ KIỆN VIỆT NAM ===== */}
                        <Select.OptGroup label="🇻🇳 Sự kiện Việt Nam">
                          <Option value="tet">🧧 Tết Nguyên Đán (lì xì, hoa mai)</Option>
                          <Option value="women_day">🌷 20/10 – Phụ nữ Việt Nam</Option>
                          <Option value="teacher_day">📚 20/11 – Ngày Nhà Giáo</Option>
                          <Option value="national_day">🇻🇳 Quốc khánh 2/9</Option>
                        </Select.OptGroup>

                        {/* ===== SỰ KIỆN / SALE ===== */}
                        <Select.OptGroup label="🎉 Khuyến mãi & sự kiện">
                          <Option value="confetti">🎉 Confetti (Sale / ăn mừng)</Option>
                          <Option value="flash_sale">⚡ Flash Sale</Option>
                          <Option value="brand_birthday">🎂 Sinh nhật thương hiệu</Option>
                        </Select.OptGroup>

                        {/* ===== QUỐC TẾ ===== */}
                        <Select.OptGroup label="🌍 Sự kiện quốc tế">
                          <Option value="noel">🎄 Giáng sinh (Noel)</Option>
                          <Option value="halloween">🎃 Halloween</Option>
                          <Option value="valentine">❤️ Valentine</Option>
                          <Option value="new_year">🎆 Năm mới</Option>
                        </Select.OptGroup>

                        {/* ===== TÙY CHỈNH ===== */}
                        <Select.OptGroup label="⚙️ Tùy chỉnh">
                          <Option value="custom">🖼️ Sử dụng Icon tùy chỉnh (PNG)</Option>
                        </Select.OptGroup>
                      </Select>
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prevValues, curValues) => prevValues.seasonalEffectType !== curValues.seasonalEffectType}>
                      {({ getFieldValue }) => getFieldValue('seasonalEffectType') === 'custom' && (
                        <Form.Item
                          label="Tải lên Icon hiệu ứng (PNG)"
                          name="seasonalEffectIcon"
                        >
                          <Upload
                            accept="image/png"
                            listType="picture-card"
                            maxCount={1}
                            beforeUpload={() => false}
                            onChange={handleSeasonalIconUpload}
                          >
                            {getFieldValue('seasonalEffectIcon') ? (
                              <img src={getFieldValue('seasonalEffectIcon')} alt="Custom effect" style={{ width: '100%' }} />
                            ) : (
                              <div>
                                <UploadOutlined />
                                <div style={{ fontSize: 12 }}>Upload PNG</div>
                              </div>
                            )}
                          </Upload>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            Khuyến nghị: PNG nền trong suốt, kích thước 32x32 hoặc 64x64px.
                          </div>
                        </Form.Item>
                      )}
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Mức độ hiệu ứng (gợi ý)">
                      <Radio.Group
                        onChange={(e) => {
                          const level = e.target.value
                          let density = 80
                          if (level === 'low') density = 30
                          if (level === 'medium') density = 60
                          if (level === 'high') density = 100
                          form.setFieldsValue({ seasonalEffectDensity: density })
                        }}
                      >
                        <Radio value="low">Thấp</Radio>
                        <Radio value="medium">Trung bình</Radio>
                        <Radio value="high">Cao</Radio>
                      </Radio.Group>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        Gợi ý nhanh: hệ thống vẫn lưu mật độ dưới dạng số.
                      </div>
                    </Form.Item>
                    <Form.Item
                      label="Mật độ hiệu ứng"
                      name="seasonalEffectDensity"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={10}
                        max={250}
                        step={10}
                        placeholder="80"
                      />
                    </Form.Item>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      Số lượng phần tử trên màn hình. Mật độ cao sẽ tốn tài nguyên hơn.
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Hiển thị trên trang"
                      name="seasonalEffectPages"
                    >
                      <Select mode="multiple" placeholder="Chọn trang hiển thị">
                        <Option value="home">Trang chủ</Option>
                        <Option value="product">Trang sản phẩm</Option>
                        <Option value="category">Trang danh mục / bộ sưu tập</Option>
                        <Option value="cart">Giỏ hàng / thanh toán</Option>
                        <Option value="all">Tất cả trang (trừ admin)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>Thời gian áp dụng</Divider>

                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Khoảng thời gian chạy hiệu ứng"
                      name="seasonalEffectRange"
                    >
                      <RangePicker
                        showTime
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY HH:mm"
                      />
                    </Form.Item>

                  </Col>
                </Row>

                <Divider />

                {/* Nút xem trước hiệu ứng - chỉ chạy local trong admin, không lưu DB */}
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Space>
                      <Button
                        icon={<PlayCircleOutlined />}
                        type="default"
                        disabled={previewing}
                        onClick={() => {
                          if (previewing) return
                          setPreviewing(true)
                          // Sau 8 giây tắt preview
                          setTimeout(() => setPreviewing(false), 8000)
                        }}
                      >
                        Xem trước hiệu ứng (8 giây)
                      </Button>
                      <span style={{ fontSize: 12, color: '#666' }}>
                        Chỉ xem trước trong màn hình admin, không lưu vào cấu hình.
                      </span>
                    </Space>
                  </Col>
                </Row>

                <Alert
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                  message="Gợi ý sử dụng"
                  description={
                    <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                      <li>Dùng hiệu ứng bông tuyết cho Noel / mùa đông.</li>
                      <li>Dùng hiệu ứng Tết cho dịp Tết Nguyên Đán.</li>
                      <li>Dùng confetti cho flash sale, sinh nhật thương hiệu, khai trương,...</li>
                    </ul>
                  }
                />
              </Card>
              {/* Canvas preview chỉ cho admin, chạy tạm thời */}
              {previewing && (
                <SeasonalEffects
                  forceEnabled
                  durationMs={8000}
                  overrideConfig={form.getFieldsValue([
                    'seasonalEffectType',
                    'seasonalEffectDensity',
                    'seasonalEffectPages',
                    'seasonalEffectIcon'
                  ])}
                />
              )}
            </TabPane>

            {/* Maintenance */}
            <TabPane
              tab={<span><SettingOutlined /> Bảo trì</span>}
              key="maintenance"
            >
              <Card className="settings-card">
                <Alert
                  message="Chế độ bảo trì"
                  description="Khi bật chế độ bảo trì, website sẽ không khả dụng cho người dùng thường. Chỉ admin mới có thể truy cập."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Form.Item
                  label="Bật chế độ bảo trì"
                  name="maintenanceMode"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Đang bảo trì"
                    unCheckedChildren="Hoạt động bình thường"
                  />
                </Form.Item>

                <Form.Item
                  label="Thông báo bảo trì"
                  name="maintenanceMessage"
                >
                  <TextArea
                    rows={4}
                    placeholder="Nhập thông báo hiển thị khi bảo trì"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Card>
            </TabPane>
          </Tabs>

          <div className="form-actions">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={loading}
            >
              Khôi phục
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
              size="large"
            >
              Lưu cài đặt
            </Button>
          </div>
        </Form>
      </Loading>
    </SettingsContainer>
  )
}

export default AdminSettings
