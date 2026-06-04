import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { trackEvent } from '@/lib/analytics/track'
import { API_BASE_URL } from '@/lib/api/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Determine the event type from type or event_type
    const rawType = body.event_type || body.type
    
    if (rawType) {
      let creatorId = body.creator_id
      
      // If prompt_id is provided but creator_id is not, fetch the prompt to get the creator_id
      if (body.prompt_id && !creatorId) {
        try {
          const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${body.prompt_id}`)
          const prompt = resp.data
          if (prompt?.creator_id) {
            creatorId = prompt.creator_id
          }
        } catch (_) {}
      }

      // Map copy/prompt_copy event types
      const event_type = (rawType === 'copy' || rawType === 'prompt_copy') ? 'prompt_copy' : rawType

      trackEvent({
        event_type,
        prompt_id: body.prompt_id ?? undefined,
        creator_id: creatorId ?? undefined,
        campaign_id: body.campaign_id ?? undefined,
        placement_id: body.placement_id ?? undefined,
        session_id: body.session_id ?? 'unknown',
        value: body.value ?? undefined,
        request: req,
      })
    }
  } catch (err) {
    console.error('[analytics/event] error:', err)
  }
  
  return NextResponse.json({ ok: true })
}
