import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { deleteProject, downloadProject, getProjects, uploadProject } from '../../services/projectService'
import { getErrorMessage } from '../../utils/errorHandler'

const MAX_PROJECT_COUNT = 5
const MAX_PROJECT_SIZE_BYTES = 5 * 1024 * 1024

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function ProjectsManager() {
  const navigate = useNavigate()
  const location = useLocation()
  const studentId = useSelector((state) => state.auth.user?.id)
  const fileInputRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [technologyStack, setTechnologyStack] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isUploadRoute = location.pathname === '/projects/upload'

  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return

    input.setAttribute('webkitdirectory', '')
    input.setAttribute('directory', '')
    input.setAttribute('multiple', '')
  }, [])

  const loadProjects = useCallback(async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await getProjects(studentId)
      setProjects(response?.data?.data || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const selectedSize = useMemo(
    () => selectedFiles.reduce((sum, file) => sum + (file.size || 0), 0),
    [selectedFiles],
  )

  const resetUploadForm = () => {
    setProjectName('')
    setDescription('')
    setTechnologyStack('')
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    if (!studentId) return
    if (projects.length >= MAX_PROJECT_COUNT) {
      setError('Maximum 5 projects allowed. Delete an existing project before uploading a new one.')
      return
    }
    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }
    if (!selectedFiles.length) {
      setError('Please select your project folder files')
      return
    }
    if (selectedSize > MAX_PROJECT_SIZE_BYTES) {
      setError('Each project folder must not exceed 5MB')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      const formData = new FormData()
      formData.append('project_name', projectName.trim())
      formData.append('description', description.trim())
      formData.append('technology_stack', technologyStack.trim())

      selectedFiles.forEach((file) => {
        const relativeName = file.webkitRelativePath || file.name
        formData.append('files', file, relativeName)
      })

      await uploadProject(studentId, formData)
      await loadProjects()
      resetUploadForm()
      setSuccess('Project uploaded successfully')
      if (isUploadRoute) {
        navigate('/projects')
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setUploading(false)
    }
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

  const handleDelete = async (projectId) => {
    const confirmed = window.confirm('Delete this project and all uploaded files?')
    if (!confirmed) return

    await runWithLoading(`delete-${projectId}`, async () => {
      await deleteProject(studentId, projectId)
      setProjects((prev) => prev.filter((project) => project._id !== projectId))
      setSuccess('Project deleted successfully')
    })
  }

  const handleDownload = async (project) => {
    await runWithLoading(`download-${project._id}`, async () => {
      const response = await downloadProject(studentId, project._id)
      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${(project.projectName || 'project').replace(/\s+/g, '_')}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    })
  }

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Projects</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upload and manage up to 5 project folders. Each folder can have multiple files and must stay within 5MB.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/projects/upload')} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            Upload Project
          </button>
          <button type="button" onClick={loadProjects} disabled={loading} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      {(isUploadRoute || projects.length === 0) && (
        <form onSubmit={handleUpload} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upload Project Folder</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose a folder to upload all files together.</p>
          </div>

          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Project name"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />

          <input
            value={technologyStack}
            onChange={(event) => setTechnologyStack(event.target.value)}
            placeholder="Technology stack (comma separated)"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            rows={3}
            className="md:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />

          <div className="md:col-span-2 rounded-lg border border-dashed border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFilesChange}
              className="w-full text-sm text-slate-700 dark:text-slate-200"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Files selected: {selectedFiles.length} • Total size: {formatBytes(selectedSize)}
            </p>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={resetUploadForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
              Clear
            </button>
            <button type="submit" disabled={uploading} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              {uploading ? 'Uploading...' : 'Upload Folder'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
            {loading ? 'Loading projects...' : 'No projects uploaded yet.'}
          </div>
        ) : (
          projects.map((project) => {
            const deleting = Boolean(actionLoading[`delete-${project._id}`])
            const downloading = Boolean(actionLoading[`download-${project._id}`])

            return (
              <article key={project._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{project.projectName}</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{project.description || 'No description provided.'}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Files: {project.files?.length || 0} • Size: {formatBytes(project.totalSize)} • Uploaded: {new Date(project.uploadDate || project.createdAt).toLocaleDateString()}
                    </p>
                    {project.technologyStack?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {project.technologyStack.map((tech) => (
                          <span key={`${project._id}-${tech}`} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => navigate(`/projects/${project._id}`)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                      Open
                    </button>
                    <button type="button" onClick={() => handleDownload(project)} disabled={downloading} className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      {downloading ? 'Downloading...' : 'Download'}
                    </button>
                    <button type="button" onClick={() => handleDelete(project._id)} disabled={deleting} className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
