import api from './index'

export const leaderboardApi = {
  getByBalance: () => api.get('/leaderboard'),
  getBySpending: () => api.get('/leaderboard/spending'),
  getByStocks: () => api.get('/leaderboard/stocks')
}
