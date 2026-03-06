import api from './api'

export const getAdminDashboardStats = () => api.get('/admin/dashboard/stats')

export const getAllUsers = (params) => api.get('/admin/users', { params })
export const createLearningPath = (payload) => api.post('/admin/learning-paths', payload)
export const createCompanyQuestion = (payload) => api.post('/admin/company-questions', payload)
