export async function fetchInstagramOEmbed(url: string, customToken?: string): Promise<string | null> {
  try {
    let token = customToken || process.env.INSTAGRAM_ACCESS_TOKEN
    
    // If no token, try to construct one from App ID and Secret if available
    if (!token && process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET) {
      token = `${process.env.INSTAGRAM_APP_ID}|${process.env.INSTAGRAM_APP_SECRET}`
    }

    if (!token) {
      console.warn('[OEmbed] No Instagram access token available')
      return null
    }

    const endpoint = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${token}`
    const res = await fetch(endpoint, { next: { revalidate: 3600 } })
    
    if (!res.ok) {
      const err = await res.json()
      console.error('[OEmbed] API Error:', err)
      return null
    }

    const data = await res.json()
    return data.html ?? null
  } catch (error) {
    console.error('[OEmbed] Error:', error)
    return null
  }
}
