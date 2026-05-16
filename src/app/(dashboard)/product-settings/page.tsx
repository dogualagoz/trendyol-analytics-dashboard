"use client"

import { useState, useEffect, useCallback } from "react"
import { Package, RefreshCw } from "lucide-react"
import type { ProductForSettings } from "@/lib/product-settings"
import { FilterBar } from "./_filter-bar"
import { BulkActions } from "./_bulk-actions"
import { GroupSection } from "./_group-section"
import { groupProducts, buildQuery } from "./_helpers"
import { W, TH } from "./_styles"
import {
  EMPTY_FILTERS,
  type Filters,
  type VariantGroup,
  type SaveState,
  type EditableField,
} from "./_types"

export default function ProductSettingsPage() {
  const [groups, setGroups]             = useState<VariantGroup[]>([])
  const [activeFilters, setActiveFilters] = useState<Filters>(EMPTY_FILTERS)
  const [loading, setLoading]           = useState(true)
  const [saveState, setSaveState]       = useState<SaveState>({})
  const [bulkApplying, setBulkApplying] = useState(false)
  const [bulkResult, setBulkResult]     = useState<{ applied: number; skipped: number } | null>(null)

  const fetchProducts = useCallback(async (filters: Filters) => {
    setLoading(true)
    try {
      const qs   = buildQuery(filters)
      const res  = await fetch(`/api/product-settings${qs ? `?${qs}` : ""}`)
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

  async function saveField(id: string, field: EditableField, value: number | null) {
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

  async function applyFabricCost(product: ProductForSettings) {
    if (product.fabricCostTry == null) return
    await saveField(product.id, "costPrice", product.fabricCostTry)
  }

  // Filtrelenen tüm ürünlerin kumaş maliyetini costPrice'a uygula.
  // Boyutu ayrıştırılamayan veya zaten aynı maliyete sahip ürünler atlanır.
  async function applyFabricCostBulk() {
    setBulkApplying(true)
    setBulkResult(null)
    let applied = 0
    let skipped = 0
    try {
      for (const group of groups) {
        for (const product of group.products) {
          if (product.fabricCostTry == null) { skipped++; continue }
          if (product.costPrice != null && Math.abs(product.costPrice - product.fabricCostTry) < 0.01) {
            skipped++; continue
          }
          await saveField(product.id, "costPrice", product.fabricCostTry)
          applied++
        }
      }
      setBulkResult({ applied, skipped })
    } finally {
      setBulkApplying(false)
      setTimeout(() => setBulkResult(null), 5000)
    }
  }

  const totalProducts       = groups.reduce((s, g) => s + g.products.length, 0)
  const fabricEligibleCount = groups.reduce(
    (s, g) => s + g.products.filter(p => p.fabricCostTry != null).length,
    0,
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#1a1c1c]">Ürün Ayarları</h2>
        <p className="text-sm text-[#8b7264] mt-0.5">Ürün maliyeti, KDV oranı, desi ve ekstra gider yönetimi</p>
      </div>

      <FilterBar onApply={setActiveFilters} />

      <BulkActions
        fabricEligibleCount={fabricEligibleCount}
        bulkApplying={bulkApplying}
        bulkResult={bulkResult}
        onApplyFabricBulk={applyFabricCostBulk}
      />

      <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm overflow-hidden">
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

        <div className="overflow-auto [overflow-anchor:none]" style={{ maxHeight: "calc(100vh - 180px)" }}>
          <table className="border-collapse w-full" style={{ minWidth: "1610px" }}>
            <thead className="sticky top-0 z-10">
              <tr>
                <th className={`${TH} ${W.expand}`}></th>
                <th className={`${TH} ${W.info}`}>Ürün</th>
                <th className={`${TH} ${W.barcode}`}>Barkod</th>
                <th className={`${TH} ${W.costPrice}`}>
                  Maliyet
                  <span className="block font-normal normal-case tracking-normal text-[#b0a49e] mt-0.5">KDV Dahil (₺)</span>
                </th>
                <th className={`${TH} ${W.fabricCost}`}>
                  Kumaş Maliyeti
                  <span className="block font-normal normal-case tracking-normal text-[#b0a49e] mt-0.5">Boyuttan Hesap (₺)</span>
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
                  <td colSpan={15} className="py-20 text-center">
                    <RefreshCw className="w-6 h-6 text-[#dec1b1] mx-auto animate-spin" />
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-20 text-center">
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
                  onApplyFabric={applyFabricCost}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
