'use client'

import { useState } from 'react'
import SettingsForm from './SettingsForm'
import type { Creator } from '@/types'
import type { InstagramUser, InstagramMedia } from '@/lib/instagram'
import InstagramView from '@/components/public/InstagramView'

import AccountSettings from './AccountSettings'
import type { AdCampaign } from '@/types'
import DiscoveryHubAds from './ads/DiscoveryHubAds'

interface Props {
  creator: Creator
  userEmail: string
  igUser: InstagramUser | null
  igFeed: InstagramMedia[]
  campaigns: AdCampaign[]
  clients: { id: string; name: string }[]
  prompts: { id: string; title: string; slug: string }[]
  categories: { id: string; name: string }[]
}

export default function ControlCenter({
  creator,
  userEmail,
  igUser,
  igFeed,
  campaigns,
  clients,
  prompts,
  categories
}: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'instagram' | 'account' | 'ads'>('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'ads', label: 'Discovery Hub Ads', icon: '📢' },
    { id: 'account', label: 'Account & Security', icon: '🔒' },
    { id: 'integrations', label: 'Integrations', icon: '🔌' },
    { id: 'instagram', label: 'Instagram Profile', icon: '📸' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Tabs Header */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
              ? 'bg-zinc-800 text-white shadow-lg'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Public Profile</h2>
              <p className="text-zinc-500 text-sm">How you appear to the world on your discovery hub.</p>
            </div>
            <SettingsForm defaultValues={creator} section="profile" />
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Discovery Hub Ads</h2>
              <p className="text-zinc-500 text-sm">Manage ad slots and campaigns on your discovery page grid.</p>
            </div>
            <DiscoveryHubAds
              creator={creator}
              campaigns={campaigns}
              clients={clients}
              prompts={prompts}
              categories={categories}
            />
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Account & Security</h2>
              <p className="text-zinc-500 text-sm">Manage your login credentials and security preferences.</p>
            </div>
            <AccountSettings userEmail={userEmail} />
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Integrations</h2>
              <p className="text-zinc-500 text-sm">Securely connect your social API keys for automated features.</p>
            </div>
            <SettingsForm defaultValues={creator} section="integrations" />
          </div>
        )}
        {activeTab === 'instagram' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white">Instagram Preview</h2>
              <p className="text-zinc-500 text-sm">Review how your Instagram profile appears to visitors.</p>
            </div>

            {igUser ? (
              <div className="rounded-2xl overflow-hidden -mx-8 md:mx-0 border border-zinc-800">
                <InstagramView
                  user={igUser}
                  feed={igFeed}
                  creator={creator}
                />
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-500 mb-4 text-sm font-medium">Your Instagram account is not connected.</p>
                <button
                  onClick={() => setActiveTab('integrations')}
                  className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                >
                  Connect Instagram Now →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
