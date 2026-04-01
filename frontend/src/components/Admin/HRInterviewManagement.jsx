import { useEffect, useState } from 'react'
import {
  createAdminHRInterviewQuestion,
  deleteAdminHRInterviewQuestion,
  getAdminHRInterviewQuestionById,
  getAdminHRInterviewQuestions,
  updateAdminHRInterviewQuestion,
} from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'
import Toast from '../Common/Toast'

const initialForm = {
  question: '',
  answer: '',
  explanation: '',
  tagsInput: '',
  isActive: true,
}

const toPayload = (form) => ({
  question: form.question,
  answer: form.answer,
  explanation: form.explanation,
  tags: String(form.tagsInput || '').split(',').map((row) => row.trim()).filter(Boolean),
  isActive: form.isActive,
})

export default function HRInterviewManagement() {
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
    const response = await getAdminHRInterviewQuestions({
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
      await createAdminHRInterviewQuestion(toPayload(form))
      setToast({ type: 'success', message: 'HR interview question created successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const openEdit = async (questionId) => {
    try {
      const response = await getAdminHRInterviewQuestionById(questionId)
      const item = response?.data?.data
      setEditingId(questionId)
      setForm({
        question: item?.question || '',
        answer: item?.answer || '',
        explanation: item?.explanation || '',
        tagsInput: Array.isArray(item?.tags) ? item.tags.join(', ') : '',
        isActive: item?.isActive !== false,
      })
      setEditOpen(true)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onEdit = async (event) => {
    event.preventDefault()
    try {
      await updateAdminHRInterviewQuestion(editingId, toPayload(form))
      setToast({ type: 'success', message: 'HR interview question updated successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  const onDelete = async () => {
    if (!deleteTarget?._id) return
    try {
      await deleteAdminHRInterviewQuestion(deleteTarget._id)
      setToast({ type: 'success', message: 'HR interview question deleted successfully.' })
      closeModal()
      await loadRows(page, search)
    } catch (requestError) {
      setToast({ type: 'error', message: getErrorMessage(requestError) })
    }
  }

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <h1 className="admin-title">HR Interview Preparation</h1>
        <button type="button" onClick={() => setCreateOpen(true)} className="admin-btn admin-btn-primary">Add HR Question</button>
      </div>

      <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search question, answer, explanation, or tags" className="admin-input mt-4" />
      {loading && <p className="mt-3 text-sm text-slate-500">Loading HR interview questions...</p>}
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="admin-table-wrap mt-4 overflow-x-auto">
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Question</th>
              <th className="py-2">Answer</th>
              <th className="py-2">Explanation</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item._id} className="border-b border-slate-100 transition hover:bg-sky-50/60">
                <td className="py-2 max-w-72 align-top">
                  <p className="line-clamp-2">{item.question}</p>
                </td>
                <td className="py-2 max-w-80 align-top">
                  <p className="line-clamp-3 text-slate-700">{item.answer}</p>
                </td>
                <td className="py-2 max-w-80 align-top">
                  <p className="line-clamp-3 text-slate-600">{item.explanation}</p>
                </td>
                <td className="py-2 align-top">
                  <span className={`admin-badge ${item.isActive ? 'admin-badge-success' : 'admin-badge-muted'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 text-right align-top">
                  <div className="inline-flex gap-2">
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => openEdit(item._id)}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => setDeleteTarget(item)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  No HR interview questions found. Click "Add HR Question" to create one.
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
            <h2 className="admin-modal-title">{createOpen ? 'Add HR Interview Question' : 'Edit HR Interview Question'}</h2>
            <form className="space-y-3" onSubmit={createOpen ? onCreate : onEdit}>
              <textarea className="admin-input min-h-20" placeholder="Question" value={form.question} onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))} required />
              <textarea className="admin-input min-h-24" placeholder="Recommended Answer" value={form.answer} onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))} required />
              <textarea className="admin-input min-h-20" placeholder="How to explain it clearly" value={form.explanation} onChange={(event) => setForm((prev) => ({ ...prev, explanation: event.target.value }))} required />
              <input className="admin-input" placeholder="Tags (comma separated)" value={form.tagsInput} onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))} />
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
            <h2 className="admin-modal-title">Delete HR Interview Question</h2>
            <p className="text-sm text-slate-600">Delete this HR interview question permanently?</p>
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
