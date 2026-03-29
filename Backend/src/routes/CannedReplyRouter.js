const express = require('express');
const router = express.Router();
const CannedReplyController = require('../controllers/CannedReplyController');
const { authAdminMiddleWare } = require('../middleware/authMiddleware');

router.get('/admin/list', authAdminMiddleWare, CannedReplyController.listCannedReplies);
router.post('/admin', authAdminMiddleWare, CannedReplyController.createCannedReply);
router.put('/admin/:id', authAdminMiddleWare, CannedReplyController.updateCannedReply);
router.delete('/admin/:id', authAdminMiddleWare, CannedReplyController.deleteCannedReply);

module.exports = router;