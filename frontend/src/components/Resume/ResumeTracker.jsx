import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { deleteResume, getResumes, setActiveResume, uploadResume } from '../../services/resumeService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function ResumeTracker() {
  const studentId = useSelector((state) => state.auth.user?.id)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!studentId) return
      try {
        const response = await getResumes(studentId)
        if (active) setFiles(response?.data?.data || [])
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }
    load()
    return () => {
      active = false
    }
  }, [studentId])

  const onFilePick = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !studentId) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('customName', file.name)

    try {
      setError('')
      await uploadResume(studentId, formData)
      const refreshed = await getResumes(studentId)
      setFiles(refreshed?.data?.data || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const onSetActive = async (resumeId) => {
    try {
      setError('')
      await setActiveResume(studentId, resumeId)
      const refreshed = await getResumes(studentId)
      setFiles(refreshed?.data?.data || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const onDelete = async (resumeId) => {
    try {
      setError('')
      await deleteResume(studentId, resumeId)
      setFiles((prev) => prev.filter((file) => file._id !== resumeId))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Resume Management</h1>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <label className="mt-4 block rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-600">
        Drag resume here or click to browse
        <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onFilePick} />
      </label>

      <div className="mt-5 space-y-2">
        {files.map((file) => (
          <article key={file._id || `${file.name}-${file.date}`} className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">{file.customName || file.fileName || file.name}</p>
              <p className="text-slate-500">{Math.ceil((file.fileSize || 0) / 1024) || file.size} KB • {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : file.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-1 text-xs ${file.isActive || file.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {file.isActive || file.active ? 'Active' : 'Inactive'}
              </span>
              <button type="button" onClick={() => onSetActive(file._id)} className="rounded border border-slate-300 px-2 py-1 text-xs">Set Active</button>
              <button type="button" onClick={() => onDelete(file._id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
