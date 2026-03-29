const Conversation = require('../models/ConversationModel');
const Message = require('../models/MessageModel');
const Product = require('../models/ProductModel');
const ChatService = require('../services/ChatService');
const { Types } = require('mongoose');

// helper to get admin namespace
function adminNs(io) {
  return io && io.of ? io.of('/chat/admin') : null;
}

const normalizeContext = async (context = {}, fallbackProductId = null) => {
  const ctxType = (context.type || (fallbackProductId ? 'PRODUCT' : 'GENERAL')).toString().toUpperCase();
  if (ctxType !== 'PRODUCT') return { type: 'GENERAL' };

  const productId = context.productId || fallbackProductId || null;
  let productName = context.productName || context.name || null;
  let price = context.price || null;
  let image = context.image || null;

  if (productId && (!productName || !price || !image)) {
    try {
      const product = await Product.findById(productId).select('name price images image').lean();
      if (product) {
        productName = productName || product.name;
        price = price || product.price;
        image = image || (product.images && product.images[0]) || product.image || null;
      }
    } catch (e) {
      // ignore fetch errors; keep partial context
    }
  }

  return {
    type: 'PRODUCT',
    productId,
    productName: productName || null,
    price: price || null,
    image: image || null,
  };
};

const emitConversationUpdate = () => {};
const emitNewMessage = () => {};

const listConversations = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '20');
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;

    const [items, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email name')
        .populate('assignedTo', 'email name')
        .populate('productId', 'name price images image')
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    const normalizedItems =
      items?.map((c) => ({
        ...c,
        mode: c.mode || 'AI',
        context: c.context || { type: 'GENERAL' },
      })) || [];

    return res.json({ status: 'OK', data: { items: normalizedItems, total, page, limit } });
  } catch (error) {
    console.error('listConversations error', error);
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    // support both /:id/messages and /messages/:conversationId
    const conversationId = req.params.id || req.params.conversationId;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '50');
    const skip = (page - 1) * limit;

    const conversationDoc = await Conversation.findById(conversationId)
      .populate('productId', 'name price images image')
      .lean();
    const conversation = conversationDoc
      ? { ...conversationDoc, mode: conversationDoc.mode || 'AI', context: conversationDoc.context || { type: 'GENERAL' } }
      : null;

    if (!conversation) {
      return res.status(404).json({ status: 'ERROR', message: 'Conversation not found' });
    }

    const [items, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversationId }),
    ]);

    return res.json({ status: 'OK', data: { items, total, page, limit, conversation } });
  } catch (error) {
    console.error('getMessages error', error);
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
};

const adminSendMessage = async (_req, res) => res.status(410).json({ status: 'ERROR', message: 'Admin chat is disabled' });

const updateStatus = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { status, assignedTo, mode } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ status: 'ERROR', message: 'Conversation not found' });

    if (status) {
      conversation.status = status;
      if (String(status).toUpperCase() === 'CLOSED') {
        // record closure metadata
        conversation.closedAt = new Date();
        conversation.closedReason = req.body.closedReason || conversation.closedReason || null;
      }
    }
    if (assignedTo !== undefined) conversation.assignedTo = assignedTo || null;
    if (mode) conversation.mode = mode;
    await conversation.save();
    const convoPayload = conversation.toObject();

    return res.json({ status: 'OK', data: convoPayload });
  } catch (error) {
    console.error('updateStatus error', error);
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
};

const updateMeta = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { meta } = req.body; // expect an object

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ status: 'ERROR', message: 'Conversation not found' });

    conversation.meta = Object.assign({}, conversation.meta || {}, meta || {});
    await conversation.save();

    return res.json({ status: 'OK', data: conversation });
  } catch (error) {
    console.error('updateMeta error', error);
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
};

const adminDeleteMessage = async (_req, res) => res.status(410).json({ status: 'ERROR', message: 'Admin chat is disabled' });

// User can start a conversation
const startConversation = async (req, res) => {
  try {
    // req.user may be set by optionalAuthMiddleware
    const userId = req.user ? req.user.id : null;
    const { userId: bodyUserId, supportRequestId, productId, guestId, context: ctxPayload } = req.body;
    // If user is logged in, prefer req.user.id, else accept guestId or body userId
    const participantId = userId || bodyUserId || null;

    const context = await normalizeContext(ctxPayload || {}, productId);

    const conversation = await Conversation.create({
      userId: participantId,
      guestId: guestId || null,
      productId: context.type === 'PRODUCT' ? context.productId || productId || null : null,
      supportRequestId,
      mode: 'AI',
      status: 'ACTIVE',
      context,
      lastMessageAt: new Date(),
    });

    // Per new business rules: do NOT create nor emit automatic system/welcome messages when a conversation is started.
    conversation.lastMessageAt = new Date();
    await conversation.save();

    try {
      const io = req.app.get('io');
      if (io) {
        // Emit conversation update so admin UI is aware of the new conversation
        emitConversationUpdate(io, conversation.toObject());
      }
    } catch (e) {
      console.warn('Socket emit failed', e.message);
    }

    return res.json({ status: 'OK', data: conversation });
  } catch (error) {
    console.error('startConversation error', error);
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
};

// User sends a message
const userSendMessage = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { content, type = 'text', metadata = {} } = req.body;
    const normalizedType = typeof type === 'string' ? type.toUpperCase() : 'TEXT';

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ status: 'ERROR', message: 'Conversation not found' });
    if (!conversation.mode) conversation.mode = 'AI';

    const senderId = req.user ? req.user.id : req.body.senderId || null;

    const userMsg = {
      _id: new Types.ObjectId().toString(),
      conversationId,
      senderRole: 'USER',
      type: normalizedType,
      content,
      createdAt: new Date(),
      metadata,
    };

    let aiMessages = [];
    try {
      const aiResult = await ChatService.processChatMessage(content, senderId || null, []);
      const aiText =
        aiResult?.text ||
        aiResult?.message ||
        aiResult?.data?.text ||
        aiResult?.data?.message ||
        aiResult?.data?.reply ||
        aiResult?.data ||
        '';

      const safeText = (aiText || '').toString().trim();
      const introText =
        safeText ||
        (Array.isArray(aiResult?.products) && aiResult.products.length > 0
          ? 'Minh goi y vai mau phu hop, ban xem nhanh nhe:'
          : 'Xin chao! Minh co the giup gi cho ban?');

      const baseCreatedAt = new Date();
      if (introText) {
        aiMessages.push({
          _id: new Types.ObjectId().toString(),
          conversationId,
          senderRole: 'AI',
          type: 'TEXT',
          content: introText,
          createdAt: baseCreatedAt,
          metadata: { intent: aiResult?.intent },
        });
      }

      if (Array.isArray(aiResult?.products)) {
        aiResult.products.forEach((p, idx) => {
          aiMessages.push({
            _id: new Types.ObjectId().toString(),
            conversationId,
            senderRole: 'AI',
            type: 'PRODUCT',
            content: {
              productId: p.id || p._id || p.productId || null,
              name: p.name,
              price: p.price,
              image: p.image || (p.images && p.images[0]) || null,
              variant: p.variant || p.variation || null,
            },
            createdAt: new Date(baseCreatedAt.getTime() + idx + 1),
            metadata: { intent: aiResult?.intent, fromAiSuggestion: true },
          });
        });
      }
    } catch (e) {
      aiMessages = [
        {
          _id: new Types.ObjectId().toString(),
          conversationId,
          senderRole: 'AI',
          type: 'TEXT',
          content: 'Xin loi, minh dang ban. Ban vui long thu lai sau.',
          createdAt: new Date(),
        },
      ];
    }

    conversation.lastMessageAt = new Date();
    conversation.status = 'ACTIVE';
    conversation.mode = 'AI';
    await conversation.save();

    const responseMessages = aiMessages.length ? [userMsg, ...aiMessages] : [userMsg];
    return res.json({ status: 'OK', data: responseMessages });
  } catch (error) {
    console.error('userSendMessage error', error);
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
};

// Upload attachment as message (user)
const uploadAttachment = async (_req, res) =>
  res.status(410).json({ status: 'ERROR', message: 'Upload disabled in AI-only chat' });

const requestHuman = async (_req, res) =>
  res.status(410).json({ status: 'ERROR', message: 'Human support is disabled in AI-only mode' });


const markRead = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ status: 'ERROR', message: 'Conversation not found' });

    conversation.unreadCount = 0;
    await conversation.save();

    try {
      const io = req.app.get('io');
      emitConversationUpdate(io, conversation.toObject());
    } catch (e) {
      console.warn('Socket emit failed', e.message);
    }

    return res.json({ status: 'OK', data: conversation });
  } catch (error) {
    console.error('markRead error', error);
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
};

module.exports = {
  listConversations,
  getMessages,
  adminSendMessage,
  startConversation,
  userSendMessage,
  updateStatus,
  updateMeta,
  adminDeleteMessage,
  uploadAttachment,
  markRead,
  requestHuman,
};
