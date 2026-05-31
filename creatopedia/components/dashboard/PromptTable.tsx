'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import {
  Eye,
  Edit2,
  Trash2,
  Cloud,
  CloudOff,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import type { Prompt } from '@/types'
import PromptModal from './PromptModal'

interface PromptWithCategory extends Prompt {
  categories?: {
    name: string
  }
}

interface Props {
  prompts: PromptWithCategory[]
  subdomain: string
}

const GATE_STYLES: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  payment: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  draft: 'bg-zinc-700/50 text-zinc-500 border-zinc-600/30',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PromptTable({ prompts: initial, subdomain }: Props) {
  const router = useRouter()
  const [prompts, setPrompts] = useState(initial)

  // Update internal state when initial prompts change
  useEffect(() => {
    setPrompts(initial)
  }, [initial])

  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<PromptWithCategory | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const siteUrl = (slug: string) => `/${subdomain}/${slug}`

  async function handleCopyLink(p: PromptWithCategory) {
    const fullUrl = `${window.location.origin}${siteUrl(p.slug)}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopiedId(p.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  async function handleToggleStatus(p: PromptWithCategory) {
    setTogglingId(p.id)
    const newStatus = p.status === 'published' ? 'draft' : 'published'
    try {
      await apiFetch(`/prompts/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setPrompts(prev => prev.map(x => x.id === p.id ? { ...x, status: newStatus } : x))
      startTransition(() => router.refresh())
    } catch {}
    setTogglingId(null)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await apiFetch(`/prompts/${id}`, { method: 'DELETE' })
      setPrompts(prev => prev.filter(p => p.id !== id))
    } catch {}
    setDeletingId(null)
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl mb-4">📝</div>
        <p className="text-white font-bold text-lg mb-2">No prompts yet</p>
        <p className="text-zinc-500 text-sm mb-6">Create your first prompt to get started.</p>
        <Link href="/dashboard/prompts/new" className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-bold text-white transition-all">
          Create First Prompt
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-800">
      <table className="w-full text-sm overflow-hidden rounded-2xl">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="text-left px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Title</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Category</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Tool</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gate</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
            <th className="text-center px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Link</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Created</th>
            <th className="px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {prompts.map((p) => (
            <tr key={p.id} className={`hover:bg-zinc-900/40 transition-colors ${deletingId === p.id ? 'opacity-40' : ''}`}>
              <td className="px-5 py-4">
                <div>
                  <p className="font-semibold text-white truncate max-w-[200px]">{p.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">/{p.slug}</p>
                </div>
              </td>
              <td className="px-4 py-4 hidden md:table-cell">
                <span className="text-xs text-zinc-400">{p.categories?.name || 'Uncategorized'}</span>
              </td>
              <td className="px-4 py-4 hidden lg:table-cell">
                <span className="text-xs font-semibold text-zinc-300">{p.ai_tool}</span>
              </td>
              <td className="px-4 py-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${GATE_STYLES[p.gate_type]}`}>
                  {p.gate_type}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={siteUrl(p.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-zinc-900/50 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-zinc-800/50 hover:border-indigo-500/20 transition-all"
                    title="Open Link"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => handleCopyLink(p)}
                    className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border transition-all ${
                      copiedId === p.id 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-zinc-900/50 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 border-zinc-800/50 hover:border-indigo-500/20'
                    }`}
                    title="Copy Link"
                  >
                    {copiedId === p.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </td>
              <td className="px-4 py-4 hidden xl:table-cell">
                <span className="text-xs text-zinc-500">{formatDate(p.created_at)}</span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/prompts/${p.id}/view`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-600/10 border border-transparent hover:border-indigo-500/20 transition-all"
                    title="View"
                  >
                    <Eye size={18} />
                  </Link>

                  <div className="relative">
                    <button
                      ref={el => { buttonRefs.current[p.id] = el }}
                      onClick={() => {
                        if (openDropdownId === p.id) {
                          setOpenDropdownId(null)
                          setDropdownPos(null)
                        } else {
                          const rect = buttonRefs.current[p.id]?.getBoundingClientRect()
                          if (rect) {
                            setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
                          }
                          setOpenDropdownId(p.id)
                        }
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {openDropdownId === p.id && (
                      <>
                        <div
                          className="fixed inset-0 z-[9998]"
                          onClick={() => { setOpenDropdownId(null); setDropdownPos(null) }}
                        />
                        <div
                          className="fixed w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[9999] py-1 overflow-hidden animate-in fade-in zoom-in duration-200"
                          style={dropdownPos ? { top: dropdownPos.top, right: dropdownPos.right } : {}}
                        >
                          <button
                            onClick={() => {
                              setEditingPrompt(p)
                              setOpenDropdownId(null)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 size={16} />
                            <span>Edit Prompt</span>
                          </button>

                          <button
                            onClick={() => {
                              handleToggleStatus(p)
                              setOpenDropdownId(null)
                            }}
                            disabled={togglingId === p.id || isPending}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                          >
                            {p.status === 'published' ? <CloudOff size={16} /> : <Cloud size={16} />}
                            <span>{p.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                          </button>

                          <div className="h-px bg-zinc-800 my-1" />

                          <button
                            onClick={() => {
                              handleDelete(p.id, p.title)
                              setOpenDropdownId(null)
                            }}
                            disabled={deletingId === p.id}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingPrompt && (
        <PromptModal
          isOpen={true}
          onClose={() => {
            setEditingPrompt(null)
            router.refresh()
          }}
          promptToEdit={editingPrompt}
        />
      )}
    </div>
  )
}
