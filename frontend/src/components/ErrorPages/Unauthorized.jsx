import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">Access Denied</h1>
      <p className="mt-2 text-slate-600">You do not have permission to access this page.</p>
      <Link to="/dashboard" className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white">Go Home</Link>
    </section>
  )
}
