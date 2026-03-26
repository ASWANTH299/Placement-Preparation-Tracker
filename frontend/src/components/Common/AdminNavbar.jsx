import { Link, NavLink } from 'react-router-dom'
import ptLogo from '../../assets/pt-logo.svg'

const navItems = [
  { label: 'Dashboard', to: '/admin-dashboard' },
  { label: 'Users', to: '/admin-users' },
  { label: 'Learning Paths', to: '/admin-learning-path' },
  { label: 'Company Questions', to: '/admin-company-questions' },
]

export default function AdminNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-teal-100 bg-white/90 backdrop-blur" role="banner">
      <div className="flex w-full items-center justify-between py-3 pr-4 pl-3 sm:pr-6 sm:pl-4 lg:pr-8 lg:pl-4">
        <Link to="/admin-dashboard" className="flex items-center gap-3 text-base font-semibold text-teal-700 sm:text-lg">
          <img src={ptLogo} alt="PT logo" className="h-[2.25rem] w-[2.25rem] rounded-full object-cover sm:h-[2.75rem] sm:w-[2.75rem]" />
          <span>Placement Preparation Tracker Admin</span>
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
