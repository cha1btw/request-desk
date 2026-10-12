import { useCallback, useEffect, useState } from 'react'
import { api, getErrorMessage } from './client'

interface FetchResult<T> {
  key: string // which request this answer belongs to
  data: T | null
  error: string | null
}

// Loads `path` when the component mounts and again whenever `path` changes
// (for example when a filter changes). Call reload() to fetch it again.
export function useFetch<T>(path: string) {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState<FetchResult<T> | null>(null)

  // Identifies the request we want right now.
  const key = `${path}#${reloadCount}`

  useEffect(() => {
    // If the key changes before an answer arrives, the old answer must be
    // ignored, otherwise a slow response could overwrite a newer one.
    let ignore = false

    api
      .get<T>(path)
      .then((data) => {
        if (!ignore) setResult({ key, data, error: null })
      })
      .catch((error: unknown) => {
        if (!ignore) setResult({ key, data: null, error: getErrorMessage(error) })
      })

    return () => {
      ignore = true
    }
  }, [path, key])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  // Still waiting when the latest answer is for an older request.
  const loading = result?.key !== key
  return {
    // While reloading we keep showing the previous data instead of flashing an empty page.
    data: result?.data ?? null,
    error: loading ? null : (result?.error ?? null),
    loading,
    reload,
  }
}
