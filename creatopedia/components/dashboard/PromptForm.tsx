'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Link as LinkIcon, Sparkles, Loader2 as LoaderIcon, Plus, Trash2 } from 'lucide-react'
import { apiFetch, uploadFile } from '@/lib/api/client'
import type { Prompt, Category } from '@/types'
import InstagramPostPicker, { type InstagramPost } from './InstagramPostPicker'

const AI_TOOLS = ['Midjourney', 'Claude', 'ChatGPT', 'Gemini', 'Runway', 'Pika', 'Kling', 'Veo', 'Other'] as const
const OUTPUT_TYPES = ['image', 'video', 'text', 'code', 'audio'] as const
const GATE_TYPES = ['open', 'email', 'payment'] as const

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface Props {
  defaultValues?: Partial<Prompt>
  promptId?: string
  onSuccess?: () => void
}

type FieldErrors = Record<string, string[]>

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm'
const labelCls = 'block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2'

export default function PromptForm({ defaultValues, promptId, onSuccess }: Props) {
  const router = useRouter()
  const isEdit = !!promptId

  const isInitialVariants = (() => {
    try {
      if (defaultValues?.content && defaultValues.content.startsWith('[') && defaultValues.content.endsWith(']')) {
        const parsed = JSON.parse(defaultValues.content)
        return Array.isArray(parsed) && parsed.length > 0 && parsed.every(v => 'subtitle' in v && 'description' in v)
      }
    } catch (e) {}
    return false
  })()

  const initialVariants = (() => {
    try {
      if (isInitialVariants && defaultValues?.content) {
        return JSON.parse(defaultValues.content)
      }
    } catch (e) {}
    return [{ subtitle: '', description: '' }]
  })()

  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [categoryId, setCategoryId] = useState<string>(defaultValues?.category_id ?? '')
  const [categories, setCategories] = useState<Category[]>([])
  const [description, setDescription] = useState(defaultValues?.description ?? '')
  const [content, setContent] = useState(defaultValues?.content ?? '')
  const [aiTools, setAiTools] = useState<string[]>(
    defaultValues?.ai_tool ? defaultValues.ai_tool.split(',').map(t => t.trim()) : ['Midjourney']
  )
  const [outputType, setOutputType] = useState<typeof OUTPUT_TYPES[number]>(defaultValues?.output_type ?? 'image')
  const [gateType, setGateType] = useState<typeof GATE_TYPES[number]>(defaultValues?.gate_type ?? 'open')
  const [price, setPrice] = useState<string>(defaultValues?.price?.toString() ?? '')
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [videoUrl, setVideoUrl] = useState(defaultValues?.video_url ?? '')
  const [embedHtml, setEmbedHtml] = useState(defaultValues?.embed_html ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(defaultValues?.thumbnail_url ?? '')
  const [shareImageUrl, setShareImageUrl] = useState(defaultValues?.share_image_url ?? '')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(defaultValues?.thumbnail_url ?? null)
  const [shareImagePreview, setShareImagePreview] = useState<string | null>(defaultValues?.share_image_url ?? null)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [shareImageError, setShareImageError] = useState(false)
  const [status, setStatus] = useState<'draft' | 'published'>(defaultValues?.status ?? 'published')
  const [featured, setFeatured] = useState(defaultValues?.featured ?? false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!defaultValues?.slug)
  const [contentType, setContentType] = useState<'prompt' | 'pdf'>(defaultValues?.content_type ?? 'prompt')
  const [pdfUrl, setPdfUrl] = useState(
    defaultValues?.pdf_url ||
    (defaultValues?.content_type === 'pdf' ? defaultValues?.content : '') ||
    ''
  )
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)

  // Dynamic variants
  const [isVariants, setIsVariants] = useState(isInitialVariants)
  const [variants, setVariants] = useState<{ subtitle: string; description: string }[]>(initialVariants)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await apiFetch<Category[]>('/categories')
        setCategories(data)
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }
    }
    fetchCategories()
  }, [])

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>, isShareImage = false) {
    const file = e.target.files?.[0]
    if (!file) return

    // Generate local preview URL
    const localUrl = URL.createObjectURL(file)
    if (isShareImage) {
      setShareImagePreview(localUrl)
      setShareImageError(false)
    } else {
      setThumbnailPreview(localUrl)
      setThumbnailError(false)
    }

    setUploading(true)
    setServerError(null)
    try {
      const url = await uploadFile(file)
      if (isShareImage) {
        setShareImageUrl(url)
      } else {
        setThumbnailUrl(url)
      }
    } catch (err: any) {
      setServerError(err.message || 'Upload failed')
      // Reset preview on failure
      if (isShareImage) {
        setShareImagePreview(shareImageUrl || null)
      } else {
        setThumbnailPreview(thumbnailUrl || null)
      }
    } finally {
      setUploading(false)
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPdf(true)
    setServerError(null)
    try {
      const url = await uploadFile(file)
      setPdfUrl(url)
      if (content === '') setContent('See attached PDF for instructions.')
    } catch (err: any) {
      setServerError(err.message || 'Upload failed')
    } finally {
      setUploadingPdf(false)
    }
  }

  async function handlePostSelect(post: InstagramPost) {
    setIsPickerOpen(false)
    setIsAutoFilling(true)

    try {
      // Call backend to create the prompt from the Instagram post in one shot
      const result = await apiFetch<{
        id: string
        title: string
        slug: string
        thumbnail_url: string | null
        instagram_post_id: string
        permalink: string
      }>('/instagram/import-post', {
        method: 'POST',
        body: JSON.stringify({
          post_id: post.id,
          gate_type: gateType,
          ai_tool: aiTools.join(', ') || undefined,
          category_id: categoryId || undefined,
        }),
      })

      // Import succeeded — redirect to prompts list
      router.push('/dashboard/prompts')
      router.refresh()
      return
    } catch (err) {
      // If import-post fails (e.g. no credentials yet), fall back to auto-filling the form
      console.warn('backend import-post failed, falling back to form fill:', err)
    }

    // ---- Fallback: auto-fill the form fields from the post data ----
    const imageUrl = post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url
    setVideoUrl(post.permalink)
    setThumbnailUrl(imageUrl)
    setThumbnailPreview(imageUrl)
    setThumbnailError(false)

    if (post.caption) {
      const firstLine = post.caption.split('\n')[0].trim().substring(0, 60)
      if (title === '' || title === 'Untitled Prompt') {
        setTitle(firstLine)
        if (!slugManuallyEdited) {
          setSlug(toSlug(firstLine))
        }
      }
      if (content === '') {
        setContent(post.caption)
      }
    }

    try {
      const res = await fetch(`/api/instagram/oembed?url=${encodeURIComponent(post.permalink)}`)
      const data = await res.json()
      if (data.html) {
        setEmbedHtml(data.html)
      }
    } catch (err) {
      console.error('Failed to fetch oEmbed', err)
    } finally {
      setIsAutoFilling(false)
    }
  }

  const addVariantOption = () => {
    setVariants(prev => [...prev, { subtitle: '', description: '' }])
  }

  const removeVariantOption = (index: number) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateVariantOption = (index: number, key: 'subtitle' | 'description', value: string) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [key]: value } : v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setServerError(null)

    const fullContent = contentType === 'prompt'
      ? (isVariants ? JSON.stringify(variants.filter(v => v.subtitle.trim() && v.description.trim())) : content)
      : (pdfUrl || '')

    const fd = new FormData()
    fd.append('title', title)
    
    // Only conditionally append if truthy
    if (description) fd.append('description', description)
    if (categoryId) fd.append('category_id', categoryId)
    if (fullContent) fd.append('content', fullContent)
    if (aiTools.length > 0) fd.append('ai_tool', aiTools.join(', '))
    if (outputType) fd.append('output_type', outputType)
    if (gateType) fd.append('gate_type', gateType)
    if (gateType === 'payment' && price) fd.append('price', parseFloat(price).toString())
    if (slug) fd.append('slug', slug)
    if (status) fd.append('status', status)
    if (thumbnailUrl) fd.append('thumbnail_url', thumbnailUrl)
    if (contentType) fd.append('content_type', contentType)
    if (pdfUrl) fd.append('pdf_url', pdfUrl)
    fd.append('featured', featured ? 'true' : 'false')

    const url = isEdit ? `/prompts/${promptId}` : '/prompts'
    const method = isEdit ? 'PATCH' : 'POST'

    try {
      await apiFetch(url, {
        method,
        body: fd
      })
      setSaving(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/prompts')
      }
      router.refresh()
    } catch (err: any) {
      setSaving(false)
      let errObj: any = err.message
      try { errObj = JSON.parse(err.message).detail || err.message } catch (e) {}

      if (Array.isArray(errObj)) {
        // FastAPI field errors
        const fErrors: FieldErrors = {}
        errObj.forEach(e => {
          const field = e.loc[e.loc.length - 1]
          fErrors[field] = [e.msg]
        })
        setErrors(fErrors)
      } else {
        setServerError(typeof errObj === 'string' ? errObj : JSON.stringify(errObj) ?? 'An error occurred')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 select-none">
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
          {serverError}
        </div>
      )}

      {/* Media Integration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className={labelCls}>Media Integration</label>
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            disabled={isAutoFilling}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isAutoFilling ? (
              <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isAutoFilling ? 'Auto-filling...' : 'Select from Instagram'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800">
          <div className={isAutoFilling ? 'animate-pulse' : ''}>
            <label className={labelCls}>Instagram / TikTok Reel URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className={inputCls}
            />
            <p className="text-[10px] text-zinc-500 mt-1">Direct link to the Reel or Post.</p>
          </div>
          <div className={isAutoFilling ? 'animate-pulse' : ''}>
            <label className={labelCls}>Manual Embed Code</label>
            <textarea
              value={embedHtml}
              onChange={e => setEmbedHtml(e.target.value)}
              placeholder="Paste <blockquote>...</blockquote> code here"
              rows={1}
              className={inputCls + ' resize-none'}
            />
            <p className="text-[10px] text-zinc-500 mt-1">Standard Instagram/TikTok embed HTML.</p>
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Category *</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className={inputCls}
          required
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.length === 0 && <option value="">No categories available</option>}
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.category_id && <p className="text-red-400 text-xs mt-1">{errors.category_id[0]}</p>}
      </div>

      {/* Title */}
      <div>
        <label className={labelCls}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => {
            const newTitle = e.target.value
            setTitle(newTitle)
            if (!slugManuallyEdited) {
              setSlug(toSlug(newTitle))
            }
          }}
          placeholder="Cinematic Neon City Reel"
          className={inputCls}
          required
        />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title[0]}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Short description shown as subtitle on the prompt page..."
          rows={2}
          className={inputCls + ' resize-none'}
        />
      </div>

      {/* Content Type & Content */}
      <div className="space-y-4 border border-zinc-800 rounded-2xl p-6 bg-zinc-900/30">
        <div>
          <label className={labelCls}>Content Type</label>
          <div className="flex gap-3 bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-800">
            <button
              type="button"
              onClick={() => setContentType('prompt')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${contentType === 'prompt' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              📝 Text Prompt
            </button>
            <button
              type="button"
              onClick={() => setContentType('pdf')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${contentType === 'pdf' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              📄 PDF Document
            </button>
          </div>
        </div>

        {contentType === 'prompt' ? (
          <div className="space-y-4">
            {/* Toggle for multiple variations array */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Enable Subtitle & Description Variations:
              </label>
              <button
                type="button"
                onClick={() => setIsVariants(!isVariants)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isVariants ? 'bg-indigo-600' : 'bg-zinc-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isVariants ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {isVariants ? (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="p-4 border border-zinc-800 bg-zinc-900/60 rounded-xl space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400"># {index + 1} Variant</span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantOption(index)}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <input
                          type="text"
                          value={variant.subtitle}
                          onChange={e => updateVariantOption(index, 'subtitle', e.target.value)}
                          placeholder="Subtitle (e.g. For Men, For Women) *"
                          className={inputCls}
                          required={isVariants}
                        />
                      </div>
                      <div>
                        <textarea
                          value={variant.description}
                          onChange={e => updateVariantOption(index, 'description', e.target.value)}
                          placeholder="Prompt description/content *"
                          rows={3}
                          className={inputCls + ' resize-y font-mono'}
                          required={isVariants}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariantOption}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variant Option
                </button>
              </div>
            ) : (
              <div>
                <label className={labelCls}>Prompt Content *</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste the full AI prompt here..."
                  rows={6}
                  className={inputCls + ' resize-y font-mono'}
                  required={!isVariants}
                />
                {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content[0]}</p>}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className={labelCls}>PDF File *</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition-all cursor-pointer"
            />
            <p className="text-zinc-600 text-xs mt-1">Max 20MB. PDF only.</p>
            {uploadingPdf && <p className="text-indigo-400 text-xs mt-1">Uploading PDF…</p>}
            {pdfUrl && !uploadingPdf && (
              <p className="text-emerald-400 text-xs mt-1 truncate">✓ PDF Uploaded: {pdfUrl.split('/').pop()}</p>
            )}
            {errors.pdf_url && <p className="text-red-400 text-xs mt-1">{errors.pdf_url[0]}</p>}
          </div>
        )}
      </div>

      {/* AI Tool + Output Type row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>AI Tools *</label>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
            {aiTools.map(tool => (
              <span key={tool} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                {tool}
                <button 
                  type="button" 
                  onClick={() => setAiTools(prev => prev.length > 1 ? prev.filter(t => t !== tool) : prev)}
                  className="hover:text-white transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <select 
            value="" 
            onChange={e => {
              const val = e.target.value
              if (val && !aiTools.includes(val)) {
                setAiTools(prev => [...prev, val])
              }
            }} 
            className={inputCls}
          >
            <option value="" disabled>+ Add AI Tool</option>
            {AI_TOOLS.map(t => (
              <option key={t} value={t} disabled={aiTools.includes(t)}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Output Type *</label>
          <select value={outputType} onChange={e => setOutputType(e.target.value as typeof OUTPUT_TYPES[number])} className={inputCls}>
            {OUTPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Gate Type */}
      <div>
        <label className={labelCls}>Gate Type *</label>
        <div className="flex gap-3 flex-wrap">
          {GATE_TYPES.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGateType(g)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${gateType === g
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                }`}
            >
              {g === 'open' ? '🔓 Open' : g === 'email' ? '📧 Email Gate' : '💳 Payment'}
            </button>
          ))}
        </div>
        {gateType === 'payment' && (
          <div className="mt-4">
            <label className={labelCls}>Price (USD)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="4.99"
              min="0.50"
              step="0.01"
              className={inputCls + ' max-w-xs'}
            />
            {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price[0]}</p>}
          </div>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className={labelCls}>Slug *</label>
        <div className="flex items-center">
          <span className="px-4 py-3 bg-zinc-900 border border-r-0 border-zinc-700 rounded-l-xl text-zinc-500 text-sm">
            /{toSlug(title)}/
          </span>
          <input
            type="text"
            value={slug}
            onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true) }}
            placeholder="cinematic-neon-city"
            className={inputCls + ' rounded-l-none'}
          />
        </div>
        {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug[0]}</p>}
      </div>

      {/* Thumbnail & Share Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Thumbnail */}
        <div className="space-y-4">
          <label className={labelCls}>Website Thumbnail</label>
          <div className="flex gap-4 items-start p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex-1 min-w-0">
              <input
                id="thumbnail-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleThumbnailUpload(e, false)}
                className="hidden"
              />
              <label
                htmlFor="thumbnail-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                Choose File
              </label>
              <p className="text-zinc-600 text-[10px] mt-2 font-medium">JPEG, PNG or WebP. Max 5MB.</p>
              {uploading && <p className="text-indigo-400 text-[10px] mt-1 animate-pulse">Uploading…</p>}
              {thumbnailUrl && !uploading && (
                <div className="flex items-center gap-1.5 mt-2 overflow-hidden bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                  <span className="text-emerald-400 text-[10px] shrink-0">✓</span>
                  <p className="text-emerald-400 text-[10px] truncate font-mono" title={thumbnailUrl}>{thumbnailUrl}</p>
                </div>
              )}
            </div>
            {thumbnailPreview && (
              <div className="relative group flex-shrink-0">
                {thumbnailError ? (
                  <div className="w-20 h-20 rounded-lg border border-red-500/20 bg-red-500/10 flex flex-col items-center justify-center text-center p-1 text-[10px] font-semibold text-red-400">
                    <span>Access Denied</span>
                    <span className="text-[8px] text-zinc-500 mt-1">Make B2 Bucket Public</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail" 
                    className="w-20 h-20 object-cover rounded-lg border border-zinc-700 shadow-xl" 
                    onError={() => setThumbnailError(true)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailUrl('')
                    setThumbnailPreview(null)
                    setThumbnailError(false)
                  }}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-90"
                  title="Remove thumbnail"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-zinc-500">This thumbnail is shown on the website listing and prompt page.</p>
        </div>

        {/* Share Image */}
        <div className="space-y-4">
          <label className={labelCls}>Social Share Thumbnail (OG Image)</label>
          <div className="flex gap-4 items-start p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex-1 min-w-0">
              <input
                id="share-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleThumbnailUpload(e, true)}
                className="hidden"
              />
              <label
                htmlFor="share-image-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                Choose File
              </label>
              <p className="text-zinc-600 text-[10px] mt-2 font-medium">JPEG, PNG or WebP. Max 5MB.</p>
              {uploading && <p className="text-indigo-400 text-[10px] mt-1 animate-pulse">Uploading…</p>}
              {shareImageUrl && !uploading && (
                <div className="flex items-center gap-1.5 mt-2 overflow-hidden bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                  <span className="text-emerald-400 text-[10px] shrink-0">✓</span>
                  <p className="text-emerald-400 text-[10px] truncate font-mono" title={shareImageUrl}>{shareImageUrl}</p>
                </div>
              )}
            </div>
            {shareImagePreview && (
              <div className="relative group flex-shrink-0">
                {shareImageError ? (
                  <div className="w-20 h-20 rounded-lg border border-red-500/20 bg-red-500/10 flex flex-col items-center justify-center text-center p-1 text-[10px] font-semibold text-red-400">
                    <span>Access Denied</span>
                    <span className="text-[8px] text-zinc-500 mt-1">Make B2 Bucket Public</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={shareImagePreview} 
                    alt="Share Image" 
                    className="w-20 h-20 object-cover rounded-lg border border-zinc-700 shadow-xl" 
                    onError={() => setShareImageError(true)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShareImageUrl('')
                    setShareImagePreview(null)
                    setShareImageError(false)
                  }}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-90"
                  title="Remove share image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-zinc-500">This thumbnail is shown when you share the link on WhatsApp, Instagram, etc.</p>
        </div>
      </div>

      {/* Status + Featured */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-zinc-400">Status:</label>
          <button
            type="button"
            onClick={() => setStatus(s => s === 'draft' ? 'published' : 'draft')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${status === 'published' ? 'bg-indigo-600' : 'bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status === 'published' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-semibold ${status === 'published' ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-zinc-400">Featured:</label>
          <button
            type="button"
            onClick={() => setFeatured(!featured)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${featured ? 'bg-amber-500' : 'bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${featured ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-semibold ${featured ? 'text-amber-400' : 'text-zinc-500'}`}>
            {featured ? '★ Featured' : 'Standard'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-6 py-4 rounded-2xl border border-zinc-800 bg-zinc-900 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading || uploadingPdf || categories.length === 0}
          className="flex-[2] px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-indigo-500/20"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Prompt'}
        </button>
      </div>
      <InstagramPostPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handlePostSelect}
      />
    </form>
  )
}
