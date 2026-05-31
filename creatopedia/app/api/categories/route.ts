import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { categorySchema } from '@/lib/validations'

export async function GET() {
  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/categories`)
    return NextResponse.json(resp.data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = categorySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const resp = await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/categories`, parsed.data, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
