import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { getCodingProfiles, linkCodingProfile, refreshCodingProfile, unlinkCodingProfile } from '../../services/codingProfileService'
import { getAllUsers } from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'

const platforms = ['LeetCode', 'CodeChef', 'HackerRank', 'Codeforces']
const ALL_ACCOUNTS_OPTION = '__all_accounts__'

const platformUrlBuilders = {
  LeetCode: (username) => `https://leetcode.com/${username}`,
  CodeChef: (username) => `https://codechef.com/users/${username}`,
  HackerRank: (username) => `https://hackerrank.com/${username}`,
  Codeforces: (username) => `https://codeforces.com/profile/${username}`
}

const platformMeta = {
  LeetCode: {
    icon: 'LC',
    hue: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    placeholder: 'e.g. leetcode.com/john_doe'
  },
  CodeChef: {
    icon: 'CC',
    hue: 'from-rose-500 to-red-600',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
    placeholder: 'e.g. codechef.com/users/john_doe'
  },
  HackerRank: {
    icon: 'HR',
    hue: 'from-emerald-500 to-green-600',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    placeholder: 'e.g. hackerrank.com/john_doe'
  },
  Codeforces: {
    icon: 'CF',
    hue: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    placeholder: 'e.g. codeforces.com/profile/john_doe'
  }
}

const extractUsername = (raw = '') => {
  const value = String(raw || '').trim()
  if (!value) return ''
  const parts = value.split('/').filter(Boolean)
  return (parts[parts.length - 1] || '').replace(/\?.*$/, '').replace(/#.*$/, '').trim()
}

const getCanonicalProfileUrl = (profile) => {
  const username = extractUsername(profile?.username || profile?.profileUrl)
  if (!username) return ''
  const builder = platformUrlBuilders[profile?.platform]
  return builder ? builder(username) : ''
}

const formatRelativeTime = (value) => {
  if (!value) return 'Not synced yet'
  const timestamp = new Date(value).getTime()
  if (!timestamp) return 'Not synced yet'

  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function CodingProfilesPage() {
  const studentId = useSelector((state) => state.auth.user?.id)
  const role = useSelector((state) => state.auth.role)
  const isAdmin = role === 'admin'
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [formValues, setFormValues] = useState({})
  const [actionState, setActionState] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('platform')
  const [showLinkedOnly, setShowLinkedOnly] = useState(false)
  const [managedStudents, setManagedStudents] = useState([])
  const [managedStudentId, setManagedStudentId] = useState('')

  const targetStudentId = isAdmin && managedStudentId ? managedStudentId : studentId

  const refreshProfiles = async () => {
    if (!targetStudentId) return
    const response = await getCodingProfiles(targetStudentId)
    setProfiles(response?.data?.data || [])
  }

  useEffect(() => {
    let active = true

    const loadManagedStudents = async () => {
      if (!isAdmin) return
      try {
        const response = await getAllUsers()
        if (active) {
          setManagedStudents(response?.data?.data || [])
          if (!managedStudentId) {
            setManagedStudentId((response?.data?.data || [])[0]?._id || '')
          }
        }
      } catch (requestError) {
        console.error('Failed to load students:', requestError)
      }
    }

    if (isAdmin) loadManagedStudents()

    return () => {
      active = false
    }
  }, [isAdmin])

  const profileMap = useMemo(() => {
    return profiles.reduce((map, profile) => {
      map[profile.platform] = profile
      return map
    }, {})
  }, [profiles])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!targetStudentId) return
      try {
        setLoading(true)
        const response = await getCodingProfiles(targetStudentId)
        if (active) {
          setProfiles(response?.data?.data || [])
          setError('')
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [targetStudentId])

  const setBusy = (key, value) => {
    setActionState((prev) => ({ ...prev, [key]: value }))
  }

  const link = async (platform, inputValue) => {
    if (!inputValue) return

    try {
      setError('')
      setBusy(`link:${platform}`, true)

      if (managedStudentId === ALL_ACCOUNTS_OPTION) {
        // Link for all students
        await Promise.all(
          managedStudents.map((student) =>
            linkCodingProfile(student._id, { platform, profileUrl: inputValue, username: inputValue }).catch((err) => {
              console.error(`Failed to link for ${student._id}:`, err)
            })
          )
        )
      } else {
        // Link for single student
        await linkCodingProfile(targetStudentId, { platform, profileUrl: inputValue, username: inputValue })
      }

      setFormValues((prev) => ({ ...prev, [platform]: '' }))
      await refreshProfiles()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(`link:${platform}`, false)
    }
  }

  const unlink = async (profileId, platform) => {
    try {
      setError('')
      setBusy(`unlink:${profileId}`, true)
      await unlinkCodingProfile(targetStudentId, profileId)
      setProfiles((prev) => prev.filter((profile) => profile._id !== profileId))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(`unlink:${profileId}`, false)
      setFormValues((prev) => ({ ...prev, [platform]: '' }))
    }
  }

  const refresh = async (profileId) => {
    try {
      setError('')
      setBusy(`refresh:${profileId}`, true)
      await refreshCodingProfile(targetStudentId, profileId)
      await refreshProfiles()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(`refresh:${profileId}`, false)
    }
  }

  const refreshAll = async () => {
    if (!profiles.length) return
    try {
      setError('')
      setBusy('refresh-all', true)
      await Promise.all(profiles.map((profile) => refreshCodingProfile(targetStudentId, profile._id)))
      await refreshProfiles()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy('refresh-all', false)
    }
  }

  const stats = useMemo(() => {
    const linked = profiles.length
    const total = platforms.length
    const completion = total ? Math.round((linked / total) * 100) : 0
    const solved = profiles.reduce((sum, profile) => sum + (Number(profile.problemsSolved) || 0), 0)
    const ratings = profiles.map((profile) => Number(profile.currentRating)).filter((value) => Number.isFinite(value) && value > 0)
    const averageRating = ratings.length ? Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length) : 0
    const syncedRecently = profiles.filter((profile) => {
      const syncedAt = new Date(profile.lastSyncedAt || 0).getTime()
      return syncedAt && Date.now() - syncedAt < 24 * 60 * 60 * 1000
    }).length

    return { linked, total, completion, solved, averageRating, syncedRecently }
  }, [profiles])

  const visiblePlatforms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    const items = platforms
      .map((platform) => {
        const profile = profileMap[platform]
        const username = (profile?.username || '').toLowerCase()
        const matchesSearch = !term || platform.toLowerCase().includes(term) || username.includes(term)
        const matchesLinked = !showLinkedOnly || Boolean(profile)
        return { platform, profile, matchesSearch, matchesLinked }
      })
      .filter((item) => item.matchesSearch && item.matchesLinked)

    const sorted = [...items]
    sorted.sort((a, b) => {
      if (sortBy === 'linked') {
        const linkedDiff = Number(Boolean(b.profile)) - Number(Boolean(a.profile))
        if (linkedDiff !== 0) return linkedDiff
      }
      if (sortBy === 'rating') {
        const ratingA = Number(a.profile?.currentRating) || -1
        const ratingB = Number(b.profile?.currentRating) || -1
        if (ratingB !== ratingA) return ratingB - ratingA
      }
      if (sortBy === 'solved') {
        const solvedA = Number(a.profile?.problemsSolved) || -1
        const solvedB = Number(b.profile?.problemsSolved) || -1
        if (solvedB !== solvedA) return solvedB - solvedA
      }
      return a.platform.localeCompare(b.platform)
    })

    return sorted
  }, [platforms, profileMap, searchTerm, showLinkedOnly, sortBy])

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      setError('Unable to copy right now. Please copy manually.')
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-100 via-cyan-100 to-teal-100 p-5 dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-emerald-300/20 blur-2xl" />

        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Coding Platform Profiles</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Link your handles, track sync health, and keep every profile interview-ready.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Linked" value={`${stats.linked}/${stats.total}`} />
            <StatCard label="Completion" value={`${stats.completion}%`} />
            <StatCard label="Problems Solved" value={String(stats.solved)} />
            <StatCard label="Avg Rating" value={stats.averageRating ? String(stats.averageRating) : '-'} />
            <StatCard label="Synced (24h)" value={String(stats.syncedRecently)} />
          </div>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isAdmin && (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
          <h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-100">Admin: Manage Profiles</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-blue-900 dark:text-blue-100">Select Student</label>
              <select
                value={managedStudentId}
                onChange={(event) => setManagedStudentId(event.target.value)}
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-blue-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">-- Choose Student --</option>
                {managedStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name || student.email}
                  </option>
                ))}
                <option value={ALL_ACCOUNTS_OPTION}>All Accounts (all student logins)</option>
              </select>
            </div>
            {managedStudentId === ALL_ACCOUNTS_OPTION && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 p-3 dark:border-amber-700 dark:bg-amber-900/20">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  ✓ Profiles will be linked for all {managedStudents.length} student accounts
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Find by platform or username"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="platform">Platform</option>
            <option value="linked">Linked first</option>
            <option value="solved">Solved (high to low)</option>
            <option value="rating">Rating (high to low)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
          <input
            type="checkbox"
            checked={showLinkedOnly}
            onChange={(event) => setShowLinkedOnly(event.target.checked)}
            className="h-4 w-4"
          />
          Linked only
        </label>

        <button
          type="button"
          onClick={refreshAll}
          disabled={actionState['refresh-all'] || !profiles.length}
          className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-teal-700 dark:bg-teal-900/20 dark:text-teal-300"
        >
          {actionState['refresh-all'] ? 'Refreshing all...' : 'Refresh all'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {loading ? (
          platforms.map((platform) => (
            <article key={platform} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-3 h-4 w-56 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            </article>
          ))
        ) : (
          visiblePlatforms.map(({ platform, profile }) => {
            const resolvedUrl = profile ? getCanonicalProfileUrl(profile) : ''
            const meta = platformMeta[platform]
            const isRefreshing = Boolean(actionState[`refresh:${profile?._id}`])
            const isUnlinking = Boolean(actionState[`unlink:${profile?._id}`])
            const isLinking = Boolean(actionState[`link:${platform}`])

          return (
            <article key={platform} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.hue} text-xs font-black text-white shadow-md`}>
                    {meta.icon}
                  </div>
                  <div>
                    {profile && resolvedUrl ? (
                      <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="text-base font-bold text-slate-900 hover:underline dark:text-slate-100">
                        {platform}
                      </a>
                    ) : (
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{platform}</h2>
                    )}
                    <p className="text-xs text-slate-500">{profile ? `Last sync ${formatRelativeTime(profile.lastSyncedAt)}` : 'Not linked yet'}</p>
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                  {profile ? 'Linked' : 'Pending'}
                </span>
              </div>

              {profile ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MetricPill label="Username" value={profile.username || '-'} />
                    <MetricPill label="Solved" value={profile.problemsSolved != null ? String(profile.problemsSolved) : '-'} />
                    <MetricPill label="Rating" value={profile.currentRating != null ? String(profile.currentRating) : '-'} />
                    <MetricPill label="Status" value={profile.syncStatus || 'Success'} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!resolvedUrl}
                      onClick={() => {
                        if (!resolvedUrl) return
                        window.open(resolvedUrl, '_blank', 'noopener,noreferrer')
                      }}
                      className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-100"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(profile.username || '')}
                      className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      Copy username
                    </button>
                    <button
                      type="button"
                      disabled={isRefreshing}
                      onClick={() => refresh(profile._id)}
                      className="rounded border border-cyan-300 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-60 dark:border-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300"
                    >
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                      type="button"
                      disabled={isUnlinking}
                      onClick={() => unlink(profile._id, platform)}
                      className="rounded border border-rose-300 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                    >
                      {isUnlinking ? 'Unlinking...' : 'Unlink'}
                    </button>
                  </div>
                </>
              ) : (
                <ProfileLinkForm
                  platform={platform}
                  value={formValues[platform] || ''}
                  loading={isLinking}
                  placeholder={meta.placeholder}
                  onChange={(value) => setFormValues((prev) => ({ ...prev, [platform]: value }))}
                  onLink={link}
                />
              )}
            </article>
          )
          })
        )}
      </div>

      {!loading && visiblePlatforms.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
          No platforms match your current search or filter.
        </div>
      )}
    </section>
  )
}

function ProfileLinkForm({ platform, value, loading, placeholder, onChange, onLink }) {
  const canSubmit = Boolean(value.trim()) && !loading

  return (
    <div className="mt-3">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || 'Enter username or profile URL'}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-sky-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">You can paste full URL or only username.</p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onLink(platform, value)}
          className="rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:from-sky-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Linking...' : 'Link profile'}
        </button>
      </div>
    </div>
  )
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
