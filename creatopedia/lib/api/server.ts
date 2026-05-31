import { API_BASE_URL } from './config'

type ApiFetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

export async function apiFetchServer<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  }

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers,
    cache: options.cache ?? 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}
