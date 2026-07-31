import api from './index'
export const userApi = {
  getProfile: (id) => api.get(`/users/${id}/profile`)
}
