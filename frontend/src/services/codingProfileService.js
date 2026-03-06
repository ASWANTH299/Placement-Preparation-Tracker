import api from './api'

export const getCodingProfiles = (studentId) => api.get(`/students/${studentId}/coding-profiles`)
export const linkCodingProfile = (studentId, payload) => api.post(`/students/${studentId}/coding-profiles`, payload)
export const refreshCodingProfile = (studentId, profileId) => api.put(`/students/${studentId}/coding-profiles/${profileId}`)
export const unlinkCodingProfile = (studentId, profileId) => api.delete(`/students/${studentId}/coding-profiles/${profileId}`)
