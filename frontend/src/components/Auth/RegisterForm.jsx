export default function RegisterForm({ onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
    </form>
  )
}
