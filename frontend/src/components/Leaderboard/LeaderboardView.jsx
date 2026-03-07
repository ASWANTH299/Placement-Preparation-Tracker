import { useEffect, useMemo, useState } from 'react'
import { getLeaderboard } from '../../services/leaderboardService'

const fallbackRows = [
  { rank: 1, name: 'Rahul Sharma', progress: 95, questions: 245, score: 890 },
  { rank: 2, name: 'Priya Patel', progress: 90, questions: 220, score: 850 },
  { rank: 3, name: 'Arjun Verma', progress: 88, questions: 210, score: 810 },
  { rank: 4, name: 'Ananya Rao', progress: 84, questions: 198, score: 770 },
  { rank: 5, name: 'Karthik Iyer', progress: 79, questions: 182, score: 735 },
  { rank: 6, name: 'Sneha Reddy', progress: 76, questions: 175, score: 708 },
]

const periods = ['All Time', 'This Month', 'This Week']

const getMomentum = (row) => {
  const composite = row.score * 0.5 + row.progress * 3 + row.questions * 0.2
  if (composite >= 650) return { label: 'Hot', tone: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40' }
  if (composite >= 450) return { label: 'Rising', tone: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950/40' }
  return { label: 'Steady', tone: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/40' }
}

export default function LeaderboardView() {
  const [period, setPeriod] = useState('All Time')
  const [rows, setRows] = useState(fallbackRows)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('rank')
  const [topTenOnly, setTopTenOnly] = useState(false)

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

  const rankedRows = useMemo(() => {
    const filtered = rows.filter((row) => row.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'rank') return a.rank - b.rank
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return b[sortBy] - a[sortBy]
    })

    if (topTenOnly) return sorted.slice(0, 10)
    return sorted
  }, [rows, searchTerm, sortBy, topTenOnly])

  const podiumRows = useMemo(() => {
    return [...rows].sort((a, b) => a.rank - b.rank).slice(0, 3)
  }, [rows])

  const leaderboardStats = useMemo(() => {
    const source = rankedRows.length ? rankedRows : rows
    const total = source.length
    const totalScore = source.reduce((sum, row) => sum + row.score, 0)
    const totalQuestions = source.reduce((sum, row) => sum + row.questions, 0)
    const avgProgress = total ? Math.round(source.reduce((sum, row) => sum + row.progress, 0) / total) : 0

    return {
      participants: total,
      avgScore: total ? Math.round(totalScore / total) : 0,
      avgProgress,
      totalQuestions,
    }
  }, [rankedRows, rows])

  return (
    <section className="space-y-6 fade-rise">
      <article className="ui-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Competition Hub</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">Leaderboard</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Track rankings, compare progress, and identify the fastest-rising performers.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${period === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard label="Participants" value={String(leaderboardStats.participants)} />
        <InsightCard label="Average Score" value={String(leaderboardStats.avgScore)} />
        <InsightCard label="Average Progress" value={`${leaderboardStats.avgProgress}%`} />
        <InsightCard label="Total Questions Solved" value={String(leaderboardStats.totalQuestions)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <article className="ui-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top Performers</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{period}</span>
          </div>
          <div className="mt-4 space-y-3">
            {podiumRows.map((row) => (
              <PodiumCard key={`${row.rank}-${row.name}`} row={row} />
            ))}
          </div>
        </article>

        <article className="ui-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rankings Table</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900"
              />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="rank">Sort: Rank</option>
                <option value="score">Sort: Score</option>
                <option value="progress">Sort: Progress</option>
                <option value="questions">Sort: Questions</option>
                <option value="name">Sort: Name</option>
              </select>
              <button
                type="button"
                onClick={() => setTopTenOnly((prev) => !prev)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${topTenOnly ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                {topTenOnly ? 'Top 10 Only' : 'Show All'}
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading && <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Loading leaderboard...</p>}
            <table className="w-full text-left text-sm">
          <thead>
              <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <th className="py-2 pr-2">Rank</th>
                <th className="py-2 pr-2">Student</th>
                <th className="py-2 pr-2">Momentum</th>
                <th className="py-2 pr-2">Progress</th>
                <th className="py-2 pr-2">Questions</th>
                <th className="py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {rankedRows.map((row) => {
                const momentum = getMomentum(row)
                return (
                  <tr key={`${row.rank}-${row.name}`} className="border-b border-slate-100 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">#{row.rank}</span>
                    </td>
                    <td className="py-3 pr-2 font-medium text-slate-900 dark:text-slate-100">{row.name}</td>
                    <td className="py-3 pr-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${momentum.tone}`}>{momentum.label}</span>
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.min(Math.max(row.progress, 0), 100)}%` }} />
                        </div>
                        <span className="text-slate-700 dark:text-slate-200">{row.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-2 text-slate-700 dark:text-slate-200">{row.questions}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">{row.score}</td>
                  </tr>
                )
              })}
              {!rankedRows.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No students found for your current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>
  )
}

function InsightCard({ label, value }) {
  return (
    <article className="ui-card rounded-2xl p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Insight</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </article>
  )
}

function PodiumCard({ row }) {
  const tone =
    row.rank === 1
      ? 'border-yellow-300/70 bg-yellow-50/60 dark:border-yellow-900/60 dark:bg-yellow-950/30'
      : row.rank === 2
        ? 'border-slate-300 bg-slate-100/70 dark:border-slate-700 dark:bg-slate-800/50'
        : 'border-amber-300/70 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/30'

  return (
    <article className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">#{row.rank} {row.name}</p>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{row.score} pts</span>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{row.questions} questions solved • {row.progress}% progress</p>
    </article>
  )
}
