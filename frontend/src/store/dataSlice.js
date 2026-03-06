import { createSlice } from '@reduxjs/toolkit'

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    dashboard: null,
    learningPaths: [],
    questions: [],
  },
  reducers: {
    setDashboard: (state, action) => {
      state.dashboard = action.payload
    },
    setLearningPaths: (state, action) => {
      state.learningPaths = action.payload
    },
    setQuestions: (state, action) => {
      state.questions = action.payload
    },
  },
})

export const { setDashboard, setLearningPaths, setQuestions } = dataSlice.actions
export default dataSlice.reducer
