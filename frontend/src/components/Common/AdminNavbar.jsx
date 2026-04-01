import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import ptLogo from '../../assets/pt-logo.svg'

const navItems = [
  { label: 'Admin Overview', to: '/admin-dashboard' },
  { label: 'Manage Users', to: '/admin-users' },
  { label: 'Manage Profiles', to: '/admin-profiles' },
  { label: 'Manage Learning Paths', to: '/admin-learning-path' },
  { label: 'Manage Questions', to: '/admin-company-questions' },
  { label: 'Manage Daily Tasks', to: '/admin-daily-task' },

  // Admin access to platform modules
  { label: 'Manage Resume Data', to: '/resume-tracker' },
  { label: 'Manage Mock Interviews', to: '/mock-interviews' },
  { label: 'Manage Quiz Data', to: '/quiz' },
  { label: 'Manage Notes', to: '/notes' },
  { label: 'Manage Projects', to: '/projects' },
  { label: 'Manage Forum Content', to: '/forum' },
  { label: 'Manage Coding Profiles', to: '/coding-profiles' },
  { label: 'Review Leaderboard', to: '/leaderboard' },
]

export default function AdminNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-200/70 bg-white/80 backdrop-blur-xl" role="banner">
      <div className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-cyan-50/80 via-white to-sky-50/80 px-3 py-3 sm:px-6 lg:px-8">
        <Link to="/admin-dashboard" className="flex items-center gap-3 text-base font-semibold text-slate-900 sm:text-lg">
          <img src={ptLogo} alt="PT logo" className="h-[2.25rem] w-[2.25rem] rounded-full object-cover sm:h-[2.75rem] sm:w-[2.75rem]" />
          <span>Placement Tracker Admin</span>
        </Link>

        <button
          type="button"
          className="admin-btn admin-btn-ghost sm:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle admin menu"
        >
          Menu
        </button>

        <nav aria-label="Admin navigation" className="hidden items-center gap-2 overflow-x-auto whitespace-nowrap sm:flex sm:gap-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg' : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button type="button" className="admin-btn admin-btn-danger" onClick={onLogout}>Logout</button>
        </nav>
      </div>

      {mobileOpen && (
        <nav className="border-t border-cyan-100 bg-white px-3 py-3 sm:hidden" aria-label="Admin mobile navigation">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white' : 'bg-slate-50 text-slate-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button type="button" className="admin-btn admin-btn-danger" onClick={onLogout}>Logout</button>
          </div>
        </nav>
      )}
    </header>
  )
}
