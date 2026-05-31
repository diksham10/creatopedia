import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { z } from 'zod'

const placementSchema = z.object({
  prompt_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  position: z.enum(['above_media', 'above_prompt', 'below_prompt', 'popup', 'creator_page']).default('above_prompt'),
  is_global: z.boolean().default(false),
})

const campaignUpdateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  client_id: z.string().uuid().optional().nullable(),
  banner_url: z.string().url().optional(),
  banner_alt: z.string().max(200).optional().nullable().or(z.literal('')),
  target_url: z.string().url().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional().nullable().or(z.literal('')),
  client_webhook_url: z.string().url().optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'paused', 'ended', 'scheduled']).optional(),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  placements: z.array(placementSchema).optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/ads/campaigns/${id}`, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data)
  } catch (e) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = campaignUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const resp = await axios.patch(`${API_BASE_URL.replace(/\/$/, '')}/ads/campaigns/${id}`, parsed.data, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await axios.delete(`${API_BASE_URL.replace(/\/$/, '')}/ads/campaigns/${id}`, { headers: { cookie: cookieHeader } })
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
