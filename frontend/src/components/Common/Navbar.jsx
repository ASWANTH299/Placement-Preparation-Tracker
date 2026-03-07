import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import useAuth from '../../hooks/useAuth'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Learning Path', to: '/learning-path' },
  { label: 'Questions & Practice', to: '/company-questions' },
  { label: 'Resume', to: '/resume-tracker' },
  { label: 'Notes', to: '/notes' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Coding Profiles', to: '/coding-profiles' },
  { label: 'Concept Learning', to: '/concept-learning' },
  { label: 'Profile', to: '/profile' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        isDark
          ? 'border-slate-800 bg-slate-950/80'
          : 'border-slate-200 bg-white/95'
      }`}
      role="banner"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/dashboard" className={`text-base font-semibold tracking-tight sm:text-lg ${isDark ? 'text-blue-300' : 'text-slate-900'}`}>
          Placement Tracker
        </Link>

        <nav aria-label="Student navigation" className="flex flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap sm:gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link-base ${
                  isActive
                    ? 'nav-link-active'
                    : 'nav-link-idle'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setIsDark((prev) => !prev)}
          className="ui-button ui-button-ghost shrink-0 px-3 py-2 text-sm"
        >
          {isDark ? 'Light' : 'Dark'}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="ui-button ui-button-ghost shrink-0 px-3 py-2 text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  )
}