import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let hasTriggeredSessionRedirect = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const errorCode = error?.response?.data?.errorCode
    const hasToken = Boolean(localStorage.getItem('token'))
    const isAuthFailure = status === 401 || errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID'

    if (hasToken && isAuthFailure && !hasTriggeredSessionRedirect) {
      hasTriggeredSessionRedirect = true

      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('user')

      // Hard redirect resets Redux auth state from cleared localStorage.
      window.location.assign('/login?reason=session-expired')
    }

    return Promise.reject(error)
  }
)

export default api
