const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderRole: {
      type: String,
      enum: ['USER', 'AGENT', 'SYSTEM', 'AI'],
      default: 'USER',
    },
    type: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'FILE', 'PRODUCT', 'SYSTEM'],
      default: 'TEXT',
    },
    // content may be string or object (product info)
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    metadata: {
      type: Object,
      default: {},
    },
    readBy: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
