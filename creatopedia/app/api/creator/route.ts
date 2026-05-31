import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { creatorSettingsSchema } from '@/lib/validations'
import { revalidateTag } from 'next/cache'
import { Creator } from '@/types'

export async function GET() {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/users/me/profile`, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = creatorSettingsSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const resp = await axios.patch(`${API_BASE_URL.replace(/\/$/, '')}/users/me/profile`, parsed.data, { headers: { cookie: cookieHeader } })
    const data = resp.data
    revalidateTag(`creator-${data.subdomain}`, 'max')
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
