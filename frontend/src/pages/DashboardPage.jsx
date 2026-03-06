import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getCurrentLearningPath, getDashboardProgress, getStudyStreak, getTodayActivity, logTodayActivity } from '../services/studentService'
import { getErrorMessage } from '../utils/errorHandler'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [streak, setStreak] = useState({ currentStreak: 0 })
  const [progress, setProgress] = useState({ learningPathsCompleted: 0, totalLearningPaths: 0, questionsSolved: 0, totalQuestions: 0, mockInterviewsCompleted: 0, totalMockInterviews: 0 })
  const [activity, setActivity] = useState({ questionsSolved: 0, timeStudiedMinutes: 0, tasksCompleted: 0 })
  const [path, setPath] = useState({ currentWeek: null, topic: null, nextTopic: null })

  const cards = useMemo(() => [
    { title: 'Study Streak', content: `🔥 ${streak.currentStreak} Day Streak · Keep it going!` },
    { title: 'Progress Overview', content: `Learning Paths: ${progress.learningPathsCompleted}/${progress.totalLearningPaths} · Questions: ${progress.questionsSolved}/${progress.totalQuestions} · Mocks: ${progress.mockInterviewsCompleted}/${progress.totalMockInterviews}` },
    { title: 'Daily Activity', content: `Questions: ${activity.questionsSolved} · Time: ${Math.round((activity.timeStudiedMinutes || 0) / 60)}h · Tasks: ${activity.tasksCompleted}` },
    { title: 'Learning Path Progress', content: `Current week: ${path.currentWeek || '--'} ${path.topic ? `(${path.topic})` : ''} · Next topic: ${path.nextTopic || '--'}` },
    { title: 'Recent Mock Interviews', content: 'Track latest interview scores from Mock Interviews page.' },
    { title: 'Quick Actions', content: 'Practice · Record Interview · Upload Resume · Add Notes' },
  ], [activity.questionsSolved, activity.tasksCompleted, activity.timeStudiedMinutes, path.currentWeek, path.nextTopic, path.topic, progress.learningPathsCompleted, progress.mockInterviewsCompleted, progress.questionsSolved, progress.totalLearningPaths, progress.totalMockInterviews, progress.totalQuestions, streak.currentStreak])

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

        setProgress(progressRes?.data?.data || progress)
        setStreak(streakRes?.data?.data || streak)
        setActivity(activityRes?.data?.data || activity)
        setPath(pathRes?.data?.data || path)
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
    <section>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
          <p className="text-sm text-slate-600">Central hub for your placement preparation progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!user?.id) return
              try {
                await logTodayActivity(user.id, { activityType: 'study_session', durationMinutes: 30, description: 'Quick refresh from dashboard' })
                const activityRes = await getTodayActivity(user.id)
                setActivity(activityRes?.data?.data || activity)
              } catch (requestError) {
                setError(getErrorMessage(requestError))
              }
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>

      {loading && <p className="mb-3 text-sm text-slate-500">Loading dashboard data...</p>}
      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.content}</p>
          </article>
        ))}
      </div>
    </section>
  )
}