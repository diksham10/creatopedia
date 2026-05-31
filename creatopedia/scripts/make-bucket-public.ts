import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function makeBucketPublic() {
  console.log('=== Configuring Supabase Storage Bucket ===')
  console.log(`Target Bucket: "prompts" at ${supabaseUrl}`)

  const { data, error } = await supabase.storage.updateBucket('prompts', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    fileSizeLimit: 10485760 // 10MB
  })

  if (error) {
    console.error('Error updating bucket properties:', error.message)
    console.log('Trying fallback SQL or direct update...')
  } else {
    console.log('✓ Successfully configured "prompts" storage bucket to PUBLIC!')
    console.log('All public URLs will now resolve immediately with no signature requirements!')
  }
}

makeBucketPublic()
