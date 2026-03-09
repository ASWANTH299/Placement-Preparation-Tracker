import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { askAiAssistant } from '../../services/aiService'
import { getErrorMessage } from '../../utils/errorHandler'

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

const initialAssistantMessage = {
  role: 'assistant',
  content: 'AI Mode is ready. Ask about DSA, resume, interview preparation, or study planning.'
}

export default function AiModeWidget() {
  const location = useLocation()
  const token = useSelector((state) => state.auth.token)

  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState([initialAssistantMessage])

  const isHidden = useMemo(() => authRoutes.includes(location.pathname) || !token, [location.pathname, token])

  if (isHidden) {
    return null
  }

  const handleSend = async (event) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || isSending) {
      return
    }

    setInput('')
    setIsSending(true)
    setMessages((prev) => [...prev, { role: 'user', content: message }])

    try {
      const data = await askAiAssistant(message)
      const reply = data?.reply || 'No response from AI assistant.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: getErrorMessage(error) || 'Unable to reach AI assistant right now.' }
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)]">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white shadow-lg ring-1 ring-slate-700 transition hover:bg-slate-800"
        >
          AI Mode
        </button>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <div className="flex items-center justify-between bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            <span>AI Mode</span>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
              Close
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto p-3">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={item.role === 'user'
                  ? 'ml-8 rounded-lg bg-orange-100 px-3 py-2 text-sm text-slate-900 dark:bg-orange-900/40 dark:text-orange-100'
                  : 'mr-8 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100'}
              >
                {item.content}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-200 p-3 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask AI..."
                disabled={isSending}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none ring-orange-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isSending}
                className="rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
