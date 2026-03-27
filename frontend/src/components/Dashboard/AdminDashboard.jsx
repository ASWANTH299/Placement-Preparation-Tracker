import { useEffect, useState } from 'react'
import PageShell from '../Common/PageShell'
import { getAdminDashboardStats, getAnalytics } from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'

function AnimatedMetric({ value }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = Number(value || 0)
    const start = performance.now()
    const duration = 700

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(target * eased)
      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [value])

  const formatted = Number.isInteger(value) ? Math.round(display) : display.toFixed(1)
  return <span>{formatted}</span>
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState([])
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const normalizeStats = (raw) => ({
      totalUsers: Number(raw?.totalUsers || 0),
      activeUsersThisMonth: Number(raw?.activeUsersThisMonth || 0),
      newUsersThisMonth: Number(raw?.newUsersThisMonth || 0),
      averageProgressPercentage: Number(raw?.averageProgressPercentage || 0),
      totalQuestionsSolved: Number(raw?.totalQuestionsSolved || 0),
      averageQuestionsPerStudent: Number(raw?.averageQuestionsPerStudent || 0),
      totalMockInterviews: Number(raw?.totalMockInterviews || 0),
      averageMockScore: Number(raw?.averageMockScore || 0),
    })

    const load = async () => {
      try {
        setLoading(true)

        let response
        try {
          response = await getAnalytics()
        } catch (analyticsError) {
          // Fallback for older backend versions that don't expose /admin/analytics yet.
          response = await getAdminDashboardStats()
        }

        const normalized = normalizeStats(response?.data?.data)
        if (!active) return

        setStats(normalized)
        setMetrics([
          { label: 'Total Users', value: normalized.totalUsers, accent: 'from-sky-500 to-blue-600' },
          { label: 'Active This Month', value: normalized.activeUsersThisMonth, accent: 'from-teal-500 to-cyan-600' },
          { label: 'New This Month', value: normalized.newUsersThisMonth, accent: 'from-indigo-500 to-blue-700' },
          { label: 'Avg Progress %', value: normalized.averageProgressPercentage, accent: 'from-emerald-500 to-green-600' },
          { label: 'Questions Solved', value: normalized.totalQuestionsSolved, accent: 'from-amber-500 to-orange-600' },
          { label: 'Avg Questions/Student', value: normalized.averageQuestionsPerStudent, accent: 'from-cyan-500 to-sky-600' },
          { label: 'Mock Interviews', value: normalized.totalMockInterviews, accent: 'from-fuchsia-500 to-pink-600' },
          { label: 'Avg Mock Score', value: normalized.averageMockScore, accent: 'from-rose-500 to-red-600' },
        ])

        setError('')
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const trendRaw = [
    stats?.newUsersThisMonth || 0,
    stats?.activeUsersThisMonth || 0,
    stats?.averageProgressPercentage || 0,
    stats?.totalQuestionsSolved || 0,
    stats?.totalMockInterviews || 0,
    stats?.averageMockScore || 0,
  ]

  const trendMax = Math.max(...trendRaw, 1)
  const trendBars = trendRaw.map((value) => {
    const minHeight = 36
    const maxHeight = 120
    const scaled = minHeight + Math.round((value / trendMax) * (maxHeight - minHeight))
    return Math.max(minHeight, Math.min(maxHeight, scaled))
  })

  const activityItems = stats
    ? [
        `Active students this month: ${stats.activeUsersThisMonth} out of ${stats.totalUsers} total users.`,
        `${stats.newUsersThisMonth} new users joined in the current month.`,
        `Students solved ${stats.totalQuestionsSolved} questions overall (${stats.averageQuestionsPerStudent.toFixed(1)} per student).`,
        `Mock interview average score is ${stats.averageMockScore.toFixed(1)} across ${stats.totalMockInterviews} sessions.`,
      ]
    : [
        'Analytics will appear once data is loaded.',
        'If this persists, verify backend is running with admin routes.',
      ]

  return (
    <PageShell title="Admin Dashboard" subtitle="Platform intelligence, engagement health, and quality signals in one view.">
      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="mb-3 text-sm text-slate-500">Loading analytics...</p>}

      <div className="admin-metric-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="admin-metric-card">
            <div className={`admin-metric-accent bg-gradient-to-r ${metric.accent}`} />
            <p className="admin-metric-label">{metric.label}</p>
            <p className="admin-metric-value"><AnimatedMetric value={metric.value} /></p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="admin-chart-card">
          <h2 className="admin-card-title">Engagement Trend</h2>
          <p className="admin-card-subtitle">Normalized snapshot across six key engagement indicators.</p>
          <div className="admin-chart-placeholder">
            {trendBars.map((height, index) => (
              <div key={`trend-${index}`} className="admin-chart-bar" style={{ height: `${height}px` }} />
            ))}
          </div>
        </section>

        <section className="admin-chart-card">
          <h2 className="admin-card-title">Recent Admin Activity</h2>
          <ul className="admin-activity-list">
            {activityItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  )
}
