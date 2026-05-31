import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { emailCaptureSchema } from '@/lib/validations'
import { trackEvent } from '@/lib/analytics/track'
import { API_BASE_URL } from '@/lib/api/config'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = emailCaptureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, prompt_id } = parsed.data

  // Fetch prompt content from backend
  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${prompt_id}/page`)
    const prompt = resp.data
    if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

    // Fire-and-forget: post email capture to backend
    axios.post(`${API_BASE_URL.replace(/\/$/, '')}/prompts/email-capture`, { email, prompt_id }).catch(() => {})

    // Track analytics
    const sessionId = req.headers.get('x-session-id') ?? 'unknown'
    trackEvent({ event_type: 'email_capture', prompt_id, session_id: sessionId, request: req })
    trackEvent({ event_type: 'email_unlock', prompt_id, session_id: sessionId, request: req })

    return NextResponse.json({ content: prompt.content })
  } catch (e) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
  }
}
