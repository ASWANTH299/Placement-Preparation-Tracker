import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams, useSearchParams } from 'react-router-dom'
import { getLearningPathByTopic, updateTopicProblemProgress } from '../../services/learningPathService'
import { getErrorMessage } from '../../utils/errorHandler'

const fallbackTopic = {
  _id: 'fallback-topic',
  topic: 'Arrays',
  description: 'Arrays fundamentals and interview-ready patterns.',
  explanation: 'Arrays is a high-impact DSA area used in interviews. Learn representations, trade-offs, and common templates.',
  pseudocodeExplanation: 'Understand the core template first, then map each problem to that template and optimize.',
  javaSyntaxExample: '// Arrays Java starter\nclass TopicDemo {\n  public static void main(String[] args) {\n    System.out.println("Arrays");\n  }\n}',
  week: 1,
  order: 1,
  statusLabel: 'In Progress',
  completionPercentage: 20,
  estimatedDurationHours: 8,
  difficulty: 'Beginner',
  subtopics: ['Traversal', 'Prefix Sum', 'Two Pointers', 'Hashing', 'Sliding Window'],
  resources: [
    { title: 'Array Patterns Guide', url: 'https://leetcode.com/problem-list/array/', type: 'article' },
    { title: 'Prefix Sum Masterclass', url: 'https://www.youtube.com/watch?v=pVS3yhlzrlQ', type: 'video' },
    { title: 'Java Arrays Reference', url: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html', type: 'documentation' },
  ],
  completedProblems: 0,
  totalProblems: 5,
  completedProblemIndexes: [],
  problems: [
    {
      title: 'Two Sum Variant',
      description: 'Find two elements that add to target using efficient lookups.',
      pseudocode: '1. map={}\n2. for each x\n3. if target-x in map return\n4. add x',
      javaSolution: 'class Solution { int[] solve(int[] nums, int t){ return new int[]{0,1}; } }'
    },
    {
      title: 'Maximum Subarray',
      description: 'Find maximum sum contiguous subarray.',
      pseudocode: '1. current=best=nums[0]\n2. current=max(nums[i], current+nums[i])\n3. best=max(best,current)',
      javaSolution: 'class Solution { int maxSubArray(int[] nums){ return 0; } }'
    },
    {
      title: 'Product of Array Except Self',
      description: 'Compute product of all elements except current index without using division.',
      pseudocode: '1. build prefix products\n2. build suffix products\n3. result[i]=prefix[i]*suffix[i]',
      javaSolution: 'class Solution { int[] solve(int[] nums){ return nums; } }'
    },
    {
      title: 'Best Time to Buy and Sell Stock',
      description: 'Maximize profit with one buy and one sell.',
      pseudocode: '1. minPrice=INF\n2. for each price: update minPrice and maxProfit',
      javaSolution: 'class Solution { int maxProfit(int[] prices){ return 0; } }'
    },
    {
      title: 'Subarray Sum Equals K',
      description: 'Count subarrays whose sum equals K using prefix sums + frequency map.',
      pseudocode: '1. freq[0]=1\n2. running+=num\n3. answer+=freq[running-k]\n4. freq[running]++',
      javaSolution: 'class Solution { int solve(int[] nums, int k){ return 0; } }'
    }
  ]
}

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''))

const normalizeLines = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const parsePhaseNumber = (value) => {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isNaN(parsed) ? null : parsed
}

const resourceTone = {
  article: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  video: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  documentation: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
}

export default function LearningPathDetail() {
  const { topicId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const studentId = useSelector((state) => state.auth.user?.id)
  const [topic, setTopic] = useState(null)
  const [updatingIndex, setUpdatingIndex] = useState(-1)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [activePhaseIndex, setActivePhaseIndex] = useState(0)
  const [expandedProblem, setExpandedProblem] = useState(0)
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [focusEndsAt, setFocusEndsAt] = useState(0)
  const [nowTs, setNowTs] = useState(Date.now())
  const phaseStorageKey = useMemo(() => `learning-path-active-phase:${topicId || 'fallback-topic'}`, [topicId])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!isValidObjectId(topicId)) {
        setTopic(fallbackTopic)
        return
      }

      try {
        setError('')
        const response = await getLearningPathByTopic(topicId)
        if (active) setTopic(response?.data?.data || fallbackTopic)
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError))
          setTopic(fallbackTopic)
        }
      }
    }

    if (topicId) load()
    return () => {
      active = false
    }
  }, [topicId])

  const toggleProblem = async (problemIndex, isCompleted) => {
    if (!studentId || !topic?._id || !isValidObjectId(topic?._id)) return
    try {
      setError('')
      setUpdatingIndex(problemIndex)
      await updateTopicProblemProgress(studentId, topic._id, problemIndex, !isCompleted)
      const refreshed = await getLearningPathByTopic(topic._id)
      setTopic(refreshed?.data?.data || null)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setUpdatingIndex(-1)
    }
  }

  const completedIndexes = new Set(topic?.completedProblemIndexes || [])

  const topicData = topic || fallbackTopic
  const totalProblems = Number(topicData.totalProblems || topicData.problems?.length || 0)
  const completedProblems = Number(topicData.completedProblems || 0)
  const completionPercentage = Number(topicData.completionPercentage || 0)
  const remainingProblems = Math.max(totalProblems - completedProblems, 0)

  const explanationLines = useMemo(() => normalizeLines(topicData.explanation), [topicData.explanation])
  const pseudocodeLines = useMemo(() => normalizeLines(topicData.pseudocodeExplanation), [topicData.pseudocodeExplanation])
  const subtopics = useMemo(() => (Array.isArray(topicData.subtopics) ? topicData.subtopics.filter(Boolean) : []), [topicData.subtopics])

  const phases = useMemo(() => {
    const total = Math.max(totalProblems, 1)
    const completedRatio = completedProblems / total
    return [
      {
        id: 'foundation',
        title: 'Foundation',
        detail: 'Understand core definitions, constraints, and base templates.',
        checklist: [
          'Explain the brute force approach and baseline complexity.',
          'Identify input constraints and edge-case categories.',
          'Build a clean starter template in Java before optimization.',
        ],
        status: completedRatio >= 0.25 ? 'done' : 'current',
      },
      {
        id: 'pattern-mapping',
        title: 'Pattern Mapping',
        detail: 'Map problem statements to known solution patterns quickly.',
        checklist: [
          'Classify each new problem by pattern in under 60 seconds.',
          'Write why this pattern fits and alternatives do not.',
          'Reuse a proven template and adapt only variable parts.',
        ],
        status: completedRatio >= 0.5 ? 'done' : completedRatio >= 0.25 ? 'current' : 'upcoming',
      },
      {
        id: 'optimization',
        title: 'Optimization',
        detail: 'Improve time/space complexity with refined strategy choices.',
        checklist: [
          'Move from brute force to target complexity using constraints.',
          'Track invariants and update logic to avoid regressions.',
          'Compare trade-offs between memory and execution speed.',
        ],
        status: completedRatio >= 0.75 ? 'done' : completedRatio >= 0.5 ? 'current' : 'upcoming',
      },
      {
        id: 'interview-simulation',
        title: 'Interview Simulation',
        detail: 'Solve under time pressure with verbal reasoning and clean code.',
        checklist: [
          'Solve one timed medium problem with narration.',
          'Validate dry-run and edge cases before final answer.',
          'Summarize complexity and justify final implementation.',
        ],
        status: completedRatio >= 1 ? 'done' : completedRatio >= 0.75 ? 'current' : 'upcoming',
      },
    ]
  }, [completedProblems, totalProblems])

  useEffect(() => {
    if (activePhaseIndex >= phases.length) {
      setActivePhaseIndex(0)
    }
  }, [activePhaseIndex, phases.length])

  useEffect(() => {
    const phaseFromQuery = parsePhaseNumber(searchParams.get('phase'))
    const phaseFromStorage = typeof window === 'undefined'
      ? null
      : parsePhaseNumber(window.localStorage.getItem(phaseStorageKey))

    const preferredPhase = phaseFromQuery ?? phaseFromStorage
    if (!preferredPhase) return

    const preferredIndex = preferredPhase - 1
    if (preferredIndex >= 0 && preferredIndex < phases.length) {
      setActivePhaseIndex((currentIndex) => (currentIndex === preferredIndex ? currentIndex : preferredIndex))
    }
  }, [searchParams, phaseStorageKey, phases.length])

  useEffect(() => {
    if (!phases.length) return

    const phaseNumber = activePhaseIndex + 1
    const currentQueryPhase = parsePhaseNumber(searchParams.get('phase'))
    if (currentQueryPhase !== phaseNumber) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('phase', String(phaseNumber))
      setSearchParams(nextParams, { replace: true })
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(phaseStorageKey, String(phaseNumber))
    }
  }, [activePhaseIndex, phases.length, searchParams, setSearchParams, phaseStorageKey])

  const selectedPhase = phases[activePhaseIndex] || phases[0]

  const resources = useMemo(() => {
    if (Array.isArray(topicData.resources) && topicData.resources.length > 0) return topicData.resources
    const encodedTopic = encodeURIComponent(topicData.topic || 'dsa')
    return [
      { title: `${topicData.topic} Problem Set`, url: `https://leetcode.com/problem-list/${encodedTopic}/`, type: 'article' },
      { title: `${topicData.topic} Video Walkthrough`, url: `https://www.youtube.com/results?search_query=${encodedTopic}+dsa`, type: 'video' },
      { title: `${topicData.topic} Java Documentation`, url: 'https://docs.oracle.com/javase/tutorial/', type: 'documentation' },
    ]
  }, [topicData.resources, topicData.topic])

  const focusRemainingMs = Math.max(focusEndsAt - nowTs, 0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (focusEndsAt > 0 && focusRemainingMs <= 0) {
      setFocusEndsAt(0)
    }
  }, [focusEndsAt, focusRemainingMs])

  const startFocus = () => {
    const safeMinutes = Math.min(Math.max(Number(focusMinutes) || 25, 5), 180)
    setFocusMinutes(safeMinutes)
    setFocusEndsAt(Date.now() + safeMinutes * 60 * 1000)
  }

  const stopFocus = () => {
    setFocusEndsAt(0)
  }

  const focusLabel = useMemo(() => {
    const seconds = Math.floor(focusRemainingMs / 1000)
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [focusRemainingMs])

  const statusTone = (status) => {
    if (status === 'done') return 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
    if (status === 'current') return 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300'
    return 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300'
  }

  return (
    <section className="space-y-6 fade-rise">
      <article className="ui-card overflow-hidden p-5 sm:p-6">
        <div className="rounded-2xl border border-blue-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.22),_transparent_55%),linear-gradient(135deg,_rgba(14,116,144,0.16),_rgba(16,185,129,0.12))] p-5 dark:border-blue-900/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Roadmap Topic</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-slate-100">{topicData.topic || 'Learning Topic'}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-700 dark:text-slate-300">{topicData.description || 'Detailed roadmap guidance appears here.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MetricTile label="Progress" value={`${completionPercentage}%`} />
              <MetricTile label="Solved" value={`${completedProblems}/${totalProblems}`} />
              <MetricTile label="Difficulty" value={topicData.difficulty || 'NA'} />
              <MetricTile label="Duration" value={`${Number(topicData.estimatedDurationHours || 0) || 0}h`} />
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/60 dark:bg-slate-800/80">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>
        {error && <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      </article>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        <article className="ui-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Execution Roadmap</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{remainingProblems} problems left</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {phases.map((phase, index) => (
              <button
                key={phase.title}
                type="button"
                onClick={() => setActivePhaseIndex(index)}
                className={`rounded-xl border p-3 text-left transition hover:brightness-105 ${statusTone(phase.status)} ${activePhaseIndex === index ? 'ring-2 ring-blue-400/80' : ''}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Phase {index + 1}</p>
                <p className="mt-1 font-semibold">{phase.title}</p>
                <p className="mt-1 text-sm">{phase.detail}</p>
              </button>
            ))}
          </div>
          {selectedPhase && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
                  Active: {selectedPhase.title}
                </h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selectedPhase.status === 'done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : selectedPhase.status === 'current' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {selectedPhase.status === 'done' ? 'Completed' : selectedPhase.status === 'current' ? 'In Progress' : 'Upcoming'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{selectedPhase.detail}</p>
              <div className="mt-3 space-y-2">
                {selectedPhase.checklist.map((item, idx) => (
                  <p key={`${selectedPhase.id}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {idx + 1}. {item}
                  </p>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="ui-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Focus Mode</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Deep Work Timer</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use timed sessions to complete this topic with consistency.</p>
          <div className="mt-4 flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="180"
              value={focusMinutes}
              onChange={(event) => setFocusMinutes(event.target.value)}
              className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">minutes</span>
          </div>
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-lg font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {focusEndsAt > 0 ? focusLabel : 'Not running'}
          </p>
          <div className="mt-3 flex gap-2">
            {focusEndsAt > 0 ? (
              <button type="button" onClick={stopFocus} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700">Stop</button>
            ) : (
              <button type="button" onClick={startFocus} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Start Session</button>
            )}
            <button type="button" onClick={() => setFocusMinutes(45)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">45m preset</button>
          </div>
        </article>
      </div>

      <article className="ui-card p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'practice', label: 'Practice Workspace' },
            { id: 'resources', label: 'Resources & Notes' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Concept Brief</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  {(explanationLines.length ? explanationLines : ['Detailed explanation will appear here.']).map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Pseudocode Playbook</h3>
                <ol className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  {(pseudocodeLines.length ? pseudocodeLines : ['Review template', 'Map strategy', 'Test edge cases']).map((line, index) => (
                    <li key={`${line}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">{index + 1}. {line}</li>
                  ))}
                </ol>
              </article>
            </div>

            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Java Reference Implementation</h3>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-100">{topicData.javaSyntaxExample || '// Java syntax example unavailable'}</pre>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Subtopic Checklist</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(subtopics.length ? subtopics : ['Core Concepts', 'Patterns', 'Complexity Analysis']).map((item, index) => (
                  <span key={`${item}-${index}`} className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{item}</span>
                ))}
              </div>
            </article>
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="mt-5 space-y-3">
            {(topicData.problems || []).map((problem, index) => {
              const isCompleted = completedIndexes.has(index)
              const expanded = expandedProblem === index
              return (
                <article key={`${problem.title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedProblem(expanded ? -1 : index)}
                      className="text-left"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Problem {index + 1}</p>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{problem.title}</h3>
                    </button>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        disabled={updatingIndex === index}
                        onChange={() => toggleProblem(index, isCompleted)}
                      />
                      {updatingIndex === index ? 'Saving...' : 'Mark Complete'}
                    </label>
                  </div>

                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{problem.description}</p>

                  {expanded && (
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <pre className="overflow-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{problem.pseudocode || 'No pseudocode provided.'}</pre>
                      <pre className="overflow-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-100">{problem.javaSolution || '// Java solution not provided.'}</pre>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Recommended Resources</h3>
              <div className="mt-3 space-y-2">
                {resources.map((resource, index) => (
                  <a
                    key={`${resource.title}-${index}`}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{resource.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${resourceTone[resource.type] || resourceTone.article}`}>{resource.type || 'article'}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Open resource</p>
                  </a>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Interview Readiness Checklist</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <ChecklistItem done={completionPercentage >= 25} text="Can explain the base pattern without code." />
                <ChecklistItem done={completionPercentage >= 50} text="Can derive optimal time and space complexity." />
                <ChecklistItem done={completionPercentage >= 75} text="Can solve medium variants under time limits." />
                <ChecklistItem done={completionPercentage >= 100} text="Can implement and test final Java solution confidently." />
              </div>
              <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Current status: {topicData.statusLabel || 'In Progress'} • Week {topicData.week || '-'} • Order {topicData.order || '-'}
              </p>
            </article>
          </div>
        )}
      </article>
    </section>
  )
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

function ChecklistItem({ done, text }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
        {done ? 'Y' : '-'}
      </span>
      <p>{text}</p>
    </div>
  )
}
