import { useEffect, useMemo, useState } from 'react'

const dailyQuestionBank = [
  {
    id: 'dq-1',
    title: 'Two Sum with Indices',
    difficulty: 'Easy',
    company: 'Amazon',
    time: '20 min',
    tags: ['Array', 'HashMap'],
    prompt: 'Given an array of integers and a target, return the indices of two numbers whose sum is target.',
    practiceUrl: 'https://leetcode.com/problems/two-sum/',
  },
  {
    id: 'dq-2',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    company: 'Google',
    time: '35 min',
    tags: ['Sliding Window', 'String'],
    prompt: 'Find the length of the longest substring without repeating characters.',
    practiceUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
  },
  {
    id: 'dq-3',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    company: 'Microsoft',
    time: '15 min',
    tags: ['Stack'],
    prompt: 'Given a string of brackets, determine whether the input string is valid.',
    practiceUrl: 'https://leetcode.com/problems/valid-parentheses/',
  },
  {
    id: 'dq-4',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    company: 'Meta',
    time: '30 min',
    tags: ['Intervals', 'Sorting'],
    prompt: 'Merge all overlapping intervals and return an array of non-overlapping intervals.',
    practiceUrl: 'https://leetcode.com/problems/merge-intervals/',
  },
  {
    id: 'dq-5',
    title: 'Kth Largest Element in an Array',
    difficulty: 'Medium',
    company: 'Netflix',
    time: '30 min',
    tags: ['Heap', 'Quickselect'],
    prompt: 'Find the kth largest element in an unsorted array.',
    practiceUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
  },
  {
    id: 'dq-6',
    title: 'Number of Islands',
    difficulty: 'Medium',
    company: 'Uber',
    time: '35 min',
    tags: ['Graph', 'DFS/BFS'],
    prompt: 'Given a 2D grid map of 1s and 0s, count the number of islands.',
    practiceUrl: 'https://leetcode.com/problems/number-of-islands/',
  },
  {
    id: 'dq-7',
    title: 'LRU Cache',
    difficulty: 'Medium',
    company: 'Adobe',
    time: '40 min',
    tags: ['Design', 'HashMap', 'LinkedList'],
    prompt: 'Design and implement a data structure for Least Recently Used (LRU) cache.',
    practiceUrl: 'https://leetcode.com/problems/lru-cache/',
  },
  {
    id: 'dq-8',
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    company: 'Atlassian',
    time: '30 min',
    tags: ['Heap', 'HashMap'],
    prompt: 'Return the k most frequent elements in any order.',
    practiceUrl: 'https://leetcode.com/problems/top-k-frequent-elements/',
  },
  {
    id: 'dq-9',
    title: 'Course Schedule',
    difficulty: 'Medium',
    company: 'Apple',
    time: '35 min',
    tags: ['Graph', 'Topological Sort'],
    prompt: 'Determine if it is possible to finish all courses given prerequisites.',
    practiceUrl: 'https://leetcode.com/problems/course-schedule/',
  },
  {
    id: 'dq-10',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    company: 'Goldman Sachs',
    time: '45 min',
    tags: ['Two Pointers', 'Array'],
    prompt: 'Compute how much water can be trapped after raining for elevation bars.',
    practiceUrl: 'https://leetcode.com/problems/trapping-rain-water/',
  },
  {
    id: 'dq-11',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    company: 'PayPal',
    time: '25 min',
    tags: ['Prefix/Suffix', 'Array'],
    prompt: 'Return an array answer such that answer[i] is product of all elements except nums[i].',
    practiceUrl: 'https://leetcode.com/problems/product-of-array-except-self/',
  },
  {
    id: 'dq-12',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    company: 'Oracle',
    time: '30 min',
    tags: ['Tree', 'BFS'],
    prompt: 'Return the level order traversal of binary tree node values.',
    practiceUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
  },
]

const hashString = (value) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getQuestionForDay = (userSeed, dateKey) => {
  const seed = `${userSeed}|${dateKey}`
  const index = hashString(seed) % dailyQuestionBank.length
  return dailyQuestionBank[index]
}

const getDifficultyTone = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  if (difficulty === 'Medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
  return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
}

export default function DailyTaskCard({ user, period = 'Today', className = '' }) {
  const [now, setNow] = useState(() => new Date())
  const [isCompleted, setIsCompleted] = useState(false)

  const userSeed = user?.id || user?._id || user?.email || user?.name || 'guest-user'
  const dateKey = useMemo(() => getLocalDateKey(now), [now])
  const question = useMemo(() => getQuestionForDay(userSeed, dateKey), [userSeed, dateKey])

  const completionStorageKey = useMemo(() => `daily-task:${userSeed}:${dateKey}:${question.id}`, [userSeed, dateKey, question.id])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    try {
      setIsCompleted(window.localStorage.getItem(completionStorageKey) === 'true')
    } catch {
      setIsCompleted(false)
    }
  }, [completionStorageKey])

  const remainingMs = useMemo(() => {
    const tomorrow = new Date(now)
    tomorrow.setHours(24, 0, 0, 0)
    return Math.max(tomorrow.getTime() - now.getTime(), 0)
  }, [now])

  const dayElapsedPercent = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000
    const elapsed = dayMs - remainingMs
    return Math.min(Math.max(Math.round((elapsed / dayMs) * 100), 0), 100)
  }, [remainingMs])

  const countdownLabel = useMemo(() => {
    const totalMinutes = Math.floor(remainingMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
  }, [remainingMs])

  const completionTone = isCompleted
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
    : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300'

  const toggleCompletion = () => {
    const next = !isCompleted
    setIsCompleted(next)

    try {
      window.localStorage.setItem(completionStorageKey, String(next))
    } catch {
      // ignore storage errors to keep UX responsive
    }
  }

  return (
    <article className={`ui-card p-5 sm:p-6 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Daily Challenge</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">DAILY TASK</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {period}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyTone(question.difficulty)}`}>{question.difficulty}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{question.company}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{question.time}</span>
        </div>

        <h4 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{question.title}</h4>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{question.prompt}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${completionTone}`}>
        {isCompleted ? 'Completed for today. New question unlocks at midnight.' : 'Not completed yet. Solve this before midnight to maintain consistency.'}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Resets in {countdownLabel}</span>
          <span>{dayElapsedPercent}% day elapsed</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${dayElapsedPercent}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={toggleCompletion}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${isCompleted ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </button>
        <a
          href={question.practiceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-cyan-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-cyan-700"
        >
          Start Practice
        </a>
      </div>
    </article>
  )
}
