"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Filter, X, ArrowUpDown } from "lucide-react"

const STATUS_OPTIONS = [
  { value: "",          label: "Tüm durumlar" },
  { value: "Delivered", label: "Teslim Edildi" },
  { value: "Cancelled", label: "İptal" },
  { value: "Returned",  label: "İade" },
  { value: "Created",   label: "İşlemde" },
]

const SORT_OPTIONS = [
  { value: "orderDate_desc",   label: "En yeni sipariş" },
  { value: "orderDate_asc",    label: "En eski sipariş" },
  { value: "grossAmount_desc", label: "Tutar yüksek → düşük" },
  { value: "grossAmount_asc",  label: "Tutar düşük → yüksek" },
]

const inp = "rounded-lg border border-[#E8E8E8] px-3 h-9 text-sm text-[#1a1c1c] placeholder:text-[#c0bbb7] focus:outline-none focus:border-[#F27A1A] focus:ring-2 focus:ring-[#F27A1A]/10 bg-white transition-all"

export function OrderFilterBar() {
  const router = useRouter()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search,   setSearch]   = useState(sp.get("search")   ?? "")
  const [status,   setStatus]   = useState(sp.get("status")   ?? "")
  const [dateFrom, setDateFrom] = useState(sp.get("dateFrom") ?? "")
  const [dateTo,   setDateTo]   = useState(sp.get("dateTo")   ?? "")
  const [sort,     setSort]     = useState(
    sp.get("sortBy") && sp.get("sortDir")
      ? `${sp.get("sortBy")}_${sp.get("sortDir")}`
      : "orderDate_desc"
  )

  function apply() {
    const p = new URLSearchParams()
    if (search)   p.set("search",   search)
    if (status)   p.set("status",   status)
    if (dateFrom) p.set("dateFrom", dateFrom)
    if (dateTo)   p.set("dateTo",   dateTo)
    const [sortBy, ...rest] = sort.split("_")
    const sortDir = rest.join("_")
    p.set("sortBy",  sortBy)
    p.set("sortDir", sortDir)
    startTransition(() => router.push(`?${p.toString()}`))
  }

  function clear() {
    setSearch(""); setStatus(""); setDateFrom(""); setDateTo(""); setSort("orderDate_desc")
    startTransition(() => router.push("?"))
  }

  const hasActive = !!(search || status || dateFrom || dateTo || sort !== "orderDate_desc")

  return (
    <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm p-4 space-y-3">
      {/* Durum pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => setStatus(o.value)}
            className={`px-3 h-8 rounded-full text-sm font-medium transition-colors ${
              status === o.value
                ? "bg-[#F27A1A] text-white"
                : "bg-[#F4F4F4] text-[#574236] hover:bg-orange-50 hover:text-[#F27A1A]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Arama */}
        <input
          type="text"
          placeholder="Sipariş no veya ürün adı…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && apply()}
          className={`${inp} w-full`}
        />

        {/* Tarih aralığı */}
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className={`${inp} w-full`}
          title="Başlangıç tarihi"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className={`${inp} w-full`}
          title="Bitiş tarihi"
        />

        {/* Sıralama */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#8b7264] shrink-0" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className={`${inp} w-full appearance-none`}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={apply}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors disabled:opacity-60"
        >
          <Filter className="w-3.5 h-3.5" />
          {isPending ? "Yükleniyor…" : "Uygula"}
        </button>

        {hasActive && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[#E8E8E8] text-sm text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A] transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Temizle
          </button>
        )}
      </div>
    </div>
  )
}
