import type { ProductForSettings } from "@/lib/product-settings"
import type { Filters, VariantGroup } from "./_types"

export function groupProducts(products: ProductForSettings[]): VariantGroup[] {
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

export function buildQuery(f: Filters): string {
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
  if (f.sortBy)    p.set("sortBy",    f.sortBy)
  if (f.sortDir)   p.set("sortDir",   f.sortDir)
  return p.toString()
}

// Tüm varyantlar aynı değeri paylaşıyorsa onu göster, farklıysa null döner
export function sharedValue<T extends string | null>(
  products: ProductForSettings[],
  field: keyof ProductForSettings,
): T | null {
  const vals = products.map(p => p[field] as T).filter(v => v != null)
  if (!vals.length) return null
  const first = vals[0]
  return vals.every(v => v === first) ? first : null
}
