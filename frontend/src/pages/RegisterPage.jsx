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
      setError('Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.')
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
    <section className="auth-stage relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface-panel fade-rise w-full max-w-5xl overflow-hidden rounded-2xl">
        <div className="grid md:grid-cols-2">
          <aside className="hidden bg-gradient-to-br from-teal-700 to-orange-700 p-8 text-white md:block">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-100">Get Started</p>
            <h1 className="mt-5 text-3xl font-bold leading-tight">Create your prep workspace in minutes.</h1>
            <p className="mt-4 text-sm text-teal-50">Choose your role and start tracking every key milestone from day one.</p>
            <div className="mt-8 rounded-xl border border-white/30 bg-white/10 p-4 text-sm text-teal-50">
              Use a strong password like <span className="font-semibold">Pass@1234</span> for quick onboarding.
            </div>
          </aside>

          <div className="bg-white p-6 sm:p-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-600">Placement Preparation Tracker</p>
            <h2 className="mb-1 text-2xl font-bold text-slate-900">Create Your Account</h2>
            <p className="mb-6 text-sm text-slate-600">Register as student or admin to access your dashboard.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700">
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
              placeholder="Enter full name"
            />
          </div>

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
              minLength={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
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
              minLength={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
              placeholder="Re-enter your password"
            />
          </div>

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
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
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
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
            </form>

            <p className="mt-3 text-xs text-slate-500">
          Password must include uppercase, lowercase, number, and special character.
            </p>

            <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-orange-600 hover:text-orange-700">
            Login here
          </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}