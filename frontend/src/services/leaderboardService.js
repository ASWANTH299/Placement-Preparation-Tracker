import api from './api'

export const getLeaderboard = (params) => api.get('/leaderboard', { params })
export const getMyRank = (studentId) => api.get(`/leaderboard/my-rank/${studentId}`)
