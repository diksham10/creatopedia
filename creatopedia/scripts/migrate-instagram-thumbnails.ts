import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const ALGORITHM = 'aes-256-cbc'

// Helper to decrypt creator token
function decryptToken(encrypted: string, iv: string): string | null {
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY
  if (!encryptionKey) return null
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(encryptionKey, 'hex'), Buffer.from(iv, 'hex'))
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    return null
  }
}

// Check if a URL is still valid (returns 200 OK)
async function isUrlValid(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.status === 200
  } catch (e) {
    return false
  }
}

// Download image and upload to Supabase Storage
async function uploadToSupabase(imageUrl: string, slug: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) {
      console.warn(`[Download] Failed to download image from ${imageUrl}: ${res.statusText}`)
      return null
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.split('/').pop() ?? 'jpg'
    const filename = `migrated-${slug}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await res.arrayBuffer())

    const { error } = await supabase.storage
      .from('prompts')
      .upload(filename, buffer, { contentType, upsert: false })

    if (error) {
      console.error(`[Storage] Upload failed for ${filename}:`, error.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage.from('prompts').getPublicUrl(filename)
    return publicUrl
  } catch (e: any) {
    console.error(`[Storage] Exception during download/upload: ${e.message}`)
    return null
  }
}

// Get fresh media details from Instagram Graph API / oEmbed
async function getFreshInstagramMedia(videoUrl: string, creatorId: string): Promise<{ mediaUrl: string; thumbnailUrl?: string } | null> {
  const match = videoUrl.match(/(?:\/(?:p|reels|reel)\/)([A-Za-z0-9_-]+)/)
  if (!match) return null
  const shortcode = match[1]

  let token = process.env.INSTAGRAM_ACCESS_TOKEN
  let igUserId: string | null = null

  // Try to load creator token
  const { data: tokenRecord } = await supabase
    .from('creator_instagram_tokens')
    .select('*')
    .eq('creator_id', creatorId)
    .single()

  if (tokenRecord) {
    const decrypted = decryptToken(tokenRecord.encrypted_token, tokenRecord.iv)
    if (decrypted) {
      token = decrypted
      igUserId = tokenRecord.instagram_user_id
    }
  }

  if (!token) return null

  // 1. Try Feed API
  try {
    const endpoints = igUserId 
      ? [`https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,media_type,media_url,permalink,thumbnail_url&access_token=${token}`]
      : []
    
    endpoints.push(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,thumbnail_url&access_token=${token}`)

    for (const url of endpoints) {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const mediaList = data.data || []
      const found = mediaList.find((m: any) => m.permalink && m.permalink.includes(shortcode))
      if (found) {
        return {
          mediaUrl: found.media_url,
          thumbnailUrl: found.thumbnail_url
        }
      }
    }
  } catch (e) {
    console.error('[Instagram API] Feed check error:', e)
  }

  // 2. Fallback: Try oEmbed API directly (extremely clean and works for any public post!)
  try {
    const oembedEndpoint = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(videoUrl)}&access_token=${token}`
    const res = await fetch(oembedEndpoint)
    if (res.ok) {
      const data = await res.json()
      if (data.thumbnail_url) {
        console.log(`[OEmbed API] Successfully retrieved fresh thumbnail: ${data.thumbnail_url.substring(0, 60)}...`)
        return {
          mediaUrl: data.thumbnail_url,
          thumbnailUrl: data.thumbnail_url
        }
      }
    } else {
      console.warn(`[OEmbed API] Failed for URL ${videoUrl}: ${res.statusText}`)
    }
  } catch (e) {
    console.error('[Instagram API] oEmbed check error:', e)
  }

  return null
}

async function migrate() {
  console.log('=== Starting Enhanced Instagram Thumbnail Migration ===')

  // Fetch all prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, slug, thumbnail_url, share_image_url, video_url, creator_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching prompts from Supabase:', error.message)
    return
  }

  console.log(`Fetched ${prompts.length} total prompts. Analyzing for Instagram thumbnails...`)

  let migratedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const prompt of prompts) {
    const isInstagramThumb = prompt.thumbnail_url && prompt.thumbnail_url.includes('cdninstagram.com')
    if (!isInstagramThumb) {
      skippedCount++
      continue
    }

    console.log(`\nAnalyzing prompt: "${prompt.title}" (${prompt.slug})`)
    console.log(`- Current URL: ${prompt.thumbnail_url?.substring(0, 80)}...`)

    // Step 1: Check if share_image_url is already a permanent Supabase Storage URL
    const isShareImageSupabase = prompt.share_image_url && prompt.share_image_url.includes(supabaseUrl)
    if (isShareImageSupabase) {
      console.log(`[FAST PATH] Found permanent Supabase URL in share_image_url: ${prompt.share_image_url}`)
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ thumbnail_url: prompt.share_image_url })
        .eq('id', prompt.id)

      if (updateError) {
        console.error(`- Failed to update: ${updateError.message}`)
        errorCount++
      } else {
        console.log(`✓ Successfully updated thumbnail_url to permanent share_image_url!`)
        migratedCount++
      }
      continue
    }

    // Step 2: Check if current thumbnail is still valid
    const isValid = await isUrlValid(prompt.thumbnail_url!)
    if (isValid) {
      console.log(`- Current URL is still valid (200 OK). Uploading to Supabase...`)
      const permanentUrl = await uploadToSupabase(prompt.thumbnail_url!, prompt.slug)
      if (permanentUrl) {
        const { error: updateError } = await supabase
          .from('prompts')
          .update({ thumbnail_url: permanentUrl })
          .eq('id', prompt.id)

        if (updateError) {
          console.error(`- Failed to update: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`✓ Successfully migrated to permanent URL: ${permanentUrl}`)
          migratedCount++
        }
      } else {
        errorCount++
      }
      continue
    }

    // Step 3: URL is expired, try to fetch fresh URL from Instagram Graph API
    console.log(`- Current URL is EXPIRED (403/invalid). Attempting to fetch fresh URL from Instagram...`)
    if (!prompt.video_url) {
      console.warn(`- Skip: Prompt has no video_url to query Instagram API.`)
      errorCount++
      continue
    }

    const freshMedia = await getFreshInstagramMedia(prompt.video_url, prompt.creator_id)
    if (freshMedia) {
      const targetUrl = freshMedia.thumbnailUrl || freshMedia.mediaUrl
      console.log(`- Successfully retrieved fresh URL from Instagram. Uploading to Supabase...`)
      const permanentUrl = await uploadToSupabase(targetUrl, prompt.slug)
      if (permanentUrl) {
        const { error: updateError } = await supabase
          .from('prompts')
          .update({ 
            thumbnail_url: permanentUrl,
            share_image_url: prompt.share_image_url ? prompt.share_image_url : permanentUrl // set share image if empty
          })
          .eq('id', prompt.id)

        if (updateError) {
          console.error(`- Failed to update: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`✓ Successfully migrated to permanent URL: ${permanentUrl}`)
          migratedCount++
        }
      } else {
        errorCount++
      }
    } else {
      console.warn(`- Failed to retrieve fresh URL from Instagram API. Token might be invalid/expired.`)
      errorCount++
    }
  }

  console.log('\n=== Migration Complete ===')
  console.log(`- Total Migrated & Fixed: ${migratedCount}`)
  console.log(`- Skipped (Already permanent/clean): ${skippedCount}`)
  console.log(`- Errors / Could not fix: ${errorCount}`)
}

migrate()
