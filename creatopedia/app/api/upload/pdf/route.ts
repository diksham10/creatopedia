import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'
import { cookies } from 'next/headers'
import { API_BASE_URL } from '@/lib/api/config'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.get('next-auth.session-token')?.value || ''

  // Verify user by asking backend profile endpoint (backend will validate session cookie)
  let user: any = null
  try {
    const profile = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/users/me/profile`, { headers: { cookie: cookieHeader } })
    user = profile.data
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Invalid file type. Only PDF allowed.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 20MB.' }, { status: 400 })
  }

  const crypto = await import('crypto')
  const uuid = crypto.randomUUID()
  const path = `pdfs/${user.id}/${uuid}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const form = new FormData()
    form.append('file', buffer, { filename: path })

    const headers: any = { ...form.getHeaders() }
    const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
    if (cookieHeader) headers.cookie = cookieHeader

    const resp = await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/upload/pdf`, form, { headers })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 })
  }
}
