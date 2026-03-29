import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'antd';
import {
    FacebookOutlined,
    InstagramOutlined,
    YoutubeOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import { usePublicSettings } from '../../hooks/useSettings';
import {
    WrapperFooter,
    WrapperFooterTop,
    WrapperFooterContainer,
    WrapperFooterColumns,
    WrapperFooterColumn,
    WrapperFooterTitle,
    WrapperFooterLink,
    WrapperFooterText,
    WrapperFooterSocial,
    WrapperFooterLogo,
    WrapperFooterBottom,
    WrapperFooterBottomContent,
    WrapperContactItem,
} from './style';

const TikTokIcon = (props) => (
    <svg viewBox="0 0 256 256" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
        <path d="M234.2 69.6c-5.6 2.6-11.6 4.4-18 5.2v63.4c0 35.9-29.1 65-65 65-35.9 0-65-29.1-65-65s29.1-65 65-65c1.1 0 2.3 0 3.4.1v41.6c-9.9-.9-19.6-6.4-26.1-15.5-7.1-9.8-9.2-22-6-33.4 3.1-11.2 11.4-20.2 22.4-23.9 14.4-4.7 30.9-.3 41.5 11.2V69.6z" />
    </svg>
);

const FooterComponent = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const { settings, refetch } = usePublicSettings();

    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    const handleNavigate = (path) => {
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const contactAddressHtml = useMemo(() => {
        if (!settings?.contactAddress) return '';
        return settings.contactAddress.split(/\r?\n/).join('<br />');
    }, [settings?.contactAddress]);
    const [sizeChartGender, setSizeChartGender] = useState('men'); // 'men' | 'women'
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isReturnPolicyOpen, setIsReturnPolicyOpen] = useState(false);
    const [isShippingOpen, setIsShippingOpen] = useState(false);
    const [isWarrantyOpen, setIsWarrantyOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Fallback payment methods when settings.paymentMethods is not configured
    const paymentMethods = settings?.paymentMethods?.length ? settings.paymentMethods : ['cod', 'momo', 'paypal'];

    useEffect(() => {
        if ((isContactOpen || isReturnPolicyOpen || isShippingOpen || isWarrantyOpen || isPaymentOpen) && typeof refetch === 'function') {
            // ensure we have the latest public settings when user opens contact, return-policy, shipping, warranty or payment modal
            refetch();
        }
    }, [isContactOpen, isReturnPolicyOpen, isShippingOpen, isWarrantyOpen, isPaymentOpen, refetch]);


    const handleDownloadSizeChart = () => {
        const el = document.getElementById('size-chart-modal');
        if (!el) return;
        const w = window.open('', '_blank');
        const style = `
            <style>body{font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:20px; color:#111}</style>
        `;
        w.document.write(`<html><head><title>Bảng kích cỡ chân VN</title>${style}</head><body>${el.innerHTML}</body></html>`);
        w.document.close();
    };

    return (
        <WrapperFooter>
            {/* Khối 3 cột */}
            <WrapperFooterTop>
                <WrapperFooterContainer>
                    <WrapperFooterColumns>
                        {/* Cột 1: Giới thiệu */}
                        <WrapperFooterColumn>
                            <WrapperFooterTitle>Giới thiệu</WrapperFooterTitle>
                            <WrapperFooterLink onClick={() => handleNavigate('/product')}>
                                Tìm kiếm
                            </WrapperFooterLink>
                            <WrapperFooterLink onClick={() => handleNavigate('/about')}>
                                Giới thiệu
                            </WrapperFooterLink>
                            <WrapperFooterLink onClick={() => setIsContactOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setIsContactOpen(true); }}>
                                Thông tin liên hệ
                            </WrapperFooterLink>

                            <WrapperFooterSocial>
                                {(settings?.facebookUrl || settings?.facebookIcon) && (
                                    (settings?.facebookUrl) ? (
                                        <a
                                            href={settings.facebookUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Facebook"
                                        >
                                            {settings?.facebookIcon ? (
                                                <img src={settings.facebookIcon} alt="Facebook" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                            ) : (
                                                <FacebookOutlined />
                                            )}
                                        </a>
                                    ) : (
                                        <span aria-label="Facebook">
                                            {settings?.facebookIcon ? (
                                                <img src={settings.facebookIcon} alt="Facebook" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                            ) : (
                                                <FacebookOutlined />
                                            )}
                                        </span>
                                    )
                                )}

                                {(settings?.instagramUrl || settings?.instagramIcon) && (
                                    (settings?.instagramUrl) ? (
                                        <a
                                            href={settings.instagramUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Instagram"
                                        >
                                            {settings?.instagramIcon ? (
                                                <img src={settings.instagramIcon} alt="Instagram" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                            ) : (
                                                <InstagramOutlined />
                                            )}
                                        </a>
                                    ) : (
                                        <span aria-label="Instagram">
                                            {settings?.instagramIcon ? (
                                                <img src={settings.instagramIcon} alt="Instagram" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                            ) : (
                                                <InstagramOutlined />
                                            )}
                                        </span>
                                    )
                                )}

                                {(settings?.youtubeUrl || settings?.youtubeIcon) && (
                                    (settings?.youtubeUrl) ? (
                                        <a
                                            href={settings.youtubeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="YouTube"
                                        >
                                            {settings?.youtubeIcon ? (
                                                <img src={settings.youtubeIcon} alt="YouTube" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                            ) : (
                                                <YoutubeOutlined />
                                            )}
                                        </a>
                                    ) : (
                                        <span aria-label="YouTube">
                                            {settings?.youtubeIcon ? (
                                                <img src={settings.youtubeIcon} alt="YouTube" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                            ) : (
                                                <YoutubeOutlined />
                                            )}
                                        </span>
                                    )
                                )}

                                {(settings?.tiktokUrl || settings?.tiktokIcon) && (
                                    (settings?.tiktokUrl) ? (
                                        <a
                                            href={settings.tiktokUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="TikTok"
                                            className="tiktok"
                                        >
                                            {settings?.tiktokIcon ? (
                                                <img src={settings.tiktokIcon} alt="TikTok" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                            ) : (
                                                <TikTokIcon />
                                            )}
                                        </a>
                                    ) : (
                                        <span aria-label="TikTok" className="tiktok">
                                            {settings?.tiktokIcon ? (
                                                <img src={settings.tiktokIcon} alt="TikTok" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                            ) : (
                                                <TikTokIcon />
                                            )}
                                        </span>
                                    )
                                )}
                            </WrapperFooterSocial>
                        </WrapperFooterColumn>

                        {/* Cột 2: Hỗ trợ khách hàng */}
                        <WrapperFooterColumn>
                            <WrapperFooterTitle>Hỗ trợ khách hàng</WrapperFooterTitle>
                            <WrapperFooterLink onClick={() => setIsSizeGuideOpen(true)}>
                                Hướng dẫn chọn size
                            </WrapperFooterLink>
                            <WrapperFooterLink onClick={() => setIsPaymentOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setIsPaymentOpen(true); }}>Hình thức thanh toán</WrapperFooterLink>
                            <WrapperFooterLink onClick={() => setIsShippingOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setIsShippingOpen(true); }}>Hình thức giao hàng</WrapperFooterLink>
                            <WrapperFooterLink onClick={() => setIsReturnPolicyOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setIsReturnPolicyOpen(true); }}>Chính sách đổi trả</WrapperFooterLink>
                            <WrapperFooterLink onClick={() => setIsWarrantyOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setIsWarrantyOpen(true); }}>Chính sách bảo hành</WrapperFooterLink>


                        </WrapperFooterColumn>

                        {/* Cột 3: Hệ thống cửa hàng / liên hệ */}
                        <WrapperFooterColumn>
                            <WrapperFooterTitle>Hệ thống cửa hàng</WrapperFooterTitle>
                            <WrapperFooterLink>
                                Liên hệ đại lý &amp; nhượng quyền
                            </WrapperFooterLink>

                            <div style={{ marginTop: 20 }}>
                                {settings?.contactPhone && (
                                    <WrapperContactItem>
                                        <PhoneOutlined className="icon" />
                                        <span className="text">
                                            Điện thoại:&nbsp;<strong>{settings.contactPhone}</strong>
                                        </span>
                                    </WrapperContactItem>
                                )}

                                {settings?.contactEmail && (
                                    <WrapperContactItem>
                                        <MailOutlined className="icon" />
                                        <span className="text">{settings.contactEmail}</span>
                                    </WrapperContactItem>
                                )}

                                {settings?.contactAddress && (
                                    <WrapperContactItem>
                                        <EnvironmentOutlined className="icon" />
                                        <span
                                            className="text"
                                            dangerouslySetInnerHTML={{
                                                __html: contactAddressHtml,
                                            }}
                                        />
                                    </WrapperContactItem>
                                )}
                            </div>
                        </WrapperFooterColumn>
                    </WrapperFooterColumns>
                </WrapperFooterContainer>
            </WrapperFooterTop>

            {/* Hàng dưới: Logo + Copyright */}
            <WrapperFooterBottom>
                <WrapperFooterContainer>
                    <WrapperFooterBottomContent>
                        <WrapperFooterLogo>
                            <div className="logo-text">
                                {settings?.websiteName || 'WALKZY'}
                            </div>
                        </WrapperFooterLogo>

                        <WrapperFooterText as="p" style={{ textAlign: 'center', marginBottom: 0 }}>
                            © {currentYear} {settings?.websiteName || 'WALKZY'}.
                        </WrapperFooterText>
                    </WrapperFooterBottomContent>
                </WrapperFooterContainer>
            </WrapperFooterBottom>

            <Modal
                title="Hướng dẫn chọn size"
                open={isSizeGuideOpen}
                onCancel={() => setIsSizeGuideOpen(false)}
                footer={null}
            >
                <p style={{ marginBottom: 12 }}>
                    Chọn size phù hợp giúp mang thoải mái và hạn chế đổi trả. Gợi ý nhanh:
                </p>

                <div id="size-chart-modal" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', margin: '12px 0' }}>
                    <div style={{ flex: '0 0 220px', textAlign: 'center' }}>
                        {/* measurement illustration */}
                        <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" style={{ borderRadius: 8 }}>
                            <circle cx="60" cy="60" r="56" fill="#f8fafc" stroke="#e6eef8" />
                            <path d="M30 80 C40 60, 60 50, 85 45" stroke="#0f1724" strokeWidth="3" fill="none" strokeLinecap="round" />
                            <rect x="22" y="86" width="76" height="8" rx="4" fill="#065f46" />
                        </svg>
                        <div style={{ marginTop: 8, fontWeight: 700 }}>Cách đo</div>
                        <div style={{ fontSize: 13, color: '#555' }}>Đặt chân lên giấy, đo từ gót đến mũi chân</div>
                    </div>

                    <div style={{ flex: '1 1 420px', minWidth: 260 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>Bảng kích cỡ chân (VN)</div>
                            <div>
                                <Button size="small" type={sizeChartGender === 'men' ? 'primary' : 'default'} onClick={() => setSizeChartGender('men')} style={{ marginRight: 6 }}>Nam</Button>
                                <Button size="small" type={sizeChartGender === 'women' ? 'primary' : 'default'} onClick={() => setSizeChartGender('women')}>Nữ</Button>
                                <Button size="small" onClick={handleDownloadSizeChart} style={{ marginLeft: 12 }}>Tải bảng kích cỡ</Button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360, boxShadow: '0 6px 18px rgba(0,0,0,0.04)', borderRadius: 8, overflow: 'hidden' }}>
                                <thead>
                                    <tr style={{ background: '#f3f4f6' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 14 }}>Chiều dài chân (cm)</th>
                                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 14 }}>VN size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(sizeChartGender === 'men' ? [
                                        ['24.0', '39'],
                                        ['24.5', '40'],
                                        ['25.0', '41'],
                                        ['25.5', '42'],
                                        ['26.0', '43'],
                                        ['26.5', '44'],
                                        ['27.0', '45'],
                                        ['27.5', '46'],
                                        ['28.0', '47'],
                                    ] : [
                                        ['22.0', '34'],
                                        ['22.5', '35'],
                                        ['23.0', '36'],
                                        ['23.5', '37'],
                                        ['24.0', '38'],
                                        ['24.5', '39'],
                                        ['25.0', '40'],
                                        ['25.5', '41'],
                                        ['26.0', '42'],
                                    ]).map((row, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fbfbfc' }}>
                                            <td style={{ padding: '12px 16px', fontSize: 15 }}>{row[0]}</td>
                                            <td style={{ padding: '12px 16px', fontSize: 15, textAlign: 'center', fontWeight: 700 }}>{row[1]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>Ghi chú: Đo chiều dài chân (cm). Nếu ở giữa hai size, chọn size lớn hơn.</div>
                    </div>
                </div>

                <ul style={{ paddingLeft: 18, marginBottom: 0, lineHeight: 1.7 }}>
                    <li>Đo chiều dài bàn chân (cm) vào cuối ngày là chính xác nhất.</li>
                    <li>Nếu muốn bó sát hoặc thích mặc rộng, chọn tăng 0.5 size.</li>
                    <li>Nếu đứng giữa 2 size, ưu tiên size lớn hơn.</li>
                </ul>
            </Modal>

            <Modal
                title="Hình thức thanh toán"
                open={isPaymentOpen}
                onCancel={() => setIsPaymentOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsPaymentOpen(false)}>Đóng</Button>
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ marginBottom: 0 }}>Các phương thức thanh toán hiện có:</p>
                    <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                        {paymentMethods.includes('cod') && (
                            <li key="cod"><strong>Thanh toán khi nhận hàng (COD)</strong> — Thanh toán bằng tiền mặt cho nhân viên giao hàng.</li>
                        )}
                        {paymentMethods.includes('momo') && (
                            <li key="momo"><strong>MoMo</strong> — Thanh toán nhanh qua ứng dụng MoMo (QR / chuyển tiền).</li>
                        )}
                        {paymentMethods.includes('paypal') && (
                            <li key="paypal"><strong>PayPal</strong> — Thanh toán quốc tế qua PayPal / thẻ.</li>
                        )}
                    </ul>

                    <div>
                        <div style={{ fontWeight: 700 }}>Lưu ý</div>
                        <div style={{ marginTop: 6 }}>
                            - Các phương thức và phí có thể thay đổi tùy theo trạng thái đơn hàng và khu vực giao hàng.
                            <div style={{ marginTop: 8 }}>Nếu cần hỗ trợ thanh toán, liên hệ: {settings?.contactPhone ? <a href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}>{settings.contactPhone}</a> : settings?.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : '—'}</div>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal

                title="Hình thức giao hàng"
                open={isShippingOpen}
                onCancel={() => setIsShippingOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsShippingOpen(false)}>Đóng</Button>
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ marginBottom: 0 }}>Chúng tôi cung cấp các hình thức giao hàng sau:</p>

                    <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                        <li><strong>Giao hàng tiêu chuẩn</strong> — Thời gian 3-5 ngày làm việc. Phí: {settings?.defaultShippingFee ? new Intl.NumberFormat('vi-VN').format(settings.defaultShippingFee) + '₫' : 'tùy khu vực'}.</li>
                        <li><strong>Giao hàng nhanh</strong> — Thời gian 1-2 ngày làm việc (phí cao hơn, tùy khu vực).</li>
                        <li><strong>Nhận hàng tại cửa hàng</strong> — Miễn phí, thời gian có thể thay đổi tùy cửa hàng.</li>
                    </ul>

                    <div>
                        {settings?.freeShippingThreshold ? (
                            <div><strong>Miễn phí giao hàng</strong> cho đơn hàng từ <strong>{new Intl.NumberFormat('vi-VN').format(settings.freeShippingThreshold)}₫</strong>.</div>
                        ) : null}

                        {settings?.businessHours && (<div>Giờ làm việc: {settings.businessHours}</div>)}

                        <div style={{ marginTop: 8 }}>
                            Liên hệ hỗ trợ giao hàng: {settings?.contactPhone ? <a href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}>{settings.contactPhone}</a> : settings?.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : '—'}
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                title="Chính sách đổi trả"
                open={isReturnPolicyOpen}
                onCancel={() => setIsReturnPolicyOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsReturnPolicyOpen(false)}>Đóng</Button>
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ marginBottom: 0 }}>
                        Khách hàng có thể đổi trả hàng trong <strong>{settings?.returnDays || 7} ngày</strong> kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn, chưa qua sử dụng và có hóa đơn / mã đơn hàng.
                    </p>

                    <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                        <li>Gửi yêu cầu đổi/trả kèm hình ảnh sản phẩm và mã đơn tới email hoặc hotline.</li>
                        <li>Sản phẩm phải còn nguyên tem, hộp, nhãn mác và không bị hư hỏng do người dùng.</li>
                        <li>Phí vận chuyển đổi/trả có thể được áp dụng theo chính sách cụ thể của từng trường hợp.</li>
                    </ul>

                    <div>
                        <div style={{ fontWeight: 700 }}>Cách thức yêu cầu đổi trả</div>
                        <div style={{ marginTop: 6 }}>
                            Liên hệ: {settings?.contactPhone ? <a href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}>{settings.contactPhone}</a> : settings?.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : '—'}
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                title="Chính sách bảo hành"
                open={isWarrantyOpen}
                onCancel={() => setIsWarrantyOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsWarrantyOpen(false)}>Đóng</Button>
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ marginBottom: 0 }}>
                        Sản phẩm được bảo hành trong <strong>{settings?.warrantyPeriod || '12 tháng'}</strong> kể từ ngày mua (tùy theo chính sách từng sản phẩm).
                    </p>

                    <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                        <li>Bảo hành cho lỗi chính hãng và lỗi kỹ thuật do nhà sản xuất.</li>
                        <li>Không bảo hành các lỗi do rơi vỡ, ngấm nước, sử dụng sai hướng dẫn hoặc hao mòn thông thường.</li>
                        <li>Vui lòng giữ hóa đơn hoặc mã đơn hàng làm căn cứ bảo hành.</li>
                        <li>Thời gian xử lý yêu cầu bảo hành thường là 7-14 ngày làm việc.</li>
                    </ul>

                    <div>
                        <div style={{ fontWeight: 700 }}>Liên hệ bảo hành</div>
                        <div style={{ marginTop: 6 }}>
                            {settings?.contactPhone && (<div>Điện thoại: <a href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}>{settings.contactPhone}</a></div>)}
                            {settings?.contactEmail && (<div>Email: <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></div>)}
                            {settings?.businessHours && (<div>Giờ làm việc: {settings.businessHours}</div>)}
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                title="Thông tin liên hệ"
                open={isContactOpen}
                onCancel={() => setIsContactOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsContactOpen(false)}>Đóng</Button>
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {settings?.contactPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PhoneOutlined />
                            <a href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}>{settings.contactPhone}</a>
                        </div>
                    )}

                    {settings?.contactEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MailOutlined />
                            <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                        </div>
                    )}

                    {settings?.contactAddress && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <EnvironmentOutlined style={{ marginTop: 6 }} />
                            <div dangerouslySetInnerHTML={{ __html: contactAddressHtml }} />
                        </div>
                    )}

                    <WrapperFooterSocial style={{ marginTop: 8 }}>
                        {(settings?.facebookUrl || settings?.facebookIcon) && (
                            (settings?.facebookUrl) ? (
                                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                    {settings?.facebookIcon ? (
                                        <img src={settings.facebookIcon} alt="Facebook" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                    ) : (
                                        <FacebookOutlined />
                                    )}
                                </a>
                            ) : (
                                <span aria-label="Facebook">
                                    {settings?.facebookIcon ? (
                                        <img src={settings.facebookIcon} alt="Facebook" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                    ) : (
                                        <FacebookOutlined />
                                    )}
                                </span>
                            )
                        )}

                        {(settings?.instagramUrl || settings?.instagramIcon) && (
                            (settings?.instagramUrl) ? (
                                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                    {settings?.instagramIcon ? (
                                        <img src={settings.instagramIcon} alt="Instagram" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                    ) : (
                                        <InstagramOutlined />
                                    )}
                                </a>
                            ) : (
                                <span aria-label="Instagram">
                                    {settings?.instagramIcon ? (
                                        <img src={settings.instagramIcon} alt="Instagram" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                    ) : (
                                        <InstagramOutlined />
                                    )}
                                </span>
                            )
                        )}

                        {(settings?.youtubeUrl || settings?.youtubeIcon) && (
                            (settings?.youtubeUrl) ? (
                                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                    {settings?.youtubeIcon ? (
                                        <img src={settings.youtubeIcon} alt="YouTube" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                    ) : (
                                        <YoutubeOutlined />
                                    )}
                                </a>
                            ) : (
                                <span aria-label="YouTube">
                                    {settings?.youtubeIcon ? (
                                        <img src={settings.youtubeIcon} alt="YouTube" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                    ) : (
                                        <YoutubeOutlined />
                                    )}
                                </span>
                            )
                        )}

                        {(settings?.tiktokUrl || settings?.tiktokIcon) && (
                            (settings?.tiktokUrl) ? (
                                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="tiktok">
                                    {settings?.tiktokIcon ? (
                                        <img src={settings.tiktokIcon} alt="TikTok" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                    ) : (
                                        <TikTokIcon />
                                    )}
                                </a>
                            ) : (
                                <span aria-label="TikTok" className="tiktok">
                                    {settings?.tiktokIcon ? (
                                        <img src={settings.tiktokIcon} alt="TikTok" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                    ) : (
                                        <TikTokIcon />
                                    )}
                                </span>
                            )
                        )}
                    </WrapperFooterSocial>
                </div>
            </Modal>
        </WrapperFooter>
    );
};

export default FooterComponent;
