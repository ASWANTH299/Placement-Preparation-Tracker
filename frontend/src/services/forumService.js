import api from './api'

export const getForumMessages = () => api.get('/forum/messages')
export const createForumMessage = (payload) => api.post('/forum/messages', payload)
export const updateForumMessage = (messageId, payload) => api.put(`/forum/messages/${messageId}`, payload)
export const deleteForumMessage = (messageId) => api.delete(`/forum/messages/${messageId}`)
