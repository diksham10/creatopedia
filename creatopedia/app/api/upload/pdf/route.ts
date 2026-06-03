import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_BASE_URL } from '@/lib/api/config'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.get('next-auth.session-token')?.value || ''

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Invalid file type. Only PDF allowed.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 20MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    // Construct standard FormData to forward the file to the python backend
    const fd = new FormData()
    const blob = new Blob([buffer], { type: file.type })
    fd.append('file', blob, file.name)

    const backendUrl = `${API_BASE_URL.replace(/\/$/, '')}/upload/file`
    console.log(`[Upload PDF API] Forwarding upload to backend: ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        ...(cookieHeader ? { cookie: `next-auth.session-token=${cookieHeader}` } : {}),
      },
      body: fd,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[Upload PDF API] Backend upload failed: status=${response.status} body=${errText}`)
      return NextResponse.json({ error: `Upload failed: ${errText}` }, { status: response.status })
    }

    const data = await response.json()
    console.log(`[Upload PDF API] ✓ PDF upload succeeded. Public URL: ${data.url}`)
    return NextResponse.json({ url: data.url })
  } catch (e: any) {
    const msg = e.message || String(e)
    console.error(`[Upload PDF API] Exception in upload forwarding: ${msg}`)
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 })
  }
}
