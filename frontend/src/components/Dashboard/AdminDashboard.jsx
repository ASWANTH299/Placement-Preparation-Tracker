import { useEffect, useState } from 'react'
import PageShell from '../Common/PageShell'
import { getAdminDashboardStats } from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState([
    { label: 'Active Students', value: '-' },
    { label: 'Mock Interviews', value: '-' },
    { label: 'Questions Solved', value: '-' },
    { label: 'Avg Mock Score', value: '-' },
  ])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const response = await getAdminDashboardStats()
        const stats = response?.data?.data
        if (!active) return
        setMetrics([
          { label: 'Active Students', value: stats?.activeUsersThisMonth ?? 0 },
          { label: 'Mock Interviews', value: stats?.totalMockInterviews ?? 0 },
          { label: 'Questions Solved', value: stats?.totalQuestionsSolved ?? 0 },
          { label: 'Avg Mock Score', value: stats?.averageMockScore ?? 0 },
        ])
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <PageShell title="Admin Dashboard" subtitle="Track platform-wide KPIs and activity.">
      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Recent Admin Activity</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Approved 12 newly submitted company questions.</li>
          <li>Published "Graph Revision Sprint" learning path update.</li>
          <li>Flagged 3 duplicate interview feedback entries for review.</li>
        </ul>
      </div>
    </PageShell>
  )
}
