import api from './index'

export const leaderboardApi = {
  get: (type = 'daily') => api.get('/leaderboard', { params: { type } }),
  myRank: () => api.get('/leaderboard/my-rank')
}
