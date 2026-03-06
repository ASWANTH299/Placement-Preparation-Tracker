import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useForm from '../hooks/useForm'
import useLocalStorage from '../hooks/useLocalStorage'
import { login as loginRequest } from '../services/authService'
import { getErrorMessage } from '../utils/errorHandler'
import { isValidEmail } from '../utils/validators'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [rememberedEmail, setRememberedEmail] = useLocalStorage('rememberedEmail', '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const sessionExpired = new URLSearchParams(location.search).get('reason') === 'session-expired'
  const { values, onChange } = useForm({
    email: rememberedEmail,
    password: '',
    remember: Boolean(rememberedEmail),
    role: 'student',
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isValidEmail(values.email) || !values.password) {
      setError('Please enter a valid email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      const response = await loginRequest({ email: values.email, password: values.password })
      const payload = response?.data?.data

      if (payload?.role !== values.role) {
        setError(`This account is ${payload?.role || 'unknown'} role. Please choose the correct role to login.`)
        return
      }

      login({
        token: payload?.token,
        role: payload?.role,
        user: {
          id: payload?.id,
          name: payload?.name,
          email: payload?.email,
          role: payload?.role,
        },
      })

      if (values.remember) {
        setRememberedEmail(values.email)
      } else {
        setRememberedEmail('')
      }

      navigate(payload?.role === 'admin' ? '/admin-dashboard' : '/dashboard')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-stage relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface-panel fade-rise w-full max-w-5xl overflow-hidden rounded-2xl">
        <div className="grid md:grid-cols-2">
          <aside className="hidden bg-gradient-to-br from-orange-700 to-teal-700 p-8 text-white md:block">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-100">Placement Preparation Tracker</p>
            <h1 className="mt-5 text-3xl font-bold leading-tight">Ship your preparation plan with momentum.</h1>
            <p className="mt-4 text-sm text-orange-50">Track streaks, questions, interviews, notes, and resume updates in one dashboard.</p>
            <div className="mt-8 space-y-2 text-sm text-orange-50">
              <p>- Structured topic-based roadmap</p>
              <p>- Interview progress analytics</p>
              <p>- Role-based student/admin access</p>
            </div>
          </aside>

          <div className="bg-white p-6 sm:p-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-600">Placement Preparation Tracker</p>
            <h2 className="mb-1 text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="mb-6 text-sm text-slate-600">Login to continue your preparation journey.</p>

            {sessionExpired && (
              <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Your session expired. Please log in again.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={onChange}
              required
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={values.password}
              onChange={onChange}
              required
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
              placeholder="Enter your password"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="remember"
              checked={values.remember}
              onChange={onChange}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-slate-300"
            />
            Remember me
          </label>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={values.role}
              onChange={onChange}
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-700"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-orange-600 hover:text-orange-700">
            Forgot Password?
          </Link>
          <span className="text-slate-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-orange-600 hover:text-orange-700">
              Register here
            </Link>
          </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}