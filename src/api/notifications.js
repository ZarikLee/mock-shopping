import api from './index'

export const notificationApi = {
  list: () => api.get('/notifications'),
  readAll: () => api.post('/notifications/read'),
}
