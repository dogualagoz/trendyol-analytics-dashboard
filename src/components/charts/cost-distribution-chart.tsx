"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

type CostItem = {
  name:  string
  value: number
  color: string
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: CostItem }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-[#E2E2E2] rounded-lg shadow-md px-4 py-3 text-sm">
      <p className="font-semibold text-[#1a1c1c]">{item.name}</p>
      <p style={{ color: item.payload.color }} className="mt-1 tabular-nums">
        {formatCurrency(item.value)}
      </p>
    </div>
  )
}

export function CostDistributionChart({ data }: { data: CostItem[] }) {
  // Donut sadece değeri olan kalemleri gösterir
  const donutData = data.filter(d => d.value > 0)
  const total     = donutData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">

      {/* Donut */}
      <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
        {donutData.length > 0 ? (
          <>
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#574236]">
                Toplam Maliyet
              </span>
              <span className="text-[1.05rem] font-bold text-[#1a1c1c] tabular-nums mt-0.5">
                {formatCurrency(total)}
              </span>
            </div>
          </>
        ) : (
          // Hiç veri yoksa boş daire placeholder
          <div className="w-full h-full rounded-full border-[12px] border-[#F4F4F4] flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#8b7264]">Veri Yok</span>
            <span className="text-[11px] text-[#8b7264] mt-1">Sync Bekliyor</span>
          </div>
        )}
      </div>

      {/* Grid — tüm kategoriler, sıfır olanlar soluk */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 content-center">
        {data.map((item) => {
          const isEmpty = item.value === 0
          const pct     = total > 0 ? ((item.value / total) * 100).toFixed(1) : null

          return (
            <div key={item.name} className={`flex items-start gap-2.5 ${isEmpty ? "opacity-40" : ""}`}>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: isEmpty ? "#dec1b1" : item.color }}
              />
              <div className="min-w-0">
                <p className="text-[12px] text-[#574236] leading-tight">{item.name}</p>
                {isEmpty ? (
                  <p className="text-[13px] text-[#8b7264] mt-0.5 italic">
                    {item.name === "Toplam Ürün Maliyeti"
                      ? "Ürünler sayfasından girin"
                      : ["Toplam Kargo Ücreti", "Toplam Hizmet Bedeli"].includes(item.name)
                        ? "Finance API gerekiyor"
                        : "Sync bekleniyor"}
                  </p>
                ) : (
                  <>
                    <p className="text-[14px] font-semibold text-[#1a1c1c] tabular-nums mt-0.5">
                      {formatCurrency(item.value)}
                    </p>
                    {pct && (
                      <p className="text-[11px] text-[#574236]">%{pct}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
