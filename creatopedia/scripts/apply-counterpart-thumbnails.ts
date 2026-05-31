import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyPragmaticFixes() {
  console.log('=== Applying Counterpart Thumbnail Fixes ===')

  // 1. Fix "वैदिक ज्योतिष विश्लेषण प्रॉम्प्ट" (slug: kundali)
  // Set to the permanent Supabase astrology image from kundali-prompt
  const astrologyImageUrl = 'https://slbywxgigzuodyrmhdsg.supabase.co/storage/v1/object/public/prompts/1778431119342-39ag0bov4vj.jpg'
  const { error: error1 } = await supabase
    .from('prompts')
    .update({ 
      thumbnail_url: astrologyImageUrl,
      share_image_url: astrologyImageUrl
    })
    .eq('slug', 'kundali')

  if (error1) {
    console.error('Failed to update kundali prompt:', error1.message)
  } else {
    console.log('✓ Successfully mapped "kundali" prompt to permanent astrology thumbnail!')
  }

  // 2. Fix "AI Modifier" (slug: ai-modifier)
  // Set to the permanent Supabase AI tools image from ai-tools
  const aiToolsImageUrl = 'https://slbywxgigzuodyrmhdsg.supabase.co/storage/v1/object/public/prompts/1778424673021-9g0dzydgbde.png'
  const { error: error2 } = await supabase
    .from('prompts')
    .update({ 
      thumbnail_url: aiToolsImageUrl,
      share_image_url: aiToolsImageUrl
    })
    .eq('slug', 'ai-modifier')

  if (error2) {
    console.error('Failed to update ai-modifier prompt:', error2.message)
  } else {
    console.log('✓ Successfully mapped "ai-modifier" prompt to permanent AI tools thumbnail!')
  }

  console.log('=== All Pragmatic Fixes Applied Successfully! ===')
}

applyPragmaticFixes()
