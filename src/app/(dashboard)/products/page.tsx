import db from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Prisma } from "@/generated/prisma/client"
import { ProductFilterBar } from "./_filter-bar"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function str(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const search   = str(sp.search)
  const category = str(sp.category)
  const brand    = str(sp.brand)
  const hasCost  = str(sp.hasCost)
  const sortBy   = str(sp.sortBy)   ?? "createdAt"
  const sortDir  = (str(sp.sortDir) ?? "desc") as "asc" | "desc"

  // WHERE koşulu
  const where: Prisma.ProductWhereInput = {}
  if (search) {
    where.OR = [
      { title:   { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ]
  }
  if (category) where.category = { equals: category, mode: "insensitive" }
  if (brand)    where.brand    = { contains: brand, mode: "insensitive" }
  if (hasCost === "yes") where.costPrice = { not: null }
  if (hasCost === "no")  where.costPrice = null

  // ORDER BY
  type OrderBy = Prisma.ProductOrderByWithRelationInput
  const orderByMap: Record<string, OrderBy | OrderBy[]> = {
    createdAt:  { createdAt: sortDir },
    title:      { title:     sortDir },
    costPrice:  { costPrice: sortDir },
    orderCount: { orderItems: { _count: sortDir } },
  }
  const orderBy = orderByMap[sortBy] ?? { createdAt: "desc" }

  // Filtre seçenekleri için distinct değerler
  const [products, categoryRows, brandRows] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      include: { _count: { select: { orderItems: true } } },
    }),
    db.product.findMany({ select: { category: true }, distinct: ["category"], where: { category: { not: null } }, orderBy: { category: "asc" } }),
    db.product.findMany({ select: { brand: true },    distinct: ["brand"],    where: { brand:    { not: null } }, orderBy: { brand:    "asc" } }),
  ])

  const categories = categoryRows.map(r => r.category!).filter(Boolean)
  const brands     = brandRows.map(r => r.brand!).filter(Boolean)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1c1c]">Ürünler</h2>
        <p className="text-sm text-[#574236] mt-0.5">
          <span className="font-semibold text-[#1a1c1c]">{products.length}</span> ürün gösteriliyor
        </p>
      </div>

      <ProductFilterBar categories={categories} brands={brands} />

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E2E2] p-10 text-center">
          <p className="text-sm font-medium text-[#1a1c1c]">Ürün bulunamadı</p>
          <p className="text-xs text-[#574236] mt-1">
            Filtreleri değiştirin ya da önce sync yapın.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">

          <div className="grid grid-cols-[60px_2fr_1fr_1fr_80px_100px] gap-4 px-5 py-3 border-b border-[#F4F4F4] bg-[#FAFAFA]">
            {["", "ÜRÜN", "BARKOD", "KATEGORİ", "SİPARİŞ", "MALİYET"].map((h) => (
              <span key={h} className="text-[10px] font-semibold text-[#574236] uppercase tracking-wide">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-[#F4F4F4]">
            {products.map((product) => (
              <div key={product.id} className="grid grid-cols-[60px_2fr_1fr_1fr_80px_100px] gap-4 items-center px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">

                <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] overflow-hidden shrink-0">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#574236]">
                      {product.title.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1a1c1c] truncate">{product.title}</p>
                  <p className="text-xs text-[#574236]">{product.brand ?? "—"}</p>
                </div>

                <span className="text-xs text-[#574236] font-mono truncate">{product.barcode ?? "—"}</span>
                <span className="text-sm text-[#574236] truncate">{product.category ?? "—"}</span>
                <span className="text-sm text-[#574236] tabular-nums">{product._count.orderItems}</span>
                <span className={`text-sm font-semibold tabular-nums ${product.costPrice ? "text-[#1a1c1c]" : "text-amber-500"}`}>
                  {product.costPrice ? formatCurrency(Number(product.costPrice)) : "Girilmedi"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
