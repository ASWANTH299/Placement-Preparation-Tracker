import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/admin-dashboard' },
  { label: 'Users', to: '/admin-users' },
  { label: 'Learning Paths', to: '/admin-learning-path' },
  { label: 'Company Questions', to: '/admin-company-questions' },
]

export default function AdminNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-teal-100 bg-white/90 backdrop-blur" role="banner">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/admin-dashboard" className="text-base font-semibold text-teal-700 sm:text-lg">
          Placement Tracker Admin
        </Link>
        <nav aria-label="Admin navigation" className="flex items-center gap-2 overflow-x-auto whitespace-nowrap sm:gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
