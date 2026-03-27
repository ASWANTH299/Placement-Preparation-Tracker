import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getAllUsers } from '../../services/adminService'
import { deleteProject, downloadProject, getProjects, updateProject, uploadProject } from '../../services/projectService'
import { getErrorMessage } from '../../utils/errorHandler'

const MAX_PROJECT_COUNT = 5
const MAX_PROJECT_SIZE_BYTES = 5 * 1024 * 1024
const ALL_ACCOUNTS_OPTION = '__all_accounts__'

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function ProjectsManager() {
  const navigate = useNavigate()
  const location = useLocation()
  const studentId = useSelector((state) => state.auth.user?.id)
  const role = useSelector((state) => state.auth.role)
  const isAdmin = role === 'admin'
  const fileInputRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [managedStudents, setManagedStudents] = useState([])
  const [managedStudentId, setManagedStudentId] = useState(ALL_ACCOUNTS_OPTION)
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
  const targetStudentId = isAdmin ? managedStudentId : studentId

  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return

    input.setAttribute('webkitdirectory', '')
    input.setAttribute('directory', '')
    input.setAttribute('multiple', '')
  }, [])

  const loadManagedStudents = useCallback(async () => {
    if (!isAdmin) return []

    const response = await getAllUsers({ page: 1, limit: 500, sortBy: 'created', order: 'desc' })
    const students = response?.data?.data || []
    setManagedStudents(students)
    return students
  }, [isAdmin])

  const loadProjects = useCallback(async () => {
    if (!targetStudentId) return

    try {
      setLoading(true)
      const response = await getProjects(targetStudentId)
      setProjects(response?.data?.data || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [targetStudentId])

  useEffect(() => {
    if (!studentId) return

    if (isAdmin) {
      loadManagedStudents()
      return
    }

    loadProjects()
  }, [studentId, isAdmin, loadManagedStudents, loadProjects])

  useEffect(() => {
    if (!targetStudentId) return
    loadProjects()
  }, [targetStudentId, loadProjects])

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

    if (!targetStudentId) return
    if (targetStudentId !== ALL_ACCOUNTS_OPTION && projects.length >= MAX_PROJECT_COUNT) {
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

      if (isAdmin && targetStudentId === ALL_ACCOUNTS_OPTION) {
        if (!managedStudents.length) {
          setError('No student accounts found.')
          return
        }

        await Promise.all(
          managedStudents.map(async (student) => {
            const perStudentData = new FormData()
            perStudentData.append('project_name', projectName.trim())
            perStudentData.append('description', description.trim())
            perStudentData.append('technology_stack', technologyStack.trim())
            selectedFiles.forEach((file) => {
              const relativeName = file.webkitRelativePath || file.name
              perStudentData.append('files', file, relativeName)
            })
            await uploadProject(student._id, perStudentData)
          })
        )
      } else {
        const formData = new FormData()
        formData.append('project_name', projectName.trim())
        formData.append('description', description.trim())
        formData.append('technology_stack', technologyStack.trim())

        selectedFiles.forEach((file) => {
          const relativeName = file.webkitRelativePath || file.name
          formData.append('files', file, relativeName)
        })

        await uploadProject(targetStudentId, formData)
      }

      await loadProjects()
      resetUploadForm()
      if (isAdmin && targetStudentId === ALL_ACCOUNTS_OPTION) {
        setSuccess(`Project uploaded for ${managedStudents.length} student accounts`)
      } else {
        setSuccess('Project uploaded successfully')
      }

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
    if (!targetStudentId) return
    const confirmed = window.confirm('Delete this project and all uploaded files?')
    if (!confirmed) return

    await runWithLoading(`delete-${projectId}`, async () => {
      const project = projects.find((item) => item._id === projectId)
      const ownerId = isAdmin ? (project?.studentId?._id || targetStudentId) : targetStudentId
      await deleteProject(ownerId, projectId)
      setProjects((prev) => prev.filter((item) => item._id !== projectId))
      setSuccess('Project deleted successfully')
    })
  }

  const handleDownload = async (project) => {
    if (!targetStudentId) return
    await runWithLoading(`download-${project._id}`, async () => {
      const ownerId = isAdmin ? (project?.studentId?._id || targetStudentId) : targetStudentId
      const response = await downloadProject(ownerId, project._id)
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

  const handleEdit = async (project) => {
    if (!project?._id || !targetStudentId) return

    const nextName = window.prompt('Project name', project.projectName || '')
    if (!nextName || !nextName.trim()) return

    const nextDescription = window.prompt('Description', project.description || '')
    if (nextDescription === null) return

    const nextTech = window.prompt(
      'Technology stack (comma separated)',
      Array.isArray(project.technologyStack) ? project.technologyStack.join(', ') : ''
    )
    if (nextTech === null) return

    await runWithLoading(`edit-${project._id}`, async () => {
      const ownerId = isAdmin ? (project?.studentId?._id || targetStudentId) : targetStudentId
      await updateProject(ownerId, project._id, {
        project_name: nextName.trim(),
        description: nextDescription,
        technology_stack: nextTech
      })
      await loadProjects()
      setSuccess('Project updated successfully')
    })
  }

  return (
    <section className="projects-shell space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Projects</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upload and manage up to 5 project folders. Each folder can have multiple files and must stay within 5MB.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/projects/upload')} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            Upload Project
          </button>
          <button type="button" onClick={loadProjects} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      {isAdmin && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-700 dark:bg-blue-900/20">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">Target Student</label>
          <select
            value={managedStudentId}
            onChange={(event) => setManagedStudentId(event.target.value)}
            className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-blue-500 transition focus:ring-2 dark:border-blue-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value={ALL_ACCOUNTS_OPTION}>All Accounts (all student logins)</option>
            {managedStudents.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {(isUploadRoute || projects.length === 0) && (
        <form onSubmit={handleUpload} className="projects-upload-form grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 md:grid-cols-2">
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

          <div className="projects-file-drop md:col-span-2 rounded-lg border border-dashed border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900">
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
            <button type="button" onClick={resetUploadForm} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800">
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
          <div className="projects-empty-state rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
            {loading ? 'Loading projects...' : 'No projects uploaded yet.'}
          </div>
        ) : (
          projects.map((project) => {
            const deleting = Boolean(actionLoading[`delete-${project._id}`])
            const downloading = Boolean(actionLoading[`download-${project._id}`])
            const editing = Boolean(actionLoading[`edit-${project._id}`])

            return (
              <article key={project._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{project.projectName}</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{project.description || 'No description provided.'}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Files: {project.files?.length || 0} • Size: {formatBytes(project.totalSize)} • Uploaded: {new Date(project.uploadDate || project.createdAt).toLocaleDateString()}
                    </p>
                    {isAdmin && project?.studentId?.name && (
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">Owner: {project.studentId.name} ({project.studentId.email || 'no email'})</p>
                    )}
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
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project._id}`, { state: { ownerId: project?.studentId?._id || targetStudentId } })}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Open
                    </button>
                    <button type="button" onClick={() => handleEdit(project)} disabled={editing} className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      {editing ? 'Saving...' : 'Edit'}
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
