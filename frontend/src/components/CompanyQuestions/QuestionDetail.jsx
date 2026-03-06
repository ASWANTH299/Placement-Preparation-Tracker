import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getQuestionDetail, markQuestionSolved, toggleQuestionBookmark } from '../../services/questionService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function QuestionDetail() {
  const { questionId } = useParams()
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getQuestionDetail(questionId)
        const data = response?.data?.data
        if (!active) return
        setQuestion(data)
        setSolved(Boolean(data?.userProgress?.isSolved))
        setBookmarked(Boolean(data?.userProgress?.isBookmarked))
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }
    if (questionId) load()
    return () => {
      active = false
    }
  }, [questionId])

  const toggleSolved = async () => {
    try {
      await markQuestionSolved(questionId)
      setSolved((prev) => !prev)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const toggleBookmark = async () => {
    try {
      await toggleQuestionBookmark(questionId, !bookmarked)
      setBookmarked((prev) => !prev)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{question?.title || 'Question Detail'}</h1>
      <p className="mt-2 text-sm text-slate-600">Company: {question?.company || '-'} • Difficulty: {question?.difficulty || '-'} • Topic: {question?.topics?.[0] || question?.topic || '-'}</p>
      {loading && <p className="mt-2 text-sm text-slate-500">Loading question...</p>}
      {error && <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 rounded border border-slate-200 p-4 text-sm text-slate-700">
        {question?.description || 'No description available.'}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={toggleSolved} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">
          {solved ? 'Mark Unsolved' : 'Mark as Solved'}
        </button>
        <button type="button" onClick={toggleBookmark} className="rounded border border-slate-300 px-3 py-2 text-sm">
          {bookmarked ? 'Unbookmark' : 'Bookmark'}
        </button>
      </div>

      <div className="mt-5">
        <h2 className="text-base font-semibold text-slate-900">Related Questions</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
          <li>3Sum</li>
          <li>Container With Most Water</li>
          <li>Two Sum II - Input Array Is Sorted</li>
        </ul>
      </div>
    </section>
  )
}
