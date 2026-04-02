import { useEffect, useMemo, useState } from 'react'
import useAuth from '../../hooks/useAuth'

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const formatRemaining = (ms) => {
  const safeMs = Math.max(Number(ms) || 0, 0)
  const totalSeconds = Math.floor(safeMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function TaskPlannerView() {
  const { user } = useAuth()
  const userSeed = user?.id || user?._id || user?.email || user?.name || 'guest-user'
  const starredStorageKey = useMemo(() => `daily-task:starred:${userSeed}`, [userSeed])
  const timerStorageKey = useMemo(() => `task-planner:timer:${userSeed}`, [userSeed])

  const [tasks, setTasks] = useState([])
  const [activeTimer, setActiveTimer] = useState(null)
  const [nowMs, setNowMs] = useState(Date.now())

  useEffect(() => {
    const rawTasks = window.localStorage.getItem(starredStorageKey)
    const rawTimer = window.localStorage.getItem(timerStorageKey)
    const loadedTasks = parseJson(rawTasks, [])
    const loadedTimer = parseJson(rawTimer, null)

    setTasks(Array.isArray(loadedTasks) ? loadedTasks : [])
    setActiveTimer(loadedTimer && loadedTimer.endsAt ? loadedTimer : null)
  }, [starredStorageKey, timerStorageKey])

  useEffect(() => {
    window.localStorage.setItem(starredStorageKey, JSON.stringify(tasks))
  }, [tasks, starredStorageKey])

  useEffect(() => {
    if (activeTimer) {
      window.localStorage.setItem(timerStorageKey, JSON.stringify(activeTimer))
    } else {
      window.localStorage.removeItem(timerStorageKey)
    }
  }, [activeTimer, timerStorageKey])

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!activeTimer?.endsAt) return
    if (activeTimer.endsAt <= nowMs) {
      setActiveTimer(null)
    }
  }, [activeTimer, nowMs])

  const updateTask = (taskId, patch) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)))
  }

  const removeTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    if (activeTimer?.taskId === taskId) {
      setActiveTimer(null)
    }
  }

  const startTimer = (task) => {
    const timerMinutes = Math.max(Number(task.timerMinutes) || 0, 0)
    const durationMinutes = timerMinutes || 25
    const endsAt = Date.now() + durationMinutes * 60 * 1000
    setActiveTimer({ taskId: task.id, endsAt, durationMinutes })
  }

  const stopTimer = () => {
    setActiveTimer(null)
  }

  return (
    <section className="space-y-6 fade-rise">
      <article className="ui-card overflow-hidden p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Planning Zone</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">Task Planner</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Manage your starred tasks, set when you want to do them, and run a focus timer.</p>
      </article>

      {!tasks.length && (
        <article className="ui-card p-5 sm:p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No starred tasks yet. Go to Daily Task and click Star Task to save tasks here.
          </p>
        </article>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {tasks.map((task) => {
          const isActive = activeTimer?.taskId === task.id
          const remainingMs = isActive ? Math.max(activeTimer.endsAt - nowMs, 0) : 0

          return (
            <article key={task.id} className="ui-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-300">{task.platform} • {task.difficulty}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{task.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{task.company || 'General'} • {task.time || 'Custom duration'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Planned time</span>
                  <input
                    type="time"
                    value={task.plannedTime || ''}
                    onChange={(event) => updateTask(task.id, { plannedTime: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Task timer (minutes)</span>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={task.timerMinutes || ''}
                    onChange={(event) => updateTask(task.id, { timerMinutes: event.target.value })}
                    placeholder="25"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
              </div>

              {isActive && (
                <p className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-300">
                  Timer running: {formatRemaining(remainingMs)}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {isActive ? (
                  <button
                    type="button"
                    onClick={stopTimer}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
                  >
                    Stop Timer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startTimer(task)}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Start Timer
                  </button>
                )}
                <a
                  href={task.practiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                >
                  Open Practice
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
