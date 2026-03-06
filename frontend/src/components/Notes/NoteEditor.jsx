import { useEffect, useState } from 'react'

const draftKey = 'note-draft'

export default function NoteEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const draft = localStorage.getItem(draftKey)
    if (!draft) return
    const parsed = JSON.parse(draft)
    setTitle(parsed.title || '')
    setContent(parsed.content || '')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ title, content }))
      setSaved(true)
      setTimeout(() => setSaved(false), 1000)
    }, 1000)

    return () => clearTimeout(timer)
  }, [title, content])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Create Note</h1>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="mt-4 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={10000} className="mt-3 h-48 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{content.length}/10000</span>
        <span>{saved ? 'Draft saved' : 'Autosaving...'}</span>
      </div>
    </section>
  )
}
