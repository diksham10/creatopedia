// creatopedia/app/api/creator/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { creatorSettingsSchema } from '@/lib/validations'
import { revalidateTag } from 'next/cache'

// Helper to safely grab ALL cookies (including FastAPI's access_token)
function getForwardableCookies(req: NextRequest) {
  return req.headers.get('cookie') || ''
}

export async function GET(req: NextRequest) {
  const cookieHeader = getForwardableCookies(req)
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/users/me/profile`, { 
      headers: { cookie: cookieHeader } 
    })
    return NextResponse.json(resp.data)
  } catch (e: any) {
    const msg = e.response?.data?.detail || e.message || String(e)
    return NextResponse.json({ error: msg }, { status: e.response?.status || 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const cookieHeader = getForwardableCookies(req)
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = creatorSettingsSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    // 🔴 CHANGED: FastAPI expects PUT for updating the profile!
    const resp = await axios.put(`${API_BASE_URL.replace(/\/$/, '')}/users/me/profile`, parsed.data, { 
      headers: { cookie: cookieHeader } 
    })
    
    const data = resp.data
    revalidateTag(`creator-${data.subdomain}`, 'max')
    
    return NextResponse.json(data)
  } catch (e: any) {
    const msg = e.response?.data?.detail || e.message || String(e)
    return NextResponse.json({ error: msg }, { status: e.response?.status || 400 })
  }
}