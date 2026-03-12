import { useEffect, useRef, useState } from 'react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { askAiAssistant } from '../../services/aiService'
import { getErrorMessage } from '../../utils/errorHandler'

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

const initialAssistantMessage = {
  role: 'assistant',
  content: "Hello! I'm your placement prep assistant 👋\nAsk me about DSA, resume tips, interview prep, system design, or project ideas!",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const TypingIndicator = () => (
  <div className="mr-8 flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
  </div>
)

export default function AiModeWidget() {
  const location = useLocation()
  const token = useSelector((state) => state.auth.token)

  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState([initialAssistantMessage])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const isHidden = useMemo(() => authRoutes.includes(location.pathname) || !token, [location.pathname, token])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [isOpen, messages])

  if (isHidden) return null

  const handleSend = async (event) => {
    event?.preventDefault()
    const message = input.trim()
    if (!message || isSending) return

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setInput('')
    setIsSending(true)
    setMessages((prev) => [...prev, { role: 'user', content: message, time }])

    try {
      const data = await askAiAssistant(message)
      const reply = data?.reply || 'No response from AI assistant.'
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, time: replyTime }])
    } catch (error) {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: getErrorMessage(error) || 'Unable to reach AI assistant right now.', time: replyTime }
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span>AI Assistant</span>
          <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-green-400" />
        </button>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">AI Assistant</p>
              <p className="text-xs text-blue-100">Placement Prep · Always ready</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([initialAssistantMessage])}
                title="Clear chat"
                className="rounded-lg px-2 py-1 text-xs text-blue-100 hover:bg-white/20"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-2 py-1 text-xs text-blue-100 hover:bg-white/20"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto p-3">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex flex-col gap-0.5 ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    item.role === 'user'
                      ? 'rounded-tr-sm bg-blue-600 text-white'
                      : 'rounded-tl-sm bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  {item.content}
                </div>
                {item.time && (
                  <span className="px-1 text-[10px] text-slate-400">{item.time}</span>
                )}
              </div>
            ))}
            {isSending && (
              <div className="flex items-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-slate-200 p-3 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about DSA, resume, interviews..."
                disabled={isSending}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-blue-500 transition focus:ring-2 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                <svg className="h-4 w-4 rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">Enter to send · Shift+Enter for new line</p>
          </form>
        </div>
      )}
    </div>
  )
}
