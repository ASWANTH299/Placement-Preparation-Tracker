import { useEffect, useMemo, useState } from 'react'
import useDebounce from '../../hooks/useDebounce'
import useTouchInteractions from '../../hooks/useTouchInteractions'
import { getLearningPaths } from '../../services/learningPathService'

const sampleWeeks = Array.from({ length: 6 }).map((_, index) => ({
  id: `${index + 1}`,
  week: index + 1,
  topic: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'System Design'][index],
  description: 'Focused practice topics with resources and guided progression.',
  status: index < 2 ? 'Completed' : index === 2 ? 'In Progress' : 'Not Started',
  progress: index < 2 ? 100 : index === 2 ? 45 : 0,
  difficulty: index > 3 ? 'Advanced' : index > 1 ? 'Intermediate' : 'Beginner',
  hours: 6 + index,
}))

export default function LearningPathList() {
  const [weeks, setWeeks] = useState(sampleWeeks)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        const response = await getLearningPaths()
        const list = response?.data?.data || response?.data || []

        if (!active || !Array.isArray(list) || list.length === 0) return

        const normalized = list.map((item, index) => ({
          id: String(item.id ?? item.weekId ?? index + 1),
          week: item.week ?? index + 1,
          topic: item.topic ?? item.title ?? `Week ${index + 1}`,
          description: item.description ?? 'Focused practice topics with resources and guided progression.',
          status: item.status ?? 'Not Started',
          progress: Number(item.progress ?? 0),
          difficulty: item.difficulty ?? 'Intermediate',
          hours: Number(item.hours ?? 6),
        }))

        setWeeks(normalized)
      } catch {
        if (active) {
          setWeeks(sampleWeeks)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const [view, setView] = useState('card')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const touchHandlers = useTouchInteractions({
    onSwipeLeft: () => setView('timeline'),
    onSwipeRight: () => setView('card'),
  })

  const filteredWeeks = useMemo(() => {
    return weeks.filter((week) => {
      const statusMatch = statusFilter === 'All' || week.status === statusFilter
      const searchMatch = week.topic.toLowerCase().includes(debouncedSearch.toLowerCase())
      return statusMatch && searchMatch
    })
  }, [debouncedSearch, statusFilter, weeks])

  const completed = weeks.filter((week) => week.status === 'Completed').length
  const remainingHours = weeks.filter((week) => week.status !== 'Completed').reduce((sum, week) => sum + week.hours, 0)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" {...touchHandlers}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Learning Journey</h1>
          <p className="mt-1 text-sm text-slate-600">{completed}/{weeks.length} weeks completed • {remainingHours}h remaining</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setView('card')} className={`rounded px-3 py-1 text-sm ${view === 'card' ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700'}`}>Card</button>
          <button type="button" onClick={() => setView('timeline')} className={`rounded px-3 py-1 text-sm ${view === 'timeline' ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700'}`}>Timeline</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topic" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option>All</option>
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <p className="text-sm text-slate-500">Swipe left/right on mobile to switch views.</p>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-500">Loading learning paths...</p>}

      {view === 'card' ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredWeeks.map((week) => (
            <article key={week.id} className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold text-blue-600">Week {week.week}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{week.topic}</h2>
              <p className="mt-2 text-sm text-slate-600">{week.description}</p>
              <div className="mt-3 h-2 rounded bg-slate-200"><div className="h-2 rounded bg-blue-600" style={{ width: `${week.progress}%` }} /></div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{week.status}</span>
                <span>{week.difficulty}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {filteredWeeks.map((week) => (
            <li key={week.id} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Week {week.week}: {week.topic}</p>
              <p className="text-sm text-slate-600">Status: {week.status} • Progress: {week.progress}%</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
