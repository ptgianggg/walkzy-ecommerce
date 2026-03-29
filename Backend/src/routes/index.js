const UserRouter = require('./UserRouter')
const ProductRouter = require('./ProductRouter')
const OrderRouter = require('./OrderRouter')
const CartRouter = require('./CartRouter')
const PaymentRouter = require('./PaymentRouter')
const CategoryRouter = require('./CategoryRouter')
const BrandRouter = require('./BrandRouter')
const CollectionRouter = require('./CollectionRouter')
const PromotionRouter = require('./PromotionRouter')
const BannerRouter = require('./BannerRouter')
const AttributeRouter = require('./AttributeRouter')
const AnalyticsRouter = require('./AnalyticsRouter')
const ReviewRouter = require('./ReviewRouter')
const NotificationRouter = require('./NotificationRouter')
const VoucherRouter = require('./VoucherRouter')
const ChatRouter = require('./ChatRouter')
const ConversationRouter = require('./ConversationRouter')
const CannedReplyRouter = require('./CannedReplyRouter')
const ShippingRouter = require('./ShippingRouter')
const ShippingVoucherRouter = require('./ShippingVoucherRouter')
const WarehouseRouter = require('./WarehouseRouter')
const StockRouter = require('./StockRouter')
const SupplierRouter = require('./SupplierRouter')
const PurchaseOrderRouter = require('./PurchaseOrderRouter')
const SupportRequestRouter = require('./SupportRequestRouter')
const SettingsRouter = require('./SettingsRouter')
const RoleRouter = require('./RoleRouter')
const PermissionRouter = require('./PermissionRouter')
const QrRouter = require('./QrRouter')

const routes = (app) => {
    app.use('/api/user', UserRouter)
    app.use('/api/product', ProductRouter)
    app.use('/api/order', OrderRouter)
    app.use('/api/cart', CartRouter)
    app.use('/api/payment', PaymentRouter)
    app.use('/api/category', CategoryRouter)
    app.use('/api/brand', BrandRouter)
    app.use('/api/collection', CollectionRouter)
    app.use('/api/promotion', PromotionRouter)
    app.use('/api/banner', BannerRouter)
    app.use('/api/attribute', AttributeRouter)
    app.use('/api/analytics', AnalyticsRouter)
    app.use('/api/review', ReviewRouter)
    app.use('/api/notification', NotificationRouter)
    app.use('/api/voucher', VoucherRouter)
    app.use('/api/chat', ChatRouter)
    app.use('/api/conversation', ConversationRouter)
    app.use('/api/canned-reply', CannedReplyRouter)
    app.use('/api/shipping', ShippingRouter)
    app.use('/api/shipping-voucher', ShippingVoucherRouter)
    app.use('/api/warehouse', WarehouseRouter)
    app.use('/api/stock', StockRouter)
    app.use('/api/supplier', SupplierRouter)
    app.use('/api/purchase-order', PurchaseOrderRouter)
    app.use('/api/support-request', SupportRequestRouter)
    app.use('/api/settings', SettingsRouter)
    app.use('/api/role', RoleRouter)

    app.use('/api/permission', PermissionRouter)
    app.use('/api/qr', QrRouter)
    
    // Root API route for health check
    app.get('/api', (req, res) => {
        res.json({
            status: 'OK',
            message: 'Walkzy API is running smoothly via ZeroTier!',
            version: '2.3.0'
        });
    });
}
module.exports = routes