import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Learning Path', to: '/learning-path' },
  { label: 'Company Questions', to: '/company-questions' },
  { label: 'Practice', to: '/company-questions' },
  { label: 'Resume', to: '/resume-tracker' },
  { label: 'Notes', to: '/notes' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Coding Profiles', to: '/coding-profiles' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-slate-200 bg-white" role="banner">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-base font-semibold text-blue-600 sm:text-lg">
          Placement Tracker
        </Link>

        <nav aria-label="Student navigation" className="flex flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap sm:gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </header>
  )
}