import { adminClient } from '@/lib/supabase/cli'

async function check() {
  const { count: viewsCount } = await adminClient.from('views').select('*', { count: 'exact', head: true })
  const { count: eventsCount } = await adminClient.from('events').select('*', { count: 'exact', head: true })
  const { count: analyticsEventsCount } = await adminClient.from('analytics_events').select('*', { count: 'exact', head: true })
  
  console.log({ viewsCount, eventsCount, analyticsEventsCount })
}

check()
