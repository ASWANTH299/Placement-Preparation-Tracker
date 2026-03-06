export default function Toast({ type = 'info', message, onClose }) {
  const styleMap = {
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <div className={`fixed right-4 top-4 z-50 min-w-64 rounded-md border px-3 py-2 shadow ${styleMap[type]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button type="button" onClick={onClose} className="text-xs">✕</button>
      </div>
    </div>
  )
}
