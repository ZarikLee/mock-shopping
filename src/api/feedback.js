import api from './index'

export const feedbackApi = {
  list: () => api.get('/feedback'),
  create: d => api.post('/feedback', d),
  reply: (id, d) => api.post('/feedback/' + id + '/reply', d),
}
