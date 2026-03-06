export default function Pagination({ page = 1, totalPages = 1, onPrev, onNext }) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <button type="button" onClick={onPrev} disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-50">
        Previous
      </button>
      <span className="text-slate-600">Page {page} / {totalPages}</span>
      <button type="button" onClick={onNext} disabled={page >= totalPages} className="rounded border px-3 py-1 disabled:opacity-50">
        Next
      </button>
    </div>
  )
}
