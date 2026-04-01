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

export const getAdminDailyTasks = (params) => api.get('/admin/daily-tasks', { params })
export const getAdminDailyTaskById = (taskId) => api.get(`/admin/daily-tasks/${taskId}`)
export const createAdminDailyTask = (payload) => api.post('/admin/daily-tasks', payload)
export const updateAdminDailyTask = (taskId, payload) => api.put(`/admin/daily-tasks/${taskId}`, payload)
export const deleteAdminDailyTask = (taskId) => api.delete(`/admin/daily-tasks/${taskId}`)

export const getAdminConceptVideos = (params) => api.get('/admin/concept-videos', { params })
export const getAdminConceptVideoById = (videoId) => api.get(`/admin/concept-videos/${videoId}`)
export const createAdminConceptVideo = (payload) => api.post('/admin/concept-videos', payload)
export const updateAdminConceptVideo = (videoId, payload) => api.put(`/admin/concept-videos/${videoId}`, payload)
export const deleteAdminConceptVideo = (videoId) => api.delete(`/admin/concept-videos/${videoId}`)

export const getAdminHRInterviewQuestions = (params) => api.get('/admin/hr-interview-questions', { params })
export const getAdminHRInterviewQuestionById = (questionId) => api.get(`/admin/hr-interview-questions/${questionId}`)
export const createAdminHRInterviewQuestion = (payload) => api.post('/admin/hr-interview-questions', payload)
export const updateAdminHRInterviewQuestion = (questionId, payload) => api.put(`/admin/hr-interview-questions/${questionId}`, payload)
export const deleteAdminHRInterviewQuestion = (questionId) => api.delete(`/admin/hr-interview-questions/${questionId}`)

export const getAdminProfiles = (params) => api.get('/admin/profiles', { params })
export const getAdminProfileById = (userId) => api.get(`/admin/profiles/${userId}`)
export const createAdminProfile = (payload) => api.post('/admin/profiles', payload)
export const updateAdminProfile = (userId, payload) => api.put(`/admin/profiles/${userId}`, payload)
export const deleteAdminProfile = (userId) => api.delete(`/admin/profiles/${userId}`)

export const getAdminMockInterviews = (params) => api.get('/admin/mock-interviews', { params })
export const createAdminMockInterview = (payload) => api.post('/admin/mock-interviews', payload)
export const updateAdminMockInterview = (interviewId, payload) => api.put(`/admin/mock-interviews/${interviewId}`, payload)
export const deleteAdminMockInterview = (interviewId) => api.delete(`/admin/mock-interviews/${interviewId}`)
