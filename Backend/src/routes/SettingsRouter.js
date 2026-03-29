const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const { authMiddleWare } = require('../middleware/authMiddleware');

// Public route - Get public settings (no auth required)
router.get('/public', SettingsController.getSettingsPublic);

// Admin routes - Require admin authentication
router.get('/', authMiddleWare, SettingsController.getSettings);
router.put('/', authMiddleWare, SettingsController.updateSettings);

module.exports = router;

