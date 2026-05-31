'use client'

import { AdPlacementPosition } from '@/types'
import { LayoutGrid, FileText, Image as ImageIcon, Video, User, Sparkles } from 'lucide-react'

interface Props {
  selectedPosition: AdPlacementPosition
  onChange: (position: AdPlacementPosition) => void
  bannerUrl?: string
}

export default function PromptPlacementDesigner({ selectedPosition, onChange, bannerUrl }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const positions: { id: AdPlacementPosition; label: string; icon: any }[] = [
    { id: 'above_media', label: 'Hero', icon: ImageIcon },
    { id: 'above_prompt', label: 'Middle', icon: LayoutGrid },
    { id: 'below_prompt', label: 'Bottom', icon: FileText },
    { id: 'popup', label: 'Popup', icon: Sparkles },
  ]

  return (
    <div className="bg-zinc-950/20 rounded-3xl border border-zinc-800 p-4 select-none">
      <div className="flex flex-col lg:flex-row items-start gap-6">

        {/* Left: Compact Selection List */}
        <div className="w-full lg:w-48 space-y-2 shrink-0">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-3">Placement</p>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {positions.map((pos) => {
              const Icon = pos.icon
              const isSelected = selectedPosition === pos.id
              return (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onChange(pos.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-300 ${isSelected
                      ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                  <span className={`text-[11px] font-bold tracking-wide truncate ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                    {pos.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Scaled Mockup */}
        <div className="flex-1 w-full bg-zinc-950 rounded-[2rem] border border-zinc-800 overflow-hidden relative shadow-inner min-h-[380px]">
          {/* We use scale-75 and origin-top to make it compact */}
          <div className="scale-[0.8] origin-top w-[125%] -ml-[12.5%] pb-10">
            {/* Mock Cover Area */}
            <div className="h-16 bg-zinc-900/80 relative">
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950 to-transparent" />
            </div>

            {/* Mock Profile Detail Card */}
            <div className="px-6 -mt-8 relative z-20">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-blue-500 to-pink-500">
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-20 h-2 bg-zinc-100/10 rounded-full" />
                    <div className="w-12 h-1.5 bg-zinc-500/10 rounded-full" />
                  </div>
                </div>
                <div className="w-8 h-5 bg-zinc-100 rounded-full" />
              </div>
            </div>

            {/* Slot: Premium Hero */}
            <div className="px-6 py-3">
              <button
                type="button"
                onClick={() => onChange('above_media')}
                className={`w-full h-12 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all group overflow-hidden ${selectedPosition === 'above_media'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
              >
                {selectedPosition === 'above_media' && bannerUrl ? (
                  <img src={bannerUrl} className="w-full h-full object-cover opacity-60" alt="Preview" />
                ) : (
                  <span className={`text-[8px] font-black uppercase tracking-widest ${selectedPosition === 'above_media' ? 'text-indigo-400' : 'text-zinc-600'}`}>Premium Hero</span>
                )}
              </button>
            </div>

            {/* Main Content Glass Container */}
            <div className="mx-6 mb-4 bg-zinc-900/40 border border-white/5 rounded-xl overflow-hidden">
              <div className="flex border-b border-white/5 h-8">
                <div className="flex-1 border-b-2 border-blue-500 flex items-center justify-center">
                  <LayoutGrid className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 opacity-20 flex items-center justify-center">
                  <LayoutGrid className="w-3 h-3 text-zinc-500" />
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Mock Media */}
                <div className="aspect-video bg-black rounded-lg border border-white/5 flex items-center justify-center">
                  <Video className="w-6 h-6 text-zinc-900" />
                </div>

                {/* Slot: Middle Spotlight */}
                <button
                  type="button"
                  onClick={() => onChange('above_prompt')}
                  className={`w-full h-10 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all group overflow-hidden ${selectedPosition === 'above_prompt'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                >
                  {selectedPosition === 'above_prompt' && bannerUrl ? (
                    <img src={bannerUrl} className="w-full h-full object-cover opacity-60" alt="Preview" />
                  ) : (
                    <span className={`text-[8px] font-black uppercase tracking-widest ${selectedPosition === 'above_prompt' ? 'text-indigo-400' : 'text-zinc-600'}`}>Middle Spotlight</span>
                  )}
                </button>

                {/* Mock Text */}
                <div className="space-y-2">
                  <div className="w-3/4 h-3 bg-zinc-100/10 rounded-full" />
                  <div className="w-1/2 h-2 bg-zinc-100/5 rounded-full" />
                </div>

                {/* Slot: Footer Anchor */}
                <button
                  type="button"
                  onClick={() => onChange('below_prompt')}
                  className={`w-full h-10 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all group overflow-hidden ${selectedPosition === 'below_prompt'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                >
                  {selectedPosition === 'below_prompt' && bannerUrl ? (
                    <img src={bannerUrl} className="w-full h-full object-cover opacity-60" alt="Preview" />
                  ) : (
                    <span className={`text-[8px] font-black uppercase tracking-widest ${selectedPosition === 'below_prompt' ? 'text-indigo-400' : 'text-zinc-600'}`}>Footer Anchor</span>
                  )}
                </button>
              </div>
            </div>

            {/* Slot: Popup (Floating) */}
            <div className="absolute bottom-6 right-6 z-50">
              <button
                type="button"
                onClick={() => onChange('popup')}
                className={`w-12 h-12 rounded-xl border-2 border-dashed shadow-2xl flex flex-col items-center justify-center transition-all group ${selectedPosition === 'popup'
                    ? 'border-indigo-500 bg-indigo-600 text-white animate-pulse'
                    : 'border-zinc-700 bg-zinc-900/90 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-[6px] font-black uppercase">Popup</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
