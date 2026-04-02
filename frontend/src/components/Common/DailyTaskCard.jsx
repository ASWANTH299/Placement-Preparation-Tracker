import { useEffect, useMemo, useState } from 'react'
import { validateDailySubmissionLink } from '../../services/questionService'

const dailyQuestionBank = [
  {
    id: 'dq-1',
    title: 'Two Sum with Indices',
    platform: 'LeetCode',
    difficulty: 'Easy',
    company: 'Amazon',
    time: '20 min',
    tags: ['Array', 'HashMap'],
    prompt: 'Given an array of integers and a target, return the indices of two numbers whose sum is target.',
    practiceUrl: 'https://leetcode.com/problems/two-sum/'
  },
  {
    id: 'dq-2',
    title: 'Longest Substring Without Repeating Characters',
    platform: 'LeetCode',
    difficulty: 'Medium',
    company: 'Google',
    time: '35 min',
    tags: ['Sliding Window', 'String'],
    prompt: 'Find the length of the longest substring without repeating characters.',
    practiceUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'
  },
  {
    id: 'dq-3',
    title: 'Valid Parentheses',
    platform: 'LeetCode',
    difficulty: 'Easy',
    company: 'Microsoft',
    time: '15 min',
    tags: ['Stack'],
    prompt: 'Given a string of brackets, determine whether the input string is valid.',
    practiceUrl: 'https://leetcode.com/problems/valid-parentheses/'
  },
  {
    id: 'dq-4',
    title: 'Merge Intervals',
    platform: 'LeetCode',
    difficulty: 'Medium',
    company: 'Meta',
    time: '30 min',
    tags: ['Intervals', 'Sorting'],
    prompt: 'Merge all overlapping intervals and return an array of non-overlapping intervals.',
    practiceUrl: 'https://leetcode.com/problems/merge-intervals/'
  },
  {
    id: 'dq-5',
    title: 'Add Two Numbers',
    platform: 'LeetCode',
    difficulty: 'Medium',
    company: 'Microsoft',
    time: '30 min',
    tags: ['Linked List'],
    prompt: 'Add two numbers represented as linked lists and return the sum as a linked list.',
    practiceUrl: 'https://leetcode.com/problems/add-two-numbers/'
  },
  {
    id: 'dq-6',
    title: 'Add Two Numbers',
    platform: 'CodeChef',
    difficulty: 'Easy',
    company: 'CodeChef',
    time: '10 min',
    tags: ['Math'],
    prompt: 'Read two integers and print their sum for each test case.',
    practiceUrl: 'https://www.codechef.com/problems/FLOW001'
  },
  {
    id: 'dq-7',
    title: 'Enormous Input Test',
    platform: 'CodeChef',
    difficulty: 'Easy',
    company: 'CodeChef',
    time: '20 min',
    tags: ['Implementation'],
    prompt: 'Count how many numbers are divisible by K from a large list of inputs.',
    practiceUrl: 'https://www.codechef.com/problems/INTEST'
  },
  {
    id: 'dq-8',
    title: 'Chef and Remissness',
    platform: 'CodeChef',
    difficulty: 'Easy',
    company: 'CodeChef',
    time: '10 min',
    tags: ['Math'],
    prompt: 'Find minimum and maximum possible time given two reported values.',
    practiceUrl: 'https://www.codechef.com/problems/REMISS'
  },
  {
    id: 'dq-9',
    title: 'Life, the Universe, and Everything',
    platform: 'CodeChef',
    difficulty: 'Easy',
    company: 'CodeChef',
    time: '15 min',
    tags: ['Input/Output'],
    prompt: 'Print each number until 42 appears in the input stream.',
    practiceUrl: 'https://www.codechef.com/problems/TEST'
  },
  {
    id: 'dq-10',
    title: 'Top K Frequent Elements',
    platform: 'LeetCode',
    difficulty: 'Medium',
    company: 'Atlassian',
    time: '30 min',
    tags: ['Heap', 'HashMap'],
    prompt: 'Return the k most frequent elements in any order.',
    practiceUrl: 'https://leetcode.com/problems/top-k-frequent-elements/'
  },
  {
    id: 'dq-11',
    title: 'Course Schedule',
    platform: 'LeetCode',
    difficulty: 'Medium',
    company: 'Apple',
    time: '35 min',
    tags: ['Graph', 'Topological Sort'],
    prompt: 'Determine if it is possible to finish all courses given prerequisites.',
    practiceUrl: 'https://leetcode.com/problems/course-schedule/'
  },
  {
    id: 'dq-12',
    title: 'Trapping Rain Water',
    platform: 'LeetCode',
    difficulty: 'Hard',
    company: 'Goldman Sachs',
    time: '45 min',
    tags: ['Two Pointers', 'Array'],
    prompt: 'Compute how much water can be trapped after raining for elevation bars.',
    practiceUrl: 'https://leetcode.com/problems/trapping-rain-water/'
  }
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

const getQuestionForDay = (userSeed, dateKey, bank) => {
  const seed = `${userSeed}|${dateKey}`
  const safeBank = Array.isArray(bank) && bank.length > 0 ? bank : dailyQuestionBank
  const index = hashString(seed) % safeBank.length
  return safeBank[index]
}

const normalizeHost = (host = '') => String(host || '').trim().toLowerCase().replace(/^www\./, '')

const extractLeetCodeSlug = (value = '') => {
  try {
    const parsed = new URL(value)
    const match = parsed.pathname.match(/^\/problems\/([a-z0-9-]+)\/?$/i)
    return match ? match[1].toLowerCase() : ''
  } catch {
    return ''
  }
}

const getDifficultyTone = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
  if (difficulty === 'Medium') return 'bg-amber-200 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
  return 'bg-rose-200 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
}

export default function DailyTaskCard({ user, period = 'Today', className = '' }) {
  const [now, setNow] = useState(() => new Date())
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [isValidatingSubmission, setIsValidatingSubmission] = useState(false)
  const [completionError, setCompletionError] = useState('')
  const [isStarred, setIsStarred] = useState(false)

  const userSeed = user?.id || user?._id || user?.email || user?.name || 'guest-user'
  const dateKey = useMemo(() => getLocalDateKey(now), [now])

  const question = useMemo(() => getQuestionForDay(userSeed, dateKey, dailyQuestionBank), [userSeed, dateKey])

  const completionStorageKey = useMemo(() => `daily-task:${userSeed}:${dateKey}:${question.id}`, [userSeed, dateKey, question.id])
  const submissionStorageKey = useMemo(() => `daily-task:submission:${userSeed}:${dateKey}:${question.id}`, [userSeed, dateKey, question.id])
  const starredStorageKey = useMemo(() => `daily-task:starred:${userSeed}`, [userSeed])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    try {
      const storedSubmission = window.localStorage.getItem(submissionStorageKey) || ''
      const storedCompletion = window.localStorage.getItem(completionStorageKey) === 'true'

      setSubmissionUrl(storedSubmission)

      if (storedCompletion && !isValidSubmissionUrl(storedSubmission)) {
        window.localStorage.removeItem(completionStorageKey)
        setIsCompleted(false)
      } else {
        setIsCompleted(storedCompletion)
      }
    } catch {
      setSubmissionUrl('')
      setIsCompleted(false)
    }
  }, [completionStorageKey, submissionStorageKey])

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(starredStorageKey) || '[]')
      const list = Array.isArray(stored) ? stored : []
      setIsStarred(list.some((row) => row.id === question.id))
    } catch {
      setIsStarred(false)
    }
  }, [starredStorageKey, question.id])

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

  const isValidSubmissionUrl = (value) => {
    try {
      const raw = String(value || '').trim()
      if (!raw) return false

      const parsed = new URL(raw)
      const host = normalizeHost(parsed.hostname)
      const path = parsed.pathname

      if (parsed.protocol !== 'https:') return false

      if (question.platform === 'LeetCode') {
        if (host !== 'leetcode.com') return false

        const expectedSlug = extractLeetCodeSlug(question.practiceUrl)
        // LeetCode submission IDs are currently long numeric values (typically 10+ digits).
        const detailPattern = /^\/submissions\/detail\/([1-9]\d{9,})\/?$/i
        const problemSubmissionPattern = /^\/problems\/([a-z0-9-]+)\/submissions\/([1-9]\d{9,})\/?$/i

        if (detailPattern.test(path)) return true

        const problemMatch = path.match(problemSubmissionPattern)
        if (!problemMatch) return false

        const submittedSlug = problemMatch[1].toLowerCase()
        return !expectedSlug || submittedSlug === expectedSlug
      }

      if (question.platform === 'CodeChef') {
        if (host !== 'codechef.com') return false

        const codeChefSolutionPattern = /^\/viewsolution\/([1-9]\d{7,})\/?$/i
        return codeChefSolutionPattern.test(path)
      }

      return false
    } catch {
      return false
    }
  }

  const toggleCompletion = async () => {
    if (!isCompleted && !isValidSubmissionUrl(submissionUrl)) {
      setCompletionError(`Please add a valid accepted ${question.platform} submission URL before marking this task complete.`)
      return
    }

    if (!isCompleted) {
      try {
        setIsValidatingSubmission(true)
        const response = await validateDailySubmissionLink({
          submissionUrl: submissionUrl.trim(),
          platform: question.platform,
          practiceUrl: question.practiceUrl
        })

        const validation = response?.data?.data
        if (!validation?.isValid) {
          setCompletionError(validation?.reason || 'Submission link validation failed. Please use the exact accepted link.')
          return
        }
      } catch {
        setCompletionError('Unable to verify the submission URL right now. Please try again.')
        return
      } finally {
        setIsValidatingSubmission(false)
      }
    }

    setCompletionError('')
    const next = !isCompleted
    setIsCompleted(next)

    try {
      window.localStorage.setItem(completionStorageKey, String(next))
      window.localStorage.setItem(submissionStorageKey, submissionUrl.trim())
    } catch {
      // ignore storage errors to keep UX responsive
    }
  }

  const toggleStar = () => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(starredStorageKey) || '[]')
      const list = Array.isArray(stored) ? stored : []
      const exists = list.some((row) => row.id === question.id)

      const next = exists
        ? list.filter((row) => row.id !== question.id)
        : [
            {
              id: question.id,
              title: question.title,
              platform: question.platform,
              difficulty: question.difficulty,
              company: question.company,
              time: question.time,
              prompt: question.prompt,
              tags: question.tags,
              practiceUrl: question.practiceUrl,
              dateKey,
              starredAt: new Date().toISOString(),
              plannedTime: '',
              timerMinutes: '',
            },
            ...list,
          ]

      window.localStorage.setItem(starredStorageKey, JSON.stringify(next))
      setIsStarred(!exists)
    } catch {
      setIsStarred(false)
    }
  }

  return (
    <article className={`ui-card p-5 sm:p-6 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Daily Challenge</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">DAILY TASK</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {period}
          </span>
          <button
            type="button"
            onClick={toggleStar}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${isStarred ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {isStarred ? 'Starred' : 'Star Task'}
          </button>
        </div>
      </div>

      <div className="daily-task-question-panel mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`daily-task-difficulty-chip rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyTone(question.difficulty)}`}>{question.difficulty}</span>
          <span className="daily-task-meta-chip rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">{question.platform}</span>
          <span className="daily-task-meta-chip rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{question.company}</span>
          <span className="daily-task-meta-chip rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{question.time}</span>
        </div>

        <h4 className="daily-task-question-title mt-3 text-base font-semibold text-slate-950 dark:text-slate-100">{question.title}</h4>
        <p className="daily-task-question-prompt mt-2 text-sm text-slate-800 dark:text-slate-300">{question.prompt}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <span key={tag} className="daily-task-tag-chip rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${completionTone}`}>
        {isCompleted
          ? 'Completed for today. New question unlocks at midnight.'
          : isValidSubmissionUrl(submissionUrl)
            ? 'Accepted submission link added. You can now mark this daily task as complete.'
            : 'Not completed yet. Solve this before midnight to maintain consistency.'}
      </div>
      {completionError && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
          {completionError}
        </p>
      )}

      <div className="mt-3">
        <label htmlFor="daily-task-submission" className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
          Accepted submission URL (LeetCode/CodeChef)
        </label>
        <input
          id="daily-task-submission"
          type="url"
          value={submissionUrl}
          onChange={(event) => {
            setSubmissionUrl(event.target.value)
            if (completionError) {
              setCompletionError('')
            }
          }}
          placeholder={question.platform === 'LeetCode' ? 'https://leetcode.com/submissions/detail/123456789/' : 'https://www.codechef.com/viewsolution/123456789'}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
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
          disabled={isValidatingSubmission}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${isCompleted ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {isValidatingSubmission ? 'Validating Link...' : isCompleted ? 'Completed' : 'Mark Complete'}
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
