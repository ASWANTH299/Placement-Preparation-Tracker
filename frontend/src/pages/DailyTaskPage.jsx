import DailyTaskCard from '../components/Common/DailyTaskCard'
import useAuth from '../hooks/useAuth'

export default function DailyTaskPage() {
  const { user } = useAuth()

  return (
    <section className="space-y-6 fade-rise">
      <article className="ui-card overflow-hidden p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Focus Zone</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">Daily Task</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">One coding challenge every day. Solve it before midnight and keep your momentum.</p>
      </article>

      <DailyTaskCard user={user} period="Today" />
    </section>
  )
}
