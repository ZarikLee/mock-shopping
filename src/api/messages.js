import api from './index'
export const messageApi = {
  send: (data) => api.post('/messages', data),
  conversations: () => api.get('/messages/conversations'),
  history: (userId) => api.get(`/messages/with/${userId}`),
  markRead: (id) => api.post(`/messages/${id}/read`),
  readAll: (userId) => api.post(`/messages/read-all/${userId}`),
  block: (userId) => api.post('/messages/block', { userId }),
  unblock: (userId) => api.post('/messages/unblock', { userId }),
  blockedList: () => api.get('/messages/blocked'),
  report: (data) => api.post('/messages/report', data),
  reports: () => api.get('/messages/reports'),
  approveReport: (id) => api.post(`/messages/reports/${id}/approve`),
  dismissReport: (id) => api.post(`/messages/reports/${id}/dismiss`)
}
