import api from './index'

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  detail: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  pay: (id) => api.post(`/orders/${id}/pay`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  complete: (id) => api.post(`/orders/${id}/complete`)
}
