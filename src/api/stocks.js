import api from './index'

export const stockApi = {
  list: () => api.get('/stocks'),
  detail: (symbol) => api.get(`/stocks/${symbol}`)
}
