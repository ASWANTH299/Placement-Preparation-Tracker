import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getStudentProfile, updateStudentProfile } from '../../services/studentService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function ProfilePage() {
  const studentId = useSelector((state) => state.auth.user?.id)
  const [form, setForm] = useState({ fullName: '', university: '', bio: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!studentId) return
      try {
        const response = await getStudentProfile(studentId)
        const profile = response?.data?.data
        if (active) {
          setForm({
            fullName: profile?.name || '',
            university: profile?.university || '',
            bio: profile?.bio || '',
          })
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }
    load()
    return () => {
      active = false
    }
  }, [studentId])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSave = async () => {
    if (!studentId) return
    try {
      setError('')
      setMessage('')
      await updateStudentProfile(studentId, {
        name: form.fullName,
        university: form.university,
        bio: form.bio,
      })
      setMessage('Profile saved successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input name="fullName" value={form.fullName} onChange={onChange} className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input name="university" value={form.university} onChange={onChange} className="rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <textarea name="bio" value={form.bio} onChange={onChange} maxLength={500} placeholder="Bio" className="mt-3 h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      <button type="button" onClick={onSave} className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">Save Profile</button>
    </section>
  )
}
