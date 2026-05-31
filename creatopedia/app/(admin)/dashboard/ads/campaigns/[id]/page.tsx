import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import AdCampaignForm from '@/components/dashboard/ads/AdCampaignForm'
import type { AdCampaign } from '@/types'

interface Params { params: Promise<{ id: string }> }

export default async function EditAdCampaignPage({ params }: Params) {
  const { id } = await params
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) notFound()

  const base = API_BASE_URL.replace(/\/$/, '')
  const [campaignResp, clientsResp, promptsResp, categoriesResp] = await Promise.all([
    axios.get(`${base}/ads/campaigns/${id}`, { headers: { cookie: cookieHeader } }),
    axios.get(`${base}/ads/clients`, { headers: { cookie: cookieHeader } }),
    axios.get(`${base}/prompts?status=published`, { headers: { cookie: cookieHeader } }),
    axios.get(`${base}/categories`, { headers: { cookie: cookieHeader } })
  ])

  const campaign = campaignResp.data
  if (!campaign) notFound()

  const clients = clientsResp.data || []
  const prompts = promptsResp.data || []
  const categories = categoriesResp.data || []

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Edit Ad Campaign</h1>
        <p className="text-zinc-500 text-sm mt-1">{campaign.name}</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <AdCampaignForm 
          defaultValues={campaign as AdCampaign} 
          campaignId={id} 
          clients={clients ?? []} 
          prompts={prompts ?? []} 
          categories={categories ?? []}
        />
      </div>
    </div>
  )
}
