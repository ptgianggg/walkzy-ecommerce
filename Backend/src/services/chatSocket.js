const jwt = require('jsonwebtoken');
const Message = require('../models/MessageModel');
const Conversation = require('../models/ConversationModel');
const ChatService = require('./ChatService');

const ADMIN_TIMEOUT_MS = 12 * 60 * 1000; // 12 minutes
const USER_IDLE_TIMEOUT_MS = 12 * 60 * 1000; // 12 minutes

const adminTimeouts = new Map();
const userTimeouts = new Map();

const init = (io) => {
  // admin namespace for dashboard listeners
  const adminNs = io.of('/chat/admin');

  const emitConversationUpdate = (conversation) => {
    if (!conversation || !conversation._id) return;
    const payload = conversation.toObject ? conversation.toObject() : conversation;
    const id = payload._id.toString();
    io.to(id).emit('conversation:update', { conversation: payload });
    io.to(id).emit('conversation_update', { conversation: payload });
    adminNs.emit('conversation:update', { conversation: payload });
    adminNs.emit('conversation_update', { conversation: payload });
  };

  const emitMessage = (message) => {
    if (!message || !message.conversationId) return;
    io.to(message.conversationId.toString()).emit('message:new', { message });
    try {
      // Also notify admin namespace so dashboard listeners receive immediate message notifications
      adminNs.emit('message:new', { message });
    } catch (e) {
      console.warn('admin emit failed', e.message || e);
    }
  };

  const clearTimer = (map, key) => {
    if (!key) return;
    const k = key.toString();
    if (map.has(k)) {
      clearTimeout(map.get(k));
      map.delete(k);
    }
  };

  const scheduleAdminTimeout = (conversation) => {
    if (!conversation || (conversation.mode || 'AI') !== 'HUMAN') return;
    const key = conversation._id.toString();
    clearTimer(adminTimeouts, key);
    const timeout = setTimeout(async () => {
      try {
        const conv = await Conversation.findById(key).lean();
        if (!conv || (conv.mode || 'AI') !== 'HUMAN') return;
        const systemMessage = await Message.create({
          conversationId: key,
          senderRole: 'SYSTEM',
          type: 'SYSTEM',
          content: 'CSKH is currently busy. You may continue chatting with the AI assistant.',
          metadata: { reason: 'ADMIN_INACTIVE' },
        });
        const updated = await Conversation.findByIdAndUpdate(
          key,
          { mode: 'AI', status: 'ACTIVE', lastMessageAt: systemMessage.createdAt || new Date() },
          { new: true }
        ).lean();
        emitMessage(systemMessage);
        if (updated) emitConversationUpdate(updated);
        clearTimer(userTimeouts, key);
      } catch (e) {
        console.error('admin timeout error', e.message || e);
      } finally {
        clearTimer(adminTimeouts, key);
      }
    }, ADMIN_TIMEOUT_MS);
    adminTimeouts.set(key, timeout);
  };

  const scheduleUserTimeout = (conversation) => {
    if (!conversation || (conversation.mode || 'AI') !== 'HUMAN') return;
    const key = conversation._id.toString();
    clearTimer(userTimeouts, key);
    const timeout = setTimeout(async () => {
      try {
        const conv = await Conversation.findById(key).lean();
        if (!conv || (conv.mode || 'AI') !== 'HUMAN') return;
        const systemMessage = await Message.create({
          conversationId: key,
          senderRole: 'SYSTEM',
          type: 'SYSTEM',
          content: 'CSKH session closed due to inactivity. You can continue with the Automated Assistant.',
          metadata: { reason: 'USER_INACTIVE' },
        });
        const updated = await Conversation.findByIdAndUpdate(
          key,
          { status: 'CLOSED', mode: 'AI', lastMessageAt: systemMessage.createdAt || new Date() },
          { new: true }
        ).lean();
        emitMessage(systemMessage);
        if (updated) emitConversationUpdate(updated);
      } catch (e) {
        console.error('user timeout error', e.message || e);
      } finally {
        clearTimer(userTimeouts, key);
        clearTimer(adminTimeouts, key);
      }
    }, USER_IDLE_TIMEOUT_MS);
    userTimeouts.set(key, timeout);
  };

  const handleAiReply = async (conversation, userMessage) => {
    try {
      // basic guards
      if (!conversation || (conversation.mode || 'AI') !== 'AI') {
        console.log('handleAiReply: skipping because conversation mode is not AI or conversation missing', conversation?._id?.toString());
        return;
      }
      if (!userMessage || !userMessage.content) {
        console.log('handleAiReply: skipping because no userMessage content');
        return;
      }

      const convId = conversation._id?.toString?.() || conversation.id;
      if (!convId) {
        console.log('handleAiReply: no convId available');
        return;
      }

      // take recent history
      const history = await Message.find({ conversationId: convId }).sort({ createdAt: -1 }).limit(6).lean();
      const context = conversation.context || { type: 'GENERAL' };

      // Include product details in AI prompt ONLY if the user explicitly sent a PRODUCT message earlier in this conversation.
      // This prevents the AI from using page context implicitly.
      const hasProductMessage = Boolean(
        await Message.exists({ conversationId: convId, type: 'PRODUCT', senderRole: 'USER' })
      );

      const contextHint =
        context.type === 'PRODUCT' && hasProductMessage
          ? `Product context: ${context.productName || context.productId || ''} ${
              context.price ? `(price ${context.price})` : ''
            }.`
          : 'General shop context.';
      const aiInput = `${contextHint}
User: ${userMessage.content}`;

      console.log(`handleAiReply: calling ChatService.processChatMessage for conv ${convId} with input:`, userMessage.content);

      const aiRes = await ChatService.processChatMessage(aiInput, conversation.userId || null, history);

      // debug logging of AI result
      console.log('handleAiReply: aiRes', { convId, aiResSummary: aiRes ? { text: Boolean(aiRes.text), message: Boolean(aiRes.message), intent: aiRes.intent } : null });

      const aiTextRaw = aiRes?.text || aiRes?.message;
      const safeText = aiTextRaw && aiTextRaw.toString().trim();
      const introText =
        safeText ||
        (Array.isArray(aiRes?.products) && aiRes.products.length > 0
          ? 'Minh goi y vai mau phu hop, ban xem nhanh nhe:'
          : 'Xin chao! Minh co the giup gi cho ban?');

      const baseCreatedAt = new Date();
      const aiMessages = [];

      if (introText) {
        aiMessages.push({
          conversationId: convId,
          senderRole: 'AI',
          type: 'TEXT',
          content: introText,
          createdAt: baseCreatedAt,
          metadata: {
            intent: aiRes?.intent,
            products: aiRes?.products,
            promotions: aiRes?.promotions,
            contextType: context.type,
            aiDebug: { usedAI: Boolean(aiRes && aiRes.ai) },
          },
        });
      }

      if (Array.isArray(aiRes?.products)) {
        aiRes.products.forEach((p, idx) => {
          aiMessages.push({
            conversationId: convId,
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
            metadata: {
              intent: aiRes?.intent,
              contextType: context.type,
              fromAiSuggestion: true,
            },
          });
        });
      }

      const createdMessages = aiMessages.length ? await Message.insertMany(aiMessages) : [];

      const lastCreatedAt = createdMessages.length
        ? createdMessages[createdMessages.length - 1].createdAt || baseCreatedAt
        : baseCreatedAt;

      const updated = await Conversation.findByIdAndUpdate(
        convId,
        { lastMessageAt: lastCreatedAt || new Date(), mode: 'AI' },
        { new: true }
      ).lean();

      createdMessages.forEach((msg) => emitMessage(msg));
      if (updated) emitConversationUpdate(updated);
    } catch (error) {
      console.error('AI reply error', error.message || error);
    }
  };

  io.on('connection', (socket) => {
    // try to attach authenticated user from handshake token
    try {
      const token = socket.handshake && socket.handshake.auth && socket.handshake.auth.token;
      if (token) {
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN);
        socket.user = payload; // { id, isAdmin, ... }
      }
    } catch (e) {
      // ignore auth errors; socket.user stays undefined for guests
    }

    console.log('Socket connected', socket.id, socket.user ? `(user ${socket.user.id})` : '(guest)');

    // join room / conversation
    socket.on('join_conversation', async ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(conversationId.toString());
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);

      // auto-assign if admin and conversation has no assignedTo
      try {
        if (socket.user && socket.user.isAdmin) {
          await Conversation.findOneAndUpdate({ _id: conversationId, assignedTo: null }, { assignedTo: socket.user.id });
        }
      } catch (e) {
        console.warn('Auto-assign failed', e.message);
      }
    });

    socket.on('join_room', async ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(conversationId.toString());
      console.log(`Socket ${socket.id} joined room ${conversationId}`);

      try {
        if (socket.user && socket.user.isAdmin) {
          await Conversation.findOneAndUpdate({ _id: conversationId, assignedTo: null }, { assignedTo: socket.user.id });
        }
      } catch (e) {
        console.warn('Auto-assign failed', e.message);
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(conversationId.toString());
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    socket.on('typing', ({ conversationId, userId }) => {
      if (!conversationId) return;
      socket.to(conversationId.toString()).emit('typing', { conversationId, userId });
    });

    // send_message: create message, normalize type, emit single 'message:new' and scoped conversation_update
    socket.on('send_message', async (payload) => {
      try {
        const { conversationId, senderId, senderRole, content, type = 'TEXT', metadata = {} } = payload;
        if (!conversationId || (typeof content === 'undefined' || content === null)) return;

        const normalizedType = typeof type === 'string' ? type.toUpperCase() : 'TEXT';

        let sRole = 'USER';
        if (senderRole === 'AI') sRole = 'AI';
        else if (senderRole === 'SYSTEM') sRole = 'SYSTEM';
        else if (socket.user && socket.user.isAdmin) sRole = 'AGENT';

        const sId = senderId || (socket.user ? socket.user.id : null);

        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        conv.mode = conv.mode || 'AI';
        conv.context = conv.context || { type: 'GENERAL' };

        if (sRole === 'AGENT' && conv.assignedTo && String(conv.assignedTo) !== String(sId)) {
          socket.emit('message:error', { message: 'You are not assigned to this conversation' });
          return;
        }

        const now = new Date();
        const message = await Message.create({ conversationId, senderId: sId, senderRole: sRole, content, type: normalizedType, metadata });

        const update = { lastMessageAt: now, status: 'ACTIVE', context: conv.context };
        if (sRole === 'USER') {
          update.$inc = { unreadCount: 1 };
          update.lastUserAt = now;
        } else if (sRole === 'AGENT') {
          update.unreadCount = 0;
          update.lastAgentAt = now;
          update.mode = 'HUMAN';
        }

        const updatedConv = await Conversation.findByIdAndUpdate(conversationId, update, { new: true }).lean();

        emitMessage(message);
        if (updatedConv) emitConversationUpdate(updatedConv);

        const effectiveConv = updatedConv || (conv.toObject ? conv.toObject() : conv);

        if (effectiveConv && (effectiveConv.mode || 'AI') === 'HUMAN') {
          if (sRole === 'USER') {
            scheduleAdminTimeout(effectiveConv);
            scheduleUserTimeout(effectiveConv);
          } else if (sRole === 'AGENT') {
            clearTimer(adminTimeouts, conversationId);
          }
        } else {
          clearTimer(adminTimeouts, conversationId);
          clearTimer(userTimeouts, conversationId);
        }

        if (sRole === 'USER' && normalizedType === 'TEXT' && (effectiveConv?.mode || 'AI') === 'AI') {
          handleAiReply(effectiveConv, message);
        }
      } catch (error) {
        console.error('send_message socket error', error);
      }
    });

    // message seen flow
    socket.on('message:seen', async ({ conversationId, lastMessageId }) => {
      try {
        if (!conversationId || !socket.user) return;
        const userId = socket.user.id;
        // add userId to readBy of messages up to lastMessageId
        await Message.updateMany(
          { conversationId, _id: { $lte: lastMessageId }, readBy: { $ne: userId } },
          { $push: { readBy: userId } }
        );

        // optional: update conversation.readMap
        await Conversation.findByIdAndUpdate(conversationId, { $set: { ["readMap." + userId]: lastMessageId } }, { new: true });

        // notify others in room and admin namespace
        io.to(conversationId.toString()).emit('message:seen', { conversationId, userId, lastMessageId });
        adminNs.emit('message:seen', { conversationId, userId, lastMessageId });
      } catch (e) {
        console.error('message:seen error', e);
      }
    });

    socket.on('conversation:request-human', async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        const conv = await Conversation.findByIdAndUpdate(
          conversationId,
          { mode: 'HUMAN', status: 'ACTIVE' },
          { new: true }
        ).lean();
        if (!conv) return;

        const adminCount =
          adminNs && adminNs.sockets
            ? typeof adminNs.sockets.size === 'number'
              ? adminNs.sockets.size
              : Object.keys(adminNs.sockets).length
            : 0;

        const content =
          adminCount === 0
            ? 'CSKH has received your request. Please wait a moment.'
            : 'Connecting you to CSKH...';

        const systemMessage = await Message.create({
          conversationId,
          senderRole: 'SYSTEM',
          content,
          type: 'SYSTEM',
          metadata: { reason: 'REQUEST_HUMAN' },
        });

        await Conversation.findByIdAndUpdate(conversationId, { lastMessageAt: systemMessage.createdAt || new Date() });

        emitMessage(systemMessage);
        emitConversationUpdate(conv);
        scheduleAdminTimeout(conv);
        scheduleUserTimeout(conv);
      } catch (e) {
        console.error('conversation:request-human error', e);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected', socket.id);
    });
  });

  adminNs.on('connection', (socket) => {
    try {
      const token = socket.handshake && socket.handshake.auth && socket.handshake.auth.token;
      let payload = null;
      if (token) payload = jwt.verify(token, process.env.ACCESS_TOKEN);
      if (!payload || !payload.isAdmin) {
        console.warn('Non-admin tried to connect to /chat/admin', socket.id);
        // optionally disconnect non-admin sockets
        // socket.disconnect(true);
      }
      console.log('Admin connected to /chat/admin', socket.id);
    } catch (e) {
      console.warn('Admin namespace auth failed', e.message);
    }
  });
};

module.exports = {
  init,
};
