import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { changeStudentPassword, getStudentProfile, updateStudentProfile } from '../../services/studentService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function SettingsPage() {
  const studentId = useSelector((state) => state.auth.user?.id)
  const [settings, setSettings] = useState({ emailNotifs: true, weeklyDigest: true, publicProfile: false })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!studentId) return
      try {
        const response = await getStudentProfile(studentId)
        const profile = response?.data?.data
        setSettings((prev) => ({ ...prev, publicProfile: Boolean(profile?.portfolioLink) }))
      } catch {
        setSettings((prev) => ({ ...prev, publicProfile: false }))
      }
    }
    load()
  }, [studentId])

  const toggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }))

  const savePreferences = async () => {
    if (!studentId) return
    try {
      setError('')
      setMessage('')
      await updateStudentProfile(studentId, {
        portfolioLink: settings.publicProfile ? 'https://public-profile-enabled.local' : '',
      })
      setMessage('Settings updated successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const onPasswordChange = (event) => {
    const { name, value } = event.target
    setPasswords((prev) => ({ ...prev, [name]: value }))
  }

  const updatePassword = async () => {
    if (!studentId) return
    try {
      setError('')
      setMessage('')
      await changeStudentPassword(studentId, passwords)
      setMessage('Password updated successfully.')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800">Notifications</h2>
        <label className="mt-3 flex items-center justify-between text-sm text-slate-700">
          <span>Email notifications</span>
          <input type="checkbox" checked={settings.emailNotifs} onChange={() => toggle('emailNotifs')} />
        </label>
        <label className="mt-2 flex items-center justify-between text-sm text-slate-700">
          <span>Weekly progress digest</span>
          <input type="checkbox" checked={settings.weeklyDigest} onChange={() => toggle('weeklyDigest')} />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800">Privacy</h2>
        <label className="mt-3 flex items-center justify-between text-sm text-slate-700">
          <span>Public profile visibility</span>
          <input type="checkbox" checked={settings.publicProfile} onChange={() => toggle('publicProfile')} />
        </label>
        <button type="button" onClick={savePreferences} className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Save Preferences</button>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800">Change Password</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <input name="currentPassword" type="password" value={passwords.currentPassword} onChange={onPasswordChange} placeholder="Current password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="newPassword" type="password" value={passwords.newPassword} onChange={onPasswordChange} placeholder="New password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="confirmPassword" type="password" value={passwords.confirmPassword} onChange={onPasswordChange} placeholder="Confirm new password" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={updatePassword} className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Update Password</button>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="font-semibold text-red-700">Account</h2>
        <p className="mt-1 text-xs text-red-600">Delete account will permanently remove your progress data.</p>
        <button className="mt-3 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white">Delete Account</button>
      </div>
    </section>
  )
}
