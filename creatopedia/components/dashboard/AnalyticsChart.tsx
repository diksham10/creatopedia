'use client'

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Series {
  key: string
  color: string
  name: string
}

interface Props {
  type: 'line' | 'bar'
  data: Record<string, string | number>[]
  xAxisKey?: string
  series?: Series[]
}

export default function AnalyticsChart({ type, data, xAxisKey = 'date', series }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
        No data available
      </div>
    )
  }

  // Default series for backward compatibility
  const defaultLineSeries = [{ key: 'views', color: '#6366f1', name: 'Views' }]
  const defaultBarSeries = [
    { key: 'copies', color: '#6366f1', name: 'Prompt Copies' },
    { key: 'email_captures', color: '#10b981', name: 'Email Captures' }
  ]

  const activeSeries = series || (type === 'line' ? defaultLineSeries : defaultBarSeries)

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(str) => {
              if (xAxisKey === 'date') {
                const date = new Date(str)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
              return str.length > 10 ? str.substring(0, 10) + '...' : str
            }}
          />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          {activeSeries.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={3}
              dot={{ r: 4, fill: s.color, strokeWidth: 2, stroke: '#09090b' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          stroke="#71717a"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(str) => {
            if (xAxisKey === 'date') {
              const date = new Date(str)
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }
            return str.length > 10 ? str.substring(0, 10) + '...' : str
          }}
        />
        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
          itemStyle={{ fontSize: '12px' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
        {activeSeries.map((s) => (
          <Bar 
            key={s.key} 
            dataKey={s.key} 
            name={s.name} 
            fill={s.color} 
            radius={[4, 4, 0, 0]} 
            barSize={20} 
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
