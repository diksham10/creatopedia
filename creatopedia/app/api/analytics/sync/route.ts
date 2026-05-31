import { NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/analytics/sync`, {}, { headers: { cookie: cookieHeader } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[analytics/sync] error:', err)
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 })
  }
}
