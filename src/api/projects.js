import api from './index'

export const projectApi = {
  list: () => api.get('/projects'),
  create: d => api.post('/projects', d),
  update: (id, d) => api.put(`/projects/${id}`, d),
  remove: id => api.delete(`/projects/${id}`),

  logs: (pid, params) => api.get(`/projects/${pid}/logs`, { params }),
  log: (pid, date) => api.get(`/projects/${pid}/logs/${date}`),
  draft: (pid, date, d) => api.post(`/projects/${pid}/logs/${date}/draft`, d),
  commit: (pid, date, d) => api.post(`/projects/${pid}/logs/${date}/commit`, d),
  versions: (pid, date) => api.get(`/projects/${pid}/logs/${date}/versions`),
  rollback: (pid, date, vId) => api.post(`/projects/${pid}/logs/${date}/rollback`, { versionId: vId }),
  removeDay: (pid, date) => api.delete(`/projects/${pid}/logs/${date}`)
}
