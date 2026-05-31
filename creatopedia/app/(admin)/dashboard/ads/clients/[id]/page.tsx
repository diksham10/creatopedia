import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import AdClientForm from '@/components/dashboard/ads/AdClientForm'

interface Params { params: Promise<{ id: string }> }

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ended: 'bg-zinc-700/50 text-zinc-500 border-zinc-600/30',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default async function EditAdClientPage({ params }: Params) {
  const { id } = await params
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) notFound()
  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/ads/clients/${id}`, { headers: { cookie: cookieHeader } })
    const client = resp.data
    if (!client) notFound()
    const campaigns = client.ad_campaigns ?? []

    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Edit Client</h1>
          <p className="text-zinc-500 text-sm mt-1">{client.name}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <AdClientForm defaultValues={client} clientId={id} />
        </div>

        {/* Campaigns section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Campaigns</h2>
            <Link
              href={`/dashboard/ads/campaigns/new?client_id=${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Campaign
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="px-8 py-10 text-center text-zinc-500 text-sm">
              No campaigns yet for this client.
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-800">
                {campaigns.map((cam: { id: string; name: string; status: string; starts_at: string | null; ends_at: string | null }) => (
                  <tr key={cam.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-8 py-4">
                      <p className="font-semibold text-white">{cam.name}</p>
                      {cam.starts_at && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(cam.starts_at).toLocaleDateString()} — {cam.ends_at ? new Date(cam.ends_at).toLocaleDateString() : 'ongoing'}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CAMPAIGN_STATUS_STYLES[cam.status] ?? ''}`}>
                        {cam.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/ads/campaigns/${cam.id}`}
                        className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  } catch (err) {
    notFound()
  }
}
