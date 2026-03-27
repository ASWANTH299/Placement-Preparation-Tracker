import api from './api'

export const getProjects = (studentId) => api.get(`/students/${studentId}/projects`)
export const getProjectById = (studentId, projectId) => api.get(`/students/${studentId}/projects/${projectId}`)
export const uploadProject = (studentId, formData) =>
  api.post(`/students/${studentId}/projects/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const updateProject = (studentId, projectId, payload) => api.put(`/students/${studentId}/projects/${projectId}`, payload)
export const deleteProject = (studentId, projectId) => api.delete(`/students/${studentId}/projects/${projectId}`)
export const downloadProject = (studentId, projectId) =>
  api.get(`/students/${studentId}/projects/${projectId}/download`, { responseType: 'blob' })
