import { useEffect, useState } from 'react'
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserDetail,
  updateUser,
} from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'
import Toast from '../Common/Toast'

const initialForm = {
  name: '',
  email: '',
  password: '',
  university: '',
  department: '',
}

export default function UserManagement() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
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

  const loadUsers = async (currentPage, currentSearch) => {
    setLoading(true)
    setError('')
    const response = await getAllUsers({
      page: currentPage,
      limit: 10,
      search: currentSearch,
      sortBy: 'created',
      order: 'desc',
    })
    setUsers(response?.data?.data || [])
    setTotalPages(response?.data?.pagination?.pages || 1)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        await loadUsers(page, search)
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
      await createUser(form)
      setToast({ type: 'success', message: 'User created successfully.' })
      closeModal()
      await loadUsers(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const openEdit = async (userId) => {
    try {
      const response = await getUserDetail(userId)
      const user = response?.data?.data
      setEditingId(userId)
      setForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        university: user?.university || '',
        department: user?.department || '',
      })
      setEditOpen(true)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onEdit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        name: form.name,
        email: form.email,
        university: form.university,
        department: form.department,
      }
      await updateUser(editingId, payload)
      setToast({ type: 'success', message: 'User updated successfully.' })
      closeModal()
      await loadUsers(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onDelete = async () => {
    if (!deleteTarget?._id) return
    try {
      await deleteUser(deleteTarget._id, { confirmDelete: true })
      setToast({ type: 'success', message: 'User deleted successfully.' })
      closeModal()
      await loadUsers(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <h1 className="admin-title">User Management</h1>
        <button type="button" onClick={() => setCreateOpen(true)} className="admin-btn admin-btn-primary">Create User</button>
      </div>

      <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search by name or email" className="admin-input mt-4" />
      {loading && <p className="mt-3 text-sm text-slate-500">Loading users...</p>}
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="admin-table-wrap mt-4 overflow-x-auto">
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Status</th>
              <th className="py-2">Role</th>
              <th className="py-2">Created</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id || user.email} className="border-b border-slate-100 transition hover:bg-sky-50/60">
                <td className="py-2">{user.name}</td>
                <td className="py-2">{user.email}</td>
                <td className="py-2"><span className={`admin-badge ${user.isActive ? 'admin-badge-success' : 'admin-badge-muted'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="py-2">{user.role}</td>
                <td className="py-2">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                <td className="py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => openEdit(user._id)}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => setDeleteTarget(user)}>Delete</button>
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
            <h2 className="admin-modal-title">{createOpen ? 'Create User' : 'Edit User'}</h2>
            <form className="space-y-3" onSubmit={createOpen ? onCreate : onEdit}>
              <input className="admin-input" placeholder="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
              <input className="admin-input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
              {createOpen && (
                <input className="admin-input" placeholder="Temporary password (optional)" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
              )}
              <input className="admin-input" placeholder="University" value={form.university} onChange={(event) => setForm((prev) => ({ ...prev, university: event.target.value }))} />
              <input className="admin-input" placeholder="Department" value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} />
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
            <h2 className="admin-modal-title">Delete User</h2>
            <p className="text-sm text-slate-600">Delete {deleteTarget.name} permanently? This also removes associated progress, interviews, notes, and resumes.</p>
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
