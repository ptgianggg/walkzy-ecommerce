const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        // Website Settings
        websiteName: { type: String, default: 'WALKZY' },
        websiteDescription: { type: String, default: 'Cửa hàng thời trang uy tín' },
        websiteLogo: { type: String, default: '' },
        websiteLogoMobile: { type: String, default: '' },
        websiteFavicon: { type: String, default: '' },
        websiteFavicon16: { type: String, default: '' },
        websiteFavicon32: { type: String, default: '' },
        websiteOgImage: { type: String, default: '' },
        websiteUrl: { type: String, default: 'http://localhost:3000' },
        contactEmail: { type: String, default: 'support@walkzy.com' },
        contactPhone: { type: String, default: '0123456789' },
        contactAddress: { type: String, default: '' },
        contactHotline: { type: String, default: '1900 1234' },

        // About Page Settings
        aboutBrandTitle: { type: String, default: '' },
        aboutBrandContent: { type: String, default: '' },
        aboutVisionTitle: { type: String, default: '' },
        aboutVisionContent: { type: String, default: '' },
        aboutValuesTitle: { type: String, default: '' },
        aboutValuesContent: { type: String, default: '' },
        aboutCommitmentTitle: { type: String, default: '' },
        aboutCommitmentContent: { type: String, default: '' },
        aboutStoryTitle: { type: String, default: '' },
        aboutStoryContent: { type: String, default: '' },
        aboutJourneyTitle: { type: String, default: '' },
        aboutJourneyContent: { type: String, default: '' },
        aboutStoryImageUrl: { type: String, default: '' },
        aboutStoryImageLabel: { type: String, default: '' },
        
        // Email Settings
        smtpHost: { type: String, default: '' },
        smtpPort: { type: Number, default: 587 },
        smtpUser: { type: String, default: '' },
        smtpPassword: { type: String, default: '' },
        smtpSecure: { type: Boolean, default: true },
        emailFrom: { type: String, default: 'noreply@walkzy.com' },
        emailFromName: { type: String, default: 'WALKZY' },
        // Email Types - bật/tắt từng loại email
        enableEmailOrder: { type: Boolean, default: true },
        enableEmailWelcome: { type: Boolean, default: true },
        enableEmailPasswordReset: { type: Boolean, default: true },
        enableEmailOrderConfirmation: { type: Boolean, default: true },
        enableEmailShipping: { type: Boolean, default: true },
        enableEmailPromotion: { type: Boolean, default: true },
        enableEmailNewsletter: { type: Boolean, default: true },
        
        // Payment Settings
        paymentMethods: [{ type: String }], // ['cod', 'momo', 'vnpay', 'bank', 'paypal']
        enableCod: { type: Boolean, default: true },
        momoPartnerCode: { type: String, default: '' },
        momoAccessKey: { type: String, default: '' },
        momoSecretKey: { type: String, default: '' },
        momoEnvironment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
        paypalClientId: { type: String, default: '' },
        paypalSecret: { type: String, default: '' },
        paypalEnvironment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
        
        // Shipping Settings
        defaultShippingFee: { type: Number, default: 30000 },
        freeShippingThreshold: { type: Number, default: 500000 },
        returnDays: { type: Number, default: 7 }, // Số ngày cho phép yêu cầu trả hàng
        
        // Security Settings
        enableTwoFactor: { type: Boolean, default: false },
        sessionTimeout: { type: Number, default: 30 }, // minutes
        maxLoginAttempts: { type: Number, default: 5 },
        passwordMinLength: { type: Number, default: 6 },
        
        // Notification Settings
        enableEmailNotifications: { type: Boolean, default: true },
        enableSmsNotifications: { type: Boolean, default: false },
        notificationEmail: { type: String, default: '' },
        
        // Additional Notification Settings
        enablePopup: { type: Boolean, default: true },
        enableBanner: { type: Boolean, default: true },
        enableChatAI: { type: Boolean, default: true },
        bannerSlideSpeed: { type: Number, default: 5000 }, // milliseconds
        popupDelay: { type: Number, default: 3000 }, // milliseconds - thời gian delay trước khi hiển thị popup
        
        // Maintenance
        maintenanceMode: { type: Boolean, default: false },
        maintenanceMessage: { type: String, default: 'Website đang bảo trì. Vui lòng quay lại sau!' },
        
        // Social Media
        facebookUrl: { type: String, default: '' },
        facebookIcon: { type: String, default: '' },
        instagramUrl: { type: String, default: '' },
        instagramIcon: { type: String, default: '' },
        youtubeUrl: { type: String, default: '' },
        youtubeIcon: { type: String, default: '' },
        tiktokUrl: { type: String, default: '' },
        tiktokIcon: { type: String, default: '' },
        zaloUrl: { type: String, default: '' },
        
        // Business Hours
        businessHours: { type: String, default: 'Thứ 2 - CN: 8:00 - 22:00' },
        
        // Other settings
        metaTags: { type: String, default: '' },
        googleAnalytics: { type: String, default: '' },
        
        // UI/Theme Settings
        primaryColor: { type: String, default: '#e91e63' },
        secondaryColor: { type: String, default: '#667eea' },
        textColor: { type: String, default: '#333333' },
        backgroundColor: { type: String, default: '#ffffff' },
        fontFamily: { type: String, default: 'Roboto' },
        fontSize: { type: String, enum: ['small', 'normal', 'large'], default: 'normal' },
        borderRadius: { type: String, enum: ['rounded', 'normal', 'sharp'], default: 'normal' },
        
        // Seasonal / Effects Settings
        seasonalEffectsEnabled: { type: Boolean, default: false },
        // Hỗ trợ đầy đủ các giá trị mà frontend cho phép chọn
        // (xem AdminSettings.jsx & SeasonalEffects.jsx)
        seasonalEffectType: {
            type: String,
            enum: [
                // Cơ bản
                'snow',
                // Theo mùa
                'spring',
                'summer',
                'autumn',
                'winter',
                // Sự kiện Việt Nam
                'tet',
                'women_day',
                'teacher_day',
                'national_day',
                // Khuyến mãi / sự kiện
                'confetti',
                'flash_sale',
                'brand_birthday',
                // Quốc tế
                'noel',
                'halloween',
                'valentine',
                'new_year',
                'custom',
            ],
            default: 'snow',
        },
        seasonalEffectDensity: { type: Number, default: 80 },
        seasonalEffectPages: [{ type: String, default: 'home' }],
        seasonalEffectStart: { type: Date, default: null },
        seasonalEffectEnd: { type: Date, default: null },
        seasonalEffectIcon: { type: String, default: '' },
        
        // Chỉ có 1 document duy nhất
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    }
);

// Đảm bảo chỉ có 1 settings document
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne({ isActive: true });
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

settingsSchema.statics.updateSettings = async function(data) {
    let settings = await this.findOne({ isActive: true });
    if (!settings) {
        settings = await this.create(data);
    } else {
        Object.assign(settings, data);
        await settings.save();
    }
    return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
