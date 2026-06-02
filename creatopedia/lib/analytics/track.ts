import { apiFetch } from '@/lib/api/client'

export type AnalyticsEventType =
  | 'prompt_view'
  | 'prompt_copy'
  | 'email_capture'
  | 'email_unlock'
  | 'payment_unlock'
  | 'pdf_view'
  | 'pdf_download'
  | 'ad_impression'
  | 'ad_click'
  | 'ad_view_duration'

// 🔴 THE TRANSLATOR: Maps frontend event names to the strict FastAPI Enums
const EVENT_MAP: Record<string, string> = {
  'prompt_view': 'view',
  'pdf_view': 'view',
  'ad_view_duration': 'view',
  'prompt_copy': 'copy',
  'email_unlock': 'email_capture',
  'email_capture': 'email_capture',
  'payment_unlock': 'click',
  'pdf_download': 'click',
  'ad_impression': 'ad_impression',
  'ad_click': 'ad_click'
}

export function trackEvent({
  event_type, creator_id, prompt_id, campaign_id,
  placement_id, session_id, value, request,
}: {
  event_type: AnalyticsEventType
  creator_id?: string
  prompt_id?: string
  campaign_id?: string
  placement_id?: string
  session_id: string
  value?: number
  request?: Request | { headers: { get(name: string): string | null } }
}) {
  const ua = request?.headers.get('user-agent') ?? ''
  const country = request?.headers.get('x-vercel-ip-country') ?? null
  const city = request?.headers.get('x-vercel-ip-city') ?? null
  const referrer = request?.headers.get('referer') ?? null
  const device_type = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop'
  const is_valid = !/bot|crawler|spider|headless|phantom|selenium/i.test(ua)

  // Get the translated event type, or fallback to 'view' if something weird happens
  const backend_event_type = EVENT_MAP[event_type] || 'view'

  // Fire and forget — never await this
  apiFetch('/analytics/event', {
    method: 'POST',
    body: JSON.stringify({
      event_type: backend_event_type, // 🔴 Use the translated event type here!
      creator_id: creator_id ?? null,
      entity_id: prompt_id ?? null,
      entity_type: prompt_id ? 'prompt' : null,
      session_id,
      metadata: {
        original_event: event_type, // We can still pass the original name in metadata!
        campaign_id: campaign_id ?? null,
        placement_id: placement_id ?? null,
        referrer,
        device_type,
        country,
        city,
        value: value ?? null,
        is_valid,
      },
    }),
  }).catch((error) => {
    console.error('[trackEvent] Request failed:', error)
  })
}