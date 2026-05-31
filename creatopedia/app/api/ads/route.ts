import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const position = searchParams.get('position')
  const creatorId = searchParams.get('creator_id')

  if (!position) return NextResponse.json({ error: 'position required' }, { status: 400 })

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/public/ads/placements`, {
      params: { position, creator_id: creatorId }
    })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
