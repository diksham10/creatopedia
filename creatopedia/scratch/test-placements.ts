import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data, error } = await supabase.from('prompts').select('id').eq('slug', 'milan-raya-maji').single()
  if (error) {
    console.error('Error fetching prompt:', error)
    return
  }
  console.log('Prompt ID:', data.id)
  
  // Now call the placements logic directly
  const { data: placements, error: adErr } = await supabase
    .from('ad_placements')
    .select(`
      id,
      position,
      is_global,
      prompt_id,
      campaign:ad_campaigns(
        id,
        name,
        banner_url,
        banner_alt,
        target_url,
        utm_source,
        utm_medium,
        utm_campaign,
        status,
        starts_at,
        ends_at
      )
    `)
    .or(`prompt_id.eq.${data.id},is_global.eq.true`)
  
  console.log('Placements for this prompt:', JSON.stringify(placements, null, 2))
}

run()
