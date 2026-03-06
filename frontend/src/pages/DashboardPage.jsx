import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getCurrentLearningPath, getDashboardProgress, getStudyStreak, getTodayActivity, logTodayActivity } from '../services/studentService'
import { getErrorMessage } from '../utils/errorHandler'

const defaultProgress = { learningPathsCompleted: 0, totalLearningPaths: 0, questionsSolved: 0, totalQuestions: 0, mockInterviewsCompleted: 0, totalMockInterviews: 0 }
const defaultActivity = { questionsSolved: 0, timeStudiedMinutes: 0, tasksCompleted: 0 }
const defaultPath = { currentTopicId: null, topic: null, nextTopic: null, progressPercentage: 0 }

export default function DashboardPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streak, setStreak] = useState({ currentStreak: 0 })
  const [progress, setProgress] = useState(defaultProgress)
  const [activity, setActivity] = useState(defaultActivity)
  const [path, setPath] = useState(defaultPath)

  const cards = useMemo(() => [
    { title: 'Study Streak', content: `🔥 ${streak.currentStreak} Day Streak · Keep it going!` },
    { title: 'Progress Overview', content: `Learning Paths: ${progress.learningPathsCompleted}/${progress.totalLearningPaths} · Questions: ${progress.questionsSolved}/${progress.totalQuestions} · Mocks: ${progress.mockInterviewsCompleted}/${progress.totalMockInterviews}` },
    { title: 'Daily Activity', content: `Questions: ${activity.questionsSolved} · Time: ${Math.round((activity.timeStudiedMinutes || 0) / 60)}h · Tasks: ${activity.tasksCompleted}` },
    { title: 'Learning Path Progress', content: `Current topic: ${path.topic || '--'} · Next topic: ${path.nextTopic || '--'} · Progress: ${path.progressPercentage || 0}%` },
    { title: 'Recent Mock Interviews', content: 'Track latest interview scores from Mock Interviews page.' },
    { title: 'Quick Actions', content: 'Practice · Record Interview · Upload Resume · Add Notes' },
  ], [activity.questionsSolved, activity.tasksCompleted, activity.timeStudiedMinutes, path.nextTopic, path.progressPercentage, path.topic, progress.learningPathsCompleted, progress.mockInterviewsCompleted, progress.questionsSolved, progress.totalLearningPaths, progress.totalMockInterviews, progress.totalQuestions, streak.currentStreak])

  useEffect(() => {
    if (!user?.id) return

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [progressRes, streakRes, activityRes, pathRes] = await Promise.all([
          getDashboardProgress(user.id),
          getStudyStreak(user.id),
          getTodayActivity(user.id),
          getCurrentLearningPath(user.id),
        ])

        setProgress(progressRes?.data?.data || defaultProgress)
        setStreak(streakRes?.data?.data || { currentStreak: 0 })
        setActivity(activityRes?.data?.data || defaultActivity)
        setPath(pathRes?.data?.data || defaultPath)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <section className="space-y-6 fade-rise">
      <div className="ui-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Overview</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">Student Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Central hub for your placement preparation progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!user?.id) return
              try {
                await logTodayActivity(user.id, { activityType: 'study_session', durationMinutes: 30, description: 'Quick refresh from dashboard' })
                const activityRes = await getTodayActivity(user.id)
                setActivity(activityRes?.data?.data || defaultActivity)
              } catch (requestError) {
                setError(getErrorMessage(requestError))
              }
            }}
            className="ui-button ui-button-ghost px-3 py-2 text-sm"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="ui-button ui-button-primary px-3 py-2 text-sm"
          >
            Logout
          </button>
        </div>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={`skeleton-${index}`} className="ui-card rounded-2xl p-4">
              <div className="loading-shimmer h-3 w-20 rounded" />
              <div className="loading-shimmer mt-3 h-5 w-40 rounded" />
              <div className="loading-shimmer mt-4 h-4 w-full rounded" />
              <div className="loading-shimmer mt-2 h-4 w-5/6 rounded" />
            </article>
          ))}
        </div>
      )}

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="ui-card rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Insight</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{card.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}