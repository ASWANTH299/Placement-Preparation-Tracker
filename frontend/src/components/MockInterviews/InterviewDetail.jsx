import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getMockInterviewDetail } from '../../services/interviewService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function InterviewDetail() {
  const { interviewId } = useParams()
  const studentId = useSelector((state) => state.auth.user?.id)
  const [interview, setInterview] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!studentId || !interviewId) return
      try {
        const response = await getMockInterviewDetail(studentId, interviewId)
        if (active) setInterview(response?.data?.data)
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }
    load()
    return () => {
      active = false
    }
  }, [interviewId, studentId])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{interview?.company || 'Mock Interview'} • {interview?.interviewDate ? new Date(interview.interviewDate).toLocaleDateString() : '-'}</h1>
      <p className="mt-1 text-sm text-slate-600">Score: {interview?.score ?? '-'} • Duration: {interview?.duration ?? '-'} mins</p>
      {error && <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="rounded border border-slate-200 p-3">
          <h2 className="text-sm font-semibold">Overall Feedback</h2>
          <p className="mt-1 text-sm text-slate-600">{interview?.overallFeedback || 'No feedback available.'}</p>
        </article>
        <article className="rounded border border-slate-200 p-3">
          <h2 className="text-sm font-semibold">Areas to Improve</h2>
          <p className="mt-1 text-sm text-slate-600">{interview?.improvements || 'No improvement notes available.'}</p>
        </article>
      </div>
    </section>
  )
}
