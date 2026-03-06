import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useForm from '../hooks/useForm'
import useLocalStorage from '../hooks/useLocalStorage'
import { login as loginRequest } from '../services/authService'
import { getErrorMessage } from '../utils/errorHandler'
import { isValidEmail } from '../utils/validators'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [rememberedEmail, setRememberedEmail] = useLocalStorage('rememberedEmail', '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
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
    <section className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-blue-600 animate-pulse">
          Placement Preparation Tracker
        </p>
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Welcome Back</h1>

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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
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
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">
            Forgot Password?
          </Link>
          <span className="text-slate-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
              Register here
            </Link>
          </span>
        </div>
      </div>
    </section>
  )
}