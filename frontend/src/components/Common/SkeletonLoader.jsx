export default function SkeletonLoader({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
}
