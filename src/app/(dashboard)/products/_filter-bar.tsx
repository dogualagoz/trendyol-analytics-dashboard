"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Filter, X, ArrowUpDown } from "lucide-react"

type Props = {
  categories: string[]
  brands: string[]
}

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "En yeni eklenen" },
  { value: "createdAt_asc",  label: "En eski eklenen" },
  { value: "title_asc",      label: "İsim A → Z" },
  { value: "title_desc",     label: "İsim Z → A" },
  { value: "orderCount_desc", label: "En çok sipariş" },
  { value: "orderCount_asc",  label: "En az sipariş" },
  { value: "costPrice_asc",  label: "Maliyet düşük → yüksek" },
  { value: "costPrice_desc", label: "Maliyet yüksek → düşük" },
]

const inp = "w-full rounded-lg border border-[#E8E8E8] px-3 h-9 text-sm text-[#1a1c1c] placeholder:text-[#c0bbb7] focus:outline-none focus:border-[#F27A1A] focus:ring-2 focus:ring-[#F27A1A]/10 bg-white transition-all"
const sel = `${inp} appearance-none`

export function ProductFilterBar({ categories, brands }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search,   setSearch]   = useState(sp.get("search")   ?? "")
  const [category, setCategory] = useState(sp.get("category") ?? "")
  const [brand,    setBrand]    = useState(sp.get("brand")    ?? "")
  const [hasCost,  setHasCost]  = useState(sp.get("hasCost")  ?? "")
  const [sort,     setSort]     = useState(
    sp.get("sortBy") && sp.get("sortDir")
      ? `${sp.get("sortBy")}_${sp.get("sortDir")}`
      : "createdAt_desc"
  )

  function apply() {
    const p = new URLSearchParams()
    if (search)   p.set("search",   search)
    if (category) p.set("category", category)
    if (brand)    p.set("brand",    brand)
    if (hasCost)  p.set("hasCost",  hasCost)
    const [sortBy, sortDir] = sort.split("_") as [string, string]
    p.set("sortBy",  sortBy)
    p.set("sortDir", sortDir)
    startTransition(() => router.push(`?${p.toString()}`))
  }

  function clear() {
    setSearch(""); setCategory(""); setBrand(""); setHasCost(""); setSort("createdAt_desc")
    startTransition(() => router.push("?"))
  }

  const hasActive = !!(search || category || brand || hasCost || sort !== "createdAt_desc")

  return (
    <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Arama */}
        <input
          type="text"
          placeholder="Ürün adı veya barkod…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && apply()}
          className={inp}
        />

        {/* Kategori */}
        <select value={category} onChange={e => setCategory(e.target.value)} className={sel}>
          <option value="">Tüm kategoriler</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Marka */}
        <select value={brand} onChange={e => setBrand(e.target.value)} className={sel}>
          <option value="">Tüm markalar</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Maliyet durumu */}
        <select value={hasCost} onChange={e => setHasCost(e.target.value)} className={sel}>
          <option value="">Maliyet: hepsi</option>
          <option value="yes">Maliyet girilmiş</option>
          <option value="no">Maliyet girilmemiş</option>
        </select>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Sıralama */}
        <div className="flex items-center gap-2 flex-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#8b7264] shrink-0" />
          <select value={sort} onChange={e => setSort(e.target.value)} className={`${sel} flex-1`}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

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
