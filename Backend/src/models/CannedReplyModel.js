const mongoose = require('mongoose');

const cannedReplySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const CannedReply = mongoose.model('CannedReply', cannedReplySchema);
module.exports = CannedReply;