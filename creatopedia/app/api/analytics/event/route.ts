import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { trackEvent } from '@/lib/analytics/track'
import { API_BASE_URL } from '@/lib/api/config'

export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // Forward to backend analytics endpoint
  axios.post(`${API_BASE_URL.replace(/\/$/, '')}/analytics/event`, body).catch(() => {})

  if (body.prompt_id && body.session_id) {
    try {
      const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${body.prompt_id}`)
      const prompt = resp.data
      trackEvent({
        event_type: (body.type === 'copy' || body.type === 'prompt_copy') ? 'prompt_copy' : body.type,
        prompt_id: body.prompt_id,
        creator_id: prompt?.creator_id,
        session_id: body.session_id,
        request: req,
      })
    } catch (_) {}
  }
  
  return NextResponse.json({ ok: true })
}
