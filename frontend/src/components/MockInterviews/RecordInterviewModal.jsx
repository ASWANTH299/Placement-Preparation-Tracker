import Modal from '../Common/Modal'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { createMockInterview } from '../../services/interviewService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function RecordInterviewModal({ isOpen, onClose }) {
  const studentId = useSelector((state) => state.auth.user?.id)
  const [form, setForm] = useState({ company: '', interviewDate: '', score: '', overallFeedback: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!studentId) {
      setError('Please login again to continue.')
      return
    }
    try {
      setSubmitting(true)
      setError('')
      await createMockInterview(studentId, {
        company: form.company,
        interviewDate: form.interviewDate,
        score: Number(form.score),
        overallFeedback: form.overallFeedback,
      })
      onClose()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Mock Interview">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div>
          <label htmlFor="company" className="mb-1 block text-sm font-medium text-slate-700">Company</label>
          <select id="company" name="company" value={form.company} onChange={onChange} required disabled={submitting} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select company</option>
            <option>Google</option>
            <option>Amazon</option>
            <option>Meta</option>
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="date" name="interviewDate" value={form.interviewDate} onChange={onChange} required disabled={submitting} className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" name="score" value={form.score} onChange={onChange} min="0" max="100" step="0.1" placeholder="Score" required disabled={submitting} className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <textarea
            value={form.overallFeedback}
            name="overallFeedback"
            onChange={onChange}
            maxLength={1000}
            required
            disabled={submitting}
            placeholder="Overall feedback"
            className="h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">{form.overallFeedback.length}/1000</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-3 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">{submitting ? 'Saving...' : 'Save Interview'}</button>
        </div>
      </form>
    </Modal>
  )
}
