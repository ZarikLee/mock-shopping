import api from './index'
export const stockApi = {
  list: () => api.get('/stocks'),
  detail: (symbol) => api.get(`/stocks/${symbol}`),
  buy: (symbol, shares) => api.post(`/stocks/${symbol}/buy`, { shares }),
  sell: (symbol, shares) => api.post(`/stocks/${symbol}/sell`, { shares }),
  holdings: () => api.get('/stocks/holdings'),
  stats: () => api.get('/stocks/stats')
}
