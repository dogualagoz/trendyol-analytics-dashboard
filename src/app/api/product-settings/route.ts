import { NextRequest, NextResponse } from "next/server"
import {
  getProductsForSettings,
  updateProductSettings,
  type ProductSettingsUpdate,
  type ProductSortBy,
  type SortDir,
} from "@/lib/product-settings"

const VALID_SORT_FIELDS: ProductSortBy[] = ["title", "costPrice", "stockQty", "returnRate", "createdAt"]

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const sortByRaw = sp.get("sortBy") as ProductSortBy | null
    const sortDirRaw = sp.get("sortDir") as SortDir | null
    const products = await getProductsForSettings({
      search:    sp.get("search")    ?? undefined,
      barcode:   sp.get("barcode")   ?? undefined,
      brand:     sp.get("brand")     ?? undefined,
      modelCode: sp.get("modelCode") ?? undefined,
      emptyOnly: sp.get("emptyOnly") === "true",
      minCost:   sp.get("minCost")   ? Number(sp.get("minCost"))   : undefined,
      maxCost:   sp.get("maxCost")   ? Number(sp.get("maxCost"))   : undefined,
      minStock:  sp.get("minStock")  ? Number(sp.get("minStock"))  : undefined,
      maxStock:  sp.get("maxStock")  ? Number(sp.get("maxStock"))  : undefined,
      minDesi:   sp.get("minDesi")   ? Number(sp.get("minDesi"))   : undefined,
      maxDesi:   sp.get("maxDesi")   ? Number(sp.get("maxDesi"))   : undefined,
      sortBy:    sortByRaw && VALID_SORT_FIELDS.includes(sortByRaw) ? sortByRaw : undefined,
      sortDir:   sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : undefined,
    })
    return NextResponse.json({ products })
  } catch (err) {
    console.error("product-settings GET error:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id: string } & ProductSettingsUpdate
    const { id, ...data } = body
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id gerekli" }, { status: 400 })
    }
    await updateProductSettings(id, data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("product-settings PATCH error:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
