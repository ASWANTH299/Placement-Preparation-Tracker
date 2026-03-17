import api from './api'

export const getForumMessages = () => api.get('/forum/messages')
export const createForumMessage = (payload) => api.post('/forum/messages', payload)
