import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { getMockInterviews } from '../../services/interviewService'

export default function InterviewsList() {
  const userId = useSelector((state) => state.auth.user?.id)
  const fallbackRows = [
    { company: 'Google', date: '2026-03-01', score: 82, feedback: 'Strong DSA, improve communication clarity.' },
    { company: 'Amazon', date: '2026-02-20', score: 76, feedback: 'Good approach, optimize complexity explanation.' },
  ]

  const [rows, setRows] = useState(fallbackRows)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!userId) {
      setRows(fallbackRows)
      return undefined
    }

    const load = async () => {
      try {
        setLoading(true)
        const response = await getMockInterviews(userId)
        const list = response?.data?.data || response?.data || []
        if (!active || !Array.isArray(list) || list.length === 0) return

        const normalized = list.map((row) => ({
          company: row.company ?? 'Unknown',
          date: row.date ?? row.createdAt?.slice(0, 10) ?? 'N/A',
          score: Number(row.score ?? 0),
          feedback: row.feedback ?? 'No feedback available',
        }))

        setRows(normalized)
      } catch {
        if (active) setRows(fallbackRows)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [userId])

  const averageScore = useMemo(() => {
    if (!rows.length) return 0
    const total = rows.reduce((sum, row) => sum + row.score, 0)
    return Math.round(total / rows.length)
  }, [rows])

  const bestScore = useMemo(() => (rows.length ? Math.max(...rows.map((row) => row.score)) : 0), [rows])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Mock Interview Tracker</h1>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-slate-200 p-3 text-sm">Total: {rows.length}</div>
        <div className="rounded border border-slate-200 p-3 text-sm">Average: {averageScore}</div>
        <div className="rounded border border-slate-200 p-3 text-sm">Best: {bestScore}</div>
        <div className="rounded border border-slate-200 p-3 text-sm">Trend: ↑</div>
      </div>
      <div className="mt-4 overflow-x-auto">
        {loading && <p className="mb-3 text-sm text-slate-500">Loading interviews...</p>}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Company</th>
              <th className="py-2">Date</th>
              <th className="py-2">Score</th>
              <th className="py-2">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.company}-${row.date}`} className="border-b border-slate-100">
                <td className="py-2">{row.company}</td>
                <td className="py-2">{row.date}</td>
                <td className="py-2">{row.score}</td>
                <td className="py-2">{row.feedback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
