import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { downloadProject, getProjectById } from '../../services/projectService'
import { getErrorMessage } from '../../utils/errorHandler'

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function ProjectDetail() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const studentId = useSelector((state) => state.auth.user?.id)

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId || !projectId) return

    const load = async () => {
      try {
        setLoading(true)
        const response = await getProjectById(studentId, projectId)
        setProject(response?.data?.data || null)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [studentId, projectId])

  const onDownload = async () => {
    if (!project) return

    try {
      setDownloading(true)
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
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Project Details</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Inspect uploaded project files and metadata.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/projects')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            Back to Projects
          </button>
          <button type="button" onClick={onDownload} disabled={downloading || !project} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">Loading project details...</div>
      ) : !project ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">Project not found.</div>
      ) : (
        <>
          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{project.projectName}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{project.description || 'No description provided.'}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Upload date: {new Date(project.uploadDate || project.createdAt).toLocaleString()} • Total files: {project.files?.length || 0} • Total size: {formatBytes(project.totalSize)}
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
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Project Files</h3>
            <div className="mt-3 space-y-2">
              {(project.files || []).map((file, index) => (
                <div key={`${file.filePath}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="max-w-[70%] truncate text-slate-700 dark:text-slate-200">{file.relativePath || file.originalName}</p>
                  <p className="text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                </div>
              ))}
            </div>
          </article>
        </>
      )}
    </section>
  )
}
