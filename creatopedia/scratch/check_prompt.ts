
import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPrompt() {
  const subdomain = process.argv[2]
  const slug = process.argv[3]

  if (!subdomain || !slug) {
    console.error('Usage: npx tsx scratch/check_prompt.ts <subdomain> <slug>')
    process.exit(1)
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('subdomain', subdomain)
    .single()

  if (!creator) {
    console.error('Creator not found')
    process.exit(1)
  }

  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('creator_id', creator.id)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching prompt:', error.message)
    process.exit(1)
  }

  console.log(JSON.stringify(prompt, null, 2))
}

checkPrompt()
