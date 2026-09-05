import api from './index'

export const aiApi = {
  chat: d => api.post('/ai', d)
}
