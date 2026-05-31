interface Props { 
  label: string; 
  value: number | string; 
  change?: number 
}

export default function StatsCard({ label, value, change }: Props) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-[24px] p-6 shadow-xl hover:bg-zinc-800/50 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${
            change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 origin-left transition-transform duration-500">
          {value.toLocaleString()}
        </p>
      </div>
      <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full w-2/3" />
      </div>
    </div>
  )
}
