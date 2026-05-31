import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing prompt ID' }, { status: 400 })

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${id}/page`)
    const data = resp.data
    return NextResponse.json({ pageId: data.id })
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
