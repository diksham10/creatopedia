import { NextResponse } from 'next/server'

export async function GET() {
  // Use the Instagram-specific Client ID from the "Instagram Login for Business" product
  // This is NOT the primary Facebook App ID — it's the Instagram App ID shown in
  // Use Cases > Instagram API > API setup with Instagram login
  const clientId = process.env.INSTAGRAM_CLIENT_ID
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Instagram credentials not configured. Ensure INSTAGRAM_CLIENT_ID and INSTAGRAM_REDIRECT_URI are set.' },
      { status: 500 }
    )
  }

  // Instagram Login for Business scopes
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish',
    'instagram_business_manage_insights',
  ].join(',')

  // Use the instagram.com authorize URL — this matches the Embed URL in your Meta dashboard
  const url = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`

  return NextResponse.redirect(url)
}
