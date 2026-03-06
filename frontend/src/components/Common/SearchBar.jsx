export default function SearchBar({ value, onChange, placeholder = 'Search...', label = 'Search' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={onChange}
      aria-label={label}
      placeholder={placeholder}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
    />
  )
}
