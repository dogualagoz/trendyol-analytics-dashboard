"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import {
  ChevronDown,
  ChevronRight,
  Upload,
  X,
  Filter,
  Package,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import type { ProductForSettings } from "@/lib/product-settings"

// ─── Types ────────────────────────────────────────────────────────────────────

type VariantGroup = {
  title: string
  products: ProductForSettings[]
  isExpanded: boolean
}

type Filters = {
  search: string
  barcode: string
  brand: string
  modelCode: string
  minCost: string
  maxCost: string
  minStock: string
  maxStock: string
  minDesi: string
  maxDesi: string
  emptyOnly: boolean
}

const EMPTY_FILTERS: Filters = {
  search: "",
  barcode: "",
  brand: "",
  modelCode: "",
  minCost: "",
  maxCost: "",
  minStock: "",
  maxStock: "",
  minDesi: "",
  maxDesi: "",
  emptyOnly: false,
}

// ─── Editable Cell ────────────────────────────────────────────────────────────

function EditableCell({
  value,
  placeholder = "—",
  suffix,
  step = "0.01",
  onSave,
  allowNull = false,
}: {
  value: number | null
  placeholder?: string
  suffix?: string
  step?: string
  onSave: (val: number | null) => void
  allowNull?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [localVal, setLocalVal] = useState(value?.toString() ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocalVal(value?.toString() ?? "") }, [value])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function commit() {
    setEditing(false)
    if (localVal === "" && allowNull) { onSave(null); return }
    const num = parseFloat(localVal)
    if (!isNaN(num)) onSave(num)
    else setLocalVal(value?.toString() ?? "")
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={step}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") { setEditing(false); setLocalVal(value?.toString() ?? "") }
        }}
        className="w-full h-8 rounded-md border border-[#F27A1A] bg-orange-50 px-2 text-sm text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#F27A1A]/20 tabular-nums"
      />
    )
  }

  const isEmpty = value == null
  return (
    <button
      onClick={() => setEditing(true)}
      className={`w-full h-8 flex items-center px-2 rounded-md text-sm transition-all hover:bg-orange-50 hover:text-[#F27A1A] group tabular-nums text-left ${
        isEmpty ? "text-[#c0bbb7] italic" : "text-[#1a1c1c] font-medium"
      }`}
    >
      {isEmpty ? (
        <span className="text-xs">{placeholder}</span>
      ) : (
        <span className="flex items-baseline gap-0.5">
          <span>{value}</span>
          {suffix && <span className="text-[#8b7264] text-[11px] ml-0.5">{suffix}</span>}
        </span>
      )}
      <span className="opacity-0 group-hover:opacity-40 ml-auto text-[#F27A1A] text-[10px]">✎</span>
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupProducts(products: ProductForSettings[]): VariantGroup[] {
  const map = new Map<string, ProductForSettings[]>()
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

function buildQuery(f: Filters): string {
  const p = new URLSearchParams()
  if (f.search)    p.set("search",    f.search)
  if (f.barcode)   p.set("barcode",   f.barcode)
  if (f.brand)     p.set("brand",     f.brand)
  if (f.modelCode) p.set("modelCode", f.modelCode)
  if (f.minCost)   p.set("minCost",   f.minCost)
  if (f.maxCost)   p.set("maxCost",   f.maxCost)
  if (f.minStock)  p.set("minStock",  f.minStock)
  if (f.maxStock)  p.set("maxStock",  f.maxStock)
  if (f.minDesi)   p.set("minDesi",   f.minDesi)
  if (f.maxDesi)   p.set("maxDesi",   f.maxDesi)
  if (f.emptyOnly) p.set("emptyOnly", "true")
  return p.toString()
}

// Tüm varyantlar aynı değeri paylaşıyorsa onu göster, farklıysa null döner
function sharedValue<T extends string | null>(products: ProductForSettings[], field: keyof ProductForSettings): T | null {
  const vals = products.map(p => p[field] as T).filter(v => v != null)
  if (!vals.length) return null
  const first = vals[0]
  return vals.every(v => v === first) ? first : null
}

function RangeVal({ products, field, suffix = "" }: {
  products: ProductForSettings[]
  field: "costPrice" | "costKdvRate" | "desi" | "extraCost"
  suffix?: string
}) {
  const vals = products.map(p => p[field]).filter((v): v is number => v != null)
  if (!vals.length) return <span className="text-[#d1cac5] text-xs">—</span>
  const min = Math.min(...vals), max = Math.max(...vals)
  return (
    <span className="text-xs tabular-nums font-medium text-[#574236]">
      {min === max ? `${min}${suffix}` : `${min}${suffix} – ${max}${suffix}`}
    </span>
  )
}

// ─── Column widths ────────────────────────────────────────────────────────────

const W = {
  expand:       "w-12   min-w-[48px]",
  info:         "w-[340px] min-w-[340px]",
  barcode:      "w-[150px] min-w-[150px]",
  costPrice:    "w-[140px] min-w-[140px]",
  costKdvRate:  "w-[104px] min-w-[104px]",
  desi:         "w-[80px]  min-w-[80px]",
  extraCost:    "w-[120px] min-w-[120px]",
  brand:        "w-[130px] min-w-[130px]",
  modelCode:    "w-[130px] min-w-[130px]",
  color:        "w-[120px] min-w-[120px]",
  size:         "w-[110px] min-w-[110px]",
  stock:        "w-[72px]  min-w-[72px]",
  returnRate:   "w-[90px]  min-w-[90px]",
  deliveryType: "w-[120px] min-w-[120px]",
}

const TH = "px-4 py-3 text-left text-[10px] font-semibold text-[#8b7264] uppercase tracking-wider whitespace-nowrap bg-[#FAFAFA] border-b border-[#ECECEC] select-none"
const TD = "px-4 border-b border-[#F4F4F4] align-middle"

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductSettingsPage() {
  const [groups, setGroups]               = useState<VariantGroup[]>([])
  const [draftFilters, setDraftFilters]   = useState<Filters>(EMPTY_FILTERS)
  const [activeFilters, setActiveFilters] = useState<Filters>(EMPTY_FILTERS)
  const [loading, setLoading]             = useState(true)
  const [saveState, setSaveState]         = useState<Record<string, "saving" | "ok" | "error">>({})

  const fetchProducts = useCallback(async (filters: Filters) => {
    setLoading(true)
    try {
      const qs  = buildQuery(filters)
      const res = await fetch(`/api/product-settings${qs ? `?${qs}` : ""}`)
      const data = await res.json() as { products: ProductForSettings[] }
      setGroups(prev => {
        const expandedTitles = new Set(prev.filter(g => g.isExpanded).map(g => g.title))
        return groupProducts(data.products).map(g => ({ ...g, isExpanded: expandedTitles.has(g.title) }))
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts(activeFilters) }, [activeFilters, fetchProducts])

  function toggleGroup(title: string) {
    setGroups(prev => prev.map(g => g.title === title ? { ...g, isExpanded: !g.isExpanded } : g))
  }

  function updateLocal(id: string, patch: Partial<ProductForSettings>) {
    setGroups(prev => prev.map(g => ({ ...g, products: g.products.map(p => p.id === id ? { ...p, ...patch } : p) })))
  }

  async function saveField(
    id: string,
    field: "costPrice" | "costKdvRate" | "desi" | "extraCost",
    value: number | null
  ) {
    setSaveState(s => ({ ...s, [id]: "saving" }))
    updateLocal(id, { [field]: value })
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

  const totalProducts = groups.reduce((s, g) => s + g.products.length, 0)

  const inp = "w-full rounded-lg border border-[#E8E8E8] px-3 h-9 text-sm text-[#1a1c1c] placeholder:text-[#c0bbb7] focus:outline-none focus:border-[#F27A1A] focus:ring-2 focus:ring-[#F27A1A]/10 bg-white transition-all"

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#1a1c1c]">Ürün Ayarları</h2>
        <p className="text-sm text-[#8b7264] mt-0.5">Ürün maliyeti, KDV oranı, desi ve ekstra gider yönetimi</p>
      </div>

      {/* ── Filtre Kartı ── */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2.5">
          <input type="text" placeholder="Ürün adı ara…" value={draftFilters.search}
            onChange={e => setDraftFilters(f => ({ ...f, search: e.target.value }))} className={inp} />
          <input type="text" placeholder="Barkod" value={draftFilters.barcode}
            onChange={e => setDraftFilters(f => ({ ...f, barcode: e.target.value }))} className={inp} />
          <input type="text" placeholder="Marka" value={draftFilters.brand}
            onChange={e => setDraftFilters(f => ({ ...f, brand: e.target.value }))} className={inp} />
          <input type="text" placeholder="Model kodu" value={draftFilters.modelCode}
            onChange={e => setDraftFilters(f => ({ ...f, modelCode: e.target.value }))} className={inp} />
        </div>

        <div className="grid grid-cols-4 gap-2.5 items-center">
          <div className="flex items-center gap-1.5">
            <input type="number" placeholder="Min ₺" value={draftFilters.minCost}
              onChange={e => setDraftFilters(f => ({ ...f, minCost: e.target.value }))} className={inp} />
            <span className="text-[#d1cac5] shrink-0 text-xs">–</span>
            <input type="number" placeholder="Max ₺" value={draftFilters.maxCost}
              onChange={e => setDraftFilters(f => ({ ...f, maxCost: e.target.value }))} className={inp} />
          </div>
          <div className="flex items-center gap-1.5">
            <input type="number" placeholder="Min stok" value={draftFilters.minStock}
              onChange={e => setDraftFilters(f => ({ ...f, minStock: e.target.value }))} className={inp} />
            <span className="text-[#d1cac5] shrink-0 text-xs">–</span>
            <input type="number" placeholder="Max stok" value={draftFilters.maxStock}
              onChange={e => setDraftFilters(f => ({ ...f, maxStock: e.target.value }))} className={inp} />
          </div>
          <div className="flex items-center gap-1.5">
            <input type="number" step="0.1" placeholder="Min desi" value={draftFilters.minDesi}
              onChange={e => setDraftFilters(f => ({ ...f, minDesi: e.target.value }))} className={inp} />
            <span className="text-[#d1cac5] shrink-0 text-xs">–</span>
            <input type="number" step="0.1" placeholder="Max desi" value={draftFilters.maxDesi}
              onChange={e => setDraftFilters(f => ({ ...f, maxDesi: e.target.value }))} className={inp} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={draftFilters.emptyOnly}
              onChange={e => setDraftFilters(f => ({ ...f, emptyOnly: e.target.checked }))}
              className="w-4 h-4 rounded border-[#E2E2E2] accent-[#F27A1A]" />
            <span className="text-sm text-[#574236]">Maliyeti boş olanlar</span>
          </label>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={() => setActiveFilters({ ...draftFilters })}
            className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors"
          >
            <Filter className="w-3.5 h-3.5" /> Filtrele
          </button>
          <button
            onClick={() => { setDraftFilters(EMPTY_FILTERS); setActiveFilters(EMPTY_FILTERS) }}
            className="flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[#E8E8E8] text-sm text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A] transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Temizle
          </button>
        </div>
      </div>

      {/* ── Excel Placeholder ── */}
      <div className="bg-white rounded-xl border border-dashed border-[#F0D5C4] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4 text-[#F27A1A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1c1c]">Toplu Maliyet Yükleme</p>
            <p className="text-xs text-[#8b7264] mt-0.5">
              Excel ile toplu güncelleme — <span className="text-[#F27A1A] font-medium">yakında</span>
            </p>
          </div>
          <button disabled className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#E8E8E8] text-sm text-[#c0bbb7] cursor-not-allowed">
            <Upload className="w-3.5 h-3.5" /> Excel Yükle
          </button>
        </div>
      </div>

      {/* ── Tablo Kartı ── */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm overflow-hidden">

        {/* Kart başlığı */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#F27A1A]" />
            <span className="text-sm font-semibold text-[#1a1c1c]">
              {loading
                ? <span className="flex items-center gap-1.5 text-[#8b7264]"><RefreshCw className="w-3.5 h-3.5 animate-spin" />Yükleniyor…</span>
                : <>{totalProducts.toLocaleString("tr-TR")} ürün · {groups.length.toLocaleString("tr-TR")} grup</>
              }
            </span>
          </div>
          <span className="text-[11px] text-[#c0bbb7]">Hücreye tıkla → düzenle → Enter veya dışarı tıkla</span>
        </div>

        {/* Tablo */}
        <div className="overflow-auto [overflow-anchor:none]" style={{ maxHeight: "calc(100vh - 180px)" }}>
          <table className="border-collapse w-full" style={{ minWidth: "1440px" }}>

            <thead className="sticky top-0 z-10">
              <tr>
                <th className={`${TH} ${W.expand}`}></th>
                <th className={`${TH} ${W.info}`}>Ürün</th>
                <th className={`${TH} ${W.barcode}`}>Barkod</th>
                <th className={`${TH} ${W.costPrice}`}>
                  Maliyet
                  <span className="block font-normal normal-case tracking-normal text-[#b0a49e] mt-0.5">KDV Dahil (₺)</span>
                </th>
                <th className={`${TH} ${W.costKdvRate}`}>
                  KDV
                  <span className="block font-normal normal-case tracking-normal text-[#b0a49e] mt-0.5">Oranı (%)</span>
                </th>
                <th className={`${TH} ${W.desi}`}>Desi</th>
                <th className={`${TH} ${W.extraCost}`}>
                  Ekstra
                  <span className="block font-normal normal-case tracking-normal text-[#b0a49e] mt-0.5">Gider (₺)</span>
                </th>
                <th className={`${TH} ${W.brand}`}>Marka</th>
                <th className={`${TH} ${W.modelCode}`}>Model Kodu</th>
                <th className={`${TH} ${W.color}`}>Renk</th>
                <th className={`${TH} ${W.size}`}>Beden</th>
                <th className={`${TH} ${W.stock}`}>Stok</th>
                <th className={`${TH} ${W.returnRate}`}>İade %</th>
                <th className={`${TH} ${W.deliveryType}`}>Teslimat</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-20 text-center">
                    <RefreshCw className="w-6 h-6 text-[#dec1b1] mx-auto animate-spin" />
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-20 text-center">
                    <Package className="w-10 h-10 text-[#dec1b1] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1a1c1c]">Ürün bulunamadı</p>
                    <p className="text-xs text-[#8b7264] mt-1">Filtreleri değiştirin veya önce sync yapın.</p>
                  </td>
                </tr>
              ) : groups.map(group => (
                <GroupSection
                  key={group.title}
                  group={group}
                  onToggle={() => toggleGroup(group.title)}
                  saveState={saveState}
                  onSave={saveField}
                  onLocalUpdate={updateLocal}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── GroupSection ─────────────────────────────────────────────────────────────

function GroupSection({
  group,
  onToggle,
  saveState,
  onSave,
  onLocalUpdate,
}: {
  group: VariantGroup
  onToggle: () => void
  saveState: Record<string, "saving" | "ok" | "error">
  onSave: (id: string, field: "costPrice" | "costKdvRate" | "desi" | "extraCost", val: number | null) => void
  onLocalUpdate: (id: string, patch: Partial<ProductForSettings>) => void
}) {
  const isMulti = group.products.length > 1
  const first   = group.products[0]

  function handleSave(id: string, field: "costPrice" | "costKdvRate" | "desi" | "extraCost", val: number | null) {
    onLocalUpdate(id, { [field]: val })
    onSave(id, field, val)
  }

  if (!isMulti) {
    return (
      <ProductRow
        product={first}
        isGroup={false}
        isExpanded={false}
        onToggle={() => {}}
        saveState={saveState}
        onSave={handleSave}
        isSubRow={false}
      />
    )
  }

  return (
    <>
      {/* Grup başlık satırı */}
      <tr
        onClick={onToggle}
        className="cursor-pointer bg-[#FAFAFA] hover:bg-orange-50/30 transition-colors group"
      >
        {/* Expand toggle */}
        <td className={`${TD} ${W.expand} text-center`}>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#F0F0F0] group-hover:bg-[#F27A1A]/10 transition-colors">
            {group.isExpanded
              ? <ChevronDown className="w-3.5 h-3.5 text-[#574236]" />
              : <ChevronRight className="w-3.5 h-3.5 text-[#574236]" />}
          </span>
        </td>

        {/* Ürün Bilgisi */}
        <td className={`${TD} ${W.info} h-16`}>
          <div className="flex items-center gap-2.5">
            <ProductImage src={first.imageUrl} title={first.title} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-[#1a1c1c] truncate" style={{ maxWidth: 190 }}>{first.title}</p>
                <span className="shrink-0 inline-flex items-center px-1.5 h-5 rounded text-[10px] font-semibold bg-[#574236]/10 text-[#574236]">
                  {group.products.length} varyant
                </span>
              </div>
              <p className="text-xs text-[#8b7264] mt-0.5">{first.brand ?? "—"} · {first.category ?? "—"}</p>
            </div>
          </div>
        </td>

        <td className={`${TD} ${W.barcode}`}><span className="text-[#d1cac5] text-xs">—</span></td>

        <td className={`${TD} ${W.costPrice}`}><RangeVal products={group.products} field="costPrice" suffix="₺" /></td>
        <td className={`${TD} ${W.costKdvRate}`}><RangeVal products={group.products} field="costKdvRate" suffix="%" /></td>
        <td className={`${TD} ${W.desi}`}><RangeVal products={group.products} field="desi" /></td>
        <td className={`${TD} ${W.extraCost}`}><RangeVal products={group.products} field="extraCost" suffix="₺" /></td>

        <td className={`${TD} ${W.brand}`}>
          <span className="text-xs text-[#574236] truncate block">{first.brand ?? "—"}</span>
        </td>
        <td className={`${TD} ${W.modelCode}`}>
          {(() => { const v = sharedValue<string>(group.products, "modelCode"); return v ? <span className="text-xs text-[#574236] font-mono truncate block">{v}</span> : <span className="text-[#d1cac5] text-xs">—</span> })()}
        </td>
        <td className={`${TD} ${W.color}`}>
          {(() => { const v = sharedValue<string>(group.products, "color"); return v ? <span className="inline-flex items-center px-2 h-5 rounded text-[11px] bg-[#F3F3F3] text-[#574236] font-medium">{v}</span> : <span className="text-[#d1cac5] text-xs">—</span> })()}
        </td>
        <td className={`${TD} ${W.size}`}>
          {(() => { const v = sharedValue<string>(group.products, "size"); return v ? <span className="inline-flex items-center px-2 h-5 rounded text-[11px] bg-[#F3F3F3] text-[#574236] font-medium">{v}</span> : <span className="text-[#d1cac5] text-xs">—</span> })()}
        </td>
        <td className={`${TD} ${W.stock}`}>
          <span className="text-sm tabular-nums font-semibold text-[#574236]">
            {group.products.reduce((s, p) => s + p.stockQty, 0).toLocaleString("tr-TR")}
          </span>
        </td>
        <td className={`${TD} ${W.returnRate}`}>
          {(() => { const v = sharedValue<string>(group.products, "returnRate"); return v != null ? <span className="text-xs tabular-nums text-[#574236] font-medium">%{Number(v).toFixed(1)}</span> : <span className="text-[#d1cac5] text-xs">—</span> })()}
        </td>
        <td className={`${TD} ${W.deliveryType}`}><DeliveryBadge value={sharedValue<string>(group.products, "deliveryType") ?? first.deliveryType} /></td>
      </tr>

      {/* Varyant satırları */}
      {group.isExpanded && group.products.map((product, idx) => (
        <ProductRow
          key={product.id}
          product={product}
          isGroup
          isExpanded
          onToggle={() => {}}
          variantIndex={idx + 1}
          variantTotal={group.products.length}
          saveState={saveState}
          onSave={handleSave}
          isSubRow
        />
      ))}
    </>
  )
}

// ─── ProductRow ───────────────────────────────────────────────────────────────

function ProductRow({
  product,
  isGroup,
  isSubRow = false,
  variantIndex,
  variantTotal,
  saveState,
  onSave,
}: {
  product: ProductForSettings
  isGroup: boolean
  isExpanded: boolean
  onToggle: () => void
  variantIndex?: number
  variantTotal?: number
  saveState: Record<string, "saving" | "ok" | "error">
  onSave: (id: string, field: "costPrice" | "costKdvRate" | "desi" | "extraCost", val: number | null) => void
  isSubRow?: boolean
}) {
  const state = saveState[product.id]

  return (
    <tr className={`transition-colors ${
      isSubRow
        ? "bg-white hover:bg-orange-50/20 border-l-2 border-l-[#F27A1A]/20"
        : "bg-white hover:bg-[#FAFAFA]"
    }`}>
      {/* Expand / status */}
      <td className={`${TD} ${W.expand} text-center h-16`}>
        {isGroup && variantIndex != null ? (
          <span className="inline-flex items-center justify-center text-[10px] font-bold text-[#8b7264] tabular-nums">
            {variantIndex}/{variantTotal}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-[#E2E2E2]" />
        )}
        {state === "saving" && <RefreshCw className="w-3 h-3 text-[#8b7264] animate-spin mx-auto mt-0.5" />}
        {state === "ok"     && <CheckCircle className="w-3 h-3 text-emerald-500 mx-auto mt-0.5" />}
        {state === "error"  && <AlertCircle className="w-3 h-3 text-red-500 mx-auto mt-0.5" />}
      </td>

      {/* Ürün Bilgisi */}
      <td className={`${TD} ${W.info} h-16`}>
        <div className="flex items-center gap-2.5">
          <ProductImage src={product.imageUrl} title={product.title} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1a1c1c] truncate" style={{ maxWidth: 200 }}>{product.title}</p>
            <p className="text-xs text-[#8b7264] mt-0.5">
              {[product.color, product.size].filter(Boolean).join(" · ") || product.category || "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Barkod */}
      <td className={`${TD} ${W.barcode}`}>
        <span className="text-xs text-[#574236] font-mono truncate block">{product.barcode ?? "—"}</span>
      </td>

      {/* Ürün Maliyeti */}
      <td className={`${TD} ${W.costPrice} py-1.5`}>
        <EditableCell value={product.costPrice} suffix="₺" allowNull
          onSave={v => onSave(product.id, "costPrice", v)} />
      </td>

      {/* Maliyet KDV Oranı */}
      <td className={`${TD} ${W.costKdvRate} py-1.5`}>
        <EditableCell value={product.costKdvRate} suffix="%" step="1"
          onSave={v => v != null && onSave(product.id, "costKdvRate", v)} />
      </td>

      {/* Desi */}
      <td className={`${TD} ${W.desi} py-1.5`}>
        <EditableCell value={product.desi} step="0.1"
          onSave={v => v != null && onSave(product.id, "desi", v)} />
      </td>

      {/* Ekstra Gider */}
      <td className={`${TD} ${W.extraCost} py-1.5`}>
        <EditableCell value={product.extraCost} suffix="₺"
          onSave={v => v != null && onSave(product.id, "extraCost", v)} />
      </td>

      {/* Marka */}
      <td className={`${TD} ${W.brand}`}>
        <span className="text-xs text-[#574236] truncate block">{product.brand ?? "—"}</span>
      </td>

      {/* Model Kodu */}
      <td className={`${TD} ${W.modelCode}`}>
        <span className="text-xs text-[#574236] font-mono truncate block">{product.modelCode ?? "—"}</span>
      </td>

      {/* Renk */}
      <td className={`${TD} ${W.color}`}>
        {product.color
          ? <span className="inline-flex items-center px-2 h-5 rounded text-[11px] bg-[#F3F3F3] text-[#574236] font-medium">{product.color}</span>
          : <span className="text-[#d1cac5] text-xs">—</span>
        }
      </td>

      {/* Beden */}
      <td className={`${TD} ${W.size}`}>
        {product.size
          ? <span className="inline-flex items-center px-2 h-5 rounded text-[11px] bg-[#F3F3F3] text-[#574236] font-medium">{product.size}</span>
          : <span className="text-[#d1cac5] text-xs">—</span>
        }
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

// ─── Küçük yardımcı bileşenler ────────────────────────────────────────────────

function ProductImage({ src, title }: { src: string | null; title: string }) {
  return (
    <div className="relative group/img shrink-0">
      {/* Küçük thumbnail */}
      <div className="w-14 h-14 rounded-md bg-[#F4F4F4] overflow-hidden flex items-center justify-center border border-[#ECECEC]">
        {src ? (
          <Image
            src={src}
            alt={title}
            width={56}
            height={56}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-base font-bold text-[#8b7264] uppercase">
            {title.replace(/^[^a-zA-ZğüşıöçĞÜŞİÖÇ]*/, "").charAt(0) || title.charAt(0)}
          </span>
        )}
      </div>

      {/* Hover popup — sadece resim varsa */}
      {src && (
        <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 z-[100] hidden group-hover/img:block pointer-events-none">
          <div className="w-48 h-48 rounded-md overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.20)] border-2 border-white bg-white">
            <Image
              src={src}
              alt={title}
              width={192}
              height={192}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  )
}

function DeliveryBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-[#d1cac5] text-xs">—</span>
  const isFast = value.toLowerCase().includes("fast") || value.toLowerCase().includes("same")
  const label  = isFast ? "Hızlı" : "Normal"
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded text-[11px] font-medium ${
      isFast ? "bg-blue-50 text-blue-600" : "bg-[#F3F3F3] text-[#574236]"
    }`}>
      {label}
    </span>
  )
}
