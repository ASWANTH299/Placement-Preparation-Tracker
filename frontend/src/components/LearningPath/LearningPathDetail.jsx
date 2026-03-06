import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { getLearningPathByTopic, updateTopicProblemProgress } from '../../services/learningPathService'
import { getErrorMessage } from '../../utils/errorHandler'

const fallbackTopic = {
  _id: 'fallback-topic',
  topic: 'Arrays',
  description: 'Array traversal, prefix sums, hashing, and two-pointer fundamentals.',
  explanation: 'Arrays are foundational for interview problems. Focus on indexing, invariants, and constraints.',
  pseudocodeExplanation: '1. Define invariant\n2. Iterate once where possible\n3. Track best result\n4. Return answer',
  javaSyntaxExample: 'class TopicDemo { public static void main(String[] args) { int[] nums = {1,2,3}; } }',
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

export default function LearningPathDetail() {
  const { topicId } = useParams()
  const studentId = useSelector((state) => state.auth.user?.id)
  const [topic, setTopic] = useState(null)
  const [updatingIndex, setUpdatingIndex] = useState(-1)
  const [error, setError] = useState('')

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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{topic?.topic || 'Learning Topic'}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{topic?.description}</p>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Explanation</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{topic?.explanation || 'Explanation will appear here.'}</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Pseudocode</h2>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{topic?.pseudocodeExplanation || 'Pseudocode explanation will appear here.'}</pre>
        </article>
      </div>

      <article className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Java Syntax Example</h2>
        <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs text-slate-100">{topic?.javaSyntaxExample || '// Java example not available yet'}</pre>
      </article>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Coding Problems</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {topic?.completedProblems || 0}/{topic?.totalProblems || 0} completed
        </p>
        <div className="mt-3 space-y-3">
          {(topic?.problems || []).map((problem, index) => {
            const isCompleted = completedIndexes.has(index)
            return (
              <article key={`${problem.title}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{problem.title}</h3>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={updatingIndex === index}
                      onChange={() => toggleProblem(index, isCompleted)}
                    />
                    Mark as Completed
                  </label>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{problem.description}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <pre className="overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{problem.pseudocode || 'No pseudocode provided.'}</pre>
                  <pre className="overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs text-slate-100">{problem.javaSolution || '// Java solution not provided.'}</pre>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
