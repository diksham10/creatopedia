import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

// Helper to safely grab ALL cookies (including FastAPI's access_token)
function getForwardableCookies(req: NextRequest) {
  return req.headers.get('cookie') || ''
}

export async function POST(req: NextRequest) {
  const cookieHeader = getForwardableCookies(req)
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

  try {
    const resp = await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/creators/init`, {
      email,
      name: base.charAt(0).toUpperCase() + base.slice(1),
      handle: `@${base}`,
      subdomain: base,
      brand_color: '#6366f1'
    }, { headers: { cookie: cookieHeader } })
    
    return NextResponse.json(resp.data)
  } catch (e: any) {
    const msg = e.response?.data?.detail || e.message || String(e)
    return NextResponse.json({ error: msg }, { status: e.response?.status || 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const cookieHeader = getForwardableCookies(req)
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    // Forward the PATCH request to FastAPI (Likely the /users/me/profile or /creators endpoint)
    // Make sure this URL matches what FastAPI expects!
    const resp = await axios.patch(`${API_BASE_URL.replace(/\/$/, '')}/users/me/profile`, body, {
      headers: { cookie: cookieHeader }
    })
    
    return NextResponse.json(resp.data)
  } catch (e: any) {
    const msg = e.response?.data?.detail || e.message || String(e)
    return NextResponse.json({ error: msg }, { status: e.response?.status || 400 })
  }
}