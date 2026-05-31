'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdClient } from '@/types'

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm'
const labelCls = 'block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2'

interface Props {
  defaultValues?: Partial<AdClient>
  clientId?: string
}

type FieldErrors = Record<string, string[]>

export default function AdClientForm({ defaultValues, clientId }: Props) {
  const router = useRouter()
  const isEdit = !!clientId

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [company, setCompany] = useState(defaultValues?.company ?? '')
  const [email, setEmail] = useState(defaultValues?.email ?? '')
  const [phone, setPhone] = useState(defaultValues?.phone ?? '')
  const [website, setWebsite] = useState(defaultValues?.website ?? '')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [status, setStatus] = useState<'active' | 'inactive'>(defaultValues?.status ?? 'active')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setServerError(null)

    const body = {
      name,
      company: company || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      notes: notes || null,
      status,
    }

    const url = isEdit ? `/api/ads/clients/${clientId}` : '/api/ads/clients'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      if (data.error?.fieldErrors) {
        setErrors(data.error.fieldErrors)
      } else {
        setServerError(data.error ?? 'An error occurred')
      }
      return
    }

    router.push('/dashboard/ads/clients')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
          {serverError}
        </div>
      )}

      {/* Name */}
      <div>
        <label className={labelCls}>Client Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nike Nepal"
          className={inputCls}
          required
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>}
      </div>

      {/* Company + Email row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Company Name</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Nike Inc."
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Contact Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="marketing@nike.com"
            className={inputCls}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>}
        </div>
      </div>

      {/* Phone + Website row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Website URL</label>
          <input
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://nike.com"
            className={inputCls}
          />
          {errors.website && <p className="text-red-400 text-xs mt-1">{errors.website[0]}</p>}
        </div>
      </div>

      {/* Internal Notes */}
      <div>
        <label className={labelCls}>Internal Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any notes about this client — only you can see this..."
          rows={3}
          className={inputCls + ' resize-none'}
        />
        <p className="text-zinc-600 text-xs mt-1">Only visible to you.</p>
      </div>

      {/* Status + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-zinc-400">Status:</label>
          <button
            type="button"
            onClick={() => setStatus(s => s === 'active' ? 'inactive' : 'active')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${status === 'active' ? 'bg-emerald-600' : 'bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-semibold ${status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-indigo-500/20"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </div>
    </form>
  )
}
