import { useEffect, useState } from 'react'
import { getLeaderboard } from '../../services/leaderboardService'

const fallbackRows = [
  { rank: 1, name: 'Rahul Sharma', progress: 95, questions: 245, score: 890 },
  { rank: 2, name: 'Priya Patel', progress: 90, questions: 220, score: 850 },
]

export default function LeaderboardView() {
  const [period, setPeriod] = useState('All Time')
  const [rows, setRows] = useState(fallbackRows)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        const response = await getLeaderboard({ period })
        const list = response?.data?.data || response?.data || []
        if (!active || !Array.isArray(list) || list.length === 0) return

        const normalized = list.map((row, index) => ({
          rank: Number(row.rank ?? index + 1),
          name: row.name ?? row.studentName ?? 'Student',
          progress: Number(row.progress ?? 0),
          questions: Number(row.questions ?? row.questionCount ?? 0),
          score: Number(row.score ?? 0),
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
  }, [period])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option>All Time</option>
          <option>This Month</option>
          <option>This Week</option>
        </select>
      </div>
      <p className="mt-1 text-sm text-slate-600">Current period: {period}</p>
      <div className="mt-4 overflow-x-auto">
        {loading && <p className="mb-3 text-sm text-slate-500">Loading leaderboard...</p>}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Rank</th>
              <th className="py-2">Student</th>
              <th className="py-2">Progress %</th>
              <th className="py-2">Questions</th>
              <th className="py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank} className="border-b border-slate-100">
                <td className="py-2">#{row.rank}</td>
                <td className="py-2">{row.name}</td>
                <td className="py-2">{row.progress}%</td>
                <td className="py-2">{row.questions}</td>
                <td className="py-2">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
