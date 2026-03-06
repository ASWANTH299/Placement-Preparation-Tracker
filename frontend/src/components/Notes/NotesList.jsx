import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import SearchBar from '../Common/SearchBar'
import { getNotes } from '../../services/noteService'

const notes = [
  { id: 1, title: 'Sliding Window Patterns', topic: 'Arrays', visibility: 'Private', date: '2026-03-02' },
  { id: 2, title: 'Graph Traversal Cheatsheet', topic: 'Graphs', visibility: 'Public', date: '2026-03-05' },
]

export default function NotesList() {
  const userId = useSelector((state) => state.auth.user?.id)
  const [items, setItems] = useState(notes)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState('All')

  useEffect(() => {
    let active = true
    if (!userId) {
      setItems(notes)
      return undefined
    }

    const load = async () => {
      try {
        setLoading(true)
        const response = await getNotes(userId, { search: query, visibility: visibility === 'All' ? undefined : visibility })
        const list = response?.data?.data || response?.data || []
        if (!active || !Array.isArray(list) || list.length === 0) return

        const normalized = list.map((note, index) => ({
          id: note.id ?? index + 1,
          title: note.title ?? 'Untitled Note',
          topic: note.topic ?? 'General',
          visibility: note.visibility ?? 'Private',
          date: note.date ?? note.updatedAt?.slice(0, 10) ?? 'N/A',
        }))
        setItems(normalized)
      } catch {
        if (active) setItems(notes)
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
      const byText = note.title.toLowerCase().includes(query.toLowerCase())
      const byVisibility = visibility === 'All' || note.visibility === visibility
      return byText && byVisibility
    })
  }, [items, query, visibility])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Study Notes</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" />
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option>All</option>
          <option>Public</option>
          <option>Private</option>
        </select>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {loading && <p className="text-sm text-slate-500">Loading notes...</p>}
        {filtered.map((note) => (
          <article key={note.id} className="rounded border border-slate-200 p-3">
            <h2 className="font-semibold text-slate-900">{note.title}</h2>
            <p className="text-sm text-slate-600">{note.topic} • {note.visibility} • {note.date}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
