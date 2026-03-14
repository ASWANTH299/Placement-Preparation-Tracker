import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import ptLogo from '../../assets/pt-logo.svg'

const directNavItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Daily Task', to: '/daily-task' },
]

const megaSections = [
  {
    title: 'PREPARE',
    items: [
      { label: 'Learning Path', to: '/learning-path', desc: 'Structured study roadmap' },
      { label: 'Concept Learning', to: '/concept-learning', desc: 'Deep-dive concept notes' },
      { label: 'Mock Interviews', to: '/mock-interviews', desc: 'AI-powered practice sessions' },
    ],
  },
  {
    title: 'PRACTICE',
    items: [
      { label: 'Questions & Practice', to: '/company-questions', desc: 'Company-specific Q&A bank' },
      { label: 'Coding Profiles', to: '/coding-profiles', desc: 'Track LeetCode, CF & more' },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { label: 'Resume', to: '/resume-tracker', desc: 'Build & track your résumé' },
      { label: 'Notes', to: '/notes', desc: 'Personal study notes' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Profile', to: '/profile', desc: 'Edit profile & settings' },
    ],
  },
]

const allNavItems = [
  ...directNavItems,
  ...megaSections.flatMap((s) => s.items),
]

export default function Navbar() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef(null)
  const profileRef = useRef(null)
  const megaTriggerRef = useRef(null)
  const megaPanelRef = useRef(null)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return false
  })

  const filteredPages = searchValue.trim()
    ? allNavItems.filter((item) =>
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
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
      const inTrigger = megaTriggerRef.current?.contains(e.target)
      const inPanel = megaPanelRef.current?.contains(e.target)
      if (!inTrigger && !inPanel) {
        setMegaOpen(false)
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

  const displayName = (user?.name || 'User').toUpperCase()
  const displayEmail = user?.email || 'No email'
  const initials = (user?.name || user?.email || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'

  const handleThemeToggle = () => {
    setIsDark((prev) => !prev)
    setProfileOpen(false)
  }

  const handleProfileOpen = () => {
    setProfileOpen((prev) => !prev)
  }

  const handleProfileNavigate = () => {
    setProfileOpen(false)
    navigate('/profile')
  }

  const handleLogoutClick = () => {
    setProfileOpen(false)
    handleLogout()
  }

  const handleMegaNavigate = (to) => {
    setMegaOpen(false)
    navigate(to)
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
      <div className="flex w-full items-center gap-2 py-3 pr-4 pl-3 sm:gap-3 sm:pr-6 sm:pl-4 lg:pr-8 lg:pl-4">
        <Link to="/dashboard" className={`mr-20 shrink-0 flex items-center gap-2.5 text-sm font-semibold tracking-tight sm:mr-28 sm:text-base ${isDark ? 'text-blue-300' : 'text-slate-900'}`}>
          <img src={ptLogo} alt="PT logo" className="h-[2.25rem] w-[2.25rem] rounded-full object-cover sm:h-[2.75rem] sm:w-[2.75rem]" />
          <span>Placement Tracker</span>
        </Link>

        <nav aria-label="Student navigation" className="no-scrollbar min-w-0 flex flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap sm:gap-2">
          {directNavItems.map((item) => (
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

          {/* Mega menu trigger */}
          <button
            ref={megaTriggerRef}
            type="button"
            onClick={() => setMegaOpen((prev) => !prev)}
            className={`nav-link-base flex items-center gap-1.5 ${
              megaOpen
                ? isDark
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'bg-blue-50 text-blue-700'
                : 'nav-link-idle'
            }`}
          >
            All Features
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>
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
            className={`h-9 w-40 rounded-lg border pl-9 pr-3 text-sm outline-none ring-blue-500 transition focus:w-52 focus:ring-2 sm:w-48 sm:focus:w-64 ${
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

        <div className="relative shrink-0" ref={profileRef}>
          <button
            type="button"
            onClick={handleProfileOpen}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-md ring-2 ring-white/30 transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {initials}
          </button>

          {profileOpen && (
            <div className={`absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border shadow-2xl ${
              isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
            }`}>
              <div className={`border-b px-4 py-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <p className={`text-[1.05rem] font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{displayName}</p>
                <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{displayEmail}</p>
              </div>

              <button
                type="button"
                onClick={handleProfileNavigate}
                className={`block w-full px-4 py-3 text-left text-[1.05rem] font-medium transition ${
                  isDark ? 'text-slate-100 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                Profile
              </button>

              <button
                type="button"
                onClick={handleThemeToggle}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-[1.05rem] font-medium transition ${
                  isDark ? 'text-slate-100 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>Theme</span>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isDark ? 'Dark' : 'Light'}</span>
              </button>

              <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className={`block w-full px-4 py-3 text-left text-[1.05rem] font-semibold transition ${
                    isDark ? 'text-red-300 hover:bg-slate-800' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mega dropdown panel — full-width, slides below header ── */}
      {megaOpen && (
        <div
          ref={megaPanelRef}
          className={`absolute left-0 right-0 top-full z-50 border-b shadow-2xl ${
            isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {megaSections.map((section) => (
                <div key={section.title}>
                  <p className={`mb-4 text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {section.title}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.to}>
                        <button
                          type="button"
                          onClick={() => handleMegaNavigate(item.to)}
                          className={`group flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition hover:scale-[1.01] ${
                            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className={`block text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            {item.label}
                          </span>
                          <span className={`mt-0.5 block text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {item.desc}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}