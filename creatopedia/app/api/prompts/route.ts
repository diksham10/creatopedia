// creatopedia/app/api/prompts/route.ts
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { revalidateTag } from 'next/cache'
import { Prompt } from '@/types'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/prompts`, { 
      headers: { cookie: cookieHeader } 
    })
    return NextResponse.json(resp.data as Prompt[])
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Get raw FormData from the frontend (Keep files intact!)
    const formData = await req.formData()

    // 2. Auto-generate slug if missing
    const title = formData.get('title') as string | null
    const slug = formData.get('slug') as string | null
    
    if ((!slug || slug === '') && title) {
      formData.set('slug', slugify(title))
    }

    // 3. Send directly to FastAPI
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/prompts`, {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
        // DO NOT set Content-Type here. Fetch automatically sets the multipart/form-data boundary!
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to create prompt')
    }

    const data = await response.json()

    // 4. Revalidate caches
    revalidateTag(`prompts-list-${data.creator_id}`, 'max')
    
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}