import api from './index'

export const leaderboardApi = {
  getByBalance: () => api.get('/leaderboard'),
  getByPoints: () => api.get('/leaderboard/points'),
  getBySpending: () => api.get('/leaderboard/spending')
}
