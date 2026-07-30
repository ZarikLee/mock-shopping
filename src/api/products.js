import api from './index'

export const productApi = {
  list: (params) => api.get('/products', { params }),
  detail: (id) => api.get(`/products/${id}`),
  hot: () => api.get('/products/hot'),
  newArrivals: () => api.get('/products/new')
}
