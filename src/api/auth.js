import api from './index'

export const authApi = {
  register: d => api.post('/auth/register', d),
  login: d => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  profile: d => api.put('/auth/profile', d)
}
