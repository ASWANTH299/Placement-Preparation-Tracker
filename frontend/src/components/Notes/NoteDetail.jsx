export default function NoteDetail() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Sliding Window Patterns</h1>
      <p className="mt-1 text-sm text-slate-600">Created: 2026-03-02 • Visibility: Private</p>
      <article className="mt-4 rounded border border-slate-200 p-4 text-sm text-slate-700">
        Use fixed and dynamic windows to optimize subarray/substring problems. Track boundaries and adjust based on constraints.
      </article>
      <div className="mt-4 flex gap-2">
        <button className="rounded border border-slate-300 px-3 py-2 text-sm">Edit</button>
        <button className="rounded border border-red-300 px-3 py-2 text-sm text-red-600">Delete</button>
      </div>
    </section>
  )
}
