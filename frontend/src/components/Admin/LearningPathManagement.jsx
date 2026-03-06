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
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Manage Learning Paths</h1>
      <div className="mt-4 flex gap-2">
        <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="New topic name" className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="button" onClick={addTopic} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Add Topic</button>
      </div>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <ul className="mt-4 space-y-2 text-sm">
        {topics.map((item) => (
          <li key={`${item.week}-${item.name}`} className="rounded border border-slate-200 px-3 py-2">Week {item.week}: {item.name} • {item.status}</li>
        ))}
      </ul>
    </section>
  )
}
