import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function POST(req: NextRequest) {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
