"use client"

import { useState, useMemo } from "react"
import { Calculator, Package, Truck, Percent, Tag, TrendingUp, Copy, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { calculateSuggestedPrice, TRENDYOL_CATEGORIES, type ProfitMode } from "@/lib/pricing"
import { cn } from "@/lib/utils"

const KDV_OPTIONS = [
  { label: "%20", value: 20 },
  { label: "%10", value: 10 },
  { label: "%1",  value: 1  },
  { label: "%0",  value: 0  },
]

const DELIVERY_TYPES = ["Standart", "Hızlı Teslimat", "Mikro İhracat"]

const CARD = "bg-white rounded-2xl border border-[#E2E2E2] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6"
const SECTION_TITLE = "text-[11px] font-bold text-[#574236] uppercase tracking-[0.05em]"
const FIELD_LABEL = "text-[11px] font-bold text-[#574236] uppercase tracking-[0.05em]"

function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  prefix = "₺",
  readOnly = false,
  className,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  prefix?: string
  readOnly?: boolean
  className?: string
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#574236] text-sm select-none">
        {prefix}
      </span>
      <Input
        type="number"
        min={0}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={cn(
          "pl-7 h-11 border-[#E2E2E2] rounded-lg text-sm focus-visible:ring-[#F27A1A] focus-visible:ring-1",
          readOnly && "bg-[#f3f3f3] text-[#574236] cursor-default",
          className,
        )}
      />
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PricingPage() {
  const [costPrice,       setCostPrice]       = useState("")
  const [deliveryType,    setDeliveryType]    = useState("Standart")
  const [profitMode,      setProfitMode]      = useState<ProfitMode>("amount")
  const [desiredProfit,   setDesiredProfit]   = useState("")
  const [cargoFee,        setCargoFee]        = useState("")
  const [desi,            setDesi]            = useState("")
  const [kdvRate,         setKdvRate]         = useState(20)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [commissionInput, setCommissionInput] = useState("")
  const [copied,          setCopied]          = useState(false)

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    const cat = TRENDYOL_CATEGORIES.find(c => c.label === value)
    setCommissionInput(cat && cat.commissionRate > 0 ? String(cat.commissionRate) : "")
  }

  const isCustomCategory = selectedCategory === "Özel (Manuel Giriş)" || !selectedCategory

  const result = useMemo(() => {
    const cost       = parseFloat(costPrice)       || 0
    const cargo      = parseFloat(cargoFee)        || 0
    const commission = parseFloat(commissionInput) || 0
    const profit     = parseFloat(desiredProfit)   || 0

    if (cost === 0 && cargo === 0) return null

    return calculateSuggestedPrice({
      costPrice:      cost,
      commissionRate: commission / 100,
      cargoFee:       cargo,
      desiredProfit:  profitMode === "rate" ? profit / 100 : profit,
      profitMode,
    })
  }, [costPrice, cargoFee, commissionInput, desiredProfit, profitMode])

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.salePrice.toFixed(2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-10 max-w-[1200px] mx-auto">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-[#F27A1A]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1c1c] tracking-tight">Fiyatlandırma</h1>
          <p className="text-sm text-[#574236]">İstenilen kâra göre önerilen satış fiyatını hesapla</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* ── Kart 1: Seçimler ── */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-5">
            <Package className="w-4 h-4 text-[#574236]" />
            <span className={SECTION_TITLE}>Seçimler</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Ürün Maliyeti</Label>
              <CurrencyInput value={costPrice} onChange={setCostPrice} />
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Teslimat Tipi</Label>
              <Select value={deliveryType} onValueChange={setDeliveryType}>
                <SelectTrigger className="h-11 border-[#E2E2E2] rounded-lg text-sm focus:ring-[#F27A1A] focus:ring-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Kart 2: İstenilen Kâr ── */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-[#574236]" />
            <span className={SECTION_TITLE}>İstenilen Kâr Oranı / Tutarı</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Hesaplama Yöntemi</Label>
              <Select value={profitMode} onValueChange={v => setProfitMode(v as ProfitMode)}>
                <SelectTrigger className="h-11 border-[#E2E2E2] rounded-lg text-sm focus:ring-[#F27A1A] focus:ring-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Tutara Göre (₺)</SelectItem>
                  <SelectItem value="rate">Orana Göre (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>
                {profitMode === "amount" ? "Kâr Tutarı" : "Kâr Oranı"}
              </Label>
              <CurrencyInput
                value={desiredProfit}
                onChange={setDesiredProfit}
                prefix={profitMode === "amount" ? "₺" : "%"}
              />
            </div>
          </div>
        </div>

        {/* ── Kart 3: Kargo Ücreti ── */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-5">
            <Truck className="w-4 h-4 text-[#574236]" />
            <span className={SECTION_TITLE}>Kargo Ücreti</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Kargo Bedeli</Label>
              <CurrencyInput value={cargoFee} onChange={setCargoFee} />
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Desi</Label>
              <Input
                type="number"
                min={0}
                placeholder="Desi değeri"
                value={desi}
                onChange={e => setDesi(e.target.value)}
                className="h-11 border-[#E2E2E2] rounded-lg text-sm focus-visible:ring-[#F27A1A] focus-visible:ring-1"
              />
            </div>
          </div>
        </div>

        {/* ── Kart 4: KDV ── */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-5">
            <Percent className="w-4 h-4 text-[#574236]" />
            <span className={SECTION_TITLE}>KDV (%)</span>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {KDV_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKdvRate(opt.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                    kdvRate === opt.value
                      ? "bg-[#F27A1A] text-white border-[#F27A1A] shadow-sm"
                      : "bg-white text-[#574236] border-[#E2E2E2] hover:border-[#F27A1A] hover:text-[#F27A1A]",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Özel Değer</Label>
              <CurrencyInput
                prefix="%"
                value={kdvRate === 0 || kdvRate === 1 || kdvRate === 10 || kdvRate === 20 ? String(kdvRate) : ""}
                onChange={v => {
                  const n = parseFloat(v)
                  if (!isNaN(n) && n >= 0) setKdvRate(n)
                }}
                placeholder="Özel KDV oranı"
              />
            </div>
          </div>
        </div>

        {/* ── Kart 5: Kategori ── */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-5">
            <Tag className="w-4 h-4 text-[#574236]" />
            <span className={SECTION_TITLE}>Kategori</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Kategori Seç</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-11 border-[#E2E2E2] rounded-lg text-sm focus:ring-[#F27A1A] focus:ring-1">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {TRENDYOL_CATEGORIES.map(c => (
                    <SelectItem key={c.label} value={c.label}>
                      {c.label}
                      {c.commissionRate > 0 && (
                        <span className="ml-1 text-[#574236]">({c.commissionRate}%)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>
                Komisyon Oranı
                {!isCustomCategory && (
                  <span className="ml-1 text-[#F27A1A] normal-case font-normal">otomatik</span>
                )}
              </Label>
              <CurrencyInput
                prefix="%"
                value={commissionInput}
                onChange={v => setCommissionInput(v)}
                readOnly={!isCustomCategory}
                placeholder="Komisyon oranı"
              />
            </div>
          </div>
        </div>

        {/* ── Kart 6: Sonuç ── */}
        <div className={cn(CARD, "flex flex-col")}>
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-[#574236]" />
            <span className={SECTION_TITLE}>Önerilen Fiyat</span>
          </div>

          {/* Ana fiyat gösterimi */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <p
              className={cn(
                "text-5xl font-bold tracking-tight tabular-nums transition-colors",
                result && result.salePrice > 0 ? "text-[#1a1c1c]" : "text-[#dadada]",
              )}
            >
              ₺{result && result.salePrice > 0 ? fmt(result.salePrice) : "0,00"}
            </p>
            {result && result.profit > 0 && (
              <p className="text-sm text-emerald-600 font-semibold mt-2">
                Kâr: ₺{fmt(result.profit)} — %{fmt(result.profitRate)}
              </p>
            )}
          </div>

          {/* Döküm tablosu */}
          {result && result.salePrice > 0 && (
            <div className="border-t border-[#E2E2E2] pt-4 space-y-1.5">
              {[
                { label: "Komisyon",       value: result.commission    },
                { label: "Komisyon KDV",   value: result.commissionKdv },
                { label: "Stopaj",         value: result.stoppage      },
                { label: "Kargo",          value: result.cargoFee      },
                { label: "Ürün Maliyeti",  value: result.costPrice     },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-xs text-[#574236]">
                  <span>{row.label}</span>
                  <span className="font-medium tabular-nums">−₺{fmt(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold text-[#1a1c1c] pt-1.5 border-t border-[#E2E2E2]">
                <span>Net Kâr</span>
                <span className="text-emerald-600 tabular-nums">₺{fmt(result.profit)}</span>
              </div>
            </div>
          )}

          {/* CTA butonu */}
          <Button
            onClick={handleCopy}
            disabled={!result || result.salePrice === 0}
            className="w-full h-12 mt-4 bg-[#F27A1A] hover:bg-[#d96b10] disabled:bg-[#E2E2E2] disabled:text-[#8b7264] text-white font-semibold rounded-xl transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Kopyalandı
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Fiyatı Kopyala
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
