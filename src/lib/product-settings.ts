import db from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"

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

  const products = await db.product.findMany({
    where,
    orderBy: [{ title: "asc" }, { size: "asc" }, { color: "asc" }],
  })

  return products.map((p) => ({
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
  }))
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
}
