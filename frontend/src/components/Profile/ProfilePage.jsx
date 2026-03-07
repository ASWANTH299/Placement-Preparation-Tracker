import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { API_BASE_URL } from '../../services/api'
import { getStudentProfile, updateStudentProfile, uploadStudentAvatar } from '../../services/studentService'
import { getStudentLearningProgress } from '../../services/learningPathService'
import { getQuestions } from '../../services/questionService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function ProfilePage() {
  const studentId = useSelector((state) => state.auth.user?.id)
  const [form, setForm] = useState({ fullName: '', email: '', university: '', bio: '', avatar: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [stats, setStats] = useState({
    completedTopics: 0,
    totalTopics: 0,
    completedProblems: 0,
    totalProblems: 0,
    solvedQuestions: 0
  })

  const resolveAvatarUrl = (value) => {
    const source = String(value || '')
    if (!source) return ''
    if (source.startsWith('http') || source.startsWith('data:')) return source
    if (source.startsWith('/uploads')) return `${API_BASE_URL.replace('/api/v1', '')}${source}`
    return source
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!studentId) return
      try {
        const [profileResponse, progressResponse, questionResponse] = await Promise.all([
          getStudentProfile(studentId),
          getStudentLearningProgress(studentId),
          getQuestions({ limit: 100 })
        ])

        const profile = profileResponse?.data?.data
        const progress = progressResponse?.data?.data
        const questions = questionResponse?.data?.data || []
        const solved = questions.filter((row) => row.userStatus?.isSolved).length
        const topicRows = progress?.topics || []
        const completedProblems = topicRows.reduce((sum, row) => sum + (row.completedProblems || 0), 0)
        const totalProblems = topicRows.reduce((sum, row) => sum + (row.totalProblems || 0), 0)

        if (!active) return

        setForm({
          fullName: profile?.name || '',
          email: profile?.email || '',
          university: profile?.university || '',
          bio: profile?.bio || '',
          avatar: resolveAvatarUrl(profile?.avatar || '')
        })

        setStats({
          completedTopics: progress?.topicsCompleted || 0,
          totalTopics: progress?.totalTopics || 0,
          completedProblems,
          totalProblems,
          solvedQuestions: solved
        })
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }

    load()
    return () => {
      active = false
    }
  }, [studentId])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onAvatarPick = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !studentId) return

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedMimes.includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be 2MB or smaller')
      event.target.value = ''
      return
    }

    try {
      setError('')
      setMessage('')
      setIsUploadingAvatar(true)

      const formData = new FormData()
      formData.append('avatar', file)

      const response = await uploadStudentAvatar(studentId, formData)
      const avatarValue = response?.data?.data?.avatar
      setForm((prev) => ({ ...prev, avatar: resolveAvatarUrl(avatarValue) }))
      setMessage('Profile picture uploaded successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const onSave = async () => {
    if (!studentId) return
    try {
      setError('')
      setMessage('')
      setIsSaving(true)
      await updateStudentProfile(studentId, {
        name: form.fullName,
        email: form.email,
        university: form.university,
        bio: form.bio,
        avatar: form.avatar
      })
      setMessage('Profile saved successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  const completionRate = useMemo(() => {
    if (!stats.totalTopics) return 0
    return Math.round((stats.completedTopics / stats.totalTopics) * 100)
  }, [stats])

  const problemsCompletionRate = useMemo(() => {
    if (!stats.totalProblems) return 0
    return Math.round((stats.completedProblems / stats.totalProblems) * 100)
  }, [stats.completedProblems, stats.totalProblems])

  const profileCompletionRate = useMemo(() => {
    const filledCount = [form.fullName, form.email, form.university, form.bio, form.avatar]
      .filter((value) => String(value || '').trim().length > 0)
      .length
    return Math.round((filledCount / 5) * 100)
  }, [form.avatar, form.bio, form.email, form.fullName, form.university])

  const initials = useMemo(() => {
    const words = String(form.fullName || '').trim().split(/\s+/).filter(Boolean)
    if (!words.length) return 'ST'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }, [form.fullName])

  const readinessScore = useMemo(() => {
    const weightedScore =
      profileCompletionRate * 0.25 +
      completionRate * 0.35 +
      problemsCompletionRate * 0.25 +
      Math.min(stats.solvedQuestions, 100) * 0.15
    return Math.round(Math.min(Math.max(weightedScore, 0), 100))
  }, [completionRate, problemsCompletionRate, profileCompletionRate, stats.solvedQuestions])

  const readinessLabel = useMemo(() => {
    if (readinessScore >= 80) return 'Interview Ready'
    if (readinessScore >= 60) return 'Strong Momentum'
    if (readinessScore >= 40) return 'Foundation Building'
    return 'Getting Started'
  }, [readinessScore])

  const profileChecklist = useMemo(() => ([
    { label: 'Name added', done: Boolean(form.fullName.trim()) },
    { label: 'Email added', done: Boolean(form.email.trim()) },
    { label: 'University added', done: Boolean(form.university.trim()) },
    { label: 'Bio added', done: Boolean(form.bio.trim()) },
    { label: 'Profile photo uploaded', done: Boolean(form.avatar.trim()) },
  ]), [form.avatar, form.bio, form.email, form.fullName, form.university])

  const checklistCompleted = useMemo(() => profileChecklist.filter((item) => item.done).length, [profileChecklist])

  const achievementBadges = useMemo(() => {
    const badges = []
    if (stats.solvedQuestions >= 50) badges.push('Problem Solver')
    if (completionRate >= 70) badges.push('Consistent Learner')
    if (problemsCompletionRate >= 60) badges.push('Practice Finisher')
    if (profileCompletionRate === 100) badges.push('Profile Complete')
    if (!badges.length) badges.push('Rising Candidate')
    return badges
  }, [completionRate, problemsCompletionRate, profileCompletionRate, stats.solvedQuestions])

  const milestonePlan = useMemo(() => {
    const targetTopics = Math.min(stats.totalTopics, stats.completedTopics + 3)
    const targetProblems = Math.min(stats.totalProblems, stats.completedProblems + 20)
    const targetSolved = stats.solvedQuestions + 15

    return [
      {
        title: 'Topics milestone',
        description: `Reach ${targetTopics}/${stats.totalTopics || targetTopics} completed topics`,
      },
      {
        title: 'Practice milestone',
        description: `Reach ${targetProblems}/${stats.totalProblems || targetProblems} completed problems`,
      },
      {
        title: 'Solved questions milestone',
        description: `Push solved count to ${targetSolved}`,
      },
    ]
  }, [stats.completedProblems, stats.completedTopics, stats.solvedQuestions, stats.totalProblems, stats.totalTopics])

  return (
    <section className="space-y-6 fade-rise">
      <article className="ui-card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-emerald-500/20 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {form.avatar ? (
                <img src={form.avatar} alt="Profile" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white/70 dark:ring-slate-800/80" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Student Profile</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">{form.fullName || 'Complete your profile'}</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{form.email || 'Add your email to keep account details updated'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniMetric label="Profile Completion" value={`${profileCompletionRate}%`} />
              <MiniMetric label="Topic Completion" value={`${completionRate}%`} />
              <MiniMetric label="Solved Questions" value={String(stats.solvedQuestions)} />
            </div>
          </div>
        </div>
      </article>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {message && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">{message}</p>}

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_1fr_1fr]">
        <article className="ui-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Readiness Index</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Placement Readiness</h2>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CircularScore value={readinessScore} />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{readinessLabel}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Your score combines profile quality, topic progress, problem practice, and solved question count.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {achievementBadges.map((badge) => (
              <BadgeChip key={badge} label={badge} />
            ))}
          </div>
        </article>

        <article className="ui-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Profile Health</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Completion Checklist</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{checklistCompleted}/5 essential profile fields are complete.</p>
          <div className="mt-4 space-y-2.5">
            {profileChecklist.map((item) => (
              <ChecklistItem key={item.label} label={item.label} done={item.done} />
            ))}
          </div>
        </article>

        <article className="ui-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Action Plan</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Next Milestones</h2>
          <div className="mt-4 space-y-3">
            {milestonePlan.map((milestone) => (
              <div key={milestone.title} className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{milestone.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{milestone.description}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="ui-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Edit Details</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Personal Information</h2>
            </div>
            <label className="ui-button ui-button-ghost cursor-pointer px-3 py-2 text-sm">
              Upload Profile Picture
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarPick} />
            </label>
          </div>
          {isUploadingAvatar && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Uploading profile picture...</p>}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Full Name</span>
              <input
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Email</span>
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">University</span>
              <input
                name="university"
                value={form.university}
                onChange={onChange}
                placeholder="Enter your university"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Bio</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={onChange}
                maxLength={500}
                placeholder="Tell recruiters and interviewers about your interests, strengths, and goals"
                className="h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">{form.bio.length}/500 characters</p>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onSave} disabled={isSaving} className="ui-button ui-button-primary px-4 py-2 text-sm disabled:opacity-70">
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keep your profile updated for better placement visibility.</p>
          </div>
        </article>

        <article className="ui-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Performance</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Progress Snapshot</h2>

          <div className="mt-4 space-y-4">
            <ProgressRow
              label="Learning Topics"
              value={`${stats.completedTopics}/${stats.totalTopics}`}
              percent={completionRate}
            />
            <ProgressRow
              label="Practice Problems"
              value={`${stats.completedProblems}/${stats.totalProblems}`}
              percent={problemsCompletionRate}
            />
            <ProgressRow
              label="Profile Completion"
              value={`${profileCompletionRate}%`}
              percent={profileCompletionRate}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <StatCard label="Completed Topics" value={`${stats.completedTopics}/${stats.totalTopics}`} />
            <StatCard label="Completed Problems" value={`${stats.completedProblems}/${stats.totalProblems}`} />
            <StatCard label="Solved Questions" value={String(stats.solvedQuestions)} />
            <StatCard label="Learning Completion" value={`${completionRate}%`} />
          </div>
        </article>
      </div>
    </section>
  )
}

function MiniMetric({ label, value }) {
  return (
    <article className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2.5 text-center backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/70">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </article>
  )
}

function CircularScore({ value }) {
  const safeValue = Math.min(Math.max(value, 0), 100)
  return (
    <div
      className="grid h-24 w-24 place-items-center rounded-full"
      style={{
        background: `conic-gradient(rgb(59 130 246) ${safeValue * 3.6}deg, rgb(226 232 240) 0deg)`
      }}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center dark:bg-slate-900">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{safeValue}%</span>
      </div>
    </div>
  )
}

function BadgeChip({ label }) {
  return (
    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
      {label}
    </span>
  )
}

function ChecklistItem({ label, done }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
      <p className="text-sm text-slate-700 dark:text-slate-200">{label}</p>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
        {done ? 'Done' : 'Pending'}
      </span>
    </div>
  )
}

function ProgressRow({ label, value, percent }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </article>
  )
}
