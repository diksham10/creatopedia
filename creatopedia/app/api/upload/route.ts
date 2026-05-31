import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'
import { API_BASE_URL } from '@/lib/api/config'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const url = formData.get('url') as string | null

  if (!file && !url) {
    return NextResponse.json({ error: 'No file or url provided' }, { status: 400 })
  }

  let buffer: Buffer
  let contentType: string
  let ext = 'jpg'

  if (file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }
    ext = file.name.split('.').pop() ?? 'jpg'
    contentType = file.type
    buffer = Buffer.from(await file.arrayBuffer())
  } else {
    // Fetch image from URL
    try {
      console.log(`[Upload API] Downloading image from URL: ${url}`)
      const response = await fetch(url!)
      if (!response.ok) {
        return NextResponse.json({ error: `Failed to download image from URL: ${response.statusText}` }, { status: 400 })
      }
      contentType = response.headers.get('content-type') || 'image/jpeg'
      if (!ALLOWED_TYPES.includes(contentType)) {
        // Fallback to standard jpeg type
        contentType = 'image/jpeg'
      }
      ext = contentType.split('/').pop() ?? 'jpg'
      buffer = Buffer.from(await response.arrayBuffer())
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: `Failed to fetch image from URL: ${errorMessage}` }, { status: 500 })
    }
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  try {
    const form = new FormData()
    form.append('file', buffer, { filename })

    const headers: any = { ...form.getHeaders() }
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) headers.cookie = cookieHeader
    
    const authHeader = req.headers.get('authorization')
    if (authHeader) headers.authorization = authHeader

    const resp = await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/upload`, form, { headers })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 })
  }
}
