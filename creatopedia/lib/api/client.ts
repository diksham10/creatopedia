import { API_BASE_URL } from './config'

type ApiFetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
  skipAuthFlow?: boolean
}

// Ensure you don't have multiple overlapping refresh requests
let isRefreshing = false
let refreshPromise: Promise<void> | null = null

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
  retries = 1
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  }

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  
  // Ensure cookies are sent with cross-origin or same-origin requests
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  }

  let response = await fetch(url, fetchOptions)

  // Handle 401 Unauthorized with token refresh mechanism
  if (!options.skipAuthFlow && response.status === 401 && retries > 0) {
    try {
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // The backend will read the HttpOnly refresh_token cookie
        }).then(async (res) => {
          if (!res.ok) throw new Error('Refresh failed')
        }).finally(() => {
          isRefreshing = false
          refreshPromise = null
        })
      }

      // Wait for the refresh to complete
      await refreshPromise

      // Retry original request exactly once. The browser will automatically attach the new cookies.
      response = await fetch(url, fetchOptions)
      
    } catch (error) {
      window?.location?.replace('/login')
      throw new Error('Session expired. Please log in again.')
    }
  }

  if (!options.skipAuthFlow && response.status === 401 && retries === 0) {
    window?.location?.replace('/login')
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

/**
 * Cookie-based auth logout.
 *
 * With HttpOnly cookies, the client cannot manually clear tokens; it must call
 * the backend logout endpoint which clears `access_token`/`refresh_token`.
 */
export async function clearTokens(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Best-effort: even if network fails, UI will still redirect to /login.
  }
}

/**
 * Unified client-side file upload using the Next.js server-side upload route.
 * The server handles the presign request and PUT to B2 to avoid CORS/403 issues.
 * Handles images, PDFs, and videos.
 */
export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: fd,
    credentials: 'include',
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || `Upload failed with status ${response.status}`)
  }

  const data = await response.json()
  if (!data.url) throw new Error('Upload succeeded but no URL was returned')
  return data.url
}
