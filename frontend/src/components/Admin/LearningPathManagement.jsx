import { useEffect, useState } from 'react'
import { createLearningPath, deleteLearningPath, updateLearningPath } from '../../services/adminService'
import { getLearningPaths } from '../../services/learningPathService'
import { getErrorMessage } from '../../utils/errorHandler'
import Toast from '../Common/Toast'

export default function LearningPathManagement() {
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [topics, setTopics] = useState([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)

  const loadTopics = async () => {
    const response = await getLearningPaths()
    const rows = response?.data?.data || []
    setTopics(normalizeTopics(rows))
  }

  const normalizeTopics = (rows = []) => rows.map((row, index) => ({
    id: row._id,
    topicId: row.topicId,
    order: row.order || index + 1,
    name: row.topic,
    status: row.status,
    difficulty: row.difficulty,
    estimatedDurationHours: row.estimatedDurationHours,
    description: row.description,
  }))

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        await loadTopics()
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
    const topicName = topic.trim()
    if (!topicName) {
      setToast({ type: 'warning', message: 'Please enter a topic name before adding.' })
      return
    }

    const nextOrder = topics.length + 1
    const baseTopicId = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (!baseTopicId) {
      setToast({ type: 'warning', message: 'Topic name must include letters or numbers.' })
      return
    }

    const existingIds = new Set(topics.map((item) => item.topicId).filter(Boolean))
    const topicId = existingIds.has(baseTopicId)
      ? `${baseTopicId}-${Date.now().toString().slice(-5)}`
      : baseTopicId

    const payload = {
      order: nextOrder,
      topicId,
      topic: topicName,
      description: `${topicName} topic plan`,
      difficulty: 'Intermediate',
      status: 'Active',
      estimatedDurationHours: 6,
      explanation: `${topicName} conceptual overview`,
      javaSyntaxExample: `// ${topicName} starter\nclass Demo {}`,
      pseudocodeExplanation: `${topicName} high-level pseudocode strategy`,
      problems: [
        {
          title: `${topicName} Core Problem`,
          description: `Practice the primary ${topicName} pattern.`,
          pseudocode: '1. Initialize\n2. Iterate\n3. Return answer',
          javaSolution: 'class Solution { int solve(){ return 0; } }'
        }
      ]
    }

    try {
      setCreating(true)
      setError('')
      await createLearningPath(payload)
      await loadTopics()
      setTopic('')
      setToast({ type: 'success', message: 'Learning path created.' })
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setError(message)
      setToast({ type: 'error', message })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (item) => {
    setEditing({ ...item })
  }

  const saveEdit = async () => {
    if (!editing?.id) return
    try {
      await updateLearningPath(editing.id, {
        topic: editing.name,
        status: editing.status,
        difficulty: editing.difficulty || 'Intermediate',
        estimatedDurationHours: editing.estimatedDurationHours || 6,
        description: editing.description || `${editing.name} topic plan`,
      })
      setEditing(null)
      await loadTopics()
      setToast({ type: 'success', message: 'Learning path updated.' })
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const removeTopic = async (topicId) => {
    try {
      await deleteLearningPath(topicId)
      await loadTopics()
      setToast({ type: 'success', message: 'Learning path deleted.' })
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const filteredTopics = topics.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <h1 className="admin-title">Manage Learning Paths</h1>
        <p className="text-sm text-slate-600">Create, refine, and retire topic plans.</p>
      </div>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          if (!creating) addTopic()
        }}
      >
        <input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="New topic name"
          className="admin-input flex-1"
          maxLength={100}
        />
        <button type="submit" disabled={creating} className="admin-btn admin-btn-primary">
          {creating ? 'Adding...' : 'Add Topic'}
        </button>
      </form>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics" className="admin-input mt-3" />
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <ul className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        {filteredTopics.map((item) => (
          <li key={`${item.id || item.order}-${item.name}`} className="admin-card rounded-xl px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-cyan-600">Topic #{item.order}</p>
            <p className="mt-1 font-semibold text-slate-900">{item.name}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500">{item.difficulty} • {item.estimatedDurationHours || 0}h</p>
              <span className={`admin-badge ${item.status === 'Active' ? 'admin-badge-success' : 'admin-badge-muted'}`}>{item.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => openEdit(item)}>Edit</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => removeTopic(item.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h2 className="admin-modal-title">Edit Learning Path</h2>
            <input className="admin-input mt-2" value={editing.name} onChange={(event) => setEditing((prev) => ({ ...prev, name: event.target.value }))} placeholder="Topic" />
            <textarea className="admin-input mt-2" value={editing.description || ''} onChange={(event) => setEditing((prev) => ({ ...prev, description: event.target.value }))} rows={3} placeholder="Description" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select className="admin-input" value={editing.difficulty || 'Intermediate'} onChange={(event) => setEditing((prev) => ({ ...prev, difficulty: event.target.value }))}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
              <select className="admin-input" value={editing.status || 'Active'} onChange={(event) => setEditing((prev) => ({ ...prev, status: event.target.value }))}>
                <option>Active</option>
                <option>Archived</option>
              </select>
            </div>
            <div className="admin-modal-actions mt-4">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </section>
  )
}
