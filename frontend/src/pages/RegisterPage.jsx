import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useForm from '../hooks/useForm'
import { register as registerRequest } from '../services/authService'
import { getErrorMessage } from '../utils/errorHandler'
import { isStrongPassword, isValidEmail } from '../utils/validators'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { values, onChange } = useForm({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedName = values.fullName.trim()

    if (trimmedName.length < 2) {
      setError('Full name must be at least 2 characters.')
      return
    }

    if (!isValidEmail(values.email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!isStrongPassword(values.password)) {
      setError('Password must include at least one uppercase letter and one special character.')
      return
    }

    if (values.password !== values.confirmPassword) {
      setError('Password and confirm password must match.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setMessage('')
      await registerRequest({
        name: trimmedName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: values.role,
      })
      setMessage('Registration successful. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
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
              <h1 className="login-brand-title auth-shell-title font-['Manrope'] font-extrabold leading-[0.88]">
                <span>PLACEMENT</span>
                <span>TRACKER</span>
              </h1>
            </div>
          </aside>

          <div className="login-details-panel p-6 sm:p-8 lg:p-10">
            <div className="mb-6">
              <p className="login-mobile-brand auth-shell-title mb-2 font-['Manrope'] text-xl font-extrabold tracking-tight lg:hidden">
                PLACEMENT TRACKER
              </p>
              <p className="login-kicker">Placement Preparation Tracker</p>
              <h2 className="auth-shell-title mt-3 font-['Manrope'] text-3xl font-extrabold">Create your account</h2>
              <p className="auth-shell-copy mt-2 text-sm">Register as student or admin to access your dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/70 dark:bg-red-950/35 dark:text-red-200">{error}</p>}
              {message && <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800/70 dark:bg-green-950/35 dark:text-green-200">{message}</p>}

              <div>
                <label htmlFor="fullName" className="auth-shell-label mb-1.5 block text-sm font-semibold">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={values.fullName}
                  onChange={onChange}
                  required
                  disabled={isSubmitting}
                  minLength={2}
                  maxLength={100}
                  className="login-input"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="auth-shell-label mb-1.5 block text-sm font-semibold">
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
                <label htmlFor="password" className="auth-shell-label mb-1.5 block text-sm font-semibold">
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
                  placeholder="Use at least one uppercase and one special character"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="auth-shell-label mb-1.5 block text-sm font-semibold">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  onChange={onChange}
                  required
                  disabled={isSubmitting}
                  className="login-input"
                  placeholder="Re-enter your password"
                />
              </div>

              <div>
                <label htmlFor="role" className="auth-shell-label mb-1.5 block text-sm font-semibold">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="login-cta-button w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="auth-shell-muted mt-3 text-xs">
              Password must include at least one uppercase letter and one special character.
            </p>

            <p className="auth-shell-copy mt-4 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-orange-600 transition hover:text-orange-700">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}