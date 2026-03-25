import { useEffect, useMemo, useState } from 'react'
import { createForumMessage, getForumMessages } from '../../services/forumService'
import { getErrorMessage } from '../../utils/errorHandler'

const REACTIONS_STORAGE_KEY = 'forum-reactions-v1'
const SAVED_STORAGE_KEY = 'forum-saved-v1'

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return date.toLocaleString()
}

const formatRelativeTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'just now'

  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const getMessageId = (message) => String(message._id || message.id || '')

const getTimestamp = (message) => new Date(message.created_at || message.createdAt || 0).getTime() || 0

const detectTag = (text = '') => {
  const normalized = text.toLowerCase()
  if (normalized.includes('interview') || normalized.includes('hr') || normalized.includes('round')) return 'Interview'
  if (normalized.includes('resume') || normalized.includes('ats') || normalized.includes('cv')) return 'Resume'
  if (normalized.includes('dsa') || normalized.includes('leetcode') || normalized.includes('algorithm')) return 'DSA'
  if (normalized.includes('project') || normalized.includes('github') || normalized.includes('portfolio')) return 'Projects'
  if (normalized.includes('roadmap') || normalized.includes('plan') || normalized.includes('strategy')) return 'Strategy'
  return 'General'
}

const highlightText = (text, query) => {
  if (!query) return text
  const source = String(text || '')
  const lower = source.toLowerCase()
  const match = lower.indexOf(query.toLowerCase())
  if (match === -1) return source

  const start = source.slice(0, match)
  const middle = source.slice(match, match + query.length)
  const end = source.slice(match + query.length)

  return (
    <>
      {start}
      <mark className="rounded bg-amber-200/80 px-0.5 text-slate-900">{middle}</mark>
      {end}
    </>
  )
}

const sortNodes = (nodes, sortBy) => {
  const withSortedChildren = nodes.map((node) => ({
    ...node,
    children: sortNodes(node.children || [], sortBy)
  }))

  return withSortedChildren.sort((a, b) => {
    const timeA = getTimestamp(a)
    const timeB = getTimestamp(b)

    if (sortBy === 'oldest') return timeA - timeB
    if (sortBy === 'mostReplies') {
      const replyDiff = (b.children?.length || 0) - (a.children?.length || 0)
      if (replyDiff !== 0) return replyDiff
      return timeB - timeA
    }

    return timeB - timeA
  })
}

const buildTree = (rawMessages) => {
  const nodesById = new Map()
  const roots = []

  rawMessages.forEach((message) => {
    const id = getMessageId(message)
    if (!id) return
    nodesById.set(id, { ...message, _messageId: id, children: [] })
  })

  nodesById.forEach((node) => {
    const parentId = node.parentMessageId ? String(node.parentMessageId) : null
    if (parentId && nodesById.has(parentId)) {
      nodesById.get(parentId).children.push(node)
      return
    }
    roots.push(node)
  })

  return roots
}

const filterTree = (nodes, query, activeTag) => {
  const normalizedQuery = query.trim().toLowerCase()

  return nodes
    .map((node) => {
      const messageText = String(node.message || '')
      const nodeTag = detectTag(messageText)
      const selfMatchQuery = !normalizedQuery || messageText.toLowerCase().includes(normalizedQuery)
      const selfMatchTag = activeTag === 'All' || nodeTag === activeTag
      const filteredChildren = filterTree(node.children || [], query, activeTag)

      const matches = (selfMatchQuery && selfMatchTag) || filteredChildren.length > 0
      if (!matches) return null

      return {
        ...node,
        children: filteredChildren
      }
    })
    .filter(Boolean)
}

const flattenNodes = (nodes, acc = []) => {
  nodes.forEach((node) => {
    acc.push(node)
    flattenNodes(node.children || [], acc)
  })
  return acc
}

export default function ForumChat() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [activeTag, setActiveTag] = useState('All')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [reactions, setReactions] = useState({})
  const [saved, setSaved] = useState({})

  const MAX_MESSAGE_LENGTH = 1000

  useEffect(() => {
    try {
      const savedReactions = JSON.parse(window.localStorage.getItem(REACTIONS_STORAGE_KEY) || '{}')
      const savedThreads = JSON.parse(window.localStorage.getItem(SAVED_STORAGE_KEY) || '{}')
      setReactions(savedReactions)
      setSaved(savedThreads)
    } catch {
      setReactions({})
      setSaved({})
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions))
  }, [reactions])

  useEffect(() => {
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved))
  }, [saved])

  const loadMessages = async ({ silent } = { silent: false }) => {
    try {
      if (!silent) setLoading(true)
      const response = await getForumMessages()
      setMessages(response?.data?.data || [])
      setLastUpdatedAt(Date.now())
      if (!silent) setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return undefined

    const intervalId = window.setInterval(() => {
      loadMessages({ silent: true })
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [autoRefresh])

  const tree = useMemo(() => buildTree(messages), [messages])

  const sortedTree = useMemo(() => sortNodes(tree, sortBy), [tree, sortBy])

  const filteredTree = useMemo(() => filterTree(sortedTree, searchTerm, activeTag), [sortedTree, searchTerm, activeTag])

  const visibleFlatMessages = useMemo(() => flattenNodes(filteredTree), [filteredTree])

  const tags = useMemo(() => {
    const values = new Set(['All'])
    messages.forEach((message) => {
      values.add(detectTag(message.message))
    })
    return Array.from(values)
  }, [messages])

  const stats = useMemo(() => {
    const roots = messages.filter((message) => !message.parentMessageId)
    const replies = messages.length - roots.length

    const repliesByParent = new Map()
    messages.forEach((message) => {
      if (!message.parentMessageId) return
      const key = String(message.parentMessageId)
      repliesByParent.set(key, (repliesByParent.get(key) || 0) + 1)
    })

    const activeThreads = Array.from(repliesByParent.values()).filter((count) => count >= 2).length

    const participants = new Set(messages.map((message) => message.userId?.email || message.userId?.name || 'Student'))
    const latestMessage = messages.reduce((latest, current) => {
      const latestTime = latest ? getTimestamp(latest) : 0
      return getTimestamp(current) > latestTime ? current : latest
    }, null)

    return {
      totalMessages: messages.length,
      roots: roots.length,
      replies,
      activeThreads,
      participants: participants.size,
      lastActivity: latestMessage ? formatRelativeTime(latestMessage.created_at || latestMessage.createdAt) : 'No activity'
    }
  }, [messages])

  const replyTarget = useMemo(() => {
    if (!replyTo) return null
    return messages.find((message) => getMessageId(message) === replyTo) || null
  }, [messages, replyTo])

  const handleReaction = (messageId, reactionKey) => {
    setReactions((prev) => {
      const existing = prev[messageId] || {}
      return {
        ...prev,
        [messageId]: {
          ...existing,
          [reactionKey]: !existing[reactionKey]
        }
      }
    })
  }

  const toggleSaved = (messageId) => {
    setSaved((prev) => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  const toggleCollapsed = (messageId) => {
    setCollapsed((prev) => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  const collapseAll = (nodes, value) => {
    const next = {}
    const visit = (list) => {
      list.forEach((node) => {
        if ((node.children || []).length > 0) next[node._messageId] = value
        visit(node.children || [])
      })
    }
    visit(nodes)
    setCollapsed(next)
  }

  const handleSend = async (event) => {
    event.preventDefault()

    const message = text.trim()
    if (!message) {
      setError('Message is required')
      return
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`)
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

  const handleComposerKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      if (!sending) handleSend(event)
    }
  }

  const renderMessages = (nodes, depth = 0) => {
    return nodes.map((message) => {
      const messageId = message._messageId
      const author = message.userId?.name || 'Student'
      const createdAt = message.created_at || message.createdAt
      const tag = detectTag(message.message)
      const hasChildren = (message.children || []).length > 0
      const isCollapsed = Boolean(collapsed[messageId])
      const myReactions = reactions[messageId] || {}
      const isSaved = Boolean(saved[messageId])
      const childList = hasChildren && !isCollapsed ? renderMessages(message.children, depth + 1) : null

      return (
        <div key={messageId} className={`${depth > 0 ? 'ml-4 border-l border-slate-200 pl-3 dark:border-slate-700' : ''} space-y-2`}>
          <article className="forum-message-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {author}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                {tag}
              </span>
              {isSaved && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  Saved
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500 dark:text-slate-400" title={formatTime(createdAt)}>
                {formatRelativeTime(createdAt)}
              </span>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
              {highlightText(message.message, searchTerm)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setReplyTo(messageId)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Reply
              </button>

              <button
                type="button"
                onClick={() => toggleSaved(messageId)}
                className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              >
                {isSaved ? 'Unsave' : 'Save'}
              </button>

              <button
                type="button"
                onClick={() => handleReaction(messageId, 'useful')}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${myReactions.useful ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800'}`}
              >
                Useful
              </button>

              <button
                type="button"
                onClick={() => handleReaction(messageId, 'resolved')}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${myReactions.resolved ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800'}`}
              >
                Resolved
              </button>

              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleCollapsed(messageId)}
                  className="rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                >
                  {isCollapsed ? `Expand replies (${message.children.length})` : 'Collapse replies'}
                </button>
              )}
            </div>
          </article>
          {childList}
        </div>
      )
    })
  }

  return (
    <section className="forum-shell space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:shadow-none">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 p-5 dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Forum</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Threaded discussions, smart filters, and cleaner collaboration for placement prep.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadMessages()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${autoRefresh ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800'}`}
            >
              Auto refresh: {autoRefresh ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Messages</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.totalMessages}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Threads</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.roots}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Replies</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.replies}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active threads</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.activeThreads}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Participants</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.participants}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Last activity</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{stats.lastActivity}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {lastUpdatedAt ? `Last refreshed ${formatRelativeTime(lastUpdatedAt)}` : 'Waiting for first sync'}
        </p>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Search discussions</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by keyword"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Sort</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="mostReplies">Most replies</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => collapseAll(filteredTree, true)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Collapse all
        </button>

        <button
          type="button"
          onClick={() => collapseAll(filteredTree, false)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Expand all
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeTag === tag ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800'}`}
          >
            {tag}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">Showing {visibleFlatMessages.length} matched messages</span>
      </div>

      <form onSubmit={handleSend} className="forum-compose-form space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
        {replyTo && (
          <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">
            <span>
              Replying to {replyTarget?.userId?.name || 'Student'}: {String(replyTarget?.message || '').slice(0, 80)}
            </span>
            <button type="button" onClick={() => setReplyTo(null)} className="font-medium">Cancel</button>
          </div>
        )}
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder="Share your question, insight, or placement strategy update..."
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            {text.trim().length}/{MAX_MESSAGE_LENGTH} characters. Press Ctrl+Enter to send quickly.
          </p>
          <button type="submit" disabled={sending} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="forum-state-box rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            Loading messages...
          </div>
        ) : visibleFlatMessages.length === 0 ? (
          <div className="forum-state-box rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
            No discussions match your current filters. Try adjusting search or tag selection.
          </div>
        ) : (
          renderMessages(filteredTree)
        )}
      </div>
    </section>
  )
}
