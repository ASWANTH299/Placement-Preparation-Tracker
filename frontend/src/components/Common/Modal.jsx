export default function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-lg" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
