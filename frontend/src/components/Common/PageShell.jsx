export default function PageShell({ title, subtitle, children }) {
  return (
    <section className="surface-panel fade-rise rounded-2xl p-6">
      <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-100 via-white to-cyan-100/80 p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}
