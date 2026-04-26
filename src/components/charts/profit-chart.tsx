"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

type DataPoint = {
  date: string
  revenue: number
  profit: number
}

type Props = {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E2E2] rounded-lg shadow-md px-4 py-3 text-sm">
      <p className="font-semibold text-[#1a1c1c] mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.stroke }} className="leading-relaxed">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function ProfitChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F27A1A" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#F27A1A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00D1FF" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#00D1FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#574236" }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#574236" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Ciro"
          stroke="#F27A1A"
          strokeWidth={2}
          fill="url(#gradRevenue)"
          dot={false}
          activeDot={{ r: 4, fill: "#F27A1A" }}
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Kar"
          stroke="#00D1FF"
          strokeWidth={2}
          fill="url(#gradProfit)"
          dot={false}
          activeDot={{ r: 4, fill: "#00D1FF" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
