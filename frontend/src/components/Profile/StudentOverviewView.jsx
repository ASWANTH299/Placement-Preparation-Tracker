import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../../services/api'
import { getStudentPublicOverview } from '../../services/studentService'
import { getErrorMessage } from '../../utils/errorHandler'

const fallbackData = {
  profile: {
    name: 'Student',
    bio: '',
    avatar: '',
    university: '',
    graduationYear: '',
    department: '',
    githubProfile: '',
    linkedinProfile: '',
    portfolioLink: '',
    joinedAt: null,
  },
  coding: {
    solvedCount: 0,
    attemptedCount: 0,
    bookmarkedCount: 0,
    totalAttempts: 0,
    recentSolvedQuestions: [],
  },
  learning: {
    completedTopics: 0,
    totalTopics: 0,
    completedProblems: 0,
    overallProgressPercentage: 0,
  },
  tasks: {
    completedCount: 0,
    activeTasks: [],
  },
  interviews: {
    completedCount: 0,
    averageScore: 0,
  },
}

export default function StudentOverviewView() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(fallbackData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolveAvatarUrl = (value) => {
    const source = String(value || '')
    if (!source) return ''
    if (source.startsWith('http') || source.startsWith('data:')) return source
    if (source.startsWith('/uploads')) return `${API_BASE_URL.replace('/api/v1', '')}${source}`
    return source
  }

  useEffect(() => {
    let active = true

    const loadOverview = async () => {
      if (!studentId) return
      try {
        setLoading(true)
        setError('')
        const response = await getStudentPublicOverview(studentId)
        if (!active) return
        setData(response?.data?.data || fallbackData)
      } catch (requestError) {
        if (!active) return
        setError(getErrorMessage(requestError))
        setData(fallbackData)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOverview()

    return () => {
      active = false
    }
  }, [studentId])

  const profile = data.profile || fallbackData.profile
  const coding = data.coding || fallbackData.coding
  const learning = data.learning || fallbackData.learning
  const tasks = data.tasks || fallbackData.tasks
  const interviews = data.interviews || fallbackData.interviews

  const initials = useMemo(() => {
    const words = String(profile.name || '').trim().split(/\s+/).filter(Boolean)
    if (!words.length) return 'ST'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }, [profile.name])

  return (
    <section className="space-y-6 fade-rise">
      <article className="ui-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {profile.avatar ? (
              <img src={resolveAvatarUrl(profile.avatar)} alt={profile.name || 'Student'} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/80 dark:ring-slate-800" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                {initials}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Student Overview</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{profile.name || 'Student'}</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profile.university || 'University not added'}{profile.department ? ` • ${profile.department}` : ''}</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/leaderboard')} className="ui-button ui-button-ghost px-3 py-2 text-sm">
            Back to Leaderboard
          </button>
        </div>
      </article>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading student information...</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Solved Questions" value={String(coding.solvedCount || 0)} />
        <StatCard label="Task Completions" value={String(tasks.completedCount || 0)} />
        <StatCard label="Learning Progress" value={`${learning.overallProgressPercentage || 0}%`} />
        <StatCard label="Mock Interviews" value={String(interviews.completedCount || 0)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <article className="ui-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Details</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Student Details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Department" value={profile.department || '-'} />
            <DetailItem label="Graduation Year" value={String(profile.graduationYear || '-')} />
            <DetailItem label="Topics Completed" value={`${learning.completedTopics || 0}/${learning.totalTopics || 0}`} />
            <DetailItem label="Problems Completed" value={String(learning.completedProblems || 0)} />
            <DetailItem label="Question Attempts" value={String(coding.totalAttempts || 0)} />
            <DetailItem label="Average Interview Score" value={String(interviews.averageScore || 0)} />
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{profile.bio || 'No bio has been added yet.'}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {profile.githubProfile && <a href={profile.githubProfile} target="_blank" rel="noreferrer" className="ui-button ui-button-ghost px-3 py-1.5 text-sm">GitHub</a>}
            {profile.linkedinProfile && <a href={profile.linkedinProfile} target="_blank" rel="noreferrer" className="ui-button ui-button-ghost px-3 py-1.5 text-sm">LinkedIn</a>}
            {profile.portfolioLink && <a href={profile.portfolioLink} target="_blank" rel="noreferrer" className="ui-button ui-button-ghost px-3 py-1.5 text-sm">Portfolio</a>}
          </div>
        </article>

        <article className="ui-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Coding Questions</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Recent Solved Questions</h2>
          <div className="mt-4 space-y-3">
            {(coding.recentSolvedQuestions || []).map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.title}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{row.company} • {row.difficulty}</p>
              </div>
            ))}
            {!coding.recentSolvedQuestions?.length && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No solved questions yet.</p>
            )}
          </div>
        </article>
      </div>

      <article className="ui-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Tasks</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Active Daily Tasks</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(tasks.activeTasks || []).map((task) => (
            <a key={`${task.title}-${task.platform}`} href={task.practiceUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-blue-500/60 dark:hover:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{task.platform} • {task.difficulty}{task.company ? ` • ${task.company}` : ''}</p>
            </a>
          ))}
          {!tasks.activeTasks?.length && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No active tasks available right now.</p>
          )}
        </div>
      </article>
    </section>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="ui-card rounded-2xl p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Metric</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </article>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
