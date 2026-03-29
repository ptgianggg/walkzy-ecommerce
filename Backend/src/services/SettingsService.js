const Settings = require('../models/SettingsModel');

const getSettings = async () => {
    try {
        const settings = await Settings.getSettings();
        return {
            status: 'OK',
            message: 'Lấy cài đặt thành công',
            data: settings
        };
    } catch (error) {
        console.error('Error getting settings:', error);
        return {
            status: 'ERR',
            message: 'Lỗi khi lấy cài đặt: ' + error.message
        };
    }
};

const updateSettings = async (data) => {
    try {
        const settings = await Settings.updateSettings(data);
        return {
            status: 'OK',
            message: 'Cập nhật cài đặt thành công',
            data: settings
        };
    } catch (error) {
        console.error('Error updating settings:', error);
        return {
            status: 'ERR',
            message: 'Lỗi khi cập nhật cài đặt: ' + error.message
        };
    }
};

const getSettingsPublic = async () => {
    try {
        const settings = await Settings.getSettings();
        
        // Chỉ trả về các trường công khai (không có thông tin nhạy cảm)
        const publicData = {
            websiteName: settings.websiteName,
            websiteDescription: settings.websiteDescription,
            websiteLogo: settings.websiteLogo,
            websiteFavicon: settings.websiteFavicon,
            contactEmail: settings.contactEmail,
            contactPhone: settings.contactPhone,
            contactAddress: settings.contactAddress,
            contactHotline: settings.contactHotline,
            aboutBrandTitle: settings.aboutBrandTitle,
            aboutBrandContent: settings.aboutBrandContent,
            aboutVisionTitle: settings.aboutVisionTitle,
            aboutVisionContent: settings.aboutVisionContent,
            aboutValuesTitle: settings.aboutValuesTitle,
            aboutValuesContent: settings.aboutValuesContent,
            aboutCommitmentTitle: settings.aboutCommitmentTitle,
            aboutCommitmentContent: settings.aboutCommitmentContent,
            aboutStoryTitle: settings.aboutStoryTitle,
            aboutStoryContent: settings.aboutStoryContent,
            aboutJourneyTitle: settings.aboutJourneyTitle,
            aboutJourneyContent: settings.aboutJourneyContent,
            aboutStoryImageUrl: settings.aboutStoryImageUrl,
            aboutStoryImageLabel: settings.aboutStoryImageLabel,
            paymentMethods: settings.paymentMethods || [],
            defaultShippingFee: settings.defaultShippingFee,
            freeShippingThreshold: settings.freeShippingThreshold,
            facebookUrl: settings.facebookUrl,
            facebookIcon: settings.facebookIcon || '',
            instagramUrl: settings.instagramUrl,
            instagramIcon: settings.instagramIcon || '',
            youtubeUrl: settings.youtubeUrl,
            youtubeIcon: settings.youtubeIcon || '',
            tiktokUrl: settings.tiktokUrl,
            tiktokIcon: settings.tiktokIcon || '',
            zaloUrl: settings.zaloUrl,
            businessHours: settings.businessHours,
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            
            // Seasonal / Effects (công khai, không nhạy cảm)
            seasonalEffectsEnabled: settings.seasonalEffectsEnabled,
            seasonalEffectType: settings.seasonalEffectType,
            seasonalEffectDensity: settings.seasonalEffectDensity,
            seasonalEffectPages: settings.seasonalEffectPages || [],
            seasonalEffectStart: settings.seasonalEffectStart,
            seasonalEffectEnd: settings.seasonalEffectEnd,
            seasonalEffectIcon: settings.seasonalEffectIcon || ''
        };
        
        return {
            status: 'OK',
            message: 'Lấy cài đặt công khai thành công',
            data: publicData
        };
    } catch (error) {
        console.error('Error getting public settings:', error);
        return {
            status: 'ERR',
            message: 'Lỗi khi lấy cài đặt công khai: ' + error.message
        };
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getSettingsPublic
};
