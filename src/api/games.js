import api from './index'

export const gameApi = {
  list: () => api.get('/games'),
  play: (id) => api.post(`/games/${id}/play`),
  result: (id, recordId) => api.get(`/games/${id}/result/${recordId}`)
}
