import api from './api'

const getFallbackReply = (message = '') => {
  const lower = message.toLowerCase()

  if (lower.includes('resume')) {
    return 'Resume quick tips: keep it one page, quantify impact, and highlight your top 2 projects with outcomes.'
  }

  if (lower.includes('interview') || lower.includes('hr')) {
    return 'Interview plan: practice intro + 3 STAR stories, solve 2 DSA questions daily, and do 2 mocks per week.'
  }

  if (lower.includes('dsa') || lower.includes('leetcode')) {
    return 'DSA plan: Arrays/Strings -> Hashing -> Trees/Graphs -> DP. Solve by pattern and revise mistakes weekly.'
  }

  return 'AI mode is available, but the backend AI route is currently not reachable. Please restart backend once and try again.'
}

export const askAiAssistant = async (message) => {
  try {
    const response = await api.post('/ai/chat', { message })
    return response?.data?.data || {}
  } catch (error) {
    const status = error?.response?.status
    const backendMessage = error?.response?.data?.error

    if (status === 404 && backendMessage === 'Route not found') {
      try {
        const retryResponse = await api.post('/students/ai/chat', { message })
        return retryResponse?.data?.data || {}
      } catch {
        return { reply: getFallbackReply(message), mode: 'frontend-fallback' }
      }
    }

    throw error
  }
}
