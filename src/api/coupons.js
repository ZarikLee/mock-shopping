import api from './index'

export const couponApi = {
  list: () => api.get('/coupons'),
  claim: (id) => api.post(`/coupons/${id}/claim`),
  available: (amount) => api.get('/coupons/available', { params: { amount } })
}
