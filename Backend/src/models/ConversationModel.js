const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // link to support request if applicable
    supportRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportRequest',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestId: {
      // For guest chats (not logged in)
      type: String,
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    assignedTo: {
      // adminId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'CLOSED'],
      default: 'PENDING',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // unread count for admin (number of messages from user not seen by admin)
    unreadCount: {
      type: Number,
      default: 0,
    },
    mode: {
      type: String,
      enum: ['AI', 'HUMAN'],
      default: 'AI',
    },
    context: {
      type: Object,
      default: { type: 'GENERAL' },
    },
    lastAgentAt: {
      type: Date,
      default: null,
    },
    lastUserAt: {
      type: Date,
      default: null,
    },
    // track closed chat info
    closedAt: {
      type: Date,
      default: null,
    },
    closedReason: {
      type: String,
      default: null,
    },
    // map of userId -> lastReadMessageId (for seen/read tracking)
    readMap: {
      type: Object,
      default: {},
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ assignedTo: 1, status: 1 });
conversationSchema.index({ mode: 1, status: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
