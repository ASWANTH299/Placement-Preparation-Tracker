import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { deleteResume, downloadResume, getResumes, setActiveResume, uploadResume } from '../../services/resumeService'
import { getErrorMessage } from '../../utils/errorHandler'

const allowedExtensions = ['pdf', 'docx']
const maxResumeCount = 5
const maxResumeSizeInBytes = 5 * 1024 * 1024

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const getFileExtension = (name = '') => name.split('.').pop()?.toLowerCase() || ''

export default function ResumeTracker() {
  const studentId = useSelector((state) => state.auth.user?.id)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadResumes = async () => {
    if (!studentId) return
    try {
      setLoading(true)
      const response = await getResumes(studentId)
      setFiles(response?.data?.data || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!studentId) return undefined
    loadResumes()
    return () => {
      setDragActive(false)
    }
  }, [studentId])

  const validateFile = (file) => {
    const extension = getFileExtension(file?.name)
    if (!allowedExtensions.includes(extension)) {
      return 'Only PDF and DOCX files are allowed'
    }

    if (file.size > maxResumeSizeInBytes) {
      return 'File size must not exceed 5MB'
    }

    if (files.length >= maxResumeCount) {
      return 'Maximum 5 resumes allowed. Delete an old resume before uploading a new one.'
    }

    return ''
  }

  const uploadSelectedFile = async (file) => {
    if (!file || !studentId) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('customName', file.name)

    try {
      setUploading(true)
      setError('')
      setSuccess('')
      await uploadResume(studentId, formData)
      await loadResumes()
      setSuccess(`Uploaded ${file.name} successfully.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setUploading(false)
    }
  }

  const onFilePick = async (event) => {
    const file = event.target.files?.[0]
    await uploadSelectedFile(file)
    event.target.value = ''
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer?.files?.[0]
    await uploadSelectedFile(file)
  }

  const runWithLoading = async (key, fn) => {
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }))
      setError('')
      setSuccess('')
      await fn()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  const onSetActive = async (resumeId) => {
    await runWithLoading(`active-${resumeId}`, async () => {
      await setActiveResume(studentId, resumeId)
      await loadResumes()
      setSuccess('Active resume updated.')
    })
  }

  const onDelete = async (resumeId) => {
    const isConfirmed = window.confirm('Delete this resume permanently?')
    if (!isConfirmed) return
    await runWithLoading(`delete-${resumeId}`, async () => {
      await deleteResume(studentId, resumeId)
      setFiles((prev) => prev.filter((file) => file._id !== resumeId))
      setSuccess('Resume deleted successfully.')
    })
  }

  const onDownload = async (resumeId, fileName) => {
    await runWithLoading(`download-${resumeId}`, async () => {
      const response = await downloadResume(studentId, resumeId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName || 'resume')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    })
  }

  const filteredAndSortedFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filtered = files.filter((file) => {
      const extension = (file.fileType || getFileExtension(file.fileName)).toLowerCase()
      const fileName = (file.customName || file.fileName || '').toLowerCase()
      const matchesQuery = normalizedQuery ? fileName.includes(normalizedQuery) : true
      const matchesType = typeFilter === 'all' ? true : extension === typeFilter
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? file.isActive
          : !file.isActive

      return matchesQuery && matchesType && matchesStatus
    })

    const sorted = [...filtered]
    sorted.sort((left, right) => {
      if (sortBy === 'name-asc') return (left.customName || left.fileName || '').localeCompare(right.customName || right.fileName || '')
      if (sortBy === 'name-desc') return (right.customName || right.fileName || '').localeCompare(left.customName || left.fileName || '')
      if (sortBy === 'size-asc') return (left.fileSize || 0) - (right.fileSize || 0)
      if (sortBy === 'size-desc') return (right.fileSize || 0) - (left.fileSize || 0)
      if (sortBy === 'oldest') return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })

    return sorted
  }, [files, searchQuery, typeFilter, statusFilter, sortBy])

  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
    const activeCount = files.filter((file) => file.isActive).length
    const newest = [...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    return {
      total: files.length,
      activeCount,
      totalSize,
      newestDate: newest?.createdAt ? new Date(newest.createdAt).toLocaleDateString() : 'N/A',
    }
  }, [files])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resume Management</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Max 5 resumes, up to 5MB each, and only PDF or DOCX.</p>
        </div>
        <button
          type="button"
          onClick={loadResumes}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total resumes</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active resumes</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{stats.activeCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Storage used</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{formatBytes(stats.totalSize)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Latest upload</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{stats.newestDate}</p>
        </article>
      </div>

      <label
        className={`mt-4 block rounded-xl border-2 border-dashed p-5 text-center transition ${dragActive
          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20'
          : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800/40'} ${uploading ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{uploading ? 'Uploading...' : 'Click or Drag & Drop to upload resume'}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Supported: PDF, DOCX • Max size: 5MB per file</p>
        <input type="file" accept=".pdf,.docx" className="hidden" onChange={onFilePick} disabled={uploading || files.length >= maxResumeCount} />
      </label>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by file name"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">All types</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="size-asc">Smallest size</option>
          <option value="size-desc">Largest size</option>
        </select>
      </div>

      <div className="mt-5 space-y-2">
        {filteredAndSortedFiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
            {loading ? 'Loading resumes...' : 'No resumes match your current filters.'}
          </div>
        ) : (
          filteredAndSortedFiles.map((file) => {
            const displayName = file.customName || file.fileName
            const extension = (file.fileType || getFileExtension(file.fileName)).toUpperCase()
            const isActive = Boolean(file.isActive)
            const isDownloading = Boolean(actionLoading[`download-${file._id}`])
            const isSettingActive = Boolean(actionLoading[`active-${file._id}`])
            const isDeleting = Boolean(actionLoading[`delete-${file._id}`])

            return (
              <article key={file._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="min-w-[220px] flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {formatBytes(file.fileSize)} • {extension} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onDownload(file._id, file.fileName)}
                    disabled={isDownloading}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetActive(file._id)}
                    disabled={isSettingActive || isActive}
                    className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  >
                    {isSettingActive ? 'Updating...' : isActive ? 'Current Active' : 'Set Active'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(file._id)}
                    disabled={isDeleting}
                    className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
