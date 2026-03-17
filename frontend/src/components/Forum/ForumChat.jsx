import { useEffect, useMemo, useState } from 'react'
import { createForumMessage, getForumMessages } from '../../services/forumService'
import { getErrorMessage } from '../../utils/errorHandler'

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return date.toLocaleString()
}

const getMessageId = (message) => String(message._id || message.id || '')

export default function ForumChat() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadMessages = async ({ silent } = { silent: false }) => {
    try {
      if (!silent) setLoading(true)
      const response = await getForumMessages()
      setMessages(response?.data?.data || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()

    const intervalId = window.setInterval(() => {
      loadMessages({ silent: true })
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [])

  const childrenByParent = useMemo(() => {
    const map = new Map()

    messages.forEach((message) => {
      const key = message.parentMessageId ? String(message.parentMessageId) : 'root'
      const existing = map.get(key) || []
      existing.push(message)
      map.set(key, existing)
    })

    return map
  }, [messages])

  const handleSend = async (event) => {
    event.preventDefault()

    const message = text.trim()
    if (!message) {
      setError('Message is required')
      return
    }

    try {
      setSending(true)
      setError('')
      await createForumMessage({ message, parentMessageId: replyTo || null })
      setText('')
      setReplyTo(null)
      await loadMessages({ silent: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSending(false)
    }
  }

  const renderMessages = (parentId = 'root', depth = 0) => {
    const list = childrenByParent.get(parentId) || []

    return list.map((message) => {
      const messageId = getMessageId(message)
      const author = message.userId?.name || 'Student'
      const replyList = renderMessages(messageId, depth + 1)

      return (
        <div key={messageId} className={`space-y-2 ${depth > 0 ? 'ml-4 border-l border-slate-200 pl-3 dark:border-slate-700' : ''}`}>
          <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{author}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatTime(message.created_at || message.createdAt)}</p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{message.message}</p>
            <button
              type="button"
              onClick={() => setReplyTo(messageId)}
              className="mt-2 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reply
            </button>
          </article>
          {replyList}
        </div>
      )
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Forum</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Discuss placement prep topics with fellow students. Messages refresh every few seconds.</p>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSend} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
        {replyTo && (
          <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">
            <span>Replying to message</span>
            <button type="button" onClick={() => setReplyTo(null)} className="font-medium">Cancel</button>
          </div>
        )}
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write your message..."
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <div className="flex justify-end">
          <button type="submit" disabled={sending} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
            No messages yet. Start the first discussion.
          </div>
        ) : (
          renderMessages('root')
        )}
      </div>
    </section>
  )
}
