import api from './index'

export const authApi = {
  register: d => api.post('/auth/register', d),
  reset: d => api.post('/auth/reset', d),
  sms: d => api.post('/auth/sms', d),
  points: () => api.get('/auth/points'),
  convertStorage: d => api.post('/auth/points/convert', d),
  login: d => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  profile: d => api.put('/auth/profile', d)
}
