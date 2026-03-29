import React, { useState } from 'react';
import { Card, Row, Col, Select, Statistic, Table, Tag, Progress } from 'antd';
import { DatabaseOutlined, WarningOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import * as AnalyticsService from '../../services/AnalyticsService';
import * as UserService from '../../services/UserService';
import * as PromotionService from '../../services/PromotionService';
import * as ReviewService from '../../services/ReviewService';
import { WrapperHeader } from '../AdminCategory/style';
import { convertPrice } from '../../utils';
import Loading from '../LoadingComponent/Loading';

const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminAnalytics = () => {
    const user = useSelector((state) => state?.user);
    const [revenuePeriod, setRevenuePeriod] = useState('day');
    const [customerPeriod, setCustomerPeriod] = useState('month');
    const [cancellationPeriod, setCancellationPeriod] = useState('month');
    const [aiMode, setAiMode] = useState('compact'); // compact | detailed
    const [showAllInsights, setShowAllInsights] = useState(false);
    const [showAllActions, setShowAllActions] = useState(false);

    const { data: aiInsightsCompact, isPending: isPendingAICompact } = useQuery({
        queryKey: ['analytics-ai-assistant', 'compact'],
        queryFn: () => AnalyticsService.getAIAnalyticsInsights(user?.access_token, 'compact'),
        enabled: !!user?.access_token
    });

    const { data: aiInsightsDetailed, isPending: isPendingAIDetailed } = useQuery({
        queryKey: ['analytics-ai-assistant', 'detailed'],
        queryFn: () => AnalyticsService.getAIAnalyticsInsights(user?.access_token, 'detailed'),
        enabled: !!user?.access_token && aiMode === 'detailed'
    });

    // Fetch dashboard overview
    const { data: overviewData } = useQuery({
        queryKey: ['analytics-overview'],
        queryFn: () => AnalyticsService.getDashboardOverview(user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch revenue statistics
    const { data: revenueData, isPending: isPendingRevenue } = useQuery({
        queryKey: ['analytics-revenue', revenuePeriod],
        queryFn: () => AnalyticsService.getRevenueStatistics(revenuePeriod, user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch best selling products
    const { data: bestSellingData, isPending: isPendingBestSelling } = useQuery({
        queryKey: ['analytics-best-selling'],
        queryFn: () => AnalyticsService.getBestSellingProducts(10, user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch cancellation rate
    const { data: cancellationData, isPending: isPendingCancellation } = useQuery({
        queryKey: ['analytics-cancellation', cancellationPeriod],
        queryFn: () => AnalyticsService.getCancellationRate(cancellationPeriod, user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch new customers
    const { data: customersData, isPending: isPendingCustomers } = useQuery({
        queryKey: ['analytics-customers', customerPeriod],
        queryFn: () => AnalyticsService.getNewCustomersStatistics(customerPeriod, user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch inventory
    const { data: inventoryData, isPending: isPendingInventory } = useQuery({
        queryKey: ['analytics-inventory'],
        queryFn: () => AnalyticsService.getInventoryStatistics(user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch order heatmap
    const { data: heatmapData, isPending: isPendingHeatmap } = useQuery({
        queryKey: ['analytics-heatmap'],
        queryFn: () => AnalyticsService.getOrderTimeHeatmap(user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch user statistics for top buyers
    const { data: userStatistics } = useQuery({
        queryKey: ['user-statistics'],
        queryFn: () => UserService.getUserStatistics(user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch top provinces by orders
    const { data: topProvincesData, isPending: isPendingTopProvinces } = useQuery({
        queryKey: ['analytics-top-provinces'],
        queryFn: () => AnalyticsService.getTopProvincesByOrders(10, user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch top brands
    const { data: topBrandsData, isPending: isPendingTopBrands } = useQuery({
        queryKey: ['analytics-top-brands'],
        queryFn: () => AnalyticsService.getTopBrandsByOrders(10, user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch top categories
    const { data: topCategoriesData, isPending: isPendingTopCategories } = useQuery({
        queryKey: ['analytics-top-categories'],
        queryFn: () => AnalyticsService.getTopCategoriesByOrders(10, user?.access_token),
        enabled: !!user?.access_token
    });

    // Fetch active promotions
    const { data: activePromotions, isPending: isPendingPromotions } = useQuery({
        queryKey: ['analytics-promotions'],
        queryFn: () => PromotionService.getActivePromotions(),
        enabled: true
    });

    // Fetch review statistics
    const { data: reviewStats, isPending: isPendingReviews } = useQuery({
        queryKey: ['analytics-review-stats'],
        queryFn: () => ReviewService.getReviewStatistics(user?.access_token),
        enabled: !!user?.access_token
    });

    // Format revenue data for chart
    const formatRevenueData = () => {
        if (!revenueData?.data) return [];
        return revenueData.data.map(item => ({
            date: item._id,
            revenue: item.revenue,
            orders: item.orderCount
        }));
    };

    // Format customer data for chart
    const formatCustomerData = () => {
        if (!customersData?.data?.timeline) return [];
        return customersData.data.timeline.map(item => ({
            period: item._id,
            count: item.count
        }));
    };

    // Format inventory data for pie chart
    const formatInventoryPieData = () => {
        if (!inventoryData?.data?.byLevel) return [];
        const labels = {
            'out_of_stock': 'Hết hàng',
            'low_stock': 'Tồn kho thấp',
            'medium_stock': 'Tồn kho trung bình',
            'high_stock': 'Tồn kho cao'
        };
        return inventoryData.data.byLevel.map(item => ({
            name: labels[item._id] || item._id,
            value: item.count,
            stock: item.totalStock
        }));
    };

    // Format heatmap data for table visualization
    const formatHeatmapData = () => {
        if (!heatmapData?.data) return { tableData: [], maxCount: 0 };
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const hours = Array.from({ length: 24 }, (_, i) => i);

        let maxCount = 0;
        const tableData = days.map((day, dayIndex) => {
            const row = { day, dayIndex };
            hours.forEach(hour => {
                const dataPoint = heatmapData.data.find(
                    d => d.day === day && d.hour === hour
                );
                const count = dataPoint ? dataPoint.count : 0;
                row[hour] = count;
                if (count > maxCount) maxCount = count;
            });
            return row;
        });

        return { tableData, maxCount };
    };

    // Best selling products table columns
    const bestSellingColumns = [
        {
            title: 'STT',
            key: 'index',
            render: (_, __, index) => index + 1,
            width: 60
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'productImage',
            key: 'productImage',
            width: 80,
            render: (image) => (
                <img
                    src={image || '/placeholder.png'}
                    alt="product"
                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                />
            )
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'productName',
            key: 'productName'
        },
        {
            title: 'Đã bán',
            dataIndex: 'totalSold',
            key: 'totalSold',
            render: (value) => `${value} sản phẩm`,
            sorter: (a, b) => a.totalSold - b.totalSold
        },
        {
            title: 'Doanh thu',
            dataIndex: 'totalRevenue',
            key: 'totalRevenue',
            render: (value) => convertPrice(value),
            sorter: (a, b) => a.totalRevenue - b.totalRevenue
        }
    ];

    const overview = overviewData?.data || {};
    const revenueChartData = formatRevenueData();
    const customerChartData = formatCustomerData();
    const inventoryPieData = formatInventoryPieData();
    const { tableData: heatmapTableData, maxCount: heatmapMaxCount } = formatHeatmapData();
    const bestSellingProducts = bestSellingData?.data || [];
    const totalBestSold = bestSellingProducts.reduce((s, p) => s + (p.totalSold || 0), 0);
    const totalBestRevenue = bestSellingProducts.reduce((s, p) => s + (p.totalRevenue || 0), 0);
    const topBestProduct = bestSellingProducts && bestSellingProducts.length ? bestSellingProducts[0] : null;

    // Helper function to get color intensity for heatmap
    const getHeatmapColor = (value, max) => {
        if (max === 0) return '#f0f0f0';
        const intensity = value / max;
        if (intensity === 0) return '#f0f0f0';
        if (intensity < 0.2) return '#d4edda';
        if (intensity < 0.4) return '#c3e6cb';
        if (intensity < 0.6) return '#b1dfbb';
        if (intensity < 0.8) return '#9fd4ab';
        return '#28a745';
    };

    // Calculate revenue change percentage
    const revenueChange = overview.month?.lastMonthRevenue
        ? (((overview.month.revenue - overview.month.lastMonthRevenue) / overview.month.lastMonthRevenue) * 100).toFixed(1)
        : 0;

    const formatNumber = (n) => (n || n === 0 ? Number(n).toLocaleString() : '0');
    const ordersThisMonth = overview.month?.orders || 0;
    const ordersLastMonth = overview.month?.lastMonthOrders || null;
    const ordersDelta = ordersLastMonth != null ? ordersThisMonth - ordersLastMonth : null;
    const ordersChange = ordersLastMonth != null ? (((ordersThisMonth - ordersLastMonth) / Math.max(1, ordersLastMonth)) * 100).toFixed(1) : null;

    const aiCompact = aiInsightsCompact?.data || {};
    const aiDetailed = aiInsightsDetailed?.data || {};
    const aiData = aiMode === 'compact' ? aiCompact : (aiDetailed.summary ? aiDetailed : aiCompact);
    const aiMetrics = aiData.metrics || aiCompact.metrics || {};
    const isPendingAI = aiMode === 'compact' ? isPendingAICompact : isPendingAIDetailed || isPendingAICompact;
    const kpiCardStyle = {
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
    };
    const kpiLabel = { color: '#6b7280', fontSize: 13 };
    const kpiValue = { fontSize: 18, fontWeight: 700, color: '#0f172a' };
    const truncate = (text = '', len = 90) => (text.length > len ? `${text.slice(0, len)}...` : text);

    const compactHighlights = aiCompact.keys || [];
    const detailedHighlights = aiDetailed.insights || aiData.insights || [];
    const highlightItems = aiMode === 'compact' ? compactHighlights : [...compactHighlights, ...detailedHighlights];
    const visibleHighlights = showAllInsights
        ? highlightItems
        : highlightItems.slice(0, aiMode === 'compact' ? 3 : 5);
    const compactRisks = aiCompact.risks || [];
    const detailedRisks = aiDetailed.riskAlerts || aiData.riskAlerts || [];
    const riskItems = aiMode === 'compact' ? compactRisks : [...compactRisks, ...detailedRisks];
    const visibleRisks = aiMode === 'compact' ? riskItems.slice(0, 2) : riskItems;
    const compactActions = aiCompact.actions || [];
    const detailedActions = aiDetailed.actions || [];
    const actionItems = aiMode === 'compact' ? compactActions : [...compactActions, ...detailedActions];
    const visibleActions = showAllActions ? actionItems : actionItems.slice(0, aiMode === 'compact' ? 3 : 5);
    const styles = {
        page: {
            background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
            padding: 12,
            borderRadius: 14
        },
        hero: {
            background: 'linear-gradient(120deg, #0ea5e9 0%, #6366f1 45%, #a855f7 100%)',
            color: '#fff',
            padding: '18px 20px',
            borderRadius: 16,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'stretch',
            gap: 16,
            marginBottom: 16,
            boxShadow: '0 22px 60px rgba(99,102,241,0.22)'
        },
        heroPill: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.14)',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            letterSpacing: 0.2
        },
        heroStat: {
            background: 'rgba(255,255,255,0.16)',
            borderRadius: 14,
            padding: '12px 14px',
            minWidth: 180
        },
        heroStatLabel: { fontSize: 12, opacity: 0.9 },
        heroStatValue: { fontSize: 22, fontWeight: 700, marginTop: 4 },
        card: {
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            background: '#fff',
            boxShadow: '0 18px 46px rgba(15,23,42,0.08)',
            overflow: 'hidden'
        },
        cardBody: { padding: 16 },
        sectionTitle: { fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' },
        sectionNote: { color: '#6b7280', fontSize: 13, marginTop: 2 },
        tile: {
            borderRadius: 14,
            padding: '14px 16px',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e5e7eb',
            boxShadow: '0 14px 38px rgba(15,23,42,0.08)'
        },
        tileLabel: { fontSize: 13, color: '#6b7280' },
        tileValue: { fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 6 }
    };

    return (
        <div style={styles.page}>
            <WrapperHeader>Thống kê & Báo cáo</WrapperHeader>

            {/* AI Business Assistant */}
            <Card
                title="Trợ lý kinh doanh AI"
                extra={
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Tag color="processing">Trợ lý dữ liệu</Tag>
                        <Select
                            size="small"
                            value={aiMode}
                            onChange={(v) => {
                                setAiMode(v);
                                setShowAllInsights(false);
                                setShowAllActions(false);
                            }}
                            style={{ width: 120 }}
                            options={[
                                { label: 'Chi tiết', value: 'detailed' },
                                { label: 'Gọn', value: 'compact' }
                            ]}
                        />
                    </div>
                }
                style={{ ...styles.card, marginTop: 16, marginBottom: 16 }}
                bodyStyle={styles.cardBody}
            >
                <Loading isPending={isPendingAI}>
                    {aiData.summary ? (
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={16}>
                                {/* Summary Box */}
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, #E0F7FF, #F3E8FF)',
                                        borderRadius: 12,
                                        padding: 16,
                                        marginBottom: 16,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    <h4 style={{ margin: 0, marginBottom: 8 }}>Tóm tắt</h4>
                                    <div style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                                        {aiMode === 'compact'
                                            ? truncate(aiData.summary.split('\n').slice(0, 2).join(' '), 140)
                                            : aiData.summary}
                                    </div>
                                </div>

                                {/* Key Insights */}
                                <div style={{ marginBottom: 16 }}>
                                    <h4 style={{ marginBottom: 10 }}>Những insight chính</h4>
                                    <Row gutter={[12, 12]}>
                                        {visibleHighlights.map((item, idx) => {
                                            const type = item.type;
                                            const bg =
                                                type === 'bad' ? '#FFECEC' : type === 'warning' ? '#FFF9DB' : '#E8FDEB';
                                            const borderColor =
                                                type === 'bad' ? '#EF4444' : type === 'warning' ? '#FACC15' : '#22C55E';
                                            return (
                                                <Col xs={24} sm={12} key={idx}>
                                                    <div
                                                        style={{
                                                            background: bg,
                                                            borderRadius: 10,
                                                            padding: 12,
                                                            border: `1px solid ${borderColor}`,
                                                            boxShadow: '0 6px 16px rgba(0,0,0,0.05)',
                                                            minHeight: 70
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                                            {item.icon ? `${item.icon} ` : ''}
                                                            {item.title || item.label || 'Insight'}
                                                        </div>
                                                        {item.detail || item.label ? (
                                                            <div style={{ lineHeight: 1.5, color: '#374151' }}>
                                                                {aiMode === 'compact'
                                                                    ? truncate(item.detail || item.label || '', 90)
                                                                    : item.detail || item.label || ''}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                    {highlightItems.length > visibleHighlights.length && (
                                        <div
                                            style={{ marginTop: 8, color: '#2563EB', cursor: 'pointer', fontWeight: 500 }}
                                            onClick={() => setShowAllInsights(!showAllInsights)}
                                        >
                                            {showAllInsights
                                                ? 'Thu gọn ▴'
                                                : `Xem thêm ${highlightItems.length - visibleHighlights.length} insight ▾`}
                                        </div>
                                    )}
                                </div>

                                {/* Top Overview */}
                                <div style={{ marginBottom: 16 }}>
                                    <h4 style={{ marginBottom: 8 }}>Tổng quan chính</h4>
                                    <Row gutter={[12, 12]}>
                                        <Col xs={24} sm={8}>
                                            <div style={kpiCardStyle}>
                                                <div style={kpiLabel}>Doanh thu hôm nay</div>
                                                <div style={kpiValue}>{convertPrice(aiMetrics.todayRevenue || 0)}</div>
                                            </div>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <div style={kpiCardStyle}>
                                                <div style={kpiLabel}>Doanh thu tháng</div>
                                                <div style={kpiValue}>{convertPrice(aiMetrics.monthRevenue || 0)}</div>
                                            </div>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <div style={kpiCardStyle}>
                                                <div style={kpiLabel}>Tỷ lệ hủy</div>
                                                <div style={kpiValue}>{Number(aiMetrics.cancelRate || 0).toFixed(2)}%</div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Forecast */}
                                <div
                                    style={{
                                        border: '1px solid #eaeaea',
                                        borderRadius: 12,
                                        padding: 14,
                                        marginBottom: 16,
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <h4 style={{ margin: 0, marginBottom: 6 }}>Dự báo 7 ngày</h4>
                                    <div style={{ lineHeight: 1.6 }}>
                                        {aiData.forecastText
                                            ? aiMode === 'compact'
                                                ? truncate(aiData.forecastText, 100)
                                                : aiData.forecastText
                                            : aiMode === 'compact'
                                                ? truncate(aiData.forecast || '', 100)
                                                : aiData.forecast || 'Chưa có dự báo.'}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ marginBottom: 16 }}>
                                    <h4 style={{ marginBottom: 8 }}>Hành động</h4>
                                    <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
                                        {visibleActions.map((act, idx) => (
                                            <li key={idx}>
                                                {typeof act === 'string' ? (
                                                    aiMode === 'compact' ? truncate(act, 80) : act
                                                ) : (
                                                    <>
                                                        <strong>{act.title || 'Hành động'}:</strong>{' '}
                                                        {aiMode === 'compact' ? truncate(act.detail || '', 90) : act.detail || ''}
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    {actionItems.length > visibleActions.length && (
                                        <div
                                            style={{ marginTop: 8, color: '#2563EB', cursor: 'pointer', fontWeight: 500 }}
                                            onClick={() => setShowAllActions(!showAllActions)}
                                        >
                                            {showAllActions ? 'Thu gọn ▴' : 'Xem thêm ▾'}
                                        </div>
                                    )}
                                </div>

                                {/* Risks */}
                                <div
                                    style={{
                                        background: '#FFECEC',
                                        borderRadius: 10,
                                        padding: 12,
                                        border: '1px solid #FECACA',
                                        marginBottom: 16
                                    }}
                                >
                                    <h4 style={{ marginBottom: 8 }}>Rủi ro</h4>
                                    <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
                                        {(visibleRisks || []).map((risk, idx) => {
                                            const severity = risk.level || risk.severity;
                                            const color =
                                                severity === 'high'
                                                    ? '#EF4444'
                                                    : severity === 'medium'
                                                        ? '#FACC15'
                                                        : '#FED7AA';
                                            return (
                                                <li key={idx}>
                                                    <Tag color={color} style={{ border: 'none', color: '#111', marginRight: 8 }}>
                                                        {severity || 'alert'}
                                                    </Tag>
                                                    {aiMode === 'compact'
                                                        ? truncate(
                                                            risk.text ||
                                                            risk.detail ||
                                                            (risk.title ? `${risk.title}: ${risk.detail || ''}` : ''),
                                                            90
                                                        )
                                                        : risk.text || risk.detail || (risk.title ? `${risk.title}: ${risk.detail || ''}` : '')}
                                                </li>
                                            );
                                        })}
                                        {(!visibleRisks || visibleRisks.length === 0) && <li>Không có rủi ro nổi bật.</li>}
                                    </ul>
                                </div>

                                {/* KPI Table - detailed */}
                                {aiMode !== 'compact' && (
                                    <div
                                        style={{
                                            border: '1px solid #eaeaea',
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            boxShadow: '0 6px 16px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1fr 1fr 2fr',
                                                background: '#f8fafc',
                                                padding: '10px 12px',
                                                fontWeight: 600,
                                                borderBottom: '1px solid #e5e7eb'
                                            }}
                                        >
                                            <div>KPI</div>
                                            <div>Hiện tại</div>
                                            <div>Mục tiêu</div>
                                            <div>Gợi ý</div>
                                        </div>
                                        {(aiData.kpiSuggestions || []).map((kpi, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '2fr 1fr 1fr 2fr',
                                                    padding: '10px 12px',
                                                    background: idx % 2 === 0 ? '#ffffff' : '#f9fafb'
                                                }}
                                            >
                                                <div>{kpi.kpi || 'KPI'}</div>
                                                <div>{kpi.current || 'N/A'}</div>
                                                <div>{kpi.target || 'N/A'}</div>
                                                <div>{kpi.comment || ''}</div>
                                            </div>
                                        ))}
                                        {(!aiData.kpiSuggestions || aiData.kpiSuggestions.length === 0) && (
                                            <div style={{ padding: '10px 12px' }}>Chưa có KPI gợi ý.</div>
                                        )}
                                    </div>
                                )}
                            </Col>
                            <Col xs={24} md={8}>
                                <Card
                                    size="small"
                                    title="Số liệu chính"
                                    bordered
                                    style={{ ...styles.card, boxShadow: 'none', background: '#f8fafc' }}
                                    bodyStyle={{ padding: 12 }}
                                >
                                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                                        <li>Doanh thu hôm nay: {convertPrice(aiMetrics.todayRevenue || 0)}</li>
                                        <li>Doanh thu tháng: {convertPrice(aiMetrics.monthRevenue || 0)}</li>
                                        <li>% so với tháng trước: {Number(aiMetrics.growthRate || 0).toFixed(1)}%</li>
                                        <li>Đơn hôm nay: {aiMetrics.orderToday || 0}</li>
                                        <li>Tổng khách hàng: {aiMetrics.customerCount || 0}</li>
                                        <li>Tỷ lệ hủy: {Number(aiMetrics.cancelRate || 0).toFixed(2)}%</li>
                                    </ul>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <div>Chưa có dữ liệu phân tích.</div>
                    )}
                </Loading>
            </Card>
            <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 20 }}>
                <Col xs={24} sm={12} md={6}>
                    <div style={styles.tile}>
                        <div style={styles.tileLabel}>Doanh thu hôm nay</div>
                        <div style={styles.tileValue}>{convertPrice(overview.today?.revenue || 0)}</div>
                        <div style={{ color: '#0ea5e9', fontSize: 12, marginTop: 4 }}>Cập nhật liên tục</div>
                    </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <div style={styles.tile}>
                        <div style={styles.tileLabel}>Đơn hàng hôm nay</div>
                        <div style={styles.tileValue}>{overview.today?.orders || 0}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                            <Tag color="geekblue" style={{ margin: 0 }}>Tuần: {overview.week?.orders || 0}</Tag>
                            <Tag color="green" style={{ margin: 0 }}>Tháng: {overview.month?.orders || 0}</Tag>
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <div style={styles.tile}>
                        <div style={styles.tileLabel}>Doanh thu tháng</div>
                        <div style={styles.tileValue}>{convertPrice(overview.month?.revenue || 0)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            <Tag color={revenueChange >= 0 ? 'green' : 'volcano'} style={{ margin: 0 }}>
                                {revenueChange >= 0 ? '+' : ''}{revenueChange}%
                            </Tag>
                            <span style={{ color: '#6b7280', fontSize: 12 }}>So với tháng trước</span>
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <div style={styles.tile}>
                        <div style={styles.tileLabel}>Tổng khách hàng</div>
                        <div style={styles.tileValue}>{overview.customers?.total || 0}</div>
                        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Đã đăng ký/đã mua</div>
                    </div>
                </Col>
            </Row>
            {/* Revenue Chart */}
            <Card
                title={
                    <div>
                        <div style={styles.sectionTitle}>Doanh thu theo thời gian</div>
                        <div style={styles.sectionNote}>Biểu đồ area thể hiện tốc độ tăng trưởng</div>
                    </div>
                }
                extra={
                    <Select
                        value={revenuePeriod}
                        onChange={setRevenuePeriod}
                        style={{ width: 140 }}
                        size="middle"
                    >
                        <Option value="day">Theo ngày</Option>
                        <Option value="week">Theo tuần</Option>
                        <Option value="month">Theo tháng</Option>
                    </Select>
                }
                style={{ ...styles.card, marginBottom: 20 }}
                bodyStyle={styles.cardBody}
            >
                <Loading isPending={isPendingRevenue}>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => convertPrice(value)} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#8884d8"
                                fill="#8884d8"
                                fillOpacity={0.6}
                                name="Doanh thu"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Loading>
            </Card>

            <Card
                title="Đơn hàng"
                style={{ ...styles.card, marginBottom: 20 }}
                bodyStyle={styles.cardBody}
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={16}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: 14, color: '#6b7280' }}>Tổng đơn</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                                    <div style={{ fontSize: 34, fontWeight: 900, color: '#0b5fff' }}>{formatNumber(ordersThisMonth)}</div>
                                    {ordersChange != null && (
                                        <Tag color={ordersDelta >= 0 ? 'green' : 'volcano'} icon={ordersDelta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
                                            {ordersChange}%
                                        </Tag>
                                    )}
                                    {ordersDelta != null && (
                                        <div style={{ color: '#6b7280', fontSize: 12 }}>{ordersDelta >= 0 ? `+${formatNumber(ordersDelta)}` : formatNumber(ordersDelta)} so với tháng trước</div>
                                    )}
                                </div>

                            </div>
                            <div style={{ width: 320, height: 80 }}>
                                <ResponsiveContainer width="100%" height={80}>
                                    <AreaChart data={revenueChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.6} />
                                                <stop offset="100%" stopColor="#82ca9d" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide />
                                        <Tooltip formatter={(value) => value} />
                                        <Area type="monotone" dataKey="orders" stroke="#10b981" fill="url(#ordersGradient)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} md={8}>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={styles.tileLabel}>Chờ xử lý</div>
                                    <div style={{ ...styles.tileValue, color: '#f59e0b' }}>{overview.pendingOrders || 0}</div>
                                </div>
                                <div>
                                    <Progress type="circle" percent={overview.month?.orders ? Math.round(((overview.pendingOrders || 0) / overview.month.orders) * 100) : 0} width={72} strokeColor="#f59e0b" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ ...styles.tile, flex: 1 }}>
                                    <div style={styles.tileLabel}>Đơn tuần</div>
                                    <div style={{ ...styles.tileValue, color: '#0b5fff' }}>{overview.week?.orders || 0}</div>
                                </div>
                                <div style={{ ...styles.tile, flex: 1 }}>
                                    <div style={styles.tileLabel}>Đơn hôm nay</div>
                                    <div style={{ ...styles.tileValue, color: '#10b981' }}>{overview.today?.orders || 0}</div>
                                </div>
                            </div>

                            <div style={{ ...styles.tile }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={styles.tileLabel}>Gợi ý</div>
                                        <div style={{ color: '#6b7280', fontSize: 13 }}>Kiểm tra đơn chờ xử lý &gt; 48 giờ và ưu tiên xử lý</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <Tag color="volcano">Ưu tiên</Tag>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]}>
                {/* Best Selling Products */}
                <Col xs={24} lg={16}>
                    <Card
                        title="Sản phẩm bán chạy"
                        style={{ ...styles.card, marginBottom: 20 }}
                        bodyStyle={styles.cardBody}
                    >
                        <Loading isPending={isPendingBestSelling}>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} md={16}>
                                    <Table
                                        columns={bestSellingColumns}
                                        dataSource={bestSellingProducts}
                                        rowKey="productId"
                                        pagination={{ pageSize: 6 }}
                                        size="small"
                                    />
                                </Col>
                                <Col xs={24} md={8}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ ...styles.tile, textAlign: 'center' }}>
                                            <div style={styles.tileLabel}>Tổng số đã bán</div>
                                            <div style={{ ...styles.tileValue, fontSize: 20, color: '#0b5fff' }}>{totalBestSold}</div>
                                        </div>
                                        <div style={{ ...styles.tile, textAlign: 'center' }}>
                                            <div style={styles.tileLabel}>Tổng doanh thu</div>
                                            <div style={{ ...styles.tileValue, fontSize: 18, color: '#10b981' }}>{convertPrice(totalBestRevenue)}</div>
                                        </div>
                                        {topBestProduct ? (
                                            <div style={{ ...styles.tile }}>
                                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                    <img src={topBestProduct.productImage || '/placeholder.png'} alt="top" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700 }}>{topBestProduct.productName || 'Sản phẩm'}</div>
                                                        <div style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>{topBestProduct.totalSold || 0} đã bán • {convertPrice(topBestProduct.totalRevenue || 0)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ ...styles.tile, textAlign: 'center' }}>Không có dữ liệu</div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Loading>
                    </Card>
                </Col>


            </Row>

            {/* New Customers Chart */}
            <Card
                title={
                    <div>
                        <div style={styles.sectionTitle}>Số lượng khách hàng mới</div>
                        <div style={styles.sectionNote}>Theo dõi tần suất khách mới theo chu kì</div>
                    </div>
                }
                extra={
                    <Select
                        value={customerPeriod}
                        onChange={setCustomerPeriod}
                        style={{ width: 140 }}
                        size="middle"
                    >
                        <Option value="day">Theo ngày</Option>
                        <Option value="week">Theo tuần</Option>
                        <Option value="month">Theo tháng</Option>
                    </Select>
                }
                style={{ ...styles.card, marginBottom: 20 }}
                bodyStyle={styles.cardBody}
            >
                <Loading isPending={isPendingCustomers}>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={customerChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#82ca9d" name="Khách hàng mới" />
                        </BarChart>
                    </ResponsiveContainer>
                    {customersData?.data?.total && (
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                                Tổng khách hàng mới: {customersData.data.total}
                            </Tag>
                        </div>
                    )}
                </Loading>
            </Card>

            {/* Promotions & Reviews */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={12}>
                    <Card title="Khuyến mãi đang chạy" style={{ ...styles.card, marginBottom: 20 }} bodyStyle={styles.cardBody}>
                        <Loading isPending={isPendingPromotions}>
                            {activePromotions?.data && activePromotions.data.length > 0 ? (
                                <ul style={{ paddingLeft: 18 }}>
                                    {activePromotions.data.slice(0, 5).map((p) => (
                                        <li key={p._id}>
                                            <strong>{p.name}</strong> {p.code ? `(${p.code})` : ''} - {p.type === 'percentage' ? `${p.value}%` : convertPrice(p.value || 0)}
                                        </li>
                                    ))}
                                </ul>
                            ) : <div>Không có khuyến mãi hoạt động.</div>}
                        </Loading>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Đánh giá sản phẩm" style={{ ...styles.card, marginBottom: 20 }} bodyStyle={styles.cardBody}>
                        <Loading isPending={isPendingReviews}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700 }}>{reviewStats?.data?.total || 0}</div>
                                    <div style={{ color: '#6b7280' }}>Tổng đánh giá</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700 }}>{reviewStats?.data?.avgRating != null ? Number(reviewStats.data.avgRating).toFixed(1) : 0}</div>
                                    <div style={{ color: '#6b7280' }}>Đánh giá trung bình</div>
                                </div>
                            </div>
                        </Loading>
                    </Card>
                </Col>
            </Row>

            <Card
                title={
                    <div>
                        <div style={styles.sectionTitle}>Tỷ lệ hủy đơn</div>
                        <div style={styles.sectionNote}>Theo dõi theo chu kì</div>
                    </div>
                }
                extra={
                    <Select
                        value={cancellationPeriod}
                        onChange={setCancellationPeriod}
                        style={{ width: 140 }}
                        size="middle"
                    >
                        <Option value="day">Theo ngày</Option>
                        <Option value="week">Theo tuần</Option>
                        <Option value="month">Theo tháng</Option>
                    </Select>
                }
                style={{ ...styles.card, marginBottom: 20 }}
                bodyStyle={styles.cardBody}
            >
                <Loading isPending={isPendingCancellation}>
                    {cancellationData?.data ? (
                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} md={6} style={{ textAlign: 'center' }}>
                                <Progress
                                    type="dashboard"
                                    percent={Math.min(100, Math.round(cancellationData.data.cancellationRate || 0))}
                                    width={120}
                                    strokeColor={cancellationData.data.cancellationRate > 10 ? '#ff4d4f' : '#52c41a'}
                                />
                                <div style={{ marginTop: 8 }}>
                                    <Statistic
                                        value={Number(cancellationData.data.cancellationRate || 0).toFixed(1)}
                                        suffix="%"
                                        valueStyle={{ fontSize: 22, color: cancellationData.data.cancellationRate > 10 ? '#cf1322' : '#3f8600' }}
                                    />
                                </div>
                            </Col>

                            <Col xs={24} md={12}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={styles.tile}>
                                        <div style={styles.tileLabel}>Tổng đơn</div>
                                        <div style={{ ...styles.tileValue, color: '#0b5fff' }}>{cancellationData.data.totalOrders || 0}</div>
                                    </div>
                                    <div style={styles.tile}>
                                        <div style={styles.tileLabel}>Đã hủy</div>
                                        <div style={{ ...styles.tileValue, color: '#ef4444' }}>{cancellationData.data.cancelledOrders || 0}</div>
                                    </div>
                                    <div style={styles.tile}>
                                        <div style={styles.tileLabel}>Đã hoàn tiền</div>
                                        <div style={{ ...styles.tileValue, color: '#f97316' }}>{cancellationData.data.refundedOrders || 0}</div>
                                    </div>
                                    <div style={styles.tile}>
                                        <div style={styles.tileLabel}>Tỷ lệ hủy (hiện tại)</div>
                                        <div style={{ ...styles.tileValue, color: cancellationData.data.cancellationRate > 10 ? '#cf1322' : '#0b5fff' }}>{Number(cancellationData.data.cancellationRate || 0).toFixed(1)}%</div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} md={6}>
                                <div style={{ textAlign: 'center' }}>
                                    {cancellationData.data.cancellationRate > 10 ? (
                                        <div style={{ display: 'inline-block', padding: 12, borderRadius: 8, background: '#fff4f4', border: '1px solid #ffd7d9' }}>
                                            <WarningOutlined style={{ color: '#cf1322', fontSize: 20 }} />
                                            <div style={{ marginTop: 8, fontWeight: 700, color: '#cf1322' }}>Cần kiểm tra</div>
                                            <div style={{ color: '#6b7280', fontSize: 12 }}>Tỷ lệ hủy cao</div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'inline-block', padding: 12, borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                                            <div style={{ fontWeight: 700, color: '#389e0d' }}>Ổn định</div>
                                            <div style={{ color: '#6b7280', fontSize: 12 }}>Không cần can thiệp ngay</div>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    ) : (
                        <div>Không có dữ liệu.</div>
                    )}
                </Loading>
            </Card>

            {/* Inventory Chart */}
            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <DatabaseOutlined style={{ fontSize: 18, color: '#0b5fff' }} />
                        <div>
                            <div style={styles.sectionTitle}>Biểu đồ tồn kho</div>
                            <div style={styles.sectionNote}>Phân bố theo mức tồn</div>
                        </div>
                    </div>
                }
                style={{ ...styles.card, marginBottom: 20 }}
                bodyStyle={styles.cardBody}
            >
                <Loading isPending={isPendingInventory}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={12}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={inventoryPieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {inventoryPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Col>
                        <Col xs={24} md={12}>
                            {inventoryData?.data?.summary && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={styles.tile}>
                                        <div style={styles.tileLabel}>Tổng sản phẩm</div>
                                        <div style={{ ...styles.tileValue, color: '#0b5fff' }}>{inventoryData.data.summary.totalProducts || 0}</div>
                                    </div>
                                    <div style={styles.tile}>
                                        <div style={styles.tileLabel}>Tổng tồn kho</div>
                                        <div style={{ ...styles.tileValue, color: '#10b981' }}>{inventoryData.data.summary.totalStock || 0}</div>
                                    </div>
                                    <div style={styles.tile}>
                                        <div style={styles.tileLabel}>Hết hàng</div>
                                        <div style={{ ...styles.tileValue, color: '#ef4444' }}>{inventoryData.data.summary.outOfStockProducts || 0}</div>
                                    </div>
                                    <div style={styles.tile}>
                                        <div style={styles.tileLabel}>Tồn kho thấp</div>
                                        <div style={{ ...styles.tileValue, color: '#f97316' }}>{inventoryData.data.summary.lowStockProducts || 0}</div>
                                    </div>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Loading>
            </Card>



            {/* Top Brands & Categories */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card title="Top thương hiệu" style={{ ...styles.card, marginBottom: 20 }} bodyStyle={styles.cardBody}>
                        <Loading isPending={isPendingTopBrands}>
                            {topBrandsData?.data && topBrandsData.data.length > 0 ? (
                                <Table
                                    size="small"
                                    pagination={false}
                                    columns={[
                                        { title: 'STT', key: 'index', render: (_, __, idx) => idx + 1, width: 60 },
                                        { title: 'Thương hiệu', dataIndex: 'brand', key: 'brand' },
                                        { title: 'Số lượng bán', dataIndex: 'totalSold', key: 'totalSold', align: 'right' },
                                        { title: 'Doanh thu', dataIndex: 'totalRevenue', key: 'totalRevenue', align: 'right', render: (v) => convertPrice(v) }
                                    ]}
                                    dataSource={topBrandsData.data}
                                    rowKey={(r) => r.brandId || r.brand}
                                />
                            ) : (
                                <div>Không có dữ liệu thương hiệu.</div>
                            )}
                        </Loading>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Top danh mục" style={{ ...styles.card, marginBottom: 20 }} bodyStyle={styles.cardBody}>
                        <Loading isPending={isPendingTopCategories}>
                            {topCategoriesData?.data && topCategoriesData.data.length > 0 ? (
                                <Table
                                    size="small"
                                    pagination={false}
                                    columns={[
                                        { title: 'STT', key: 'index', render: (_, __, idx) => idx + 1, width: 60 },
                                        { title: 'Danh mục', dataIndex: 'category', key: 'category' },
                                        { title: 'Số lượng bán', dataIndex: 'totalSold', key: 'totalSold', align: 'right' },
                                        { title: 'Doanh thu', dataIndex: 'totalRevenue', key: 'totalRevenue', align: 'right', render: (v) => convertPrice(v) }
                                    ]}
                                    dataSource={topCategoriesData.data}
                                    rowKey={(r) => r.categoryId || r.category}
                                />
                            ) : (
                                <div>Không có dữ liệu danh mục.</div>
                            )}
                        </Loading>
                    </Card>
                </Col>
            </Row>
            {userStatistics?.data?.topBuyers && userStatistics.data.topBuyers.length > 0 && (
                <Card
                    title="Top 10 khách hàng mua nhiều nhất"
                    style={{ ...styles.card, marginBottom: 20 }}
                    bodyStyle={styles.cardBody}
                    extra={
                        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                            Tổng {userStatistics.data.topBuyers.length} khách hàng
                        </Tag>
                    }
                >
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                key: 'index',
                                render: (_, __, index) => index + 1,
                                width: 60,
                                align: 'center'
                            },
                            {
                                title: 'Tên khách hàng',
                                dataIndex: 'name',
                                key: 'name',
                                render: (text) => <strong>{text || 'N/A'}</strong>
                            },
                            {
                                title: 'Email',
                                dataIndex: 'email',
                                key: 'email'
                            },
                            {
                                title: 'Số đơn',
                                dataIndex: 'totalOrders',
                                key: 'totalOrders',
                                align: 'center',
                                sorter: (a, b) => (a.totalOrders || 0) - (b.totalOrders || 0),
                                render: (value) => <Tag color="blue">{value || 0}</Tag>
                            },
                            {
                                title: 'Tổng chi tiêu',
                                dataIndex: 'totalSpent',
                                key: 'totalSpent',
                                align: 'right',
                                sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
                                render: (spent) => (
                                    <span style={{ color: '#3f8600', fontWeight: 'bold' }}>
                                        {convertPrice(spent || 0)}
                                    </span>
                                )
                            }
                        ]}
                        dataSource={userStatistics.data.topBuyers}
                        rowKey={(record) => record._id || record.email}
                        pagination={false}
                        size="small"
                    />
                </Card>
            )}

            {/* Top 10 Provinces */}
            <Loading isPending={isPendingTopProvinces}>
                {topProvincesData?.data && topProvincesData.data.length > 0 && (
                    <Card
                        title="Top 10 tỉnh thành mua hàng nhiều nhất"
                        style={{ ...styles.card, marginBottom: 20 }}
                        bodyStyle={styles.cardBody}
                        extra={
                            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                                Tổng {topProvincesData.data.length} tỉnh thành
                            </Tag>
                        }
                    >
                        <Table
                            columns={[
                                {
                                    title: 'STT',
                                    key: 'index',
                                    render: (_, __, index) => index + 1,
                                    width: 60,
                                    align: 'center'
                                },
                                {
                                    title: 'Tỉnh/Thành phố',
                                    dataIndex: 'province',
                                    key: 'province',
                                    render: (text) => <strong style={{ fontSize: '15px' }}>{text || 'N/A'}</strong>
                                },
                                {
                                    title: 'Số đơn hàng',
                                    dataIndex: 'totalOrders',
                                    key: 'totalOrders',
                                    align: 'center',
                                    sorter: (a, b) => (a.totalOrders || 0) - (b.totalOrders || 0),
                                    render: (value) => <Tag color="orange" style={{ fontSize: '13px', padding: '4px 12px' }}>{value || 0}</Tag>
                                },
                                {
                                    title: 'Tổng doanh thu',
                                    dataIndex: 'totalRevenue',
                                    key: 'totalRevenue',
                                    align: 'right',
                                    sorter: (a, b) => (a.totalRevenue || 0) - (b.totalRevenue || 0),
                                    render: (revenue) => (
                                        <span style={{ color: '#3f8600', fontWeight: 'bold', fontSize: '14px' }}>
                                            {convertPrice(revenue || 0)}
                                        </span>
                                    )
                                },
                                {
                                    title: 'Số khách hàng',
                                    dataIndex: 'totalCustomers',
                                    key: 'totalCustomers',
                                    align: 'center',
                                    sorter: (a, b) => (a.totalCustomers || 0) - (b.totalCustomers || 0),
                                    render: (value) => <Tag color="blue">{value || 0}</Tag>
                                }
                            ]}
                            dataSource={topProvincesData.data}
                            rowKey={(record) => record.province || record._id}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                )}
            </Loading>


            {/* Order Time Heatmap */}
            <Card
                title="Heatmap thời gian khách đặt hàng (30 ngày gần nhất)"
                style={{ ...styles.card, marginBottom: 20 }}
                bodyStyle={{ ...styles.cardBody, overflowX: 'auto' }}
            >
                <Loading isPending={isPendingHeatmap}>
                    <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }} >
                        <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, marginTop: 16, borderRadius: 12, overflow: 'hidden' }} >
                            <thead>
                                <tr>
                                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
                                        Ngày
                                    </th>
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <th
                                            key={i}
                                            style={{
                                                padding: '8px',
                                                textAlign: 'center',
                                                border: '1px solid #ddd',
                                                backgroundColor: '#f5f5f5',
                                                fontSize: '11px',
                                                minWidth: '40px'
                                            }}
                                        >
                                            {i}h
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {heatmapTableData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                                            {row.day}
                                        </td>
                                        {Array.from({ length: 24 }, (_, hour) => (
                                            <td
                                                key={hour}
                                                style={{
                                                    padding: '8px',
                                                    textAlign: 'center',
                                                    border: '1px solid #ddd',
                                                    backgroundColor: getHeatmapColor(row[hour] || 0, heatmapMaxCount),
                                                    fontWeight: row[hour] > 0 ? 'bold' : 'normal',
                                                    color: row[hour] > 0 ? '#000' : '#999',
                                                    cursor: 'pointer'
                                                }}
                                                title={`${row.day} - ${hour}h: ${row[hour] || 0} đơn hàng`}
                                            >
                                                {row[hour] || 0}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#666' }}>
                        <p>Màu sắc đậm hơn = Nhiều đơn hàng hơn. Di chuột vào ô để xem chi tiết.</p>
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 16 }}>
                            <span>Ít: <span style={{ display: 'inline-block', width: 20, height: 20, backgroundColor: '#d4edda', border: '1px solid #ccc' }}></span></span>
                            <span>Nhiều: <span style={{ display: 'inline-block', width: 20, height: 20, backgroundColor: '#28a745', border: '1px solid #ccc' }}></span></span>
                        </div>
                    </div>
                </Loading>
            </Card>
        </div>
    );
};

export default AdminAnalytics;
