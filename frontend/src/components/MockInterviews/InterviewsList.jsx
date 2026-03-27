import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  createAdminMockInterview,
  deleteAdminMockInterview,
  getAllUsers,
  getAdminMockInterviews,
  updateAdminMockInterview,
} from '../../services/adminService'
import { createMockInterview, deleteMockInterview, getMockInterviews, updateMockInterview } from '../../services/interviewService'
import { getErrorMessage } from '../../utils/errorHandler'
import Modal from '../Common/Modal'

const fallbackRows = []
const ALL_ACCOUNTS_OPTION = '__all_accounts__'

const companyResourceLinks = {
  Google: ['https://careers.google.com', 'https://www.geeksforgeeks.org/google-interview-questions/'],
  Amazon: ['https://www.amazon.jobs', 'https://www.geeksforgeeks.org/amazon-interview-questions/'],
  Microsoft: ['https://careers.microsoft.com', 'https://www.geeksforgeeks.org/microsoft-interview-experience/'],
  Meta: ['https://www.metacareers.com', 'https://www.geeksforgeeks.org/facebook-interview-questions/'],
  Apple: ['https://jobs.apple.com', 'https://www.geeksforgeeks.org/apple-interview-experience/'],
  Netflix: ['https://jobs.netflix.com', 'https://www.geeksforgeeks.org/netflix-interview-experience/'],
  Adobe: ['https://careers.adobe.com', 'https://www.geeksforgeeks.org/adobe-interview-experience/'],
  Uber: ['https://www.uber.com/us/en/careers', 'https://www.geeksforgeeks.org/uber-interview-questions/'],
  'Goldman Sachs': ['https://www.goldmansachs.com/careers', 'https://www.geeksforgeeks.org/goldman-sachs-interview-experience/'],
}

const extractFocusAreas = (feedbacks) => {
  const text = feedbacks.join(' ').toLowerCase()
  const rules = [
    { key: 'dsa', label: 'DSA patterns and optimization' },
    { key: 'graph', label: 'Graph and traversal problem solving' },
    { key: 'dynamic', label: 'Dynamic programming confidence' },
    { key: 'communication', label: 'Communication and articulation' },
    { key: 'system', label: 'System design and architecture basics' },
    { key: 'sql', label: 'SQL and database fundamentals' },
    { key: 'oop', label: 'OOP design and code clarity' },
    { key: 'speed', label: 'Coding speed and implementation pace' },
    { key: 'test', label: 'Edge-case testing and validation' },
  ]

  const picked = rules.filter((rule) => text.includes(rule.key)).map((rule) => rule.label)
  return picked.length ? picked.slice(0, 4) : ['Core DSA rounds', 'Problem decomposition', 'Clear communication']
}

const getScoreBand = (score) => {
  if (score >= 85) return { label: 'Excellent', tone: 'bg-emerald-100 text-emerald-700' }
  if (score >= 75) return { label: 'Strong', tone: 'bg-blue-100 text-blue-700' }
  if (score >= 65) return { label: 'Moderate', tone: 'bg-amber-100 text-amber-700' }
  return { label: 'Needs Work', tone: 'bg-red-100 text-red-700' }
}

const formatDate = (value) => {
  if (!value || value === 'N/A') return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString()
}

const buildSparklinePoints = (scores = []) => {
  if (scores.length <= 1) return '0,40 100,40'

  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = Math.max(max - min, 1)

  return scores
    .map((score, index) => {
      const x = (index / (scores.length - 1)) * 100
      const y = 42 - ((score - min) / range) * 32
      return `${x},${y}`
    })
    .join(' ')
}

export default function InterviewsList() {
  const role = useSelector((state) => state.auth.role)
  const userId = useSelector((state) => state.auth.user?.id)
  const isAdmin = role === 'admin'
  const [managedStudents, setManagedStudents] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    studentId: '',
    company: '',
    interviewDate: new Date().toISOString().slice(0, 10),
    score: '',
    overallFeedback: '',
  })
  const [rows, setRows] = useState(fallbackRows)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState({})
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('All')
  const [scoreFilter, setScoreFilter] = useState('All')
  const [sortBy, setSortBy] = useState('dateDesc')
  const [selectedCompany, setSelectedCompany] = useState('')
  const companyInsightRef = useRef(null)

  const loadManagedStudents = async () => {
    if (!isAdmin) return []

    const response = await getAllUsers({ page: 1, limit: 500, sortBy: 'created', order: 'desc' })
    const students = response?.data?.data || []
    setManagedStudents(students)
    return students
  }

  const normalizeRows = (list = []) => list.map((row, index) => ({
    id: row._id || row.id || `live-${index}`,
    company: row.company ?? 'Unknown',
    date: row.interviewDate ?? row.date ?? row.createdAt?.slice(0, 10) ?? 'N/A',
    score: Number(row.score ?? 0),
    feedback: row.overallFeedback ?? row.feedback ?? 'No feedback available',
    studentName: row.studentId?.name || 'Unknown student',
    studentEmail: row.studentId?.email || '-',
    studentId: row.studentId?._id || row.studentId || '',
  }))

  const loadAdminInterviewsFromStudentEndpoints = async (existingStudents = []) => {
    const students = existingStudents.length > 0 ? existingStudents : await loadManagedStudents()
    if (!students.length) return []

    const interviewsPerStudent = await Promise.all(
      students.map(async (student) => {
        try {
          const response = await getMockInterviews(student._id, { page: 1, limit: 500, sortBy: 'date', order: 'desc' })
          const list = response?.data?.data || []
          return list.map((item) => ({
            ...item,
            studentId: {
              _id: student._id,
              name: student.name,
              email: student.email,
            },
          }))
        } catch {
          return []
        }
      })
    )

    return interviewsPerStudent.flat()
  }

  const runWithLoading = async (key, operation) => {
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }))
      setError('')
      setSuccess('')
      await operation()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  const loadInterviews = async () => {
    try {
      setLoading(true)
      if (isAdmin) {
        const students = await loadManagedStudents()
        let list = []

        try {
          const response = await getAdminMockInterviews({ page: 1, limit: 500, sortBy: 'interviewDate', order: 'desc' })
          list = response?.data?.data || response?.data || []
        } catch {
          list = await loadAdminInterviewsFromStudentEndpoints(students)
        }

        if (!Array.isArray(list) || list.length === 0) {
          setRows([])
          return
        }

        setRows(normalizeRows(list))
        return
      }

      const response = await getMockInterviews(userId)
      const list = response?.data?.data || response?.data || []

      if (!Array.isArray(list) || list.length === 0) {
        setRows(fallbackRows)
        return
      }

      setRows(normalizeRows(list))
    } catch {
      setRows(isAdmin ? [] : fallbackRows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) {
      setRows(fallbackRows)
      return undefined
    }

    loadInterviews()
    return undefined
  }, [userId, isAdmin])

  const onOpenCreate = () => {
    setError('')
    setSuccess('')
    setCreateForm((prev) => ({
      ...prev,
      studentId: prev.studentId || managedStudents?.[0]?._id || '',
      company: '',
      score: '',
      overallFeedback: '',
      interviewDate: new Date().toISOString().slice(0, 10),
    }))
    setCreateOpen(true)
  }

  const onCreateSubmit = async (event) => {
    event.preventDefault()

    const score = Number(createForm.score)
    if (isAdmin && !createForm.studentId) {
      setError('Please select a student.')
      return
    }
    if (!createForm.company.trim()) {
      setError('Company is required.')
      return
    }
    if (!createForm.interviewDate) {
      setError('Interview date is required.')
      return
    }
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setError('Score must be between 0 and 100.')
      return
    }
    if (!createForm.overallFeedback.trim()) {
      setError('Overall feedback is required.')
      return
    }

    await runWithLoading('create', async () => {
      if (isAdmin) {
        if (createForm.studentId === ALL_ACCOUNTS_OPTION) {
          if (!managedStudents.length) {
            setError('No student accounts available.')
            return
          }

          await Promise.all(
            managedStudents.map((student) => createAdminMockInterview({
              studentId: student._id,
              company: createForm.company.trim(),
              interviewDate: createForm.interviewDate,
              score,
              overallFeedback: createForm.overallFeedback.trim(),
            }))
          )

          await loadInterviews()
          setCreateOpen(false)
          setSuccess(`Mock interview created for ${managedStudents.length} student accounts.`)
          return
        }

        await createAdminMockInterview({
          studentId: createForm.studentId,
          company: createForm.company.trim(),
          interviewDate: createForm.interviewDate,
          score,
          overallFeedback: createForm.overallFeedback.trim(),
        })
      } else {
        await createMockInterview(userId, {
          company: createForm.company.trim(),
          interviewDate: createForm.interviewDate,
          score,
          overallFeedback: createForm.overallFeedback.trim(),
        })
      }
      await loadInterviews()
      setCreateOpen(false)
      setSuccess('Mock interview created successfully.')
    })
  }

  const onCreateInterview = async () => {
    onOpenCreate()
  }

  const onEditInterview = async (row) => {
    if (!row?.id) return

    const company = window.prompt('Company name', row.company)
    if (!company || !company.trim()) return

    const interviewDate = window.prompt('Interview date (YYYY-MM-DD)', String(row.date).slice(0, 10))
    if (!interviewDate || !interviewDate.trim()) return

    const scoreInput = window.prompt('Score (0-100)', String(row.score))
    const score = Number(scoreInput)
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setError('Score must be between 0 and 100.')
      return
    }

    const feedback = window.prompt('Overall feedback', row.feedback || '')
    if (!feedback || !feedback.trim()) return

    await runWithLoading(`edit-${row.id}`, async () => {
      if (isAdmin) {
        await updateAdminMockInterview(row.id, {
          company: company.trim(),
          interviewDate: interviewDate.trim(),
          score,
          overallFeedback: feedback.trim(),
        })
      } else {
        await updateMockInterview(userId, row.id, {
          company: company.trim(),
          interviewDate: interviewDate.trim(),
          score,
          overallFeedback: feedback.trim(),
        })
      }
      await loadInterviews()
      setSuccess('Mock interview updated successfully.')
    })
  }

  const onDeleteInterview = async (row) => {
    if (!row?.id) return
    const confirmed = window.confirm(`Delete interview for ${row.company} on ${formatDate(row.date)}?`)
    if (!confirmed) return

    await runWithLoading(`delete-${row.id}`, async () => {
      if (isAdmin) {
        await deleteAdminMockInterview(row.id)
      } else {
        await deleteMockInterview(userId, row.id)
      }
      await loadInterviews()
      setSuccess('Mock interview deleted successfully.')
    })
  }

  const companies = useMemo(() => {
    const unique = Array.from(new Set(rows.map((row) => row.company).filter(Boolean)))
    return ['All', ...unique.sort((a, b) => a.localeCompare(b))]
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

      const base = rows.filter((row) => {
      const bySearch = !query
        || row.company.toLowerCase().includes(query)
        || row.feedback.toLowerCase().includes(query)
        || (row.studentName || '').toLowerCase().includes(query)
        || (row.studentEmail || '').toLowerCase().includes(query)
      const byCompany = companyFilter === 'All' || row.company === companyFilter
      const byScore =
        scoreFilter === 'All' ||
        (scoreFilter === '80+' && row.score >= 80) ||
        (scoreFilter === '70-79' && row.score >= 70 && row.score < 80) ||
        (scoreFilter === '<70' && row.score < 70)

      return bySearch && byCompany && byScore
    })

    return [...base].sort((a, b) => {
      if (sortBy === 'scoreDesc') return b.score - a.score
      if (sortBy === 'scoreAsc') return a.score - b.score
      if (sortBy === 'companyAsc') return a.company.localeCompare(b.company)

      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      return sortBy === 'dateAsc' ? aTime - bTime : bTime - aTime
    })
  }, [rows, search, companyFilter, scoreFilter, sortBy])

  const averageScore = useMemo(() => {
    if (!filteredRows.length) return 0
    const total = filteredRows.reduce((sum, row) => sum + row.score, 0)
    return Math.round(total / filteredRows.length)
  }, [filteredRows])

  const bestScore = useMemo(() => (filteredRows.length ? Math.max(...filteredRows.map((row) => row.score)) : 0), [filteredRows])

  const trend = useMemo(() => {
    if (filteredRows.length < 2) return 0
    const chronological = [...filteredRows].sort((a, b) => new Date(a.date) - new Date(b.date))
    return chronological[chronological.length - 1].score - chronological[0].score
  }, [filteredRows])

  const readyCount = useMemo(() => filteredRows.filter((row) => row.score >= 80).length, [filteredRows])

  const companyStats = useMemo(() => {
    const map = new Map()
    for (const row of filteredRows) {
      const current = map.get(row.company) || { company: row.company, total: 0, count: 0, best: 0 }
      current.total += row.score
      current.count += 1
      current.best = Math.max(current.best, row.score)
      map.set(row.company, current)
    }

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        average: Math.round(entry.total / entry.count),
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5)
  }, [filteredRows])

  const sparklinePoints = useMemo(() => {
    const chronological = [...filteredRows].sort((a, b) => new Date(a.date) - new Date(b.date))
    return buildSparklinePoints(chronological.map((row) => row.score))
  }, [filteredRows])

  const selectedCompanyInsight = useMemo(() => {
    if (!selectedCompany) return null
    const related = rows
      .filter((row) => row.company === selectedCompany)
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    if (!related.length) return null

    const best = Math.max(...related.map((item) => item.score))
    const avg = Math.round(related.reduce((sum, item) => sum + item.score, 0) / related.length)
    const latest = related[0]
    const resources = companyResourceLinks[selectedCompany] || [
      `https://www.google.com/search?q=${encodeURIComponent(selectedCompany + ' careers')}`,
      `https://www.google.com/search?q=${encodeURIComponent(selectedCompany + ' interview questions')}`,
    ]

    return {
      company: selectedCompany,
      count: related.length,
      average: avg,
      best,
      latest,
      focusAreas: extractFocusAreas(related.map((item) => item.feedback || '')),
      feedbackHighlights: related.slice(0, 4).map((item) => item.feedback),
      history: related,
      resources,
    }
  }, [rows, selectedCompany])

  useEffect(() => {
    if (!selectedCompany) return
    if (!companyInsightRef.current) return

    companyInsightRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedCompany])

  const handleCompanyClick = (company) => {
    setSelectedCompany(company)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mock Interview Tracker</h1>
          <p className="mt-1 text-sm text-slate-600">Track performance by company, measure growth trends, and identify weak spots.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={onCreateInterview}
              disabled={Boolean(actionLoading.create)}
              className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
            >
              {actionLoading.create ? 'Adding...' : 'Add Interview'}
            </button>
          )}
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Advanced Analytics</span>
        </div>
      </div>

      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Interviews" value={String(filteredRows.length)} note="Across filtered view" />
        <MetricCard title="Average Score" value={String(averageScore)} note="Target 80+" />
        <MetricCard title="Best Score" value={String(bestScore)} note="Highest result" />
        <MetricCard title="Interview Ready" value={`${readyCount}/${filteredRows.length || 0}`} note="Scores >= 80" />
        <MetricCard title="Trend" value={trend > 0 ? `+${trend}` : String(trend)} note={trend >= 0 ? 'Improving' : 'Needs review'} tone={trend >= 0 ? 'text-emerald-700' : 'text-red-700'} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Score Trend</h2>
            <p className="text-xs text-slate-500">Chronological</p>
          </div>
          <svg viewBox="0 0 100 48" className="mt-2 h-14 w-full" preserveAspectRatio="none" role="img" aria-label="Interview score trend">
            <polyline points={sparklinePoints} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Top Companies</h2>
          <div className="mt-2 space-y-2">
            {companyStats.length === 0 && <p className="text-sm text-slate-500">No company data for this filter.</p>}
            {companyStats.map((entry) => (
              <div key={entry.company} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={() => handleCompanyClick(entry.company)}
                  className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
                >
                  {entry.company}
                </button>
                <p className="text-xs text-slate-600">Avg {entry.average} • Best {entry.best}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search company or feedback"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
        />
        <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
          {companies.map((company) => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
        <select value={scoreFilter} onChange={(event) => setScoreFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
          <option value="All">All Scores</option>
          <option value="80+">80 and above</option>
          <option value="70-79">70 to 79</option>
          <option value="<70">Below 70</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
          <option value="dateDesc">Sort: Newest</option>
          <option value="dateAsc">Sort: Oldest</option>
          <option value="scoreDesc">Sort: Score High-Low</option>
          <option value="scoreAsc">Sort: Score Low-High</option>
          <option value="companyAsc">Sort: Company A-Z</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        {loading && <p className="mb-3 text-sm text-slate-500">Loading interviews...</p>}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              {isAdmin && <th className="py-2">Student</th>}
              <th className="py-2">Company</th>
              <th className="py-2">Date</th>
              <th className="py-2">Score</th>
              <th className="py-2">Band</th>
              <th className="py-2">Feedback</th>
              {isAdmin && <th className="py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const band = getScoreBand(row.score)
              return (
                <tr key={row.id || `${row.company}-${row.date}`} className="border-b border-slate-100 hover:bg-slate-50/70">
                  {isAdmin && (
                    <td className="py-2 text-slate-700">
                      <p className="font-medium text-slate-900">{row.studentName}</p>
                      <p className="text-xs text-slate-500">{row.studentEmail}</p>
                    </td>
                  )}
                  <td className="py-2 font-medium text-slate-900">
                    <button
                      type="button"
                      onClick={() => handleCompanyClick(row.company)}
                      className="text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      {row.company}
                    </button>
                  </td>
                  <td className="py-2 text-slate-700">{formatDate(row.date)}</td>
                  <td className="py-2 font-semibold text-slate-900">{row.score}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${band.tone}`}>{band.label}</span>
                  </td>
                  <td className="py-2 text-slate-700">{row.feedback}</td>
                  {isAdmin && (
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditInterview(row)}
                          disabled={Boolean(actionLoading[`edit-${row.id}`])}
                          className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        >
                          {actionLoading[`edit-${row.id}`] ? 'Saving...' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInterview(row)}
                          disabled={Boolean(actionLoading[`delete-${row.id}`])}
                          className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {actionLoading[`delete-${row.id}`] ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

        {!loading && filteredRows.length === 0 && (
          <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">No interviews matched your filters.</p>
        )}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add Mock Interview">
        <form onSubmit={onCreateSubmit} className="space-y-3">
          {isAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Student</label>
              <select
                value={createForm.studentId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, studentId: event.target.value }))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select student</option>
                <option value={ALL_ACCOUNTS_OPTION}>All Accounts (all student logins)</option>
                {managedStudents.map((student) => (
                  <option key={student._id} value={student._id}>{student.name} ({student.email})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
            <input
              type="text"
              value={createForm.company}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, company: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Interview Date</label>
              <input
                type="date"
                value={createForm.interviewDate}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, interviewDate: event.target.value }))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={createForm.score}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, score: event.target.value }))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Overall Feedback</label>
            <textarea
              rows={4}
              value={createForm.overallFeedback}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, overallFeedback: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded border border-slate-300 px-3 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={Boolean(actionLoading.create)} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
              {actionLoading.create ? 'Saving...' : 'Save Interview'}
            </button>
          </div>
        </form>
      </Modal>

      {selectedCompanyInsight && (
        <article ref={companyInsightRef} className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{selectedCompanyInsight.company} Insights</h2>
              <p className="mt-1 text-sm text-slate-600">Detailed view for all mock interviews recorded for this company.</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCompany('')}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Attempts" value={String(selectedCompanyInsight.count)} note="Total rounds recorded" />
            <MetricCard title="Average" value={String(selectedCompanyInsight.average)} note="Company average score" />
            <MetricCard title="Best" value={String(selectedCompanyInsight.best)} note="Best performance" />
            <MetricCard title="Latest" value={String(selectedCompanyInsight.latest.score)} note={formatDate(selectedCompanyInsight.latest.date)} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Focus Areas</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCompanyInsight.focusAreas.map((area) => (
                  <span key={area} className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">{area}</span>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Resources</h3>
              <div className="mt-2 space-y-1.5 text-sm">
                <a href={selectedCompanyInsight.resources[0]} target="_blank" rel="noreferrer" className="block text-blue-700 hover:text-blue-800 hover:underline">
                  Careers page
                </a>
                <a href={selectedCompanyInsight.resources[1]} target="_blank" rel="noreferrer" className="block text-blue-700 hover:text-blue-800 hover:underline">
                  Interview questions and experiences
                </a>
              </div>
            </article>
          </div>

          <article className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Recent Feedback Highlights</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {selectedCompanyInsight.feedbackHighlights.map((item, index) => (
                <li key={`feedback-${index}`}>- {item}</li>
              ))}
            </ul>
          </article>

          <article className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Interview History</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-2">Date</th>
                    <th className="py-2">Score</th>
                    <th className="py-2">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCompanyInsight.history.map((row) => (
                    <tr key={`company-history-${row.id}`} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{formatDate(row.date)}</td>
                      <td className="py-2 font-semibold text-slate-900">{row.score}</td>
                      <td className="py-2 text-slate-700">{row.feedback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </article>
      )}
    </section>
  )
}

function MetricCard({ title, value, note, tone = 'text-slate-900' }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </article>
  )
}
