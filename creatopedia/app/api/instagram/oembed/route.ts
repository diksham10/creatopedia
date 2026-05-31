import { NextResponse } from 'next/server'
import { fetchInstagramOEmbed } from '@/lib/oembed'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const html = await fetchInstagramOEmbed(url)
    return NextResponse.json({ html })
  } catch (error: any) {
    console.error('[API] OEmbed Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
