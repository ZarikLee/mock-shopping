import api from './index'

export const reviewApi = {
  list: (productId) => api.get(`/reviews`, { params: { productId } }),
  create: (data) => api.post('/reviews', data)
}
