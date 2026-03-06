import { useState } from 'react'

const subTopics = ['Time Complexity', 'Sliding Window', 'Two Pointers']

export default function LearningPathDetail() {
  const [checked, setChecked] = useState({})

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Week Detail - Arrays</h1>
      <p className="mt-2 text-sm text-slate-600">Estimated duration: 8 hours • Difficulty: Intermediate</p>

      <div className="mt-5 space-y-3">
        {subTopics.map((topic) => (
          <label key={topic} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
            <span className="text-sm text-slate-700">{topic}</span>
            <input
              type="checkbox"
              checked={Boolean(checked[topic])}
              onChange={() => setChecked((prev) => ({ ...prev, [topic]: !prev[topic] }))}
            />
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">Mark Week Complete</button>
        <button className="rounded border border-slate-300 px-4 py-2 text-sm">Mark In Progress</button>
      </div>
    </section>
  )
}
