"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import type { ProductForSettings } from "@/lib/product-settings"
import { ProductRow } from "./_product-row"
import { ProductImage, DeliveryBadge, RangeVal } from "./_cells"
import { sharedValue } from "./_helpers"
import { W, TD } from "./_styles"
import type { VariantGroup, EditableField, SaveState } from "./_types"

export function GroupSection({
  group,
  onToggle,
  saveState,
  onSave,
  onLocalUpdate,
  onApplyFabric,
}: {
  group: VariantGroup
  onToggle: () => void
  saveState: SaveState
  onSave: (id: string, field: EditableField, val: number | null) => void
  onLocalUpdate: (id: string, patch: Partial<ProductForSettings>) => void
  onApplyFabric: (product: ProductForSettings) => void
}) {
  const isMulti = group.products.length > 1
  const first   = group.products[0]

  // Local state'i de güncellesin diye save'i sarmalıyoruz
  function handleSave(id: string, field: EditableField, val: number | null) {
    onLocalUpdate(id, { [field]: val })
    onSave(id, field, val)
  }

  if (!isMulti) {
    return (
      <ProductRow
        product={first}
        isGroup={false}
        saveState={saveState}
        onSave={handleSave}
        onApplyFabric={onApplyFabric}
        isSubRow={false}
      />
    )
  }

  return (
    <>
      {/* Grup başlık satırı */}
      <tr
        onClick={onToggle}
        className="cursor-pointer bg-[#FAFAFA] hover:bg-orange-50/30 transition-colors group"
      >
        <td className={`${TD} ${W.expand} text-center`}>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#F0F0F0] group-hover:bg-[#F27A1A]/10 transition-colors">
            {group.isExpanded
              ? <ChevronDown className="w-3.5 h-3.5 text-[#574236]" />
              : <ChevronRight className="w-3.5 h-3.5 text-[#574236]" />}
          </span>
        </td>

        <td className={`${TD} ${W.info} h-16`}>
          <div className="flex items-center gap-2.5">
            <ProductImage src={first.imageUrl} title={first.title} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-[#1a1c1c] truncate" style={{ maxWidth: 190 }}>{first.title}</p>
                <span className="shrink-0 inline-flex items-center px-1.5 h-5 rounded text-[10px] font-semibold bg-[#574236]/10 text-[#574236]">
                  {group.products.length} varyant
                </span>
              </div>
              <p className="text-xs text-[#8b7264] mt-0.5">{first.brand ?? "—"} · {first.category ?? "—"}</p>
            </div>
          </div>
        </td>

        <td className={`${TD} ${W.barcode}`}><span className="text-[#d1cac5] text-xs">—</span></td>

        <td className={`${TD} ${W.costPrice}`}><RangeVal products={group.products} field="costPrice" suffix="₺" /></td>
        <td className={`${TD} ${W.fabricCost}`}><RangeVal products={group.products} field="fabricCostTry" suffix="₺" /></td>
        <td className={`${TD} ${W.costKdvRate}`}><RangeVal products={group.products} field="costKdvRate" suffix="%" /></td>
        <td className={`${TD} ${W.desi}`}><RangeVal products={group.products} field="desi" /></td>
        <td className={`${TD} ${W.extraCost}`}><RangeVal products={group.products} field="extraCost" suffix="₺" /></td>

        <td className={`${TD} ${W.brand}`}>
          <span className="text-xs text-[#574236] truncate block">{first.brand ?? "—"}</span>
        </td>
        <td className={`${TD} ${W.modelCode}`}>
          <SharedText products={group.products} field="modelCode" mono />
        </td>
        <td className={`${TD} ${W.color}`}>
          <SharedChip products={group.products} field="color" />
        </td>
        <td className={`${TD} ${W.size}`}>
          <SharedChip products={group.products} field="size" />
        </td>
        <td className={`${TD} ${W.stock}`}>
          <span className="text-sm tabular-nums font-semibold text-[#574236]">
            {group.products.reduce((s, p) => s + p.stockQty, 0).toLocaleString("tr-TR")}
          </span>
        </td>
        <td className={`${TD} ${W.returnRate}`}>
          <SharedReturnRate products={group.products} />
        </td>
        <td className={`${TD} ${W.deliveryType}`}>
          <DeliveryBadge value={sharedValue<string>(group.products, "deliveryType") ?? first.deliveryType} />
        </td>
      </tr>

      {/* Varyant satırları */}
      {group.isExpanded && group.products.map((product, idx) => (
        <ProductRow
          key={product.id}
          product={product}
          isGroup
          variantIndex={idx + 1}
          variantTotal={group.products.length}
          saveState={saveState}
          onSave={handleSave}
          onApplyFabric={onApplyFabric}
          isSubRow
        />
      ))}
    </>
  )
}

// Tüm varyantlar aynı text'i paylaşıyorsa onu göster, yoksa em-dash.
function SharedText({ products, field, mono = false }: {
  products: ProductForSettings[]
  field: keyof ProductForSettings
  mono?: boolean
}) {
  const v = sharedValue<string>(products, field)
  if (!v) return <span className="text-[#d1cac5] text-xs">—</span>
  return <span className={`text-xs text-[#574236] truncate block ${mono ? "font-mono" : ""}`}>{v}</span>
}

function SharedChip({ products, field }: {
  products: ProductForSettings[]
  field: keyof ProductForSettings
}) {
  const v = sharedValue<string>(products, field)
  if (!v) return <span className="text-[#d1cac5] text-xs">—</span>
  return <span className="inline-flex items-center px-2 h-5 rounded text-[11px] bg-[#F3F3F3] text-[#574236] font-medium">{v}</span>
}

function SharedReturnRate({ products }: { products: ProductForSettings[] }) {
  const v = sharedValue<string>(products, "returnRate")
  if (v == null) return <span className="text-[#d1cac5] text-xs">—</span>
  return <span className="text-xs tabular-nums text-[#574236] font-medium">%{Number(v).toFixed(1)}</span>
}
