import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { z } from 'zod'

const slotSchema = z.object({
  index: z.number().min(-1),
  campaign_id: z.string().uuid(),
})

const bodySchema = z.object({
  slots: z.array(slotSchema),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const creatorId = searchParams.get('creator_id')

  if (!creatorId) return NextResponse.json({ error: 'creator_id required' }, { status: 400 })

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/ads/placements/discovery`, { params: { creator_id: creatorId } })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Forward to backend to update discovery slots for this creator
    const resp = await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/ads/placements/discovery`, parsed.data, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
