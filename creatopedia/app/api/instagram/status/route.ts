import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function GET() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.get('next-auth.session-token')?.value || ''

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/instagram/status`, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data)
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
