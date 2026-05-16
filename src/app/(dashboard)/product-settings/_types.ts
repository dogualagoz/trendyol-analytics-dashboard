import type { ProductForSettings } from "@/lib/product-settings"

export type VariantGroup = {
  title: string
  products: ProductForSettings[]
  isExpanded: boolean
}

export type Filters = {
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
  sortBy: string
  sortDir: string
}

export type EditableField = "costPrice" | "costKdvRate" | "desi" | "extraCost"

export type SaveState = Record<string, "saving" | "ok" | "error">

export const EMPTY_FILTERS: Filters = {
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
  sortBy: "title",
  sortDir: "asc",
}

export const SORT_OPTIONS = [
  { value: "title_asc",       label: "İsim A → Z" },
  { value: "title_desc",      label: "İsim Z → A" },
  { value: "costPrice_asc",   label: "Maliyet düşük → yüksek" },
  { value: "costPrice_desc",  label: "Maliyet yüksek → düşük" },
  { value: "stockQty_desc",   label: "Stok çok → az" },
  { value: "stockQty_asc",    label: "Stok az → çok" },
  { value: "returnRate_desc", label: "İade oranı yüksek → düşük" },
  { value: "createdAt_desc",  label: "En yeni eklenen" },
  { value: "createdAt_asc",   label: "En eski eklenen" },
]
