import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createAdminProfile,
  deleteAdminProfile,
  getAdminProfileById,
  getAdminProfiles,
  updateAdminProfile,
} from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'
import Toast from '../Common/Toast'

const initialForm = {
  name: '',
  email: '',
  password: '',
  bio: '',
  university: '',
  graduationYear: '',
  department: '',
  githubProfile: '',
  linkedinProfile: '',
  portfolioLink: '',
  isActive: true,
}

const toPayload = (form, isCreateMode) => {
  const payload = {
    name: form.name,
    email: form.email,
    bio: form.bio,
    university: form.university,
    graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
    department: form.department,
    githubProfile: form.githubProfile || null,
    linkedinProfile: form.linkedinProfile || null,
    portfolioLink: form.portfolioLink || null,
    isActive: form.isActive,
  }

  if (isCreateMode && form.password) {
    payload.password = form.password
  }

  return payload
}

export default function ProfileManagement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const hasOpenedFromQueryRef = useRef(false)
  const [search, setSearch] = useState('')
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [toast, setToast] = useState(null)

  const loadProfiles = async (currentPage, currentSearch) => {
    setLoading(true)
    setError('')
    const response = await getAdminProfiles({
      page: currentPage,
      limit: 10,
      search: currentSearch,
    })
    setProfiles(response?.data?.data || [])
    setTotalPages(response?.data?.pagination?.pages || 1)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        await loadProfiles(page, search)
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
  }, [page, search])

  useEffect(() => {
    const studentId = searchParams.get('studentId')
    if (!studentId || hasOpenedFromQueryRef.current) return

    hasOpenedFromQueryRef.current = true

    const openRequestedProfile = async () => {
      try {
        await openEdit(studentId)
      } finally {
        const next = new URLSearchParams(searchParams)
        next.delete('studentId')
        setSearchParams(next, { replace: true })
      }
    }

    openRequestedProfile()
  }, [searchParams, setSearchParams])

  const closeModal = () => {
    setCreateOpen(false)
    setEditOpen(false)
    setDeleteTarget(null)
    setForm(initialForm)
    setEditingId('')
  }

  const onCreate = async (event) => {
    event.preventDefault()
    try {
      const response = await createAdminProfile(toPayload(form, true))
      const tempPassword = response?.data?.data?.temporaryPassword
      setToast({
        type: 'success',
        message: tempPassword
          ? `Profile created. Temporary password: ${tempPassword}`
          : 'Profile created successfully.',
      })
      closeModal()
      await loadProfiles(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const openEdit = async (userId) => {
    try {
      const response = await getAdminProfileById(userId)
      const profile = response?.data?.data
      setEditingId(userId)
      setForm({
        name: profile?.name || '',
        email: profile?.email || '',
        password: '',
        bio: profile?.bio || '',
        university: profile?.university || '',
        graduationYear: profile?.graduationYear || '',
        department: profile?.department || '',
        githubProfile: profile?.githubProfile || '',
        linkedinProfile: profile?.linkedinProfile || '',
        portfolioLink: profile?.portfolioLink || '',
        isActive: profile?.isActive !== false,
      })
      setEditOpen(true)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onEdit = async (event) => {
    event.preventDefault()
    try {
      await updateAdminProfile(editingId, toPayload(form, false))
      setToast({ type: 'success', message: 'Profile updated successfully.' })
      closeModal()
      await loadProfiles(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onDelete = async () => {
    if (!deleteTarget?._id) return
    try {
      await deleteAdminProfile(deleteTarget._id)
      setToast({ type: 'success', message: 'Profile deleted successfully.' })
      closeModal()
      await loadProfiles(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <h1 className="admin-title">Profile Management</h1>
        <button type="button" onClick={() => setCreateOpen(true)} className="admin-btn admin-btn-primary">Create Profile</button>
      </div>

      <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search by name, email, university, department" className="admin-input mt-4" />
      {loading && <p className="mt-3 text-sm text-slate-500">Loading profiles...</p>}
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="admin-table-wrap mt-4 overflow-x-auto">
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">University</th>
              <th className="py-2">Department</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile._id} className="border-b border-slate-100 transition hover:bg-sky-50/60">
                <td className="py-2">{profile.name}</td>
                <td className="py-2">{profile.email}</td>
                <td className="py-2">{profile.university || '-'}</td>
                <td className="py-2">{profile.department || '-'}</td>
                <td className="py-2">
                  <span className={`admin-badge ${profile.isActive ? 'admin-badge-success' : 'admin-badge-muted'}`}>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => openEdit(profile._id)}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => setDeleteTarget(profile)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">Page {page} of {Math.max(totalPages, 1)}</p>
        <div className="flex gap-2">
          <button type="button" className="admin-btn admin-btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Previous</button>
          <button type="button" className="admin-btn admin-btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      {(createOpen || editOpen) && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h2 className="admin-modal-title">{createOpen ? 'Create Profile' : 'Edit Profile'}</h2>
            <form className="space-y-3" onSubmit={createOpen ? onCreate : onEdit}>
              <input className="admin-input" placeholder="Full name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
              <input className="admin-input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
              {createOpen && (
                <input className="admin-input" placeholder="Temporary password (optional)" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
              )}
              <input className="admin-input" placeholder="University" value={form.university} onChange={(event) => setForm((prev) => ({ ...prev, university: event.target.value }))} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input className="admin-input" placeholder="Department" value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} />
                <input className="admin-input" placeholder="Graduation year" type="number" min="2000" max="2100" value={form.graduationYear} onChange={(event) => setForm((prev) => ({ ...prev, graduationYear: event.target.value }))} />
              </div>
              <input className="admin-input" placeholder="GitHub URL" value={form.githubProfile} onChange={(event) => setForm((prev) => ({ ...prev, githubProfile: event.target.value }))} />
              <input className="admin-input" placeholder="LinkedIn URL" value={form.linkedinProfile} onChange={(event) => setForm((prev) => ({ ...prev, linkedinProfile: event.target.value }))} />
              <input className="admin-input" placeholder="Portfolio URL" value={form.portfolioLink} onChange={(event) => setForm((prev) => ({ ...prev, portfolioLink: event.target.value }))} />
              <textarea className="admin-input min-h-24" placeholder="Bio" maxLength={500} value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} />
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
                Active
              </label>
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">{createOpen ? 'Create' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h2 className="admin-modal-title">Delete Profile</h2>
            <p className="text-sm text-slate-600">Delete profile for {deleteTarget.name} permanently? This also removes linked student data.</p>
            <div className="admin-modal-actions mt-4">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={closeModal}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={onDelete}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </section>
  )
}
