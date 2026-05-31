import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { trackEvent } from '@/lib/analytics/track'
import { API_BASE_URL } from '@/lib/api/config'

function buildUtmUrl(base: string, params: Record<string, string | null | undefined>) {
  const url = new URL(base)
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v)
  })
  return url.toString()
}

async function fireWebhook(webhookUrl: string, payload: Record<string, unknown>) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch { /* ignore webhook failures */ }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const placementId = searchParams.get('placement_id')
  const campaignId = searchParams.get('campaign_id')
  const promptId = searchParams.get('prompt_id')

  if (!placementId || !campaignId) {
    return NextResponse.json({ error: 'placement_id and campaign_id required' }, { status: 400 })
  }

  // Fetch campaign data from backend
  let campaign: any = null
  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/ads/campaigns/${campaignId}`)
    campaign = resp.data
  } catch (e) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const ua = req.headers.get('user-agent') ?? ''
  const device = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop'

  // Log click async via backend
  axios.post(`${API_BASE_URL.replace(/\/$/, '')}/ads/${campaignId}/click`, {
    placement_id: placementId,
    prompt_id: promptId ?? null,
    device,
  }).catch(() => {})

  const sessionId = searchParams.get('session_id') ?? 'unknown'
  trackEvent({
    event_type: 'ad_click',
    creator_id: campaign.creator_id ?? undefined,
    campaign_id: campaignId,
    placement_id: placementId ?? undefined,
    prompt_id: promptId ?? undefined,
    session_id: sessionId,
    request: req,
  })

  // Fire webhook async (no await)
  if (campaign.client_webhook_url) {
    fireWebhook(campaign.client_webhook_url, {
      event: 'click',
      campaign_id: campaignId,
      placement_id: placementId,
      prompt_id: promptId,
      timestamp: new Date().toISOString(),
    })
  }

  // Build redirect URL with UTM params
  const redirectUrl = buildUtmUrl(campaign.target_url, {
    utm_source: campaign.utm_source,
    utm_medium: campaign.utm_medium,
    utm_campaign: campaign.utm_campaign,
    utm_content: promptId ?? undefined,
  })

  return NextResponse.redirect(redirectUrl, 302)
}
