import api from './api'

export const getResumes = (studentId) => api.get(`/students/${studentId}/resumes`)
export const uploadResume = (studentId, formData) =>
	api.post(`/students/${studentId}/resumes/upload`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	})
export const setActiveResume = (studentId, resumeId) => api.put(`/students/${studentId}/resumes/${resumeId}/set-active`)
export const renameResume = (studentId, resumeId, customName) => api.put(`/students/${studentId}/resumes/${resumeId}/rename`, { customName })
export const deleteResume = (studentId, resumeId) => api.delete(`/students/${studentId}/resumes/${resumeId}`)
export const downloadResume = (studentId, resumeId) =>
	api.get(`/students/${studentId}/resumes/${resumeId}/download`, { responseType: 'blob' })
