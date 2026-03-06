import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { getCodingProfiles, linkCodingProfile, refreshCodingProfile, unlinkCodingProfile } from '../../services/codingProfileService'
import { getErrorMessage } from '../../utils/errorHandler'

const platforms = ['LeetCode', 'CodeChef', 'HackerRank', 'Codeforces']

const platformUrlBuilders = {
  LeetCode: (username) => `https://leetcode.com/${username}`,
  CodeChef: (username) => `https://codechef.com/users/${username}`,
  HackerRank: (username) => `https://hackerrank.com/${username}`,
  Codeforces: (username) => `https://codeforces.com/profile/${username}`
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

export default function CodingProfilesPage() {
  const studentId = useSelector((state) => state.auth.user?.id)
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState('')

  const profileMap = useMemo(() => {
    return profiles.reduce((map, profile) => {
      map[profile.platform] = profile
      return map
    }, {})
  }, [profiles])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!studentId) return
      try {
        const response = await getCodingProfiles(studentId)
        if (active) setProfiles(response?.data?.data || [])
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }

    load()
    return () => {
      active = false
    }
  }, [studentId])

  const link = async (platform, inputValue) => {
    if (!inputValue || !studentId) return
    try {
      setError('')
      await linkCodingProfile(studentId, { platform, profileUrl: inputValue, username: inputValue })
      const refreshed = await getCodingProfiles(studentId)
      setProfiles(refreshed?.data?.data || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const unlink = async (profileId) => {
    try {
      setError('')
      await unlinkCodingProfile(studentId, profileId)
      setProfiles((prev) => prev.filter((profile) => profile._id !== profileId))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const refresh = async (profileId) => {
    try {
      setError('')
      await refreshCodingProfile(studentId, profileId)
      const refreshed = await getCodingProfiles(studentId)
      setProfiles(refreshed?.data?.data || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Coding Platform Profiles</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Add username or profile URL. Platform name opens profile in a new tab.</p>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {platforms.map((platform) => {
          const profile = profileMap[platform]
          const resolvedUrl = profile ? getCanonicalProfileUrl(profile) : ''
          return (
            <article key={platform} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              {profile && resolvedUrl ? (
                <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-blue-700 hover:underline dark:text-blue-300">
                  {platform}
                </a>
              ) : (
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{platform}</h2>
              )}

              {profile ? (
                <>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Username: {profile.username}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Solved: {profile.problemsSolved ?? 0} • Rating: {profile.currentRating ?? '-'}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={!resolvedUrl}
                      onClick={() => {
                        if (!resolvedUrl) return
                        window.open(resolvedUrl, '_blank', 'noopener,noreferrer')
                      }}
                      className="rounded border border-slate-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-100"
                    >
                      Open
                    </button>
                    <button type="button" onClick={() => refresh(profile._id)} className="rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-600 dark:text-slate-100">Refresh</button>
                    <button type="button" onClick={() => unlink(profile._id)} className="rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-600 dark:text-slate-100">Unlink</button>
                  </div>
                </>
              ) : (
                <ProfileLinkForm platform={platform} onLink={link} />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ProfileLinkForm({ platform, onLink }) {
  const [value, setValue] = useState('')

  return (
    <div className="mt-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter username or profile URL"
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
      <button type="button" onClick={() => onLink(platform, value)} className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white">Link Profile</button>
    </div>
  )
}
