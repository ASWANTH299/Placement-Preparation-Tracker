import { useEffect, useState } from 'react'
import {
  createAdminDailyTask,
  deleteAdminDailyTask,
  getAdminDailyTaskById,
  getAdminDailyTasks,
  updateAdminDailyTask,
} from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'
import Toast from '../Common/Toast'

const initialForm = {
  title: '',
  platform: 'LeetCode',
  difficulty: 'Easy',
  company: '',
  estimatedTime: '',
  prompt: '',
  practiceUrl: '',
  tagsInput: '',
  isActive: true,
}

const toPayload = (form) => ({
  title: form.title,
  platform: form.platform,
  difficulty: form.difficulty,
  company: form.company,
  estimatedTime: form.estimatedTime,
  prompt: form.prompt,
  practiceUrl: form.practiceUrl,
  tags: String(form.tagsInput || '').split(',').map((row) => row.trim()).filter(Boolean),
  isActive: form.isActive,
})

const normalizeTaskListResponse = (response) => {
  const envelope = response?.data || {}
  const payload = envelope?.data

  const list =
    (Array.isArray(payload) && payload) ||
    (Array.isArray(payload?.rows) && payload.rows) ||
    (Array.isArray(payload?.tasks) && payload.tasks) ||
    (Array.isArray(envelope?.rows) && envelope.rows) ||
    (Array.isArray(envelope?.tasks) && envelope.tasks) ||
    []

  const pages =
    envelope?.pagination?.pages ||
    payload?.pagination?.pages ||
    envelope?.meta?.pages ||
    1

  return {
    list,
    pages: Number.isFinite(Number(pages)) ? Math.max(Number(pages), 1) : 1,
  }
}

export default function DailyTaskManagement() {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
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

  const loadRows = async (currentPage, currentSearch) => {
    setLoading(true)
    setError('')
    const response = await getAdminDailyTasks({
      page: currentPage,
      limit: 10,
      search: currentSearch,
    })
    const normalized = normalizeTaskListResponse(response)
    setRows(normalized.list)
    setTotalPages(normalized.pages)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        await loadRows(page, search)
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
      await createAdminDailyTask(toPayload(form))
      setToast({ type: 'success', message: 'Daily task created successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const openEdit = async (taskId) => {
    try {
      const response = await getAdminDailyTaskById(taskId)
      const task = response?.data?.data
      setEditingId(taskId)
      setForm({
        title: task?.title || '',
        platform: task?.platform || 'LeetCode',
        difficulty: task?.difficulty || 'Easy',
        company: task?.company || '',
        estimatedTime: task?.estimatedTime || '',
        prompt: task?.prompt || '',
        practiceUrl: task?.practiceUrl || '',
        tagsInput: Array.isArray(task?.tags) ? task.tags.join(', ') : '',
        isActive: task?.isActive !== false,
      })
      setEditOpen(true)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onEdit = async (event) => {
    event.preventDefault()
    try {
      await updateAdminDailyTask(editingId, toPayload(form))
      setToast({ type: 'success', message: 'Daily task updated successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onDelete = async () => {
    if (!deleteTarget?._id) return
    try {
      await deleteAdminDailyTask(deleteTarget._id)
      setToast({ type: 'success', message: 'Daily task deleted successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <h1 className="admin-title">Daily Task Management</h1>
        <button type="button" onClick={() => setCreateOpen(true)} className="admin-btn admin-btn-primary">Create Daily Task</button>
      </div>

      <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search by title, company, or tags" className="admin-input mt-4" />
      {loading && <p className="mt-3 text-sm text-slate-500">Loading daily tasks...</p>}
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="admin-table-wrap mt-4 overflow-x-auto">
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Title</th>
              <th className="py-2">Platform</th>
              <th className="py-2">Difficulty</th>
              <th className="py-2">Company</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <tr key={task._id} className="border-b border-slate-100 transition hover:bg-sky-50/60">
                <td className="py-2">{task.title}</td>
                <td className="py-2">{task.platform}</td>
                <td className="py-2">{task.difficulty}</td>
                <td className="py-2">{task.company || '-'}</td>
                <td className="py-2">
                  <span className={`admin-badge ${task.isActive ? 'admin-badge-success' : 'admin-badge-muted'}`}>
                    {task.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => openEdit(task._id)}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => setDeleteTarget(task)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  No daily tasks found. Click "Create Daily Task" to add your first task.
                </td>
              </tr>
            )}
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
            <h2 className="admin-modal-title">{createOpen ? 'Create Daily Task' : 'Edit Daily Task'}</h2>
            <form className="space-y-3" onSubmit={createOpen ? onCreate : onEdit}>
              <input className="admin-input" placeholder="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select className="admin-input" value={form.platform} onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value }))}>
                  <option value="LeetCode">LeetCode</option>
                  <option value="CodeChef">CodeChef</option>
                  <option value="HackerRank">HackerRank</option>
                  <option value="GeeksforGeeks">GeeksforGeeks</option>
                  <option value="Other">Other</option>
                </select>
                <select className="admin-input" value={form.difficulty} onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <input className="admin-input" placeholder="Company" value={form.company} onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))} />
              <input className="admin-input" placeholder="Estimated time (e.g. 30 min)" value={form.estimatedTime} onChange={(event) => setForm((prev) => ({ ...prev, estimatedTime: event.target.value }))} />
              <input className="admin-input" placeholder="Practice URL" type="url" value={form.practiceUrl} onChange={(event) => setForm((prev) => ({ ...prev, practiceUrl: event.target.value }))} required />
              <input className="admin-input" placeholder="Tags (comma separated)" value={form.tagsInput} onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))} />
              <textarea className="admin-input min-h-24" placeholder="Prompt" value={form.prompt} onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))} required />
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
            <h2 className="admin-modal-title">Delete Daily Task</h2>
            <p className="text-sm text-slate-600">Delete task &quot;{deleteTarget.title}&quot; permanently?</p>
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
