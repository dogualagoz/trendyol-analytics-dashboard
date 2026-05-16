"use client"

import { useState } from "react"
import { Filter, X, ArrowUpDown } from "lucide-react"
import { EMPTY_FILTERS, SORT_OPTIONS, type Filters } from "./_types"
import { INP } from "./_styles"

// Filtreler iki türlü: text/range filtreleri "Ara" butonu ile uygulanır (draft),
// emptyOnly checkbox'ı ve sortBy seçimi anlık uygulanır.
export function FilterBar({
  onApply,
}: {
  onApply: (filters: Filters) => void
}) {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)

  // Bir filtre değişikliğini hem draft'a yazar hem de hemen uygular (instant filtreler için)
  function applyInstant(patch: Partial<Filters>) {
    const next = { ...draft, ...patch }
    setDraft(next)
    onApply(next)
  }

  function reset() {
    setDraft(EMPTY_FILTERS)
    onApply(EMPTY_FILTERS)
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm p-4 space-y-3">
      <div className="grid grid-cols-4 gap-2.5">
        <input type="text" placeholder="Ürün adı ara…" value={draft.search}
          onChange={e => setDraft(f => ({ ...f, search: e.target.value }))} className={INP} />
        <input type="text" placeholder="Barkod" value={draft.barcode}
          onChange={e => setDraft(f => ({ ...f, barcode: e.target.value }))} className={INP} />
        <input type="text" placeholder="Marka" value={draft.brand}
          onChange={e => setDraft(f => ({ ...f, brand: e.target.value }))} className={INP} />
        <input type="text" placeholder="Model kodu" value={draft.modelCode}
          onChange={e => setDraft(f => ({ ...f, modelCode: e.target.value }))} className={INP} />
      </div>

      <div className="grid grid-cols-4 gap-2.5 items-center">
        <div className="flex items-center gap-1.5">
          <input type="number" placeholder="Min ₺" value={draft.minCost}
            onChange={e => setDraft(f => ({ ...f, minCost: e.target.value }))} className={INP} />
          <span className="text-[#d1cac5] shrink-0 text-xs">–</span>
          <input type="number" placeholder="Max ₺" value={draft.maxCost}
            onChange={e => setDraft(f => ({ ...f, maxCost: e.target.value }))} className={INP} />
        </div>
        <div className="flex items-center gap-1.5">
          <input type="number" placeholder="Min stok" value={draft.minStock}
            onChange={e => setDraft(f => ({ ...f, minStock: e.target.value }))} className={INP} />
          <span className="text-[#d1cac5] shrink-0 text-xs">–</span>
          <input type="number" placeholder="Max stok" value={draft.maxStock}
            onChange={e => setDraft(f => ({ ...f, maxStock: e.target.value }))} className={INP} />
        </div>
        <div className="flex items-center gap-1.5">
          <input type="number" step="0.1" placeholder="Min desi" value={draft.minDesi}
            onChange={e => setDraft(f => ({ ...f, minDesi: e.target.value }))} className={INP} />
          <span className="text-[#d1cac5] shrink-0 text-xs">–</span>
          <input type="number" step="0.1" placeholder="Max desi" value={draft.maxDesi}
            onChange={e => setDraft(f => ({ ...f, maxDesi: e.target.value }))} className={INP} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={draft.emptyOnly}
            onChange={e => applyInstant({ emptyOnly: e.target.checked })}
            className="w-4 h-4 rounded border-[#E2E2E2] accent-[#F27A1A]" />
          <span className="text-sm text-[#574236]">Maliyeti boş olanlar</span>
        </label>
      </div>

      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#8b7264] shrink-0" />
          <select
            value={`${draft.sortBy}_${draft.sortDir}`}
            onChange={e => {
              const [sortBy, ...rest] = e.target.value.split("_")
              applyInstant({ sortBy, sortDir: rest.join("_") })
            }}
            className={`${INP} appearance-none flex-1`}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <button
          onClick={() => onApply({ ...draft })}
          className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors"
        >
          <Filter className="w-3.5 h-3.5" /> Ara
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[#E8E8E8] text-sm text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A] transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Temizle
        </button>
      </div>
    </div>
  )
}
