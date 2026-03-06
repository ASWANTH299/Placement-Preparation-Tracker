import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { deleteResume, downloadResume, getResumes, setActiveResume, uploadResume } from '../../services/resumeService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function ResumeTracker() {
  const studentId = useSelector((state) => state.auth.user?.id)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  const loadResumes = async () => {
    if (!studentId) return
    const response = await getResumes(studentId)
    setFiles(response?.data?.data || [])
  }

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

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx'].includes(ext || '')) {
      setError('Only PDF and DOCX files are allowed')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB')
      event.target.value = ''
      return
    }

    if (files.length >= 5) {
      setError('Maximum 5 resumes allowed. Delete an old resume before uploading a new one.')
      event.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('customName', file.name)

    try {
      setError('')
      await uploadResume(studentId, formData)
      await loadResumes()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      event.target.value = ''
    }
  }

  const onSetActive = async (resumeId) => {
    try {
      setError('')
      await setActiveResume(studentId, resumeId)
      await loadResumes()
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

  const onDownload = async (resumeId, fileName) => {
    try {
      setError('')
      const response = await downloadResume(studentId, resumeId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName || 'resume')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resume Management</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Max 5 resumes, up to 5MB each, and only PDF or DOCX.</p>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <label className="mt-4 block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-600 transition hover:border-blue-400 dark:border-slate-600 dark:text-slate-300">
        Click to upload resume
        <input type="file" accept=".pdf,.docx" className="hidden" onChange={onFilePick} />
      </label>

      <div className="mt-5 space-y-2">
        {files.map((file) => (
          <article key={file._id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 p-3 text-sm dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">{file.customName || file.fileName}</p>
              <p className="text-slate-500 dark:text-slate-400">
                {Math.ceil((file.fileSize || 0) / 1024)} KB • {file.fileType?.toUpperCase()} • {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-1 text-xs ${file.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {file.isActive ? 'Active' : 'Inactive'}
              </span>
              <button type="button" onClick={() => onDownload(file._id, file.fileName)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:text-slate-100">Download</button>
              <button type="button" onClick={() => onSetActive(file._id)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:text-slate-100">Set Active</button>
              <button type="button" onClick={() => onDelete(file._id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
