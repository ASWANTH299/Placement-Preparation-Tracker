import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import SearchBar from '../Common/SearchBar'
import { getNotes } from '../../services/noteService'
import { fallbackNotes } from '../../utils/noteFallbackData'

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
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState('All')

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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Study Notes</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Open any note to view concept explanation, pseudocode, and Java examples.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" />
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
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
            className="cursor-pointer rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm dark:border-slate-700"
          >
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{note.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {(note.topics && note.topics[0]) || 'General'} • {note.visibility} • {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
            </p>
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
