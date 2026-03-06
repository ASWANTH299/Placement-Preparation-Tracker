import { useEffect, useState } from 'react'
import { createLearningPath } from '../../services/adminService'
import { getLearningPaths } from '../../services/learningPathService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function LearningPathManagement() {
  const [topic, setTopic] = useState('')
  const [topics, setTopics] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const response = await getLearningPaths()
        const rows = response?.data?.data || []
        if (active) {
          setTopics(rows.map((row) => ({ week: row.week, name: row.topic, status: row.status })))
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const addTopic = async () => {
    if (!topic.trim()) return

    const nextWeek = topics.length + 1
    const payload = {
      week: nextWeek,
      topic,
      description: `${topic} topic plan`,
      difficulty: 'Intermediate',
      status: 'Active',
      estimatedDurationHours: 6,
    }

    try {
      setError('')
      await createLearningPath(payload)
        const refreshed = await getLearningPaths()
        const rows = refreshed?.data?.data || []
        setTopics(rows.map((row) => ({ week: row.week, name: row.topic, status: row.status })))
      setTopic('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="surface-panel fade-rise rounded-2xl p-6">
      <div className="rounded-xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
        <h1 className="text-2xl font-bold text-slate-900">Manage Learning Paths</h1>
        <p className="mt-1 text-sm text-slate-600">Create and publish weekly learning topics for students.</p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="New topic name" className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="button" onClick={addTopic} className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700">Add Topic</button>
      </div>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <ul className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        {topics.map((item) => (
          <li key={`${item.week}-${item.name}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-cyan-600">Week {item.week}</p>
            <p className="mt-1 font-semibold text-slate-900">{item.name}</p>
            <p className="mt-1 text-xs text-slate-500">Status: {item.status}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
