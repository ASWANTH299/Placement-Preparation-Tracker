import { useEffect, useState } from 'react'
import { createCompanyQuestion } from '../../services/adminService'
import { getQuestions } from '../../services/questionService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function QuestionManagement() {
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const response = await getQuestions()
        if (active) setQuestions(response?.data?.data || [])
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const addQuestion = async () => {
    if (!title.trim()) return

    const payload = {
      title,
      description: `${title} description`,
      company: 'Custom',
      topics: ['General'],
      difficulty: 'Medium',
      status: 'Active',
    }

    try {
      setError('')
      await createCompanyQuestion(payload)
      const refreshed = await getQuestions()
      setQuestions(refreshed?.data?.data || [])
      setTitle('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Manage Interview Questions</h1>
      <div className="mt-4 flex gap-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Question title" className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="button" onClick={addQuestion} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Add</button>
      </div>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">ID</th>
              <th className="py-2">Question</th>
              <th className="py-2">Company</th>
              <th className="py-2">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question._id || question.id} className="border-b border-slate-100">
                <td className="py-2">{question._id || question.id}</td>
                <td className="py-2">{question.title}</td>
                <td className="py-2">{question.company}</td>
                <td className="py-2">{question.difficulty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
