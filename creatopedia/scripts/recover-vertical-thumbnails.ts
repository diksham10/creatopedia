import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY!

if (!supabaseUrl || !supabaseKey || !encryptionKey) {
  console.error('Error: SUPABASE and TOKEN_ENCRYPTION_KEY must be set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const ALGORITHM = 'aes-256-cbc'

// Helper to decrypt creator token
function decrypt(encrypted: string, iv: string): string | null {
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

// Download and upload image to Supabase Storage
async function uploadToSupabase(imageUrl: string, slug: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) {
      console.warn(`[Download] Failed to download image from ${imageUrl}: ${res.statusText}`)
      return null
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.split('/').pop() ?? 'jpg'
    const filename = `vertical-${slug}-${Date.now()}.${ext}`
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

async function recover() {
  console.log('=== STARTING VERTICAL THUMBNAIL RECOVERY ===')

  // Fetch prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, slug, thumbnail_url, share_image_url, video_url, creator_id')

  if (error) {
    console.error('Error fetching prompts:', error.message)
    return
  }

  // Group prompts by creator to fetch their live feeds once
  const promptsByCreator: Record<string, typeof prompts> = {}
  for (const p of prompts) {
    if (!p.video_url || !p.creator_id) continue
    if (!promptsByCreator[p.creator_id]) {
      promptsByCreator[p.creator_id] = []
    }
    promptsByCreator[p.creator_id].push(p)
  }

  for (const creatorId of Object.keys(promptsByCreator)) {
    console.log(`\nProcessing prompts for Creator ID: ${creatorId}`)

    // Get Decrypted Token
    const { data: tokenRecord } = await supabase
      .from('creator_instagram_tokens')
      .select('*')
      .eq('creator_id', creatorId)
      .single()

    if (!tokenRecord) {
      console.warn(`- No Instagram token found for Creator ${creatorId}, skipping feed fetch.`)
      continue
    }

    const token = decrypt(tokenRecord.encrypted_token, tokenRecord.iv)
    if (!token) {
      console.error(`- Failed to decrypt token for Creator ${creatorId}`)
      continue
    }

    console.log(`- Token decrypted successfully! Fetching live Instagram media feed...`)

    // Fetch feed
    let mediaList: any[] = []
    try {
      const endpoints = [
        `https://graph.facebook.com/v19.0/${tokenRecord.instagram_user_id}/media?fields=id,media_type,media_url,permalink,thumbnail_url&limit=100&access_token=${token}`,
        `https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,thumbnail_url&limit=100&access_token=${token}`
      ]

      for (const endpoint of endpoints) {
        const res = await fetch(endpoint)
        if (res.ok) {
          const data = await res.json()
          if (data.data) {
            mediaList = data.data
            console.log(`- Successfully retrieved ${mediaList.length} media items from feed!`)
            break
          }
        }
      }
    } catch (err: any) {
      console.error(`- Feed fetch exception: ${err.message}`)
    }

    if (mediaList.length === 0) {
      console.warn(`- Feed was empty or failed to load. Skipping creator's prompts.`)
      continue
    }

    // Match prompts with feed items
    const creatorPrompts = promptsByCreator[creatorId]
    for (const prompt of creatorPrompts) {
      console.log(`\nPrompt: "${prompt.title}" (${prompt.slug})`)

      const match = prompt.video_url!.match(/(?:\/(?:p|reels|reel)\/)([A-Za-z0-9_-]+)/)
      if (!match) {
        console.warn(`- Invalid Instagram URL: ${prompt.video_url}`)
        continue
      }
      const shortcode = match[1]

      const foundMedia = mediaList.find((m: any) => m.permalink && m.permalink.includes(shortcode))
      if (!foundMedia) {
        console.warn(`- No matching post found in feed for shortcode ${shortcode}`)
        continue
      }

      const verticalImageUrl = foundMedia.thumbnail_url || foundMedia.media_url
      if (!verticalImageUrl) {
        console.warn(`- Matching post had no image URL`)
        continue
      }

      console.log(`- Found vertical Reels thumbnail in live feed!`)
      console.log(`- Live image: ${verticalImageUrl.substring(0, 70)}...`)

      // Upload vertical image to Supabase
      const newVerticalSupabaseUrl = await uploadToSupabase(verticalImageUrl, prompt.slug)
      if (newVerticalSupabaseUrl) {
        console.log(`- Uploaded vertical image to Supabase: ${newVerticalSupabaseUrl}`)

        // Update database thumbnail_url (keep share_image_url separate!)
        const { error: updateError } = await supabase
          .from('prompts')
          .update({ thumbnail_url: newVerticalSupabaseUrl })
          .eq('id', prompt.id)

        if (updateError) {
          console.error(`❌ Failed to update database: ${updateError.message}`)
        } else {
          console.log(`✅ Successfully updated database thumbnail_url! (share_image_url left untouched: ${prompt.share_image_url})`)
        }
      }
    }
  }

  console.log('\n=== RECOVERY COMPLETE ===')
}

recover()
