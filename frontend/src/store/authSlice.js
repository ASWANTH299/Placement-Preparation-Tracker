import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, role, user } = action.payload
      state.token = token
      state.role = role
      state.user = user || null
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
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
