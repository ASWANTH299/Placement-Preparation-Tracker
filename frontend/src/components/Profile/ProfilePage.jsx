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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input name="fullName" value={form.fullName} onChange={onChange} placeholder="Name" className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
        <input name="email" value={form.email} onChange={onChange} placeholder="Email" className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
      </div>

      <input name="university" value={form.university} onChange={onChange} placeholder="University" className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
      <textarea name="bio" value={form.bio} onChange={onChange} maxLength={500} placeholder="Bio" className="mt-3 h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {form.avatar && <img src={form.avatar} alt="Profile" className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-200 dark:ring-blue-900" />}
        <label className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-100">
          Upload Profile Picture
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarPick} />
        </label>
        {isUploadingAvatar && <span className="text-sm text-slate-500 dark:text-slate-400">Uploading...</span>}
      </div>

      <button type="button" onClick={onSave} disabled={isSaving} className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatCard label="Completed Topics" value={`${stats.completedTopics}/${stats.totalTopics}`} />
        <StatCard label="Learning Completion" value={`${completionRate}%`} />
        <StatCard label="Completed Problems" value={`${stats.completedProblems}/${stats.totalProblems}`} />
        <StatCard label="Solved Questions" value={String(stats.solvedQuestions)} />
      </div>
    </section>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </article>
  )
}
