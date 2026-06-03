import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/api/config'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
]
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const url = formData.get('url') as string | null

  if (!file && !url) {
    return NextResponse.json({ error: 'No file or url provided' }, { status: 400 })
  }

  let buffer: Buffer
  let contentType: string
  let filename: string

  if (file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}.` }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 50MB.' }, { status: 400 })
    }
    filename = file.name
    contentType = file.type
    buffer = Buffer.from(await file.arrayBuffer())
  } else {
    // Fetch from URL
    try {
      console.log(`[Upload API] Downloading image from URL: ${url}`)
      const response = await fetch(url!)
      if (!response.ok) {
        return NextResponse.json({ error: `Failed to download image from URL: ${response.statusText}` }, { status: 400 })
      }
      contentType = response.headers.get('content-type') || 'image/jpeg'
      if (!ALLOWED_TYPES.includes(contentType)) {
        contentType = 'image/jpeg'
      }
      const ext = contentType.split('/').pop() ?? 'jpg'
      filename = `downloaded.${ext}`
      buffer = Buffer.from(await response.arrayBuffer())
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: `Failed to fetch image from URL: ${errorMessage}` }, { status: 500 })
    }
  }

  try {
    const cookieHeader = req.headers.get('cookie')
    const authHeader = req.headers.get('authorization')

    // Construct standard FormData to forward the file to the python backend
    const fd = new FormData()
    const blob = new Blob([buffer], { type: contentType })
    fd.append('file', blob, filename)

    const backendUrl = `${API_BASE_URL.replace(/\/$/, '')}/upload/file`
    console.log(`[Upload API] Forwarding upload to backend: ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: fd,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[Upload API] Backend upload failed: status=${response.status} body=${errText}`)
      return NextResponse.json({ error: `Upload failed: ${errText}` }, { status: response.status })
    }

    const data = await response.json()
    console.log(`[Upload API] ✓ Upload succeeded. Public URL: ${data.url}`)
    return NextResponse.json({ url: data.url })
  } catch (e: any) {
    const msg = e.message || String(e)
    console.error(`[Upload API] Exception in upload forwarding: ${msg}`)
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 })
  }
}
