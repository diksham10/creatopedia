import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { trackEvent } from '@/lib/analytics/track'
import { API_BASE_URL } from '@/lib/api/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { campaign_id, placement_id, prompt_id, session_id, creator_id } = body

    if (!campaign_id || !placement_id) {
      return NextResponse.json({ error: 'campaign_id and placement_id required' }, { status: 400 })
    }

    const ua = req.headers.get('user-agent') ?? ''
    const device = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop'

    // Fire and forget — notify backend to record impression
    axios.post(`${API_BASE_URL.replace(/\/$/, '')}/ads/${campaign_id}/impression`, {
      placement_id,
      prompt_id: prompt_id ?? null,
      session_id: session_id ?? null,
      device,
      referrer: req.headers.get('referer') ?? null,
    }).catch(() => {})

    trackEvent({
      event_type: 'ad_impression',
      creator_id: creator_id ?? undefined,
      campaign_id,
      placement_id,
      prompt_id: prompt_id ?? undefined,
      session_id: session_id ?? 'unknown',
      request: req,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Always 200 — never block rendering
  }
}
