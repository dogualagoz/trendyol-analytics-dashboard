"use client"

import { formatCurrency } from "@/lib/utils"

export type FunnelStep = {
  label: string
  value: number
}

const STEP_COLORS = ["#16A34A", "#22C55E", "#4ADE80", "#86EFAC", "#FCA5A5"]

export function ProfitFunnelChart({ data }: { data: FunnelStep[] }) {
  if (!data.length) return (
    <p className="text-sm text-[#574236] text-center py-8">Bu dönemde henüz veri yok.</p>
  )

  const max = data[0]?.value || 1

  return (
    <div className="space-y-2 py-1">
      {data.map((step, i) => {
        const widthPct = max > 0 ? Math.max((Math.abs(step.value) / max) * 100, 12) : 12
        const color    = STEP_COLORS[i] ?? STEP_COLORS[STEP_COLORS.length - 1]

        return (
          <div key={i}>
            <div className="flex justify-center mb-1">
              <div
                className="h-10 rounded-sm transition-all"
                style={{ width: `${widthPct}%`, backgroundColor: color }}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-[#574236]">{step.label}</span>
              <span className="text-xs font-semibold text-[#1a1c1c] tabular-nums">
                {formatCurrency(step.value)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
