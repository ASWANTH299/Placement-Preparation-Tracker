import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
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
  { label: 'Mock Interviews', to: '/mock-interviews' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef(null)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return false
  })

  const filteredPages = searchValue.trim()
    ? navItems.filter((item) =>
        item.label.toLowerCase().includes(searchValue.trim().toLowerCase()),
      )
    : []

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value)
    setSearchParams(e.target.value ? { q: e.target.value } : {})
    setDropdownOpen(true)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!dropdownOpen || filteredPages.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, filteredPages.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(filteredPages[activeIndex])
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
      setActiveIndex(-1)
    }
  }

  const handleSelect = (item) => {
    setSearchValue('')
    setDropdownOpen(false)
    setActiveIndex(-1)
    navigate(item.to)
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

        <div className="relative shrink-0" ref={searchRef}>
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            aria-label="Search pages"
            aria-autocomplete="list"
            aria-expanded={dropdownOpen && filteredPages.length > 0}
            placeholder="Search pages..."
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => searchValue.trim() && setDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            className={`h-9 w-36 rounded-lg border pl-9 pr-3 text-sm outline-none ring-blue-500 transition focus:w-48 focus:ring-2 sm:w-44 sm:focus:w-56 ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500'
                : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400'
            }`}
          />

          {dropdownOpen && filteredPages.length > 0 && (
            <ul
              role="listbox"
              className={`absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border shadow-lg ${
                isDark
                  ? 'border-slate-700 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {filteredPages.map((item, idx) => (
                <li key={item.to} role="option" aria-selected={idx === activeIndex}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition ${
                      idx === activeIndex
                        ? isDark
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-50 text-blue-700'
                        : isDark
                          ? 'text-slate-200 hover:bg-slate-800'
                          : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {dropdownOpen && searchValue.trim() && filteredPages.length === 0 && (
            <div className={`absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              isDark ? 'border-slate-700 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
            }`}>
              No pages found
            </div>
          )}
        </div>

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