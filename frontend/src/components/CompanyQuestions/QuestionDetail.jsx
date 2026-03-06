import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestionDetail, markQuestionSolved, toggleQuestionBookmark } from '../../services/questionService'
import { getErrorMessage } from '../../utils/errorHandler'
import { fallbackQuestionById, fallbackQuestions } from '../../utils/questionFallbackData'

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''))

const toLines = (value) => String(value || '')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)

export default function QuestionDetail() {
  const { questionId } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const inputFormat = question?.inputFormat || 'Read values exactly as shown in the sample input. Parse arrays/strings/graphs based on problem statement.'
  const outputFormat = question?.outputFormat || 'Return/print exactly the expected answer format shown in sample output.'
  const constraints = question?.constraints || 'Choose an optimal approach that satisfies interview-scale input limits.'
  const examples = question?.inputOutputExamples?.length
    ? question.inputOutputExamples
    : [{
      input: question?.exampleInput || 'N/A',
      output: question?.exampleOutput || 'N/A',
      explanation: question?.explanation || 'N/A'
    }]

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!isValidObjectId(questionId)) {
        setQuestion(fallbackQuestionById[questionId] || fallbackQuestions[0])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const response = await getQuestionDetail(questionId)
        const data = response?.data?.data
        if (!active) return
        setQuestion(data || fallbackQuestions[0])
        setSolved(Boolean(data?.userProgress?.isSolved))
        setBookmarked(Boolean(data?.userProgress?.isBookmarked))
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError))
          setQuestion(fallbackQuestionById[questionId] || fallbackQuestions[0])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    if (questionId) load()
    return () => {
      active = false
    }
  }, [questionId])

  const markSolved = async () => {
    if (!isValidObjectId(questionId)) {
      setSolved(true)
      return
    }

    try {
      await markQuestionSolved(questionId)
      setSolved(true)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const toggleBookmark = async () => {
    if (!isValidObjectId(questionId)) {
      setBookmarked((prev) => !prev)
      return
    }

    try {
      await toggleQuestionBookmark(questionId, !bookmarked)
      setBookmarked((prev) => !prev)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{question?.title || 'Question Detail'}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Company: {question?.company || '-'} • Difficulty: {question?.difficulty || '-'} • Topic: {question?.topic || question?.topics?.[0] || '-'}
      </p>
      {loading && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading question...</p>}
      {error && <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <article className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{question?.description || 'No statement available.'}</p>
      </article>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Input Format</h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
            {toLines(inputFormat).map((line) => (
              <li key={line}>- {line}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Output Format</h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
            {toLines(outputFormat).map((line) => (
              <li key={line}>- {line}</li>
            ))}
          </ul>
        </article>
      </div>

      <article className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Constraints</h2>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {toLines(constraints).map((line) => (
            <li key={line}>- {line}</li>
          ))}
        </ul>
      </article>

      <article className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Example</h2>
        <div className="mt-3 space-y-3">
          {examples.map((example, index) => (
            <div key={`example-${index}`} className="grid gap-3 rounded-lg bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200 md:grid-cols-3">
              <div>
                <p className="font-semibold">Input {index + 1}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs">{example.input || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Output {index + 1}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs">{example.output || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Explanation {index + 1}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs">{example.explanation || question?.explanation || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Explanation</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{question?.explanation || question?.solutionApproach || 'No explanation available.'}</p>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">Time: {question?.timeComplexity || 'N/A'}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Space: {question?.spaceComplexity || 'N/A'}</p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Pseudocode</h2>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-200">{question?.pseudocode || 'No pseudocode available.'}</pre>
        </article>
        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Java Solution</h2>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs text-slate-100">{question?.javaSolution || question?.solutionCode || '// Java solution not available.'}</pre>
        </article>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={markSolved} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">
          {solved ? 'Marked as Solved' : 'Mark as Solved'}
        </button>
        <button type="button" onClick={toggleBookmark} className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-100">
          {bookmarked ? 'Unbookmark' : 'Bookmark'}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/practice/${questionId}`)}
          className="rounded border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-700 dark:text-blue-300"
        >
          Practice
        </button>
      </div>
    </section>
  )
}
