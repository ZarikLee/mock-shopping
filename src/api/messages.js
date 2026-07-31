import api from './index'
export const messageApi = {
  send: (data) => api.post('/messages', data),
  conversations: () => api.get('/messages/conversations'),
  history: (userId) => api.get(`/messages/with/${userId}`),
  markRead: (id) => api.post(`/messages/${id}/read`),
  readAll: (userId) => api.post(`/messages/read-all/${userId}`)
}
