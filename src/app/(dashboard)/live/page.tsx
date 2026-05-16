"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  X,
  Package,
  TrendingUp,
  ShoppingBag,
  BarChart2,
  Truck,
  Info,
} from "lucide-react"
import { InfoTooltip } from "@/components/ui/info-tooltip"
import type { TodayMetrics, HourlyProfit, TodayOrder, TodayProduct } from "@/lib/live"

// ─── Types ────────────────────────────────────────────────────────────────────

type LiveData = {
  metrics: TodayMetrics
  profitByHour: HourlyProfit[]
  orders: TodayOrder[]
  products: TodayProduct[]
}

type VariantGroup = {
  title: string
  products: TodayProduct[]
  isExpanded: boolean
}

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000

const TH = "px-4 py-3 text-left text-[10px] font-semibold text-[#8b7264] uppercase tracking-wider whitespace-nowrap bg-[#FAFAFA] border-b border-[#ECECEC] select-none"
const TD = "px-4 border-b border-[#F4F4F4] align-middle"

const W = {
  expand:       "w-12 min-w-[48px]",
  info:         "w-[300px] min-w-[300px]",
  costPrice:    "w-[140px] min-w-[140px]",
  extraCost:    "w-[120px] min-w-[120px]",
  stock:        "w-[72px]  min-w-[72px]",
  returnRate:   "w-[90px]  min-w-[90px]",
  deliveryType: "w-[120px] min-w-[120px]",
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

function fmtShortCurrency(v: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── EditableCell ─────────────────────────────────────────────────────────────

function EditableCell({
  value,
  suffix,
  allowNull = false,
  onSave,
}: {
  value: number | null
  suffix?: string
  allowNull?: boolean
  onSave: (v: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal]     = useState(value?.toString() ?? "")
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocal(value?.toString() ?? "") }, [value])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function commit() {
    setEditing(false)
    if (local === "" && allowNull) { onSave(null); return }
    const n = parseFloat(local)
    if (!isNaN(n)) onSave(n)
    else setLocal(value?.toString() ?? "")
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") { setEditing(false); setLocal(value?.toString() ?? "") }
        }}
        className="w-full h-8 rounded-md border border-[#F27A1A] bg-orange-50 px-2 text-sm text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#F27A1A]/20 tabular-nums"
      />
    )
  }

  const empty = value == null
  return (
    <button
      onClick={() => setEditing(true)}
      className={`w-full h-8 flex items-center px-2 rounded-md text-sm transition-all hover:bg-orange-50 hover:text-[#F27A1A] group tabular-nums text-left ${
        empty ? "text-[#c0bbb7] italic" : "text-[#1a1c1c] font-medium"
      }`}
    >
      {empty
        ? <span className="text-xs">—</span>
        : <span className="flex items-baseline gap-0.5">
            <span>{value}</span>
            {suffix && <span className="text-[#8b7264] text-[11px] ml-0.5">{suffix}</span>}
          </span>
      }
      <span className="opacity-0 group-hover:opacity-40 ml-auto text-[#F27A1A] text-[10px]">✎</span>
    </button>
  )
}

// ─── ProductImage ─────────────────────────────────────────────────────────────

function ProductImage({ src, title }: { src: string | null; title: string }) {
  const initials = title.replace(/^[^a-zA-ZğüşıöçĞÜŞİÖÇ]*/, "").charAt(0) || title.charAt(0)
  return (
    <div className="relative group/img shrink-0">
      <div className="w-12 h-12 rounded-md bg-[#F4F4F4] overflow-hidden flex items-center justify-center border border-[#ECECEC]">
        {src ? (
          <Image src={src} alt={title} width={48} height={48} className="w-full h-full object-cover" unoptimized />
        ) : (
          <span className="text-sm font-bold text-[#8b7264] uppercase">{initials}</span>
        )}
      </div>
      {src && (
        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-1 z-[100] hidden group-hover/img:block pointer-events-none">
          <div className="w-44 h-44 rounded-md overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.20)] border-2 border-white bg-white">
            <Image src={src} alt={title} width={176} height={176} className="w-full h-full object-contain" unoptimized />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DeliveryBadge ────────────────────────────────────────────────────────────

function DeliveryBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-[#d1cac5] text-xs">—</span>
  const isFast = value.toLowerCase().includes("fast") || value.toLowerCase().includes("same")
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[11px] font-medium ${
      isFast ? "bg-blue-50 text-blue-600" : "bg-[#F3F3F3] text-[#574236]"
    }`}>
      {isFast ? "Hızlı" : "Standart"}
    </span>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  accent: "emerald" | "teal" | "orange" | "neutral"
  tooltip?: string
}

const ACCENT = {
  emerald: { card: "bg-emerald-50 border-emerald-100",   label: "text-emerald-700", value: "text-emerald-800", icon: "bg-emerald-100 text-emerald-600" },
  teal:    { card: "bg-[#E8FAFF] border-[#B3EFFF]",     label: "text-[#004e60]",   value: "text-[#00677f]",   icon: "bg-[#B3EFFF] text-[#00677f]"   },
  orange:  { card: "bg-orange-50 border-orange-100",     label: "text-[#743500]",   value: "text-[#984700]",   icon: "bg-orange-100 text-[#F27A1A]"   },
  neutral: { card: "bg-white border-[#E2E2E2]",          label: "text-[#574236]",   value: "text-[#1a1c1c]",   icon: "bg-[#F3F3F3] text-[#8b7264]"   },
}

function StatCard({ label, value, subValue, icon, accent, tooltip }: StatCardProps) {
  const c = ACCENT[accent]
  return (
    <div className={`relative flex flex-col justify-between rounded-xl border p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] ${c.card}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`text-sm font-semibold ${c.label}`}>{label}</span>
        <div className="flex items-center gap-1.5">
          {tooltip && <InfoTooltip text={tooltip} className={c.label} />}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.icon}`}>
            {icon}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p className={`text-2xl font-bold tabular-nums leading-none ${c.value}`}>{value}</p>
        {subValue && <p className={`text-xs mt-1 ${c.label} opacity-70`}>{subValue}</p>}
      </div>
    </div>
  )
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E2E2] rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-[#574236] text-[11px] font-semibold mb-0.5">{label}</p>
      <p className="text-[#1a1c1c] font-bold tabular-nums">{fmtCurrency(payload[0].value)}</p>
    </div>
  )
}

// ─── OrderDetailModal ─────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: TodayOrder; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const totalCostFromItems = order.items.reduce((s, i) => s + i.costPrice * i.quantity, 0)

  const expenses = [
    { label: "Kargo Ücreti",      value: order.cargoAmount      },
    { label: "Net KDV",           value: order.netKdv           },
    { label: "Ürün Maliyeti",     value: totalCostFromItems     },
    { label: "Ek Ürün Maliyeti",  value: order.extraCost        },
    { label: "Komisyon Tutarı",   value: order.commissionAmount },
    { label: "Hizmet Bedeli",     value: order.serviceFee       },
    { label: "Stopaj Kesintisi",  value: order.stoppageAmount   },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#F4F4F4]">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-[#F27A1A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1a1c1c]">Sipariş Analizi</h2>
            <p className="text-xs text-[#574236]">
              #{order.trendyolOrderId} · {fmtDate(order.orderDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg bg-[#F3F3F3] hover:bg-[#E8E8E8] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#574236]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sol: Siparişteki Ürünler */}
          <div className="flex-1 overflow-y-auto px-6 py-5 border-r border-[#F4F4F4]">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-[#F27A1A]" />
              <h3 className="text-sm font-semibold text-[#1a1c1c]">Siparişteki Ürünler</h3>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-orange-50 text-[#984700] text-[11px] font-semibold">
                {order.items.length} Kalem
              </span>
            </div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-xl border border-[#F0F0F0] p-3 bg-[#FAFAFA]">
                  <div className="w-14 h-14 rounded-lg bg-[#ECECEC] overflow-hidden shrink-0 border border-[#E8E8E8]">
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productTitle} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#8b7264]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1c1c] truncate">{item.productTitle}</p>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[11px] text-[#8b7264]">
                        Barkod: <span className="font-mono text-[#574236]">{item.productBarcode ?? "—"}</span>
                      </p>
                      <p className="text-[11px] text-[#8b7264]">
                        Komisyon Oranı: <span className="text-[#574236] font-medium">%{item.commissionRate.toFixed(1)}</span>
                      </p>
                      <p className="text-[11px] text-[#8b7264]">
                        Komisyon Tutarı: <span className="text-[#574236] font-medium tabular-nums">{fmtCurrency(item.commissionAmount)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#984700] tabular-nums">
                      {fmtCurrency(item.salePrice * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-[11px] text-[#8b7264]">{item.quantity} adet × {fmtCurrency(item.salePrice)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: Gider Kalemleri */}
          <div className="w-72 shrink-0 overflow-y-auto px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-[#8b7264]" />
              <h3 className="text-sm font-semibold text-[#1a1c1c]">Gider Kalemleri</h3>
            </div>

            <div className="space-y-2">
              {expenses.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-[#F0F0F0] px-4 py-3 bg-[#FAFAFA]">
                  <span className="text-sm text-[#574236]">{label}</span>
                  <span className="text-sm font-semibold tabular-nums text-[#984700]">
                    {fmtCurrency(value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Net Kâr özeti */}
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-700">Net Kâr</span>
                <span className={`text-base font-bold tabular-nums ${order.totalProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {fmtCurrency(order.totalProfit)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-600">
                <span>Kâr Marjı</span>
                <span className="tabular-nums font-medium">%{order.profitToSalesRatio.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-600">
                <span>Kâr Oranı</span>
                <span className="tabular-nums font-medium">%{order.profitToCostRatio.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TodayProductsTable ───────────────────────────────────────────────────────

function groupProducts(products: TodayProduct[]): VariantGroup[] {
  const map = new Map<string, TodayProduct[]>()
  for (const p of products) {
    const arr = map.get(p.title) ?? []
    arr.push(p)
    map.set(p.title, arr)
  }
  return Array.from(map.entries()).map(([title, prods]) => ({
    title,
    products: prods,
    isExpanded: false,
  }))
}

function TodayProductsTable({
  groups,
  saveState,
  onToggle,
  onSave,
}: {
  groups: VariantGroup[]
  saveState: Record<string, "saving" | "ok" | "error">
  onToggle: (title: string) => void
  onSave: (id: string, field: "costPrice" | "extraCost", value: number | null) => void
}) {
  if (!groups.length) {
    return (
      <div className="py-12 text-center">
        <Package className="w-8 h-8 text-[#d1cac5] mx-auto mb-2" />
        <p className="text-sm text-[#8b7264]">Bugün henüz sipariş giren ürün yok</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${TH} ${W.expand}`}></th>
            <th className={`${TH} ${W.info}`}>Ürün Bilgisi</th>
            <th className={`${TH} ${W.costPrice}`}>Ürün Maliyeti</th>
            <th className={`${TH} ${W.extraCost}`}>Ekstra Gider</th>
            <th className={`${TH} ${W.stock}`}>Stok</th>
            <th className={`${TH} ${W.returnRate}`}>İade Oranı</th>
            <th className={`${TH} ${W.deliveryType}`}>Teslimat Tipi</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const isMulti = group.products.length > 1

            if (isMulti) {
              return (
                <>
                  {/* Grup satırı */}
                  <tr
                    key={`group-${group.title}`}
                    className="bg-[#FAFAFA] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                    onClick={() => onToggle(group.title)}
                  >
                    <td className={`${TD} ${W.expand} h-12`}>
                      <div className="flex items-center justify-center">
                        <button className="w-7 h-7 rounded-full bg-[#1a1c1c] text-white flex items-center justify-center text-[11px] font-bold">
                          {group.isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className={`${TD} ${W.info} h-12`} colSpan={6}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-md bg-[#F4F4F4] overflow-hidden flex items-center justify-center border border-[#ECECEC] shrink-0">
                          {group.products[0].imageUrl ? (
                            <Image src={group.products[0].imageUrl} alt={group.title} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <span className="text-xs font-bold text-[#8b7264] uppercase">{group.title.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1a1c1c]">{group.title}</p>
                          <p className="text-[11px] text-[#8b7264]">{group.products.length} varyant</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* Varyant satırları */}
                  {group.isExpanded && group.products.map((p) => (
                    <ProductRow key={p.id} product={p} saveState={saveState} onSave={onSave} isVariant />
                  ))}
                </>
              )
            }

            return (
              <ProductRow key={group.products[0].id} product={group.products[0]} saveState={saveState} onSave={onSave} />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ProductRow({
  product,
  saveState,
  onSave,
  isVariant = false,
}: {
  product: TodayProduct
  saveState: Record<string, "saving" | "ok" | "error">
  onSave: (id: string, field: "costPrice" | "extraCost", value: number | null) => void
  isVariant?: boolean
}) {
  const state = saveState[product.id]
  return (
    <tr className={`group transition-colors ${isVariant ? "bg-orange-50/30 hover:bg-orange-50/60" : "hover:bg-[#FAFAFA]"} ${
      state === "saving" ? "opacity-60" : state === "error" ? "bg-red-50" : state === "ok" ? "bg-emerald-50/40" : ""
    }`}>
      {/* Expand sütunu (varyant göstergesi) */}
      <td className={`${TD} ${W.expand} h-14`}>
        {isVariant && (
          <div className="flex justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F27A1A]" />
          </div>
        )}
      </td>

      {/* Ürün Bilgisi */}
      <td className={`${TD} ${W.info} h-14`}>
        <div className="flex items-center gap-2.5">
          <ProductImage src={product.imageUrl} title={product.title} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1a1c1c] truncate" style={{ maxWidth: 180 }}>{product.title}</p>
            <p className="text-xs text-[#8b7264] mt-0.5">
              {[product.color, product.size].filter(Boolean).join(" · ") || product.brand || "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Ürün Maliyeti */}
      <td className={`${TD} ${W.costPrice} py-1.5`}>
        <EditableCell value={product.costPrice} suffix="₺" allowNull
          onSave={(v) => onSave(product.id, "costPrice", v)} />
      </td>

      {/* Ekstra Gider */}
      <td className={`${TD} ${W.extraCost} py-1.5`}>
        <EditableCell value={product.extraCost} suffix="₺"
          onSave={(v) => v != null && onSave(product.id, "extraCost", v)} />
      </td>

      {/* Stok */}
      <td className={`${TD} ${W.stock}`}>
        <span className={`text-sm tabular-nums font-semibold ${product.stockQty === 0 ? "text-red-400" : "text-[#1a1c1c]"}`}>
          {product.stockQty.toLocaleString("tr-TR")}
        </span>
      </td>

      {/* İade Oranı */}
      <td className={`${TD} ${W.returnRate}`}>
        {product.returnRate != null
          ? <span className="text-xs tabular-nums text-[#574236] font-medium">%{product.returnRate.toFixed(1)}</span>
          : <span className="text-[#d1cac5] text-xs">—</span>
        }
      </td>

      {/* Teslimat Tipi */}
      <td className={`${TD} ${W.deliveryType}`}>
        <DeliveryBadge value={product.deliveryType} />
      </td>
    </tr>
  )
}

// ─── OrderProfitabilityTable ───────────────────────────────────────────────────

function OrderProfitabilityTable({
  orders,
  onDetail,
}: {
  orders: TodayOrder[]
  onDetail: (order: TodayOrder) => void
}) {
  if (!orders.length) {
    return (
      <div className="py-12 text-center">
        <ShoppingBag className="w-8 h-8 text-[#d1cac5] mx-auto mb-2" />
        <p className="text-sm text-[#8b7264]">Bugün henüz sipariş yok</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={TH}>Sipariş Numarası</th>
            <th className={TH}>Sipariş Tarihi</th>
            <th className={`${TH} text-right`}>Sipariş Tutarı (₺)</th>
            <th className={`${TH} text-right`}>Kâr Tutarı (₺)</th>
            <th className={`${TH} text-right`}>Kâr Oranı (%)</th>
            <th className={`${TH} text-right`}>Kâr Marjı (%)</th>
            <th className={`${TH} text-center`}></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-[#FAFAFA] transition-colors">
              <td className={`${TD} py-3`}>
                <button
                  onClick={() => onDetail(order)}
                  className="text-sm font-medium text-[#F27A1A] hover:text-[#984700] hover:underline transition-colors tabular-nums text-left"
                >
                  #{order.trendyolOrderId}
                </button>
              </td>
              <td className={`${TD} py-3`}>
                <span className="text-sm text-[#574236]">{fmtDate(order.orderDate)}</span>
              </td>
              <td className={`${TD} py-3 text-right`}>
                <span className="text-sm font-medium tabular-nums text-[#1a1c1c]">{fmtCurrency(order.grossAmount)}</span>
              </td>
              <td className={`${TD} py-3 text-right`}>
                <span className={`text-sm font-semibold tabular-nums ${order.totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {fmtCurrency(order.totalProfit)}
                </span>
              </td>
              <td className={`${TD} py-3 text-right`}>
                <span className={`text-sm tabular-nums font-medium ${order.profitToCostRatio >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {order.profitToCostRatio.toFixed(2)}
                </span>
              </td>
              <td className={`${TD} py-3 text-right`}>
                <span className={`text-sm tabular-nums font-medium ${order.profitToSalesRatio >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {order.profitToSalesRatio.toFixed(2)}
                </span>
              </td>
              <td className={`${TD} py-3 text-center`}>
                <button
                  onClick={() => onDetail(order)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F3] hover:bg-orange-50 hover:text-[#F27A1A] text-[#574236] text-xs font-medium transition-colors"
                >
                  Detay
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LivePage() {
  const [data, setData]               = useState<LiveData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [groups, setGroups]           = useState<VariantGroup[]>([])
  const [saveState, setSaveState]     = useState<Record<string, "saving" | "ok" | "error">>({})
  const [selectedOrder, setSelectedOrder] = useState<TodayOrder | null>(null)

  // Sadece DB'den okur — hızlı, arka plan polling için
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/live")
      if (!res.ok) return
      const json = await res.json() as LiveData
      setData(json)
      setGroups(prev => {
        const expandedTitles = new Set(prev.filter(g => g.isExpanded).map(g => g.title))
        return groupProducts(json.products).map(g => ({
          ...g,
          isExpanded: expandedTitles.has(g.title),
        }))
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Trendyol'dan çekip DB'ye yazar, ardından ekranı günceller — butona basınca çağrılır
  const syncAndRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetch("/api/sync", { method: "POST" })
      await fetchData(true)
    } finally {
      setRefreshing(false)
    }
  }, [fetchData])

  // İlk yükleme
  useEffect(() => { fetchData() }, [fetchData])

  // 30 saniyede bir DB'yi yeniden oku (sync ayrıca arka planda çalışıyor)
  useEffect(() => {
    const id = setInterval(() => fetchData(true), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchData])

  function toggleGroup(title: string) {
    setGroups(prev => prev.map(g => g.title === title ? { ...g, isExpanded: !g.isExpanded } : g))
  }

  function updateLocalProduct(id: string, patch: Partial<TodayProduct>) {
    setGroups(prev => prev.map(g => ({
      ...g,
      products: g.products.map(p => p.id === id ? { ...p, ...patch } : p),
    })))
  }

  async function saveProductField(id: string, field: "costPrice" | "extraCost", value: number | null) {
    setSaveState(s => ({ ...s, [id]: "saving" }))
    updateLocalProduct(id, { [field]: value })
    try {
      const res = await fetch("/api/product-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      })
      setSaveState(s => ({ ...s, [id]: res.ok ? "ok" : "error" }))
    } catch {
      setSaveState(s => ({ ...s, [id]: "error" }))
    } finally {
      setTimeout(() => setSaveState(s => { const n = { ...s }; delete n[id]; return n }), 2000)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#F27A1A] border-t-transparent animate-spin" />
          <p className="text-sm text-[#574236]">Yükleniyor…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#574236]">Veri yüklenemedi. Lütfen sayfayı yenileyin.</p>
      </div>
    )
  }

  const { metrics, profitByHour, orders } = data

  const lastUpdatedTime = new Date(metrics.lastUpdated).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="space-y-6">

      {/* ── Başlık ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1c1c]">Canlı Performans</h1>
          <p className="text-sm text-[#574236] mt-0.5">
            Bugünkü anlık veriler · Son güncelleme: {lastUpdatedTime}
          </p>
        </div>
        <button
          onClick={syncAndRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F27A1A] text-white text-sm font-semibold hover:bg-[#d96a0e] transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Verileri Güncelle
        </button>
      </div>

      {/* ── Grafik + Stat Kartları ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* Kar Grafiği */}
        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-[#574236] uppercase tracking-wider">Bugünkü Net Kârım</p>
              <p className={`text-3xl font-bold mt-1 tabular-nums ${metrics.totalProfit >= 0 ? "text-[#1a1c1c]" : "text-red-600"}`}>
                {fmtCurrency(metrics.totalProfit)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8b7264]">
              <div className="w-2 h-2 rounded-full bg-[#00D1FF]" />
              Kâr Performansı
            </div>
          </div>

          {profitByHour.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={profitByHour} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00D1FF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00D1FF" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: "#8b7264" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8b7264" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmtShortCurrency(v)}
                  width={70}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#00D1FF"
                  strokeWidth={2}
                  fill="url(#profitGrad)"
                  dot={{ r: 3, fill: "#00D1FF", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#00D1FF", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center">
              <p className="text-sm text-[#8b7264]">Bugün henüz sipariş yok</p>
            </div>
          )}
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-rows-4 gap-4">
          <StatCard
            label="Kâr Tutarı"
            value={fmtCurrency(metrics.totalProfit)}
            subValue={`${metrics.orderCount} sipariş`}
            icon={<TrendingUp className="w-4 h-4" />}
            accent="emerald"
            tooltip="Bugünkü tüm siparişlerden elde edilen net kâr. Komisyon, kargo, KDV, stopaj ve ürün maliyetleri düşülmüş tutardır."
          />
          <StatCard
            label="Kâr / Ürün Maliyet Oranı"
            value={`%${metrics.profitToCostRatio.toFixed(2)}`}
            subValue="Kâr ÷ Toplam Maliyet"
            icon={<BarChart2 className="w-4 h-4" />}
            accent="teal"
            tooltip="Net kârın toplam ürün maliyetine oranı. Yatırım getirisi (ROI) — 1₺ harcanan maliyete karşılık kaç kuruş kâr elde edildiğini gösterir."
          />
          <StatCard
            label="Kâr / Satış Fiyat Oranı"
            value={`%${metrics.profitToSalesRatio.toFixed(2)}`}
            subValue="Kâr Marjı"
            icon={<Package className="w-4 h-4" />}
            accent="orange"
            tooltip="Net kârın toplam ciroya oranı (kâr marjı). Her 100₺'lik satıştan kaç lira kâr kaldığını gösterir."
          />
          <StatCard
            label="Ciro"
            value={fmtCurrency(metrics.totalRevenue)}
            subValue="Brüt satış tutarı"
            icon={<ShoppingBag className="w-4 h-4" />}
            accent="neutral"
            tooltip="Bugünkü toplam brüt satış tutarı. Herhangi bir kesinti yapılmamış ham gelirdir."
          />
        </div>
      </div>

      {/* ── Bugün Sipariş Alan Ürünler ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F4F4F4] bg-orange-50/60">
          <Truck className="w-4 h-4 text-[#F27A1A]" />
          <h2 className="text-sm font-semibold text-[#1a1c1c]">Bugün Sipariş Alan Ürünler</h2>
          <span className="ml-auto text-[11px] text-[#8b7264]">
            Maliyeti eksik ürünler kârlılık hesaplamasına dahil edilemez
          </span>
          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#984700] text-[11px] font-semibold">
            {groups.reduce((s, g) => s + g.products.length, 0)} ürün
          </span>
        </div>
        <TodayProductsTable
          groups={groups}
          saveState={saveState}
          onToggle={toggleGroup}
          onSave={saveProductField}
        />
      </div>

      {/* ── Sipariş Kârlılık Analizi ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F4F4F4]">
          <BarChart2 className="w-4 h-4 text-[#574236]" />
          <h2 className="text-sm font-semibold text-[#1a1c1c]">Sipariş Kârlılık Analizi</h2>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-[#F3F3F3] text-[#574236] text-[11px] font-semibold">
            {orders.length} sipariş
          </span>
        </div>
        <OrderProfitabilityTable orders={orders} onDetail={setSelectedOrder} />
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
