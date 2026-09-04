import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('dl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dl_token')
      localStorage.removeItem('dl_user')
      if (location.pathname !== '/') location.href = '/'
    }
    return Promise.reject(err.response?.data || { error: '网络错误' })
  }
)

export default api
