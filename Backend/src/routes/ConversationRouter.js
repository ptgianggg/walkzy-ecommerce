const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/ConversationController');
const { authAdminMiddleWare, optionalAuthMiddleware, authUserMiddleWare } = require('../middleware/authMiddleware');

// Admin endpoints
router.get('/admin/list', authAdminMiddleWare, ConversationController.listConversations);
router.get('/admin/:id/messages', authAdminMiddleWare, ConversationController.getMessages);
router.post('/admin/:id/message', authAdminMiddleWare, ConversationController.adminSendMessage);
router.post('/admin/:id/status', authAdminMiddleWare, ConversationController.updateStatus);
router.post('/admin/:id/meta', authAdminMiddleWare, ConversationController.updateMeta);
router.post('/admin/:id/read', authAdminMiddleWare, ConversationController.markRead);
// delete a message (admin)
router.delete('/admin/:id/message/:messageId', authAdminMiddleWare, ConversationController.adminDeleteMessage);
// admin attachment upload
const upload = require('../middleware/uploadMiddleware');
router.post('/admin/:id/attachment', authAdminMiddleWare, upload.single('file'), ConversationController.uploadAttachment);

// Public / User endpoints
// Backward-compatible and spec routes
router.post('/start', optionalAuthMiddleware, ConversationController.startConversation);
router.post('/conversations', optionalAuthMiddleware, ConversationController.startConversation); // POST /conversations
router.post('/:id/message', optionalAuthMiddleware, ConversationController.userSendMessage);
router.post('/:id/request-human', optionalAuthMiddleware, ConversationController.requestHuman); // disabled
// user attachment upload
router.post('/:id/attachment', optionalAuthMiddleware, upload.single('file'), ConversationController.uploadAttachment);
router.get('/messages/:conversationId', optionalAuthMiddleware, ConversationController.getMessages); // GET /messages/:conversationId
router.get('/:id/messages', optionalAuthMiddleware, ConversationController.getMessages);
// Admin-friendly list
router.get('/conversations', authAdminMiddleWare, ConversationController.listConversations); // GET /conversations

module.exports = router;
