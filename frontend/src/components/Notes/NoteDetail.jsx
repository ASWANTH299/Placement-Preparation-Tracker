import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteNote, getNoteById, updateNote } from '../../services/noteService'
import { getErrorMessage } from '../../utils/errorHandler'
import { fallbackNoteById, fallbackNotes } from '../../utils/noteFallbackData'
import { DEFAULT_BOX_TITLES, getBoxTag } from '../../utils/noteSections'

const fallbackNote = fallbackNotes[0]

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''))

export default function NoteDetail() {
  const { noteId } = useParams()
  const navigate = useNavigate()
  const userId = useSelector((state) => state.auth.user?.id)
  const role = useSelector((state) => state.auth.role)
  const isAdmin = role === 'admin'
  const [note, setNote] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!isValidObjectId(noteId)) {
        const fallback = fallbackNoteById[noteId] || fallbackNote
        setNote(fallback)
        setDraft(fallback.content)
        return
      }

      try {
        const response = await getNoteById(noteId)
        const data = response?.data?.data
        if (!active) return
        setNote(data || (fallbackNoteById[noteId] || fallbackNote))
        setDraft(data?.content || fallbackNote.content)
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError))
          const fallback = fallbackNoteById[noteId] || fallbackNote
          setNote(fallback)
          setDraft(fallback.content)
        }
      }
    }

    if (noteId) load()
    return () => {
      active = false
    }
  }, [noteId])

  const isOwnNote = useMemo(() => {
    const ownerId = note?.studentId?._id || note?.studentId
    return Boolean(ownerId && userId && ownerId === userId)
  }, [note, userId])

  const canManage = isAdmin || isOwnNote

  const visibleBoxes = useMemo(() => (
    [1, 2, 3, 4, 5, 6].map((number) => ({
      number,
      title: DEFAULT_BOX_TITLES[number],
      content: `Open ${DEFAULT_BOX_TITLES[number]} section`
    }))
  ), [])

  const save = async () => {
    if (!canManage || !isValidObjectId(noteId)) return
    try {
      setError('')
      const ownerId = note?.studentId?._id || note?.studentId || userId
      await updateNote(ownerId, noteId, { content: draft })
      const refreshed = await getNoteById(noteId)
      const data = refreshed?.data?.data
      setNote(data)
      setDraft(data?.content || '')
      setEditing(false)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const remove = async () => {
    if (!canManage || !isValidObjectId(noteId)) return
    try {
      setError('')
      const ownerId = note?.studentId?._id || note?.studentId || userId
      await deleteNote(ownerId, noteId)
      navigate('/notes')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="note-detail-shell rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{note?.title || 'Note Detail'}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Created: {note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : '-'} • Visibility: {note?.visibility || '-'}
      </p>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {editing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="mt-4 h-64 w-full rounded border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {visibleBoxes.map((box) => (
            <article
              key={`${box.number}-${box.title}`}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/notes/${noteId}/sections/${box.number}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/notes/${noteId}/sections/${box.number}`)
                }
              }}
              className="note-box-card relative flex min-h-[170px] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg dark:border-cyan-800/60 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 dark:hover:border-cyan-500/80 dark:hover:bg-transparent dark:hover:shadow-cyan-900/30"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-200/50 blur-2xl dark:bg-cyan-500/10" />
              <div className="note-box-tag text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
                {getBoxTag(box.title)}
              </div>
              <h2 className="note-box-title mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {box.title || DEFAULT_BOX_TITLES[box.number] || `Section ${box.number}`}
              </h2>
              <div className="note-box-preview mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-200">{String(box.content || 'Click to open this section').split('\n')[0]}</div>
            </article>
          ))}
        </div>
      )}

      {canManage && (
        <div className="mt-4 flex gap-2">
          {editing ? (
            <button type="button" onClick={save} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Save</button>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:text-slate-100">Edit</button>
          )}
          <button type="button" onClick={remove} className="rounded border border-red-300 px-3 py-2 text-sm text-red-600">Delete</button>
        </div>
      )}
    </section>
  )
}
