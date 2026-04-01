import { useEffect, useState } from 'react'
import {
  createAdminConceptVideo,
  deleteAdminConceptVideo,
  getAdminConceptVideoById,
  getAdminConceptVideos,
  updateAdminConceptVideo,
} from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'
import Toast from '../Common/Toast'

const initialForm = {
  title: '',
  topic: '',
  youtubeUrl: '',
  level: 'Beginner',
  description: '',
  tagsInput: '',
  isActive: true,
}

const toPayload = (form) => ({
  title: form.title,
  topic: form.topic,
  youtubeUrl: form.youtubeUrl,
  level: form.level,
  description: form.description,
  tags: String(form.tagsInput || '').split(',').map((row) => row.trim()).filter(Boolean),
  isActive: form.isActive,
})

export default function ConceptVideoManagement() {
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
    const response = await getAdminConceptVideos({
      page: currentPage,
      limit: 10,
      search: currentSearch,
    })
    setRows(response?.data?.data || [])
    setTotalPages(response?.data?.pagination?.pages || 1)
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
      await createAdminConceptVideo(toPayload(form))
      setToast({ type: 'success', message: 'Concept video created successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const openEdit = async (videoId) => {
    try {
      const response = await getAdminConceptVideoById(videoId)
      const video = response?.data?.data
      setEditingId(videoId)
      setForm({
        title: video?.title || '',
        topic: video?.topic || '',
        youtubeUrl: video?.youtubeUrl || '',
        level: video?.level || 'Beginner',
        description: video?.description || '',
        tagsInput: Array.isArray(video?.tags) ? video.tags.join(', ') : '',
        isActive: video?.isActive !== false,
      })
      setEditOpen(true)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onEdit = async (event) => {
    event.preventDefault()
    try {
      await updateAdminConceptVideo(editingId, toPayload(form))
      setToast({ type: 'success', message: 'Concept video updated successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onDelete = async () => {
    if (!deleteTarget?._id) return
    try {
      await deleteAdminConceptVideo(deleteTarget._id)
      setToast({ type: 'success', message: 'Concept video deleted successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <h1 className="admin-title">Learn Concepts with YouTube</h1>
        <button type="button" onClick={() => setCreateOpen(true)} className="admin-btn admin-btn-primary">Add Concept Video</button>
      </div>

      <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search by title, topic, or tags" className="admin-input mt-4" />
      {loading && <p className="mt-3 text-sm text-slate-500">Loading concept videos...</p>}
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="admin-table-wrap mt-4 overflow-x-auto">
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Title</th>
              <th className="py-2">Topic</th>
              <th className="py-2">Level</th>
              <th className="py-2">YouTube URL</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((video) => (
              <tr key={video._id} className="border-b border-slate-100 transition hover:bg-sky-50/60">
                <td className="py-2">{video.title}</td>
                <td className="py-2">{video.topic}</td>
                <td className="py-2">{video.level}</td>
                <td className="py-2 max-w-64 truncate">
                  <a href={video.youtubeUrl} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">
                    {video.youtubeUrl}
                  </a>
                </td>
                <td className="py-2">
                  <span className={`admin-badge ${video.isActive ? 'admin-badge-success' : 'admin-badge-muted'}`}>
                    {video.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => openEdit(video._id)}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => setDeleteTarget(video)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  No concept videos found. Click "Add Concept Video" to create one.
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
            <h2 className="admin-modal-title">{createOpen ? 'Add Concept Video' : 'Edit Concept Video'}</h2>
            <form className="space-y-3" onSubmit={createOpen ? onCreate : onEdit}>
              <input className="admin-input" placeholder="Video title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input className="admin-input" placeholder="Topic (e.g. Dynamic Programming)" value={form.topic} onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))} required />
              <input className="admin-input" placeholder="YouTube URL" type="url" value={form.youtubeUrl} onChange={(event) => setForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))} required />
              <select className="admin-input" value={form.level} onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <input className="admin-input" placeholder="Tags (comma separated)" value={form.tagsInput} onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))} />
              <textarea className="admin-input min-h-24" placeholder="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
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
            <h2 className="admin-modal-title">Delete Concept Video</h2>
            <p className="text-sm text-slate-600">Delete video "{deleteTarget.title}" permanently?</p>
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
