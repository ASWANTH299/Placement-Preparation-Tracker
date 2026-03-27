import api from './api'

export const getAdminDashboardStats = () => api.get('/admin/dashboard/stats')
export const getAnalytics = () => api.get('/admin/analytics')

export const getAllUsers = (params) => api.get('/admin/users', { params })
export const createUser = (payload) => api.post('/admin/users', payload)
export const getUserDetail = (userId) => api.get(`/admin/users/${userId}`)
export const updateUser = (userId, payload) => api.put(`/admin/users/${userId}`, payload)
export const deleteUser = (userId, payload) => api.delete(`/admin/users/${userId}`, { data: payload })

export const createLearningPath = (payload) => api.post('/admin/learning-paths', payload)
export const updateLearningPath = (topicId, payload) => api.put(`/admin/learning-paths/${topicId}`, payload)
export const deleteLearningPath = (topicId) => api.delete(`/admin/learning-paths/${topicId}`)

export const createCompanyQuestion = (payload) => api.post('/admin/company-questions', payload)
export const updateCompanyQuestion = (questionId, payload) => api.put(`/admin/company-questions/${questionId}`, payload)
export const deleteCompanyQuestion = (questionId) => api.delete(`/admin/company-questions/${questionId}`)

export const getAdminMockInterviews = (params) => api.get('/admin/mock-interviews', { params })
export const createAdminMockInterview = (payload) => api.post('/admin/mock-interviews', payload)
export const updateAdminMockInterview = (interviewId, payload) => api.put(`/admin/mock-interviews/${interviewId}`, payload)
export const deleteAdminMockInterview = (interviewId) => api.delete(`/admin/mock-interviews/${interviewId}`)
