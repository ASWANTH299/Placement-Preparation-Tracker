import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageShell from '../components/Common/PageShell'
import { resetPassword } from '../services/authService'
import { getErrorMessage } from '../utils/errorHandler'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (form.password.length < 8) {
      setMessage('Password must be at least 8 characters long.')
      return
    }

    const token = searchParams.get('token')
    if (!token) {
      setMessage('Reset token is missing. Please use the link from your email.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      await resetPassword({ token, newPassword: form.password, confirmPassword: form.confirmPassword })
      setMessage('Password reset successful. You can now login.')
      setForm({ password: '', confirmPassword: '' })
    } catch (requestError) {
      setMessage(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Reset Password" subtitle="Set a new password using your reset token.">
      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          disabled={submitting}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="New password"
          required
        />
        <input
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={onChange}
          disabled={submitting}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Confirm new password"
          required
        />
        <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          {submitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
      <Link to="/login" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
        Back to Login
      </Link>
    </PageShell>
  )
}
