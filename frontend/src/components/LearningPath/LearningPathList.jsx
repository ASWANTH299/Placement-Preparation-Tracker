import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLearningPaths } from '../../services/learningPathService'

const requiredTopics = [
  'Arrays',
  'Linked Lists',
  'Stacks',
  'Queues',
  'Trees',
  'Binary Search Trees',
  'Heaps',
  'Graphs',
  'Dynamic Programming',
  'Greedy Algorithms',
  'Recursion',
  'Backtracking',
  'Trie',
  'Segment Trees',
  'Bit Manipulation',
  'Sliding Window',
  'Two Pointer Technique',
  'Binary Search',
  'System Design Basics',
  'Concurrency Basics'
]

const fallbackTopics = requiredTopics.map((topic) => ({
  _id: `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-fallback`,
  topic,
  description: `${topic} roadmap with explanation, pseudocode, Java syntax examples, and practice problems.`,
  statusLabel: 'Not Started',
  completionPercentage: 0,
  completedProblems: 0,
  totalProblems: 5
}))

export default function LearningPathList() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        const response = await getLearningPaths()
        const list = response?.data?.data || []
        if (active) setTopics(Array.isArray(list) && list.length > 0 ? list : fallbackTopics)
      } catch {
        if (active) setTopics(fallbackTopics)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) =>
      topic.topic?.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, topics])

  const completedTopics = topics.filter((topic) => topic.isCompleted).length
  const totalProblems = topics.reduce((sum, topic) => sum + Number(topic.totalProblems || 0), 0)
  const completedProblems = topics.reduce((sum, topic) => sum + Number(topic.completedProblems || 0), 0)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Learning Roadmap</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {completedTopics}/{topics.length || 0} topics completed • {completedProblems}/{totalProblems} problems completed
          </p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search topics"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm md:w-64 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {loading && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading topics...</p>}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTopics.map((topic) => (
          <Link
            key={topic._id}
            to={`/learning-path/${topic._id}`}
            className="group rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-800"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{topic.topic}</h2>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {topic.statusLabel || 'Not Started'}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{topic.description}</p>
            <div className="mt-3 h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
              <div className="h-2 rounded bg-blue-600" style={{ width: `${topic.completionPercentage || 0}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {topic.completedProblems || 0}/{topic.totalProblems || 0} problems completed
            </p>
          </Link>
        ))}
      </div>

      {!loading && filteredTopics.length === 0 && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          No topics matched your search. Try a different keyword.
        </p>
      )}
    </section>
  )
}
