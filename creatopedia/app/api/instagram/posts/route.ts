import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { decrypt } from '@/lib/crypto'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after')

  const cookieStore = await cookies()
  const cookieHeader = cookieStore.get('next-auth.session-token')?.value || ''

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/instagram/posts`, {
      headers: { cookie: cookieHeader },
      params: { after }
    })
    return NextResponse.json(resp.data)
  } catch (error: any) {
    console.error('[API] Fetch Instagram Posts Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
