import api from './api'

export const register = (payload) => api.post('/auth/register', payload)
export const login = (payload) => api.post('/auth/login', payload)
export const requestPasswordResetOtp = (payload) => api.post('/auth/forgot-password', payload)
export const verifyPasswordResetOtp = (payload) => api.post('/auth/verify-reset-otp', payload)
export const resetPassword = (payload) => api.post('/auth/reset-password', payload)

export const forgotPassword = requestPasswordResetOtp
