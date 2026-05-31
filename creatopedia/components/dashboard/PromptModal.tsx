'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import PromptForm from './PromptForm'

interface Props {
  isOpen: boolean
  onClose: () => void
  promptToEdit?: any
}

interface NewPromptItem {
  title: string
  description: string
  content: string
  isVariants: boolean
  variants: { subtitle: string; description: string }[]
}

interface Category {
  id: string
  name: string
}

export default function PromptModal({ isOpen, onClose, promptToEdit }: Props) {
  const [mode, setMode] = useState<'single' | 'multiple'>('single')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [items, setItems] = useState<NewPromptItem[]>([
    { title: '', description: '', content: '', isVariants: false, variants: [{ subtitle: '', description: '' }] }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  // Fetch categories for multiple mode
  useEffect(() => {
    if (isOpen) {
      async function fetchCategories() {
        try {
          const res = await fetch('/api/categories')
          const data = await res.json()
          if (res.ok && data.length > 0) {
            setCategories(data)
            setCategoryId(data[0].id)
          }
        } catch (e) {
          console.error(e)
        }
      }
      fetchCategories()
    }
  }, [isOpen])

  if (!isOpen) return null

  const toSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { title: '', description: '', content: '', isVariants: false, variants: [{ subtitle: '', description: '' }] }
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, key: keyof NewPromptItem, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }

  const updateVariantItem = (itemIdx: number, variantIdx: number, key: 'subtitle' | 'description', value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item
      const updatedVariants = item.variants.map((v, j) => j === variantIdx ? { ...v, [key]: value } : v)
      return { ...item, variants: updatedVariants }
    }))
  }

  const addVariantOption = (itemIdx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item
      return { ...item, variants: [...item.variants, { subtitle: '', description: '' }] }
    }))
  }

  const removeVariantOption = (itemIdx: number, variantIdx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item
      if (item.variants.length > 1) {
        return { ...item, variants: item.variants.filter((_, j) => j !== variantIdx) }
      }
      return item
    }))
  }

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId) {
      setError('Please select a category.')
      return
    }
    setError(null)
    setIsSubmitting(true)

    const validItems = items.filter(item => {
      if (!item.title.trim()) return false
      if (item.isVariants) {
        return item.variants.every(v => v.subtitle.trim() && v.description.trim())
      }
      return item.content.trim()
    })

    if (validItems.length === 0) {
      setError('Please fill in both the Title and Prompt Content for at least one prompt.')
      setIsSubmitting(false)
      return
    }

    try {
      for (const item of validItems) {
        const fullContent = item.isVariants
          ? JSON.stringify(item.variants.filter(v => v.subtitle.trim() && v.description.trim()))
          : item.content

        const body = {
          title: item.title,
          slug: toSlug(item.title),
          category_id: categoryId,
          description: item.description || null,
          content: fullContent,
          content_type: 'prompt',
          ai_tool: 'Midjourney',
          output_type: 'text',
          gate_type: 'open',
          price: null,
          video_url: null,
          embed_html: null,
          thumbnail_url: null,
          status: 'published',
          is_featured: false,
        }

        const res = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? `Failed to create prompt: ${item.title}`)
        }
      }

      setItems([{ title: '', description: '', content: '', isVariants: false, variants: [{ subtitle: '', description: '' }] }])
      onClose()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to create prompts')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
         {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex flex-col gap-4 sticky top-0 bg-zinc-900 z-10 select-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {promptToEdit ? 'Edit Prompt' : 'Add New Prompt'}
              </h3>
              <p className="text-zinc-500 text-xs mt-1">
                {promptToEdit ? 'Make changes to your existing creation.' : 'Fill in the details below to publish your creation.'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Creation Mode Tabs Toggle (only for adding) */}
          {!promptToEdit && (
            <div className="flex bg-zinc-950 p-1 border border-zinc-800/80 rounded-xl w-full max-w-xs gap-1 select-none">
              <button
                onClick={() => setMode('single')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${mode === 'single' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Single
              </button>
              <button
                onClick={() => setMode('multiple')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${mode === 'multiple' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Add Multiple
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {promptToEdit ? (
            <PromptForm defaultValues={promptToEdit} promptId={promptToEdit.id} onSuccess={onClose} />
          ) : mode === 'single' ? (
            <PromptForm onSuccess={onClose} />
          ) : (
            <form onSubmit={handleSubmitAll} className="space-y-6 select-none">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Shared Category Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                  required
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Dynamic Prompts List */}
              <div className="space-y-6">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Prompt Records
                </label>
                {items.map((item, index) => (
                  <div key={index} className="p-5 border border-zinc-800/80 bg-zinc-900/30 rounded-2xl relative space-y-4 hover:border-zinc-700/80 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-wider text-indigo-400"># {index + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={e => updateItem(index, 'title', e.target.value)}
                          placeholder="Title *"
                          className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateItem(index, 'description', e.target.value)}
                          placeholder="Description (Optional)"
                          className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-light"
                        />
                      </div>

                      {/* Dynamic Variants Toggle */}
                      <div className="flex items-center gap-3 py-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Enable Subtitle & Description Variations:
                        </label>
                        <button
                          type="button"
                          onClick={() => updateItem(index, 'isVariants', !item.isVariants)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.isVariants ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.isVariants ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {item.isVariants ? (
                        <div className="space-y-3">
                          {item.variants.map((v, vIdx) => (
                            <div key={vIdx} className="p-3 border border-zinc-800 bg-zinc-800/20 rounded-xl space-y-2 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-500">Variant Option {vIdx + 1}</span>
                                {item.variants.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeVariantOption(index, vIdx)}
                                    className="text-zinc-600 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={v.subtitle}
                                  onChange={e => updateVariantItem(index, vIdx, 'subtitle', e.target.value)}
                                  placeholder="Subtitle (e.g., For Men, For Women) *"
                                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700/60 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                  required={item.isVariants}
                                />
                                <textarea
                                  value={v.description}
                                  onChange={e => updateVariantItem(index, vIdx, 'description', e.target.value)}
                                  placeholder="Prompt description/content *"
                                  rows={2}
                                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700/60 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                                  required={item.isVariants}
                                />
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addVariantOption(index)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all w-fit"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Variant Option
                          </button>
                        </div>
                      ) : (
                        <div>
                          <textarea
                            value={item.content}
                            onChange={e => updateItem(index, 'content', e.target.value)}
                            placeholder="Prompt Content *"
                            rows={3}
                            className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                            required={!item.isVariants}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions Row */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-zinc-800/60 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Prompt</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg"
                >
                  {isSubmitting ? 'Saving Prompts...' : 'Save All Prompts'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
