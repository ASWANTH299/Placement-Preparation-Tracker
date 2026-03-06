import api from './api'

export const getNotes = (studentId, params) => api.get(`/students/${studentId}/notes`, { params })
export const createNote = (studentId, payload) => api.post(`/students/${studentId}/notes`, payload)
export const getNoteById = (noteId) => api.get(`/notes/${noteId}`)
export const updateNote = (studentId, noteId, payload) => api.put(`/students/${studentId}/notes/${noteId}`, payload)
export const deleteNote = (studentId, noteId) => api.delete(`/students/${studentId}/notes/${noteId}`)
