import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { getCodingProfiles, linkCodingProfile, refreshCodingProfile, unlinkCodingProfile } from '../../services/codingProfileService'
import { getErrorMessage } from '../../utils/errorHandler'

const platforms = ['LeetCode', 'CodeChef', 'HackerRank', 'Codeforces']

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

  const link = async (platform, username) => {
    if (!username || !studentId) return
    try {
      setError('')
      await linkCodingProfile(studentId, { platform, username })
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
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Coding Platform Profiles</h1>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {platforms.map((platform) => {
          const profile = profileMap[platform]
          return (
            <article key={platform} className="rounded border border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-900">{platform}</h2>
              {profile ? (
                <>
                  <p className="mt-1 text-sm text-slate-600">Username: {profile.username}</p>
                  <p className="text-sm text-slate-600">Solved: {profile.problemsSolved ?? 0} • Rating: {profile.currentRating ?? '-'}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => refresh(profile._id)} className="rounded border border-slate-300 px-3 py-1 text-sm">Refresh</button>
                    <button type="button" onClick={() => unlink(profile._id)} className="rounded border border-slate-300 px-3 py-1 text-sm">Unlink</button>
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
  const [username, setUsername] = useState('')
  return (
    <div className="mt-2">
      <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      <button type="button" onClick={() => onLink(platform, username)} className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white">Link Profile</button>
    </div>
  )
}
