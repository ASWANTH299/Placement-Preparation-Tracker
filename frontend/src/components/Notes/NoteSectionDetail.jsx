import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNoteById } from '../../services/noteService'
import { getErrorMessage } from '../../utils/errorHandler'
import { fallbackNoteById, fallbackNotes } from '../../utils/noteFallbackData'
import { DEFAULT_BOX_TITLES, getBoxTag, parseNoteBoxes } from '../../utils/noteSections'

const fallbackNote = fallbackNotes[0]

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''))

const parseFirstPseudocodeBlock = (content = '') => {
  const text = String(content || '')
  const match = text.match(/Question name:\s*([^\n]+)[\s\S]*?Pseudocode:\s*([\s\S]*?)Theory:\s*([\s\S]*?)(?=\n\nQuestion name:|$)/i)
  if (!match) return null

  return {
    questionName: (match[1] || '').trim(),
    pseudocode: (match[2] || '').trim(),
    theory: (match[3] || '').trim()
  }
}

export default function NoteSectionDetail() {
  const { noteId, sectionId } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!isValidObjectId(noteId)) {
        const fallback = fallbackNoteById[noteId] || fallbackNote
        setNote(fallback)
        return
      }

      try {
        const response = await getNoteById(noteId)
        const data = response?.data?.data
        if (!active) return
        setNote(data || (fallbackNoteById[noteId] || fallbackNote))
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError))
          setNote(fallbackNoteById[noteId] || fallbackNote)
        }
      }
    }

    if (noteId) load()
    return () => {
      active = false
    }
  }, [noteId])

  const boxes = useMemo(() => parseNoteBoxes(note?.content), [note?.content])
  const boxNumber = Number(sectionId)
  const selected = useMemo(
    () => boxes.find((box) => box.number === boxNumber) || null,
    [boxes, boxNumber]
  )
  const firstPseudoBlock = useMemo(() => parseFirstPseudocodeBlock(selected?.content), [selected?.content])
  const isPseudocodeSection = String(selected?.title || '').toLowerCase().includes('pseudocode')

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6 text-slate-100 shadow-sm">
      <button
        type="button"
        onClick={() => navigate(`/notes/${noteId}`)}
        className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
      >
        Back to section boxes
      </button>

      <h1 className="mt-4 text-2xl font-bold text-slate-100">{note?.title || 'Note Section'}</h1>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <article className="relative mt-5 overflow-hidden rounded-3xl border border-cyan-900/40 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 shadow-lg">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          {getBoxTag(selected?.title || DEFAULT_BOX_TITLES[boxNumber] || 'Section')}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          {selected?.title || DEFAULT_BOX_TITLES[boxNumber] || 'Section'}
        </h2>
        {isPseudocodeSection && firstPseudoBlock && (
          <div className="mt-4 grid gap-3">
            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Question name</h3>
              <p className="mt-2 text-sm text-slate-100">{firstPseudoBlock.questionName || 'N/A'}</p>
            </section>
            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Pseudocode</h3>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-200">{firstPseudoBlock.pseudocode || 'N/A'}</pre>
            </section>
            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Theory</h3>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-200">{firstPseudoBlock.theory || 'N/A'}</pre>
            </section>
          </div>
        )}
        <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 text-sm leading-7 text-slate-200">
          {selected?.content || 'No content available for this section.'}
        </pre>
      </article>
    </section>
  )
}
