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
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((item) => {
          const pct = ((item.value / total) * 100).toFixed(1)
          return (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#574236] truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 pl-2">
                <span className="text-[#1a1c1c] font-medium tabular-nums">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-[#574236] w-10 text-right tabular-nums">
                  %{pct}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
