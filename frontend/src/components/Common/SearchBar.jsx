export default function SearchBar({ value, onChange, placeholder = 'Search...', label = 'Search' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={onChange}
      aria-label={label}
      placeholder={placeholder}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
    />
  )
}
