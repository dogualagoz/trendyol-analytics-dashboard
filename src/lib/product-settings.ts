import db from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"
import { getSetting } from "@/lib/settings"
import { parseProductSize, calculateFabricCostTry } from "@/lib/fabric"
import { recalcOrderItemProfit } from "@/lib/calculations"
import { DEFAULT_USD_TO_TRY_RATE } from "@/lib/constants"

export type ProductSortBy = "title" | "costPrice" | "stockQty" | "returnRate" | "createdAt"
export type SortDir = "asc" | "desc"

export type ProductSettingsFilters = {
  search?: string
  barcode?: string
  brand?: string
  modelCode?: string
  minCost?: number
  maxCost?: number
  minStock?: number
  maxStock?: number
  minDesi?: number
  maxDesi?: number
  emptyOnly?: boolean
  sortBy?: ProductSortBy
  sortDir?: SortDir
}

export type ProductForSettings = {
  id: string
  trendyolId: string
  title: string
  barcode: string | null
  imageUrl: string | null
  brand: string | null
  category: string | null
  modelCode: string | null
  color: string | null
  size: string | null
  stockQty: number
  deliveryType: string | null
  returnRate: number | null
  costPrice: number | null
  costKdvRate: number
  desi: number
  extraCost: number
  // Kumaş bazlı maliyet — `size` alanından otomatik türetilir.
  // Boyut ayrıştırılamayan ürünlerde tüm alanlar null'dur.
  fabricWidthCm:  number | null  // küçük boyut (en)
  fabricLengthCm: number | null  // büyük boyut (boy)
  fabricCostTry:  number | null  // hesaplanan TL maliyet (USD/TRY kuru ile)
}

export type ProductSettingsUpdate = {
  costPrice?: number | null
  costKdvRate?: number
  desi?: number
  extraCost?: number
}

export async function getProductsForSettings(
  filters: ProductSettingsFilters = {}
): Promise<ProductForSettings[]> {
  const where: Prisma.ProductWhereInput = {}

  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" }
  }
  if (filters.barcode) {
    where.barcode = { contains: filters.barcode, mode: "insensitive" }
  }
  if (filters.brand) {
    where.brand = { contains: filters.brand, mode: "insensitive" }
  }
  if (filters.modelCode) {
    where.modelCode = { contains: filters.modelCode, mode: "insensitive" }
  }
  if (filters.emptyOnly) {
    where.costPrice = null
  }
  if (filters.minCost !== undefined || filters.maxCost !== undefined) {
    where.costPrice = {
      ...(filters.minCost !== undefined && { gte: filters.minCost }),
      ...(filters.maxCost !== undefined && { lte: filters.maxCost }),
    }
  }
  if (filters.minStock !== undefined || filters.maxStock !== undefined) {
    where.stockQty = {
      ...(filters.minStock !== undefined && { gte: filters.minStock }),
      ...(filters.maxStock !== undefined && { lte: filters.maxStock }),
    }
  }
  if (filters.minDesi !== undefined || filters.maxDesi !== undefined) {
    where.desi = {
      ...(filters.minDesi !== undefined && { gte: filters.minDesi }),
      ...(filters.maxDesi !== undefined && { lte: filters.maxDesi }),
    }
  }

  const sortBy  = filters.sortBy  ?? "title"
  const sortDir = filters.sortDir ?? "asc"

  const sortableFields: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
    title:      [{ title: sortDir }, { size: "asc" }, { color: "asc" }],
    costPrice:  [{ costPrice: sortDir }, { title: "asc" }],
    stockQty:   [{ stockQty: sortDir }, { title: "asc" }],
    returnRate: [{ returnRate: sortDir }, { title: "asc" }],
    createdAt:  [{ createdAt: sortDir }, { title: "asc" }],
  }
  const orderBy = sortableFields[sortBy] ?? sortableFields.title

  const products = await db.product.findMany({
    where,
    orderBy,
  })

  // Kumaş maliyeti için USD/TRY kuru — settings'ten oku, yoksa varsayılan
  const usdRateSetting = await getSetting("usd_to_try_rate")
  const usdRate = Number(usdRateSetting) > 0 ? Number(usdRateSetting) : DEFAULT_USD_TO_TRY_RATE

  return products.map((p) => {
    const dims = parseProductSize(p.size)
    const fabricCostTry = dims
      ? calculateFabricCostTry(dims.widthCm, dims.lengthCm, usdRate)
      : null

    return {
      id: p.id,
      trendyolId: p.trendyolId,
      title: p.title,
      barcode: p.barcode,
      imageUrl: p.imageUrl,
      brand: p.brand,
      category: p.category,
      modelCode: p.modelCode,
      color: p.color,
      size: p.size,
      stockQty: p.stockQty,
      deliveryType: p.deliveryType,
      returnRate: p.returnRate != null ? Number(p.returnRate) : null,
      costPrice: p.costPrice != null ? Number(p.costPrice) : null,
      costKdvRate: Number(p.costKdvRate),
      desi: Number(p.desi),
      extraCost: Number(p.extraCost),
      fabricWidthCm:  dims?.widthCm  ?? null,
      fabricLengthCm: dims?.lengthCm ?? null,
      fabricCostTry,
    }
  })
}

export async function updateProductSettings(
  id: string,
  data: ProductSettingsUpdate
): Promise<void> {
  await db.product.update({
    where: { id },
    data: {
      ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
      ...(data.costKdvRate !== undefined && { costKdvRate: data.costKdvRate }),
      ...(data.desi !== undefined && { desi: data.desi }),
      ...(data.extraCost !== undefined && { extraCost: data.extraCost }),
    },
  })

  // costPrice değişince bu ürünün geçmiş sipariş kalemlerinin karını güncelle.
  // Böylece siparişler sayfası ve raporlar her zaman güncel maliyeti yansıtır.
  if (data.costPrice !== undefined) {
    const newCost = data.costPrice ?? 0
    const items = await db.orderItem.findMany({ where: { productId: id } })
    if (items.length > 0) {
      await Promise.all(
        items.map((item) =>
          db.orderItem.update({
            where: { id: item.id },
            data:  { profit: recalcOrderItemProfit(item, newCost) },
          })
        )
      )
    }
  }
}
