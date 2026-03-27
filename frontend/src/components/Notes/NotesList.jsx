import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import SearchBar from '../Common/SearchBar'
import { createNote, deleteNote, getNotes, updateNote } from '../../services/noteService'
import { getErrorMessage } from '../../utils/errorHandler'
import { fallbackNotes } from '../../utils/noteFallbackData'
import { DEFAULT_BOX_TITLES, buildNoteContentFromBoxes } from '../../utils/noteSections'

const mergeNotes = (primary = [], backup = []) => {
  const map = new Map()

  for (const note of [...primary, ...backup]) {
    const key = (note?.title || '').trim().toLowerCase() || note?._id || note?.id
    if (!key || map.has(key)) continue
    map.set(key, note)
  }

  return Array.from(map.values())
}

export default function NotesList() {
  const navigate = useNavigate()
  const userId = useSelector((state) => state.auth.user?.id)
  const role = useSelector((state) => state.auth.role)
  const isAdmin = role === 'admin'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState('All')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const defaultContent = buildNoteContentFromBoxes(
    [1, 2, 3, 4, 5, 6].map((number) => ({
      number,
      title: DEFAULT_BOX_TITLES[number],
      content: `Add ${DEFAULT_BOX_TITLES[number]} content here.`
    }))
  )

  const [createForm, setCreateForm] = useState({
    title: '',
    topic: '',
    visibility: 'Public'
  })

  useEffect(() => {
    let active = true
    if (!userId) return undefined

    const load = async () => {
      try {
        setLoading(true)
        const response = await getNotes(userId, {
          search: query || undefined,
          visibility: visibility === 'All' ? undefined : visibility,
          limit: 100
        })
        const list = response?.data?.data || []
        if (active) setItems(mergeNotes(Array.isArray(list) ? list : [], fallbackNotes))
      } catch {
        if (active) setItems(fallbackNotes)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [query, userId, visibility])

  const filtered = useMemo(() => {
    return items.filter((note) => {
      const byText = note.title?.toLowerCase().includes(query.toLowerCase())
      const byVisibility = visibility === 'All' || note.visibility === visibility
      return byText && byVisibility
    })
  }, [items, query, visibility])

  const topicOptions = useMemo(() => {
    const set = new Set()
    items.forEach((note) => {
      const topic = note?.topics?.[0]
      if (topic) set.add(topic)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  const reloadNotes = async () => {
    if (!userId) return
    const response = await getNotes(userId, {
      search: query || undefined,
      visibility: visibility === 'All' ? undefined : visibility,
      limit: 100
    })
    const list = response?.data?.data || []
    setItems(mergeNotes(Array.isArray(list) ? list : [], fallbackNotes))
  }

  const onCreate = async () => {
    if (!isAdmin || !userId) return
    try {
      setError('')
      setSuccess('')
      const topic = createForm.topic.trim()
      const title = createForm.title.trim() || `${topic || 'General'} Notes`
      await createNote(userId, {
        title,
        topics: topic ? [topic] : [],
        companies: [],
        visibility: createForm.visibility,
        content: defaultContent
      })
      setCreateForm({ title: '', topic: '', visibility: 'Public' })
      await reloadNotes()
      setSuccess('Note created successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const onQuickEdit = async (note) => {
    if (!isAdmin || !userId || !note?._id) return
    const title = window.prompt('Note title', note.title || '')
    if (!title || !title.trim()) return
    const topic = window.prompt('Primary topic', note?.topics?.[0] || '')
    if (topic === null) return
    const nextVisibility = window.prompt('Visibility: Public or Private', note.visibility || 'Public')
    if (!nextVisibility || !['Public', 'Private'].includes(nextVisibility)) {
      setError('Visibility must be Public or Private.')
      return
    }

    try {
      setError('')
      setSuccess('')
      const ownerId = note?.studentId?._id || note?.studentId || userId
      await updateNote(ownerId, note._id, {
        title: title.trim(),
        topics: topic.trim() ? [topic.trim()] : [],
        visibility: nextVisibility
      })
      await reloadNotes()
      setSuccess('Note updated successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const onRemove = async (note) => {
    if (!isAdmin || !userId || !note?._id) return
    const confirmed = window.confirm(`Delete note "${note.title}"?`)
    if (!confirmed) return

    try {
      setError('')
      setSuccess('')
      const ownerId = note?.studentId?._id || note?.studentId || userId
      await deleteNote(ownerId, note._id)
      await reloadNotes()
      setSuccess('Note deleted successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Study Notes</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Open any note to view concept explanation, pseudocode, and Java examples.</p>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      {isAdmin && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-700 dark:bg-blue-900/20">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">Admin Note CRUD</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <input
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Title (optional)"
              className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <input
              value={createForm.topic}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, topic: event.target.value }))}
              placeholder="Topic (e.g. Graphs)"
              list="notes-topics"
              className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <datalist id="notes-topics">
              {topicOptions.map((topic) => (
                <option key={topic} value={topic} />
              ))}
            </datalist>
            <select
              value={createForm.visibility}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, visibility: event.target.value }))}
              className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
            <button type="button" onClick={onCreate} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white">
              Create Note
            </button>
          </div>
          <p className="mt-2 text-xs text-blue-700 dark:text-blue-200">Tip: open a note card to edit all 6 parts (concept, pseudocode, Java, interview questions, must-solve list, 30-day schedule).</p>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" />
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          <option>All</option>
          <option>Public</option>
          <option>Private</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading notes...</p>}
        {filtered.map((note) => (
          <article
            key={note._id || note.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/notes/${note._id || note.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate(`/notes/${note._id || note.id}`)
              }
            }}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm dark:border-slate-700"
          >
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{note.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {(note.topics && note.topics[0]) || 'General'} • {note.visibility} • {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
            </p>
            {isAdmin && (
              <div className="mt-3 flex gap-2" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onQuickEdit(note)}
                  className="rounded border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(note)}
                  className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          No notes matched your search.
        </p>
      )}
    </section>
  )
}
