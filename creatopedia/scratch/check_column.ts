import { createClient } from '@/lib/supabase/cli'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumn() {
  const { data, error } = await supabase
    .from('prompts')
    .select('share_image_url')
    .limit(1)

  if (error) {
    console.error('Error selecting share_image_url:', error)
    if (error.message.includes('column "share_image_url" does not exist')) {
      console.log('COLUMN DOES NOT EXIST. We need to add it.')
    }
  } else {
    console.log('Column share_image_url EXISTS.')
  }
}

checkColumn()
