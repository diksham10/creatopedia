'use client'

import { useEffect } from 'react'

type Props = {
  subdomain: string
  path?: string
}

export default function SubdomainViewTracker({ subdomain, path = '/' }: Props) {
  useEffect(() => {
    const resolvedPath = typeof window !== 'undefined' ? window.location.pathname : path
    const dedupeKey = `ph_subdomain_visit:${subdomain}:${resolvedPath}`

    if (typeof window !== 'undefined' && window.sessionStorage.getItem(dedupeKey)) {
      return
    }

    const run = async () => {
      try {
        await fetch('/api/analytics/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            subdomain,
            path: resolvedPath,
          }),
        })
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(dedupeKey, '1')
        }
      } catch {
        // non-blocking
      }
    }

    run()
  }, [path, subdomain])

  return null
}