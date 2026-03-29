import { Badge, Menu } from 'antd'
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  UserOutlined,
  ProductOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TagsOutlined,
  GiftOutlined,
  FileExcelOutlined,
  BgColorsOutlined,
  DashboardOutlined,
  CommentOutlined,
  NotificationOutlined,
  AppstoreAddOutlined,
  TruckOutlined,
  DatabaseOutlined,
  TeamOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getItem } from '../../utils';
import { hasModuleAccess, hasPermission } from '../../utils/permissionUtils';
import AdminUser from '../../components/AdminUser/AdminUser';
import AdminProduct from '../../components/AdminProduct/AdminProduct';
import OrderAdmin from '../../components/OrderAdmin/OrderAdmin';
import AdminCategory from '../../components/AdminCategory/AdminCategory';
import AdminBrand from '../../components/AdminBrand/AdminBrand';
import AdminCollection from '../../components/AdminCollection/AdminCollection';
import AdminPromotion from '../../components/AdminPromotion/AdminPromotion';
import AdminAttribute from '../../components/AdminAttribute/AdminAttribute';
import AdminAnalytics from '../../components/AdminAnalytics/AdminAnalytics';
import AdminReview from '../../components/AdminReview/AdminReview';
import AdminBanner from '../../components/AdminBanner/AdminBanner';
import AdminShipping from '../../components/AdminShipping/AdminShipping';
import AdminWarehouse from '../../components/AdminWarehouse/AdminWarehouse';
import AdminSupplier from '../../components/AdminSupplier/AdminSupplier';
import AdminSupport from '../../components/AdminSupport/AdminSupport';
import AdminSettings from '../../components/AdminSettings/AdminSettings';
import AdminRolePermission from '../../components/AdminRolePermission/AdminRolePermission';
import * as SupportRequestService from '../../services/SupportRequestService';
import * as OrderService from '../../services/OrderService';
import {
  AdminContainer,
  Sidebar,
  SidebarHeader,
  StyledMenu,
  ContentArea,
  ContentCard
} from './style';

const AdminPage = () => {
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const isAdmin = user?.isAdmin;

  // Badge counts (pending complaints / new orders)
  const { data: supportBadgeData } = useQuery({
    queryKey: ['support-badge'],
    queryFn: () => SupportRequestService.getAllSupportRequests(
      { status: 'PENDING', limit: 1, page: 1 },
      user?.access_token
    ),
    enabled: !!user?.access_token && !!isAdmin,
    staleTime: 30_000
  });

  const { data: orderBadgeData } = useQuery({
    queryKey: ['order-badge'],
    queryFn: () => OrderService.getAllOrder(user?.access_token),
    enabled: !!user?.access_token && !!isAdmin,
    staleTime: 30_000
  });

  const pendingSupportCount = supportBadgeData?.total || 0;
  const newOrderCount = (orderBadgeData?.data || []).filter(o =>
    ['pending', 'confirmed', 'processing'].includes(o.status)
  ).length;

  const badgeCounts = {
    support: pendingSupportCount,
    order: newOrderCount
  };

  const renderLabelWithBadge = (label, key) => {
    const count = badgeCounts[key] || 0;
    if (!count) return label;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>{label}</span>
        <Badge dot count={count} size="small" style={{ background: '#ff4d4f' }} />
      </span>
    );
  };

  // Mapping menu items với permissions required
  const menuItemsConfig = [
    { key: 'analytics', label: 'Thống kê', icon: <DashboardOutlined />, module: 'analytics', requiredPermission: 'analytics.read' },
    { key: 'support', label: 'Hỗ trợ / Khiếu nại', icon: <CustomerServiceOutlined />, module: 'support-request', requiredPermission: 'support-request.read' },
    {
      key: 'product-management',
      label: 'Quản lý Sản phẩm',
      icon: <ProductOutlined />,
      children: [
        { key: 'product', label: 'Sản phẩm', icon: <ProductOutlined />, module: 'product', requiredPermission: 'product.read' },
        { key: 'category', label: 'Danh mục', icon: <AppstoreOutlined />, module: 'category', requiredPermission: 'category.read' },
        { key: 'brand', label: 'Thương hiệu', icon: <ShopOutlined />, module: 'brand', requiredPermission: 'brand.read' },
        { key: 'collection', label: 'Bộ sưu tập', icon: <TagsOutlined />, module: 'collection', requiredPermission: 'collection.read' },
        { key: 'attribute', label: 'Thuộc tính', icon: <BgColorsOutlined />, module: 'attribute', requiredPermission: 'attribute.read' },
        { key: 'review', label: 'Đánh giá', icon: <CommentOutlined />, module: 'review', requiredPermission: 'review.read' },
      ]
    },
    {
      key: 'marketing',
      label: 'Marketing',
      icon: <GiftOutlined />,
      children: [
        { key: 'promotion', label: 'Khuyến mãi', icon: <GiftOutlined />, module: 'promotion', requiredPermission: 'promotion.read' },
        { key: 'banner', label: 'Thông báo / Banner', icon: <NotificationOutlined />, module: 'banner', requiredPermission: 'banner.read' },
      ]
    },
    {
      key: 'order-management',
      label: 'Quản lý Đơn hàng',
      icon: <ShoppingCartOutlined />,
      children: [
        { key: 'order', label: 'Đơn hàng', icon: <ShoppingCartOutlined />, module: 'order', requiredPermission: 'order.read' },
        { key: 'shipping', label: 'Quản lý Vận chuyển', icon: <TruckOutlined />, module: 'shipping', requiredPermission: 'shipping.read' },
      ]
    },
    {
      key: 'inventory',
      label: 'Kho & Nhà cung cấp',
      icon: <DatabaseOutlined />,
      children: [
        { key: 'warehouse', label: 'Quản lý Kho hàng', icon: <DatabaseOutlined />, module: 'warehouse', requiredPermission: 'warehouse.read' },
        { key: 'supplier', label: 'Quản lý Nhà cung cấp', icon: <TeamOutlined />, module: 'supplier', requiredPermission: 'supplier.read' },
      ]
    },
    { key: 'user', label: 'Người dùng', icon: <UserOutlined />, module: 'user', requiredPermission: 'user.read' },
    {
      key: 'system',
      label: 'Hệ thống',
      icon: <SettingOutlined />,
      children: [
        { key: 'role-permission', label: 'Phân quyền / Vai trò', icon: <SafetyOutlined />, module: 'role', requiredPermission: 'role.read' },
        { key: 'settings', label: 'Cài đặt hệ thống', icon: <SettingOutlined />, module: 'settings', requiredPermission: 'settings.read' },
      ]
    },
  ];

  const [keySelected, setKeySelected] = useState('analytics')

  // Filter menu items dựa trên permissions
  const items = useMemo(() => {
    const checkPermission = (item) => {
      // Nếu item là group (không có module/permission) -> kiểm tra children
      if (item.children) {
        return item.children.some(child => checkPermission(child));
      }
      // Super admin có tất cả quyền
      if (isAdmin) return true;
      // Normal user
      return hasModuleAccess(user, item.module) || hasPermission(user, item.requiredPermission);
    };

    const mapItem = (item) => {
      if (item.children) {
        // Filter children
        const filteredChildren = item.children.filter(checkPermission).map(mapItem);
        // Only return group if it has accessible children
        if (filteredChildren.length === 0) return null;
        return getItem(item.label, item.key, item.icon, filteredChildren);
      }
      return getItem(renderLabelWithBadge(item.label, item.key), item.key, item.icon);
    };

    return menuItemsConfig
      .filter((_) => true) // Initial Top Level Filter if needed
      .map(mapItem)
      .filter(Boolean); // Remove nulls
  }, [user, badgeCounts.support, badgeCounts.order, isAdmin]);

  // Nếu không có items nào, set default
  useEffect(() => {
    const isKeyInItems = (itemList, key) => {
      return itemList.some(item => {
        if (item.key === key) return true;
        if (item.children) return isKeyInItems(item.children, key);
        return false;
      });
    };

    if (items.length > 0 && !isKeyInItems(items, keySelected)) {
      setKeySelected(items[0].key);
    }
  }, [items, keySelected]);

  // Scroll về đầu trang khi component mount hoặc khi chuyển tab
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [keySelected])

  // Scroll về đầu trang khi vào trang admin lần đầu
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  const renderPage = (key) => {
    switch (key) {
      case 'analytics':
        return (
          <AdminAnalytics />
        )
      case 'support':
        return (
          <AdminSupport />
        )
      case 'user':
        return (
          <AdminUser />
        )
      case 'product':
        return (
          <AdminProduct />
        )
      case 'category':
        return (
          <AdminCategory />
        )
      case 'brand':
        return (
          <AdminBrand />
        )
      case 'collection':
        return (
          <AdminCollection />
        )
      case 'attribute':
        return (
          <AdminAttribute />
        )
      case 'promotion':
        return (
          <AdminPromotion />
        )
      case 'banner':
        return (
          <AdminBanner />
        )
      case 'order':
        return (
          <OrderAdmin />
        )
      case 'review':
        return (
          <AdminReview />
        )
      case 'shipping':
        return (
          <AdminShipping />
        )
      case 'warehouse':
        return (
          <AdminWarehouse />
        )
      case 'supplier':
        return (
          <AdminSupplier />
        )
      case 'role-permission':
        return (
          <AdminRolePermission />
        )
      case 'settings':
        return (
          <AdminSettings />
        )
      default:
        return <AdminAnalytics />
    }

  }


  const handleOnClick = ({ key }) => {

    setKeySelected(key)

  }
  return (
    <AdminContainer>
      <Sidebar>
        <SidebarHeader>
          <div className="logo" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <AppstoreAddOutlined />
            </div>
            <div>
              <div>WALKZY</div>
              <div className="subtitle">Admin Dashboard</div>
            </div>
          </div>
        </SidebarHeader>
        <StyledMenu
          mode="inline"
          defaultSelectedKeys={['analytics']}
          selectedKeys={[keySelected]}
          items={items}
          onClick={handleOnClick}
        />
      </Sidebar>
      <ContentArea>
        <ContentCard>
          {renderPage(keySelected)}
        </ContentCard>
      </ContentArea>
    </AdminContainer>
  );
};

export default AdminPage;
