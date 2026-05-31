'use client'

interface Props {
  data: { date: string; views: number }[]
}

export default function DailyViewsChart({ data }: Props) {
  const maxViews = Math.max(...data.map(d => d.views), 1)
  
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="flex items-end justify-between h-32 gap-2 mt-4">
        {data.map((day, idx) => {
          const height = (day.views / maxViews) * 100
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div 
                className="w-full bg-gradient-to-t from-indigo-600/40 to-indigo-400/60 group-hover:from-indigo-500 group-hover:to-purple-500 rounded-t-lg transition-all duration-500 relative"
                style={{ height: `${Math.max(height, 5)}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {day.views} views
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2">
        {data.map((day, idx) => (
          <div key={day.date} className="flex-1 text-center">
             <span className="text-[10px] text-zinc-600 font-medium">
               {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
             </span>
          </div>
        ))}
      </div>
    </div>
  )
}
