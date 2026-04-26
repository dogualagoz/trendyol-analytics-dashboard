"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

type CostItem = {
  name: string
  value: number
  color: string
}

type Props = {
  data: CostItem[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-[#E2E2E2] rounded-lg shadow-md px-4 py-3 text-sm">
      <p className="font-semibold text-[#1a1c1c]">{item.name}</p>
      <p style={{ color: item.payload.color }} className="mt-1">
        {formatCurrency(item.value)}
      </p>
    </div>
  )
}

export function CostDistributionChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Donut + center label */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Orta yazı */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#574236]">
            Toplam Maliyet
          </span>
          <span className="text-base font-bold text-[#1a1c1c] tabular-nums mt-0.5">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        {data.map((item) => {
          const pct = ((item.value / total) * 100).toFixed(0)
          return (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#574236] truncate">{item.name}</span>
              </div>
              <span className="text-[#1a1c1c] font-semibold tabular-nums shrink-0 pl-2">
                %{pct}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
