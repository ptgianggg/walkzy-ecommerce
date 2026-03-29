const CannedReply = require('../models/CannedReplyModel');

const listCannedReplies = async (req, res) => {
  try {
    const items = await CannedReply.find().sort({ createdAt: -1 }).lean();
    return res.json({ status: 'OK', data: { items } });
  } catch (e) {
    console.error('listCannedReplies error', e);
    return res.status(500).json({ status: 'ERROR', message: e.message });
  }
};

const createCannedReply = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const reply = await CannedReply.create({ title, content, tags: tags || [], createdBy: req.user?.id || null });
    return res.json({ status: 'OK', data: reply });
  } catch (e) {
    console.error('createCannedReply error', e);
    return res.status(500).json({ status: 'ERROR', message: e.message });
  }
};

const updateCannedReply = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, tags } = req.body;
    const reply = await CannedReply.findById(id);
    if (!reply) return res.status(404).json({ status: 'ERROR', message: 'Not found' });
    reply.title = title || reply.title;
    reply.content = content || reply.content;
    reply.tags = tags || reply.tags;
    await reply.save();
    return res.json({ status: 'OK', data: reply });
  } catch (e) {
    console.error('updateCannedReply error', e);
    return res.status(500).json({ status: 'ERROR', message: e.message });
  }
};

const deleteCannedReply = async (req, res) => {
  try {
    const id = req.params.id;
    await CannedReply.deleteOne({ _id: id });
    return res.json({ status: 'OK' });
  } catch (e) {
    console.error('deleteCannedReply error', e);
    return res.status(500).json({ status: 'ERROR', message: e.message });
  }
};

module.exports = { listCannedReplies, createCannedReply, updateCannedReply, deleteCannedReply };