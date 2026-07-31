import api from './index'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  checkin: () => api.post('/checkin'),
  getCheckinStatus: () => api.get('/checkin/status'),
  getPayPasswordStatus: () => api.get('/auth/paypassword/status'),
  setPayPassword: (data) => api.post('/auth/paypassword/set', data),
  verifyPayPassword: (data) => api.post('/auth/paypassword', data),
  uploadAvatar: (data) => api.post('/auth/avatar', data)
}
