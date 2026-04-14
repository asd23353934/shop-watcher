'use client'

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

interface ChartData {
  lineData: { date: string; count: number }[]
  barData: { platform: string; count: number }[]
  compact?: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { date?: string; platform?: string; count: number } }>
  type: 'line' | 'bar'
}

function CustomTooltip({ active, payload, type }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm text-gray-900 dark:text-gray-100">
        {type === 'line' ? `${d.date}: ${d.count} 筆` : `${d.platform}: ${d.count} 筆`}
      </div>
    )
  }
  return null
}

export default function ChartsRow({ lineData, barData, compact = false }: ChartData) {
  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
      {/* Line chart — 7天通知趨勢 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 text-sm">
          過去 7 天通知量
        </h3>
        {lineData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
            尚無資料
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
              <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 11 }} stroke="currentColor" className="text-gray-500 dark:text-gray-400" />
              <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} stroke="currentColor" className="text-gray-500 dark:text-gray-400" />
              <Tooltip content={<CustomTooltip type="line" />} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#4f46e5', strokeWidth: 0, r: 4 }} activeDot={{ fill: '#4f46e5', strokeWidth: 0, r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart — 平台命中排行 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 text-sm">
          今日各平台命中數
        </h3>
        {barData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
            今日尚無通知
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
              <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 11 }} stroke="currentColor" className="text-gray-500 dark:text-gray-400" />
              <YAxis type="category" dataKey="platform" width={72} tick={{ fill: 'currentColor', fontSize: 11 }} stroke="currentColor" className="text-gray-500 dark:text-gray-400" />
              <Tooltip content={<CustomTooltip type="bar" />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {barData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill="#6366f1" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
