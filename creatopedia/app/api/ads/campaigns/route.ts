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

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(150),
  client_id: z.string().uuid().optional().nullable(),
  banner_url: z.string().url('Banner URL required'),
  banner_alt: z.string().max(200).optional().nullable().or(z.literal('')),
  target_url: z.string().url('Destination URL required'),
  utm_source: z.string().default('creatopedia'),
  utm_medium: z.string().default('banner'),
  utm_campaign: z.string().optional().nullable().or(z.literal('')),
  client_webhook_url: z.string().url().optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'paused', 'ended', 'scheduled']).default('active'),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  placements: z.array(placementSchema).default([]),
})

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/ads/campaigns`, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = campaignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const resp = await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/ads/campaigns`, parsed.data, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
