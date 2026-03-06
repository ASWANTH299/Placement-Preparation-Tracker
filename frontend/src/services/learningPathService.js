import api from './api'

export const getLearningPaths = () => api.get('/learning-paths')
export const getLearningPathByWeek = (weekId) => api.get(`/learning-paths/${weekId}`)
