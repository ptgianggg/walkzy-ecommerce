import api from './api';

export const listCannedReplies = (token) => api.get('/canned-reply/admin/list', { headers: token ? { token: `Bearer ${token}` } : undefined });
export const createCannedReply = (payload, token) => api.post('/canned-reply/admin', payload, { headers: { token: `Bearer ${token}` } });
export const updateCannedReply = (id, payload, token) => api.put(`/canned-reply/admin/${id}`, payload, { headers: { token: `Bearer ${token}` } });
export const deleteCannedReply = (id, token) => api.delete(`/canned-reply/admin/${id}`, { headers: { token: `Bearer ${token}` } });

export default { listCannedReplies, createCannedReply, updateCannedReply, deleteCannedReply };