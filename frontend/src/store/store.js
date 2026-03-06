import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import dataReducer from './dataSlice'
import userReducer from './userSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    data: dataReducer,
  },
})

export default store
