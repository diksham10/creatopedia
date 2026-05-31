import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function DELETE() {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await axios.delete(`${API_BASE_URL.replace(/\/$/, '')}/instagram/disconnect`, { headers: { cookie: cookieHeader } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
