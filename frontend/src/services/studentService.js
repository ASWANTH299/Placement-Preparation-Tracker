import api from './api'

export const getDashboardProgress = (studentId) => api.get(`/students/${studentId}/progress`)
export const getStudyStreak = (studentId) => api.get(`/students/${studentId}/streak`)
export const getTodayActivity = (studentId) => api.get(`/students/${studentId}/activity`)
export const logTodayActivity = (studentId, payload) => api.post(`/students/${studentId}/activity`, payload)
export const getCurrentLearningPath = (studentId) => api.get(`/students/${studentId}/learning-path`)
export const getStudentProfile = (studentId) => api.get(`/students/${studentId}/profile`)
export const updateStudentProfile = (studentId, payload) => api.put(`/students/${studentId}/profile`, payload)
export const uploadStudentAvatar = (studentId, formData) =>
	api.post(`/students/${studentId}/profile/avatar`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	})
export const changeStudentPassword = (studentId, payload) => api.post(`/students/${studentId}/change-password`, payload)
