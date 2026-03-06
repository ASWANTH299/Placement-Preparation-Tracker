import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteNote, getNoteById, updateNote } from '../../services/noteService'
import { getErrorMessage } from '../../utils/errorHandler'
import { fallbackNoteById, fallbackNotes } from '../../utils/noteFallbackData'

const fallbackNote = fallbackNotes[0]

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''))

const parseNoteSections = (content = '') => {
  const text = String(content || '')

  const conceptMatch = text.match(/Concept(?: explanation)?:\s*([\s\S]*?)(?=\n\nPseudocode:|\n\nJava example:|$)/i)
  const pseudoMatch = text.match(/Pseudocode:\s*([\s\S]*?)(?=\n\nJava example:|$)/i)
  const javaMatch = text.match(/Java example:\s*([\s\S]*?)$/i)

  return {
    concept: (conceptMatch?.[1] || '').trim() || text.trim() || 'No concept explanation available.',
    pseudocode: (pseudoMatch?.[1] || '').trim() || 'No pseudocode available.',
    javaExample: (javaMatch?.[1] || '').trim() || 'No Java example available.'
  }
}

export default function NoteDetail() {
  const { noteId } = useParams()
  const navigate = useNavigate()
  const userId = useSelector((state) => state.auth.user?.id)
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

  const sections = useMemo(() => parseNoteSections(editing ? draft : note?.content), [draft, editing, note?.content])

  const save = async () => {
    if (!isOwnNote || !isValidObjectId(noteId)) return
    try {
      setError('')
      await updateNote(userId, noteId, { content: draft })
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
    if (!isOwnNote || !isValidObjectId(noteId)) return
    try {
      setError('')
      await deleteNote(userId, noteId)
      navigate('/notes')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{note?.title || 'Note Detail'}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Created: {note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : '-'} • Visibility: {note?.visibility || '-'}
      </p>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {editing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="mt-4 h-64 w-full rounded border border-slate-300 p-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      ) : (
        <div className="mt-4 space-y-4">
          <article className="rounded border border-slate-200 p-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Concept Explanation</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{sections.concept}</p>
          </article>

          <article className="rounded border border-slate-200 p-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Pseudocode</h2>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-200">{sections.pseudocode}</pre>
          </article>

          <article className="rounded border border-slate-200 p-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Java Example</h2>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs text-slate-100">{sections.javaExample}</pre>
          </article>
        </div>
      )}

      {isOwnNote && (
        <div className="mt-4 flex gap-2">
          {editing ? (
            <button type="button" onClick={save} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Save</button>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-100">Edit</button>
          )}
          <button type="button" onClick={remove} className="rounded border border-red-300 px-3 py-2 text-sm text-red-600">Delete</button>
        </div>
      )}
    </section>
  )
}
