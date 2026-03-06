import api from './api'

export const getNotes = (studentId, params) => api.get(`/students/${studentId}/notes`, { params })
export const createNote = (studentId, payload) => api.post(`/students/${studentId}/notes`, payload)
