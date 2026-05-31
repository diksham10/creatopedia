import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

// Behind a reverse proxy the internal request.url is http://127.0.0.1:3000/...
// Use x-forwarded-* headers to reconstruct the real public base URL.
function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }
  // Fallback: use configured base domain
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'creatopedia.tech'
  return `https://${baseDomain}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const baseUrl = getBaseUrl(request)

  if (errorParam) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=${encodeURIComponent(errorParam)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=no_code`)
  }

  const state = searchParams.get('state') || ''

  // Redirect to the client-side settings page so the browser can execute the callback 
  // natively using localStorage JWT tokens via apiFetch.
  return NextResponse.redirect(`${baseUrl}/dashboard/settings?instagram_code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
}
