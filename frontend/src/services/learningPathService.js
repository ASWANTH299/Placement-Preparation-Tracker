import api from './api'

export const getLearningPaths = () => api.get('/learning-paths')
export const getLearningPathByTopic = (topicId) => api.get(`/learning-paths/${topicId}`)
export const updateTopicProblemProgress = (studentId, topicId, problemIndex, completed) =>
	api.post(`/students/${studentId}/learning-progress/${topicId}/problems/${problemIndex}`, { completed })
export const getStudentLearningProgress = (studentId) => api.get(`/students/${studentId}/learning-progress`)
