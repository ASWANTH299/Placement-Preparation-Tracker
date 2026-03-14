import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/authService'
import { getErrorMessage } from '../utils/errorHandler'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [devMailDebug, setDevMailDebug] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')
      setDevMailDebug(null)
      const response = await forgotPassword({ email })
      setMessage(response?.data?.message || 'If your email exists, a reset link has been sent.')
      setDevMailDebug(response?.data?.dev || null)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Forgot Password</h1>
        <p className="mb-6 text-sm text-slate-600">Enter your email to receive reset instructions.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
          {devMailDebug && (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-medium">Development mail debug</p>
              <p className="mt-1">Delivery mode: {devMailDebug.deliveryMode || 'unknown'}</p>
              {devMailDebug.previewUrl && (
                <p className="mt-1 break-all">
                  Preview inbox:{' '}
                  <a href={devMailDebug.previewUrl} target="_blank" rel="noreferrer" className="font-medium text-amber-900 underline">
                    Open preview
                  </a>
                </p>
              )}
              {devMailDebug.fallbackResetUrl && (
                <p className="mt-1 break-all">
                  Reset link:{' '}
                  <a href={devMailDebug.fallbackResetUrl} target="_blank" rel="noreferrer" className="font-medium text-amber-900 underline">
                    Open reset page
                  </a>
                </p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="resetEmail" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="resetEmail"
              name="resetEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={submitting}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Back to{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Login
          </Link>
        </p>
      </div>
    </section>
  )
}