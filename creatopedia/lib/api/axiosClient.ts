import axios from 'axios'
import { API_BASE_URL } from './config'

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
})

// Helper to forward incoming cookie header when proxying from Next.js server routes
export function forwardCookiesHeaders(originalHeaders: HeadersInit = {}) {
  const headers: Record<string, string> = {}
  // preserve content-type if present
  if ((originalHeaders as any)['content-type']) {
    headers['content-type'] = (originalHeaders as any)['content-type']
  }
  if ((originalHeaders as any)['cookie']) {
    headers['cookie'] = (originalHeaders as any)['cookie']
  }
  return headers
}

export default axiosClient
