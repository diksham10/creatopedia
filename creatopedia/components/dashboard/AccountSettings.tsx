'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'

interface Props {
  userEmail: string
}

export default function AccountSettings({ userEmail }: Props) {
  const [email, setEmail] = useState(userEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const router = useRouter()

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (email === userEmail) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await apiFetch('/users/me/email', {
        method: 'PUT',
        body: JSON.stringify({ email }),
      })
      setSuccess('Email updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email')
    }
    setLoading(false)
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await apiFetch('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ password }),
      })
      setSuccess('Password updated successfully!')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-12">
      {/* Email Section */}
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white">Email Address</h3>
          <p className="text-zinc-500 text-sm">Update your account email. You will need to verify the new email address.</p>
        </div>
        
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Current Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || email === userEmail}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </section>

      {/* Password Section */}
      <section className="space-y-6 pt-12 border-t border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-white">Change Password</h3>
          <p className="text-zinc-500 text-sm">Ensure your account is using a long, random password to stay secure.</p>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>

      {/* Status Messages */}
      {(error || success) && (
        <div className={`p-4 rounded-xl text-sm font-medium ${error ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {error || success}
        </div>
      )}
    </div>
  )
}
