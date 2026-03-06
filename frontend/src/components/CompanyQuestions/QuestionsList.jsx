import { useEffect, useMemo, useState } from 'react'
import Pagination from '../Common/Pagination'
import SearchBar from '../Common/SearchBar'
import useDebounce from '../../hooks/useDebounce'
import { getQuestions } from '../../services/questionService'

const questions = [
  { id: 1, title: 'Two Sum', company: 'Amazon', topic: 'Arrays', difficulty: 'Easy' },
  { id: 2, title: 'LRU Cache', company: 'Google', topic: 'Design', difficulty: 'Hard' },
  { id: 3, title: 'Merge Intervals', company: 'Meta', topic: 'Arrays', difficulty: 'Medium' },
]

export default function QuestionsList() {
  const [items, setItems] = useState(questions)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(search, 300)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        const response = await getQuestions({ search: debounced, difficulty: difficulty === 'All' ? undefined : difficulty })
        const list = response?.data?.data || response?.data || []
        if (!active || !Array.isArray(list) || list.length === 0) return

        const normalized = list.map((question, index) => ({
          id: question.id ?? index + 1,
          title: question.title ?? question.question ?? 'Untitled Question',
          company: question.company ?? 'Unknown',
          topic: question.topic ?? 'General',
          difficulty: question.difficulty ?? 'Medium',
        }))
        setItems(normalized)
      } catch {
        if (active) setItems(questions)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [debounced, difficulty])

  const filtered = useMemo(() => {
    return items.filter((question) => {
      const byText = question.title.toLowerCase().includes(debounced.toLowerCase())
      const byDifficulty = difficulty === 'All' || question.difficulty === difficulty
      return byText && byDifficulty
    })
  }, [debounced, difficulty, items])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Interview Question Bank</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions" />
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option>All</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto">
        {loading && <p className="mb-3 text-sm text-slate-500">Loading questions...</p>}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Question</th>
              <th className="py-2">Company</th>
              <th className="py-2">Topic</th>
              <th className="py-2">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((question) => (
              <tr key={question.id} className="border-b border-slate-100">
                <td className="py-2">{question.title}</td>
                <td className="py-2">{question.company}</td>
                <td className="py-2">{question.topic}</td>
                <td className="py-2">{question.difficulty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={1} onPrev={() => setPage((prev) => Math.max(1, prev - 1))} onNext={() => setPage((prev) => prev + 1)} />
    </section>
  )
}
