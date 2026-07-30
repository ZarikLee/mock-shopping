import api from './index'

export const gameApi = {
  play: (data) => api.post('/games/play', data),
  getRecords: () => api.get('/games/records')
}
