const SettingsService = require('../services/SettingsService');

const getSettings = async (req, res) => {
    try {
        const result = await SettingsService.getSettings();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message
        });
    }
};

const updateSettings = async (req, res) => {
    try {
        const data = req.body;
        const result = await SettingsService.updateSettings(data);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message
        });
    }
};

const getSettingsPublic = async (req, res) => {
    try {
        const result = await SettingsService.getSettingsPublic();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message
        });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getSettingsPublic
};

