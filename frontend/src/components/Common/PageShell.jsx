export default function PageShell({ title, subtitle, children }) {
  return (
    <section className="surface-panel fade-rise rounded-2xl p-6">
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}
