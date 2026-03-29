import api from './api';

export const createConversation = (payload) => api.post('/conversation/conversations', payload);
export const getConversations = (params, token) => {
  const headers = token ? { token: `Bearer ${token}` } : undefined;
  return api.get('/conversation/conversations', { params, headers });
};
export const getMessages = (conversationId, params) => api.get(`/conversation/messages/${conversationId}`, { params });
export const sendMessageAdmin = (conversationId, payload, token) =>
  api.post(`/conversation/admin/${conversationId}/message`, payload, { headers: { token: `Bearer ${token}` } });
export const markRead = (conversationId, token) =>
  api.post(`/conversation/admin/${conversationId}/read`, {}, { headers: { token: `Bearer ${token}` } });
export const updateStatus = (conversationId, data, token) =>
  api.post(`/conversation/admin/${conversationId}/status`, data, { headers: { token: `Bearer ${token}` } });
export const updateMeta = (conversationId, meta, token) =>
  api.post(`/conversation/admin/${conversationId}/meta`, { meta }, { headers: { token: `Bearer ${token}` } });
export const deleteMessage = (conversationId, messageId, token) =>
  api.delete(`/conversation/admin/${conversationId}/message/${messageId}`, { headers: { token: `Bearer ${token}` } });
export const requestHuman = (conversationId) => api.post(`/conversation/${conversationId}/request-human`);

export default { createConversation, getConversations, getMessages, sendMessageAdmin, markRead, updateStatus, updateMeta, deleteMessage, requestHuman };
