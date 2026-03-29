import React, { useEffect, useState, useRef } from 'react';
import { Badge, Popover, Input, Drawer } from 'antd';
import {
    BellOutlined,
    HeartOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import * as CategoryService from '../../services/CategoryService';
import * as ProductService from '../../services/ProductService';
import * as CollectionService from '../../services/CollectionService';
import * as UserService from '../../services/UserService';
import * as NotificationService from '../../services/NotificationService';
import * as WishlistService from '../../services/WishlistService';
import { resetUser } from '../../redux/slides/userSlide';
import { searchProduct } from '../../redux/slides/productSlide';
import { removeorderProduct, clearCart } from '../../redux/slides/orderSlide';
import { convertPrice, getPlaceholderImage } from '../../utils';
import {
    WrapperHeaderContainer,
    WrapperMainHeader,
    WrapperLogo,
    WrapperSearchContainer,
    WrapperNavMenu,
    WrapperNavItem,
    WrapperActionBar,
    HeaderLink,
    CartButton,
    WrapperMobileMenuButton,
    WrapperCartDropdown,
    WrapperCartItem,
    HeaderDivider
} from './enhancedStyle';

const { Search } = Input;

const EnhancedHeaderComponent = ({ isHiddenSearch = false, isHiddenCart = false }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);
    const order = useSelector((state) => state.order);

    const [searchValue, setSearchValue] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [, setCategories] = useState([]);
    const [, setCollections] = useState([]);
    const [hasTokenError, setHasTokenError] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);


    const searchInputRef = useRef(null);
    const suggestionsRef = useRef(null);
    const handleWishlistSync = () => {
        try {
            const list = WishlistService.getWishlist();
            setWishlistCount(Array.isArray(list) ? list.length : 0);
        } catch (error) {
            console.error('Wishlist load error:', error);
            setWishlistCount(0);
        }
    };

    useEffect(() => {
        handleWishlistSync();
        const listener = () => handleWishlistSync();
        window.addEventListener('storage', listener);
        window.addEventListener('wishlist-updated', listener);
        return () => {
            window.removeEventListener('storage', listener);
            window.removeEventListener('wishlist-updated', listener);
        };
    }, []);

    const { data: notificationsData, refetch: refetchNotifications } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            try {
                const result = await NotificationService.getAllNotifications(user?.id);
                setHasTokenError(false);
                return result;
            } catch (error) {
                if (error?.response?.status === 401) {
                    setHasTokenError(true);
                    return { data: [] };
                }
                throw error;
            }
        },
        enabled: !!user?.id && !!user?.access_token && !hasTokenError,
        refetchInterval: hasTokenError ? false : 30000,
        refetchIntervalInBackground: false,
        staleTime: 10000,
        retry: false,
        retryOnMount: false,
        onError: (error) => {
            if (error?.response?.status === 401) setHasTokenError(true);
        }
    });

    const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery({
        queryKey: ['unread-count', user?.access_token],
        queryFn: async () => {
            try {
                const result = await NotificationService.getUnreadCount(user?.access_token);
                setHasTokenError(false);
                return result;
            } catch (error) {
                if (error?.response?.status === 401) {
                    setHasTokenError(true);
                    return { data: 0 };
                }
                throw error;
            }
        },
        enabled: !!user?.access_token && !!user?.id && !hasTokenError,
        refetchInterval: hasTokenError ? false : 30000,
        refetchIntervalInBackground: false,
        staleTime: 10000,
        retry: false,
        retryOnMount: false,
        refetchOnWindowFocus: false,
        onError: (error) => {
            if (error?.response?.status === 401) setHasTokenError(true);
        }
    });

    useEffect(() => {
        if (user?.access_token && user?.id) setHasTokenError(false);
        else setHasTokenError(true);
    }, [user?.access_token, user?.id]);

    const { data: suggestionsData } = useQuery({
        queryKey: ['search-suggestions', searchDebounce],
        queryFn: () => ProductService.getSearchSuggestions(searchDebounce),
        enabled: !!(searchDebounce && searchDebounce.trim().length >= 1),
        staleTime: 1000,
        retry: false
    });

    const { data: productsData } = useQuery({
        queryKey: ['search-products-autocomplete', searchDebounce],
        queryFn: () => ProductService.searchProductsAutocomplete(searchDebounce, 4),
        enabled: !!(searchDebounce && searchDebounce.trim().length >= 1),
        staleTime: 500,
        retry: false,
        refetchOnWindowFocus: false
    });

    const notifications = notificationsData?.data || [];
    const unreadCount = unreadCountData?.data || 0;

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => CategoryService.getAllCategory(),
        staleTime: 30 * 60 * 1000,
        cacheTime: 60 * 60 * 1000
    });

    const { data: collectionsData } = useQuery({
        queryKey: ['collections'],
        queryFn: () => CollectionService.getAllCollection(),
        staleTime: 30 * 60 * 1000,
        cacheTime: 60 * 60 * 1000
    });

    useEffect(() => {
        if (categoriesData?.data) {
            setCategories(categoriesData.data.filter((c) => c.isActive));
        }
    }, [categoriesData]);

    useEffect(() => {
        if (collectionsData?.data) {
            setCollections(collectionsData.data.filter((c) => c.isActive && c.isTrending));
        }
    }, [collectionsData]);

    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounce(searchValue), 250);
        return () => clearTimeout(timer);
    }, [searchValue]);

    useEffect(() => {
        const hasSuggestions = suggestionsData?.suggestions?.length > 0;
        const hasProducts = productsData?.data?.length > 0;
        setShowSuggestions((hasSuggestions || hasProducts) && searchValue.trim().length > 0);
    }, [suggestionsData, productsData, searchValue]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target) &&
                searchInputRef.current &&
                !searchInputRef.current.input.contains(e.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (value) => {
        if (value && value.trim()) {
            const keyword = value.trim();
            dispatch(searchProduct(keyword));
            navigate(`/product?search=${encodeURIComponent(keyword)}`);
            setSearchValue('');
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        const keyword = suggestion.keyword || suggestion.label;
        if (!keyword) return;
        dispatch(searchProduct(keyword));
        navigate(`/product?search=${encodeURIComponent(keyword)}`);
        setSearchValue('');
        setShowSuggestions(false);
    };

    const handleLogout = async () => {
        try {
            await UserService.logoutUser();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // cleanup session-scoped tokens
            import('../../utils/sessionToken').then(mod => {
                mod.removeAccessToken();
                mod.removeRefreshToken();
            }).catch(() => {
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('refresh_token');
            });

            dispatch(resetUser());
            dispatch(clearCart());
            setIsAccountOpen(false);
            navigate('/sign-in');
        }
    };

    const handleRemoveFromCart = (item) => {
        const idProduct = item?.product || item;
        const variation = item?.variation;
        dispatch(removeorderProduct({ idProduct, variation }));
    };

    const calculateCartTotal = () =>
        order?.orderItems?.reduce((t, item) => t + item.price * item.amount, 0) || 0;

    const scrollToSection = (sectionId) => {
        const goScroll = () => {
            const element = document.getElementById(sectionId);
            if (!element) return;
            const headerHeight = 90;
            const top = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            window.scrollTo({ top, behavior: 'smooth' });
        };

        if (window.location.pathname !== '/') {
            navigate('/');
            setTimeout(goScroll, 500);
        } else {
            goScroll();
        }
    };

    const navItems = [
        { label: 'Flash Sale', sectionId: 'flash-sale' },
        { label: 'Danh mục nổi bật', sectionId: 'featured-categories' },
        { label: 'Sản phẩm mới', sectionId: 'new-products' },
        { label: 'Sản phẩm bán chạy', sectionId: 'best-selling' },
        { label: 'Bộ sưu tập', sectionId: 'collections' },
        { label: 'Sản phẩm yêu thích', sectionId: 'most-favorite' }
    ];

    const handleMarkAsRead = async (id) => {
        try {
            await NotificationService.markAsRead(id, user?.access_token);
            refetchNotifications();
            refetchUnreadCount();
        } catch (error) {
            console.error('Error mark read:', error);
        }
    };

    const notificationContent = (
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {notifications.length ? (
                notifications.map((n) => (
                    <div
                        key={n._id}
                        onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n._id);
                            if (n.link) {
                                navigate(n.link);
                                setIsNotificationOpen(false);
                            }
                        }}
                        style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            background: n.isRead ? '#fff' : '#f0f7ff'
                        }}
                    >
                        <div
                            style={{
                                fontWeight: n.isRead ? 500 : 700,
                                marginBottom: 4,
                                fontSize: 14
                            }}
                        >
                            {n.title}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>{n.message}</div>
                    </div>
                ))
            ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                    Chưa có thông báo nào
                </div>
            )}
        </div>
    );

    const accountContent = (
        <div style={{ minWidth: 220 }}>
            <div
                style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                onClick={() => {
                    navigate('/profile-user');
                    setIsAccountOpen(false);
                }}
            >
                Thông tin tài khoản
            </div>
            <div
                style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                onClick={() => {
                    navigate('/my-order', { state: { id: user?.id, token: user?.access_token } });
                    setIsAccountOpen(false);
                }}
            >
                Đơn hàng của tôi
            </div>
            {(user?.isAdmin || user?.roleId) && (
                <div
                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                    onClick={() => {
                        navigate('/system/admin');
                        setIsAccountOpen(false);
                    }}
                >
                    Quản trị hệ thống
                </div>
            )}
            <div
                style={{ padding: '10px 16px', cursor: 'pointer', color: '#ff4d4f' }}
                onClick={handleLogout}
            >
                Đăng xuất
            </div>
        </div>
    );

    const cartContent = (
        <WrapperCartDropdown>
            {order?.orderItems?.length ? (
                <>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {order.orderItems.map((item) => (
                            <WrapperCartItem key={item.product}>
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                        width: 60,
                                        height: 60,
                                        objectFit: 'cover',
                                        borderRadius: 6
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                                        {item.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                        Số lượng: <strong>{item.amount}</strong>
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#ee4d2d', fontSize: 14 }}>
                                        {convertPrice(item.price * item.amount)}
                                    </div>
                                </div>
                                <div
                                    style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: 18, padding: '0 4px' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFromCart(item);
                                    }}
                                >
                                    ×
                                </div>
                            </WrapperCartItem>
                        ))}
                    </div>
                    <div style={{ padding: 14, borderTop: '1px solid #f0f0f0' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                                fontWeight: 600
                            }}
                        >
                            <span>Tổng tiền:</span>
                            <span style={{ color: '#ee4d2d' }}>{convertPrice(calculateCartTotal())}</span>
                        </div>
                        <button
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: '#1890ff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                            onClick={() => {
                                navigate('/order');
                                setIsCartOpen(false);
                            }}
                        >
                            Xem giỏ hàng
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                    Giỏ hàng trống
                </div>
            )}
        </WrapperCartDropdown>
    );

    const hasSuggestions =
        (suggestionsData?.suggestions && suggestionsData.suggestions.length > 0) ||
        (productsData?.data && productsData.data.length > 0);

    return (
        <WrapperHeaderContainer data-scrolled={isScrolled}>
            {/* HÀNG LOGO – SEARCH – ACTION */}
            <WrapperMainHeader>
                <div>
                    <WrapperLogo onClick={() => navigate('/')}>
                        <span>WALKZY</span>
                    </WrapperLogo>

                    {!isHiddenSearch && (
                        <WrapperSearchContainer>
                            <Search
                                ref={searchInputRef}
                                placeholder="Bạn cần tìm gì..."
                                enterButton={<SearchOutlined />}
                                value={searchValue}
                                onChange={(e) => {
                                    setSearchValue(e.target.value);
                                    if (e.target.value.trim().length > 0) setShowSuggestions(true);
                                }}
                                onSearch={handleSearch}
                                onFocus={() => {
                                    if (hasSuggestions) setShowSuggestions(true);
                                }}
                            />
                            {showSuggestions && hasSuggestions && (
                                <div
                                    ref={suggestionsRef}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        backgroundColor: '#fff',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: 6,
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                                        zIndex: 1400,
                                        maxHeight: 450,
                                        overflowY: 'auto',
                                        marginTop: 4,
                                        padding: '6px 0'
                                    }}
                                >
                                    {productsData?.data?.map((product) => (
                                        <div
                                            key={product._id}
                                            style={{
                                                padding: '8px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                dispatch(searchProduct(product.name));
                                                navigate(`/product-details/${product._id}`);
                                                setSearchValue('');
                                                setShowSuggestions(false);
                                            }}
                                        >
                                            <img
                                                src={
                                                    product.image ||
                                                    (product.images && product.images[0]) ||
                                                    getPlaceholderImage()
                                                }
                                                alt={product.name}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    objectFit: 'cover',
                                                    borderRadius: 4
                                                }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 500,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {product.name}
                                                </div>
                                                <div style={{ fontSize: 13, color: '#ee4d2d' }}>
                                                    {convertPrice(product.price)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {suggestionsData?.suggestions?.map((sug, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                fontSize: 14
                                            }}
                                            onClick={() => handleSuggestionClick(sug)}
                                        >
                                            {sug.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </WrapperSearchContainer>
                    )}

                    <WrapperActionBar>
                        {user?.access_token && (
                            <Popover
                                content={notificationContent}
                                trigger="click"
                                open={isNotificationOpen}
                                onOpenChange={setIsNotificationOpen}
                                placement="bottomRight"
                            >
                                <HeaderLink>
                                    <Badge count={unreadCount} size="small" offset={[0, -4]}>
                                        <BellOutlined className="icon" />
                                    </Badge>
                                    <span>Thông báo</span>
                                </HeaderLink>
                            </Popover>
                        )}

                        <HeaderLink onClick={() => navigate('/wishlist')}>
                            <Badge count={wishlistCount} size="small" offset={[0, -4]}>
                                <HeartOutlined className="icon" />
                            </Badge>
                            <span>Yêu thích</span>
                        </HeaderLink>

                        {!isHiddenCart && (
                            <Popover
                                content={cartContent}
                                trigger="hover"
                                open={isCartOpen}
                                onOpenChange={setIsCartOpen}
                                placement="bottomRight"
                                overlayStyle={{ width: 380 }}
                            >
                                <CartButton onClick={() => navigate('/order')}>
                                    <Badge count={order?.orderItems?.length || 0} size="small" offset={[0, -4]}>
                                        <ShoppingCartOutlined className="icon" />
                                    </Badge>
                                    <span>Giỏ hàng</span>
                                </CartButton>
                            </Popover>
                        )}

                        {user?.access_token ? (
                            <Popover
                                content={accountContent}
                                trigger="click"
                                open={isAccountOpen}
                                onOpenChange={setIsAccountOpen}
                                placement="bottomRight"
                            >
                                <HeaderLink>
                                    {user?.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="avatar"
                                            style={{
                                                width: 26,
                                                height: 26,
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <UserOutlined className="icon" />
                                    )}
                                    <span>{user?.name || user?.email || 'Tài khoản'}</span>
                                </HeaderLink>
                            </Popover>
                        ) : (
                            <HeaderLink onClick={() => navigate('/sign-in')}>
                                <UserOutlined className="icon" />
                                <span>Đăng nhập</span>
                            </HeaderLink>
                        )}
                    </WrapperActionBar>
                </div>
            </WrapperMainHeader>

            {/* NAV MENU GIỮ NHƯ CŨ (nếu cần) */}
            <WrapperNavMenu>
                <div>
                    <WrapperMobileMenuButton onClick={() => setIsMobileMenuOpen(true)}>
                        Danh mục
                    </WrapperMobileMenuButton>
                    {navItems.map((item) => (
                        <WrapperNavItem
                            key={item.sectionId}
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection(item.sectionId);
                            }}
                        >
                            {item.label}
                        </WrapperNavItem>
                    ))}
                </div>
            </WrapperNavMenu>

            <Drawer
                title="Danh mục sản phẩm"
                placement="left"
                onClose={() => setIsMobileMenuOpen(false)}
                open={isMobileMenuOpen}
            >
                {navItems.map((item) => (
                    <div
                        key={item.sectionId}
                        style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            scrollToSection(item.sectionId);
                            setIsMobileMenuOpen(false);
                        }}
                    >
                        {item.label}
                    </div>
                ))}
            </Drawer>

            {/* Divider between header and page content */}
            <HeaderDivider />
        </WrapperHeaderContainer>
    );
};

export default EnhancedHeaderComponent;
