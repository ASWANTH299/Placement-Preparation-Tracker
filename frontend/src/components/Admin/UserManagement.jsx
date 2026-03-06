import { useEffect, useState } from 'react'
import { getAllUsers } from '../../services/adminService'
import { getErrorMessage } from '../../utils/errorHandler'

export default function UserManagement() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getAllUsers({ search })
        if (active) setUsers(response?.data?.data || [])
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [search])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="mt-4 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      {loading && <p className="mt-3 text-sm text-slate-500">Loading users...</p>}
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id || user.email} className="border-b border-slate-100">
                <td className="py-2">{user.name}</td>
                <td className="py-2">{user.email}</td>
                <td className="py-2">{user.role}</td>
                <td className="py-2">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
