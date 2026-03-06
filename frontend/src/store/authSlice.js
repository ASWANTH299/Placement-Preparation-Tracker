import { createSlice } from '@reduxjs/toolkit'

const normalizeUser = (user) => {
  if (!user) return null
  return {
    ...user,
    id: user.id || user._id || null,
  }
}

const storedUser = normalizeUser(JSON.parse(localStorage.getItem('user') || 'null'))
if (storedUser) {
  localStorage.setItem('user', JSON.stringify(storedUser))
}

const initialState = {
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  user: storedUser,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, role, user } = action.payload
      const normalizedUser = normalizeUser(user)
      state.token = token
      state.role = role
      state.user = normalizedUser
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      if (normalizedUser) {
        localStorage.setItem('user', JSON.stringify(normalizedUser))
      }
    },
    clearCredentials: (state) => {
      state.token = null
      state.role = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('user')
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer
