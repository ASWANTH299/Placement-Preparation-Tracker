import api from './api'

export const getMockInterviews = (studentId, params) => api.get(`/students/${studentId}/mock-interviews`, { params })
export const createMockInterview = (studentId, payload) => api.post(`/students/${studentId}/mock-interviews`, payload)
export const getMockInterviewDetail = (studentId, interviewId) => api.get(`/students/${studentId}/mock-interviews/${interviewId}`)
export const updateMockInterview = (studentId, interviewId, payload) => api.put(`/students/${studentId}/mock-interviews/${interviewId}`, payload)
export const deleteMockInterview = (studentId, interviewId) => api.delete(`/students/${studentId}/mock-interviews/${interviewId}`)
