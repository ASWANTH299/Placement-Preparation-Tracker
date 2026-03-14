import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import PageShell from '../components/Common/PageShell'
import { resetPassword } from '../services/authService'
import { getErrorMessage } from '../utils/errorHandler'
import { isStrongPassword } from '../utils/validators'

export default function ResetPasswordPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const resetSessionToken = location.state?.resetSessionToken || ''
  const emailToken = searchParams.get('token')

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!isStrongPassword(form.password)) {
      setMessage('Password must include at least one uppercase letter and one special character.')
      return
    }

    const token = resetSessionToken || emailToken
    if (!token) {
      setMessage('Reset session is missing. Please verify OTP again from Forgot Password page.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      if (resetSessionToken) {
        if (!form.email.trim()) {
          setMessage('Please enter your account email.')
          return
        }

        await resetPassword({
          resetSessionToken,
          email: form.email.trim(),
          newPassword: form.password,
          confirmPassword: form.confirmPassword,
        })
      } else {
        await resetPassword({ token, newPassword: form.password, confirmPassword: form.confirmPassword })
      }
      setMessage('Password reset successful. You can now login.')
      setForm({ email: '', password: '', confirmPassword: '' })
    } catch (requestError) {
      setMessage(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Reset Password" subtitle="Set a new password after OTP verification.">
      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        {resetSessionToken && (
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            disabled={submitting}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Account email"
            required
          />
        )}
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
