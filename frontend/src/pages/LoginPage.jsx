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
    <section className="auth-stage relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="login-shell-v4 fade-rise relative w-full max-w-5xl overflow-hidden rounded-3xl">
        <div className="login-shell-v4__accent" aria-hidden="true" />

        <div className="relative grid lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="login-brand-panel hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
            <div>
              <h1 className="login-brand-title font-['Manrope'] font-extrabold leading-[0.88] text-slate-900 dark:text-slate-100">
                <span>PLACEMENT</span>
                <span>TRACKER</span>
              </h1>
            </div>
          </aside>

          <div className="login-details-panel p-6 sm:p-8 lg:p-10">
            <div className="mb-6">
              <p className="login-mobile-brand mb-2 font-['Manrope'] text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 lg:hidden">
                PLACEMENT TRACKER
              </p>
              <p className="login-kicker">Placement Preparation Tracker</p>
              <h2 className="mt-3 font-['Manrope'] text-3xl font-extrabold text-slate-900 dark:text-slate-100">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sign in and continue your interview prep flow.</p>
            </div>

            {sessionExpired && (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
                Your session expired. Please log in again.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/70 dark:bg-red-950/35 dark:text-red-200">{error}</p>}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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
                  className="login-input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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
                  className="login-input"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <label htmlFor="role" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={values.role}
                  onChange={onChange}
                  disabled={isSubmitting}
                  className="login-input"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={values.remember}
                    onChange={onChange}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  Remember me
                </label>

                <Link to="/forgot-password" className="text-sm font-medium text-orange-600 transition hover:text-orange-700">
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" disabled={isSubmitting} className="login-cta-button w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-orange-600 transition hover:text-orange-700">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}