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
    <section className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-blue-600 animate-pulse">
          Placement Preparation Tracker
        </p>
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Create Your Account</h1>

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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
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
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          Password must include uppercase, lowercase, number, and special character.
        </p>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Login here
          </Link>
        </p>
      </div>
    </section>
  )
}