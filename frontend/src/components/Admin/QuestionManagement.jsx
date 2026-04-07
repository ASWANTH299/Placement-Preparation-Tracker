import { useEffect, useState } from 'react'
import { createCompanyQuestion, deleteCompanyQuestion, updateCompanyQuestion } from '../../services/adminService'
import { getQuestions } from '../../services/questionService'
import { getErrorMessage } from '../../utils/errorHandler'
import Toast from '../Common/Toast'

const allLanguageOptions = ['Java', 'Python', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#']

const normalizeSupportedLanguages = (value) => {
  if (!Array.isArray(value)) return []
  return value.filter((item, index, list) => allLanguageOptions.includes(item) && list.indexOf(item) === index)
}

export default function QuestionManagement() {
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('All')
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)

  const loadQuestions = async () => {
    const response = await getQuestions()
    setQuestions(response?.data?.data || [])
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        await loadQuestions()
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const addQuestion = async () => {
    if (!title.trim()) return

    const payload = {
      title,
      description: `${title} description`,
      company: 'Custom',
      topics: ['General'],
      difficulty: 'Medium',
      supportedLanguages: [],
      status: 'Active',
    }

    try {
      setError('')
      await createCompanyQuestion(payload)
      await loadQuestions()
      setTitle('')
      setToast({ type: 'success', message: 'Question created.' })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const saveEdit = async () => {
    if (!editing?._id) return
    try {
      await updateCompanyQuestion(editing._id, {
        title: editing.title,
        description: editing.description || `${editing.title} description`,
        company: editing.company || 'Custom',
        topics: editing.topics?.length ? editing.topics : ['General'],
        difficulty: editing.difficulty || 'Medium',
        supportedLanguages: normalizeSupportedLanguages(editing.supportedLanguages),
        status: editing.status || 'Active',
      })
      setEditing(null)
      await loadQuestions()
      setToast({ type: 'success', message: 'Question updated.' })
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const removeQuestion = async (questionId) => {
    try {
      await deleteCompanyQuestion(questionId)
      await loadQuestions()
      setToast({ type: 'success', message: 'Question deleted.' })
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const companies = ['All', ...Array.from(new Set(questions.map((q) => q.company).filter(Boolean)))]
  const filtered = questions.filter((question) => {
    const titleMatch = question.title?.toLowerCase().includes(search.toLowerCase())
    const companyMatch = companyFilter === 'All' || question.company === companyFilter
    return titleMatch && companyMatch
  })

  const difficultyClass = (difficulty) => {
    if (difficulty === 'Easy') return 'admin-badge-success'
    if (difficulty === 'Hard') return 'admin-badge-danger'
    return 'admin-badge-warning'
  }

  const supportsAllLanguages = normalizeSupportedLanguages(editing?.supportedLanguages).length === 0

  const toggleSupportedLanguage = (language) => {
    setEditing((prev) => {
      const current = normalizeSupportedLanguages(prev?.supportedLanguages)
      if (current.includes(language)) {
        return { ...prev, supportedLanguages: current.filter((item) => item !== language) }
      }
      return { ...prev, supportedLanguages: [...current, language] }
    })
  }

  return (
    <section className="admin-shell">
      <h1 className="admin-title">Manage Interview Questions</h1>
      <div className="mt-4 flex gap-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Question title" className="admin-input flex-1" />
        <button type="button" onClick={addQuestion} className="admin-btn admin-btn-primary">Add</button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr,220px]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by question title" className="admin-input" />
        <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="admin-input">
          {companies.map((company) => <option key={company} value={company}>{company}</option>)}
        </select>
      </div>

      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="admin-table-wrap mt-4 overflow-x-auto">
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">ID</th>
              <th className="py-2">Question</th>
              <th className="py-2">Company</th>
              <th className="py-2">Difficulty</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((question) => (
              <tr key={question._id || question.id} className="border-b border-slate-100 transition hover:bg-sky-50/60">
                <td className="py-2">{question._id || question.id}</td>
                <td className="py-2">{question.title}</td>
                <td className="py-2">{question.company}</td>
                <td className="py-2"><span className={`admin-badge ${difficultyClass(question.difficulty)}`}>{question.difficulty}</span></td>
                <td className="py-2"><span className={`admin-badge ${question.status === 'Active' ? 'admin-badge-success' : 'admin-badge-muted'}`}>{question.status}</span></td>
                <td className="py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditing({ ...question, supportedLanguages: normalizeSupportedLanguages(question.supportedLanguages) })}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => removeQuestion(question._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h2 className="admin-modal-title">Edit Question</h2>
            <input className="admin-input mt-2" value={editing.title || ''} onChange={(event) => setEditing((prev) => ({ ...prev, title: event.target.value }))} placeholder="Title" />
            <textarea className="admin-input mt-2" rows={3} value={editing.description || ''} onChange={(event) => setEditing((prev) => ({ ...prev, description: event.target.value }))} placeholder="Description" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input className="admin-input" value={editing.company || ''} onChange={(event) => setEditing((prev) => ({ ...prev, company: event.target.value }))} placeholder="Company" />
              <select className="admin-input" value={editing.difficulty || 'Medium'} onChange={(event) => setEditing((prev) => ({ ...prev, difficulty: event.target.value }))}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div className="mt-3 rounded border border-slate-200 p-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={supportsAllLanguages}
                  onChange={(event) => setEditing((prev) => ({ ...prev, supportedLanguages: event.target.checked ? [] : ['Java'] }))}
                />
                Supports all languages
              </label>
              {!supportsAllLanguages && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {allLanguageOptions.map((option) => {
                    const selected = normalizeSupportedLanguages(editing.supportedLanguages).includes(option)
                    return (
                      <label key={option} className="inline-flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSupportedLanguage(option)}
                        />
                        {option}
                      </label>
                    )
                  })}
                </div>
              )}
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
