import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../Common/SearchBar'
import useDebounce from '../../hooks/useDebounce'
import { getQuestions } from '../../services/questionService'

export default function QuestionsList() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const debounced = useDebounce(search, 300)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        const response = await getQuestions({
          search: debounced || undefined,
          difficulty: difficulty === 'All' ? undefined : difficulty,
          limit: 1000
        })
        const list = response?.data?.data || []
        if (!active) return
        setItems(Array.isArray(list) ? list : [])
      } catch {
        if (active) setItems([])
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
      const byText = question.title?.toLowerCase().includes(debounced.toLowerCase())
      const byDifficulty = difficulty === 'All' || question.difficulty === difficulty
      return byText && byDifficulty
    })
  }, [debounced, difficulty, items])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Interview Question Bank</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Click a row to open full details, pseudocode, Java solution, and complexity analysis.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions" />
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          <option>All</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto">
        {loading && <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Loading questions...</p>}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300">
              <th className="py-2">Question</th>
              <th className="py-2">Company</th>
              <th className="py-2">Topic</th>
              <th className="py-2">Difficulty</th>
              <th className="py-2">Practice</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((question) => (
              <tr
                key={question._id}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/90 dark:border-slate-800 dark:hover:bg-slate-800/70"
                onClick={() => navigate(`/questions/${question._id}`)}
              >
                <td className="py-2 font-medium text-slate-900 dark:text-slate-100">{question.title}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{question.company}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{question.topic || question.topics?.[0] || 'General'}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{question.difficulty}</td>
                <td className="py-2">
                  <button
                    type="button"
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(`/practice/${question._id}`)
                    }}
                  >
                    Practice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filtered.length === 0 && (
          <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            No questions found for this filter.
          </p>
        )}
      </div>
    </section>
  )
}
