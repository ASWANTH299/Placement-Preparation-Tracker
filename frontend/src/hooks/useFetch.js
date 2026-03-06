import { useEffect, useState } from 'react'

export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        setLoading(true)
        const result = await fetcher()
        if (active) setData(result)
      } catch (err) {
        if (active) setError(err)
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, deps)

  return { data, loading, error }
}
