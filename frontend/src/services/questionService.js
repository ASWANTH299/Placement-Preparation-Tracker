import api from './api'

export const getQuestions = (params) => api.get('/company-questions', { params })
export const getQuestionDetail = (questionId) => api.get(`/company-questions/${questionId}`)
export const markQuestionSolved = (questionId, payload = {}) => api.post(`/company-questions/${questionId}/mark-solved`, payload)
export const markQuestionAttempted = (questionId) => api.post(`/company-questions/${questionId}/mark-attempted`)
export const toggleQuestionBookmark = (questionId, isBookmarked) => api.post(`/company-questions/${questionId}/bookmark`, { isBookmarked })
export const runPracticeCode = (payload) => api.post('/practice/run-code', payload)
export const submitPracticeCode = (payload) => api.post('/practice/submit-code', payload)
