// Dashboard ana sayfası — Server Component.
// Veriyi doğrudan lib fonksiyonlarından çeker (HTTP overhead yok).
// Tarih filtresi URL search param olarak gelir: /?range=week|month|quarter

import { TrendingUp, TrendingDown, Banknote, Wallet, ShoppingBag, Percent, ArrowRight } from "lucide-react"
import { ProfitChart } from "@/components/charts/profit-chart"
import { CostDistributionChart } from "@/components/charts/cost-distribution-chart"
import { getSummaryMetrics, getProfitPerformance, getCostDistribution, getTopProducts } from "@/lib/dashboard"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils"
import { DashboardHeader } from "./_dashboard-header"

// ── Tarih Aralığı ─────────────────────────────────────────────────

const RANGE_DAYS: Record<string, number> = {
  week:    7,
  month:   30,
  quarter: 90,
  year:    365,
}

// ── Metrik Kartı ──────────────────────────────────────────────────

type MetricCardProps = {
  title:      string
  value:      string
  trend:      number
  trendLabel?: string
  icon:       React.ElementType
  iconBg:     string
  iconColor:  string
}

function MetricCard({ title, value, trend, trendLabel = "önceki döneme göre", icon: Icon, iconBg, iconColor }: MetricCardProps) {
  const isPositive = trend >= 0
  const TrendIcon  = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#574236] uppercase tracking-wide leading-none">{title}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-[1.6rem] font-bold text-[#1a1c1c] tabular-nums leading-none">{value}</p>
      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          <TrendIcon className="w-3 h-3" />
          {isPositive ? "+" : ""}{Math.abs(trend).toFixed(1).replace(".", ",")}%
        </span>
        <span className="text-xs text-[#574236]">{trendLabel}</span>
      </div>
    </div>
  )
}

// ── Sayfa ─────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const range   = searchParams.range ?? "month"
  const days    = RANGE_DAYS[range] ?? 30
  const endDate   = new Date()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // 4 sorguyu paralel çalıştır
  const [summary, profitPerformance, costDistribution, topProducts] = await Promise.all([
    getSummaryMetrics(startDate, endDate),
    getProfitPerformance(startDate, endDate),
    getCostDistribution(startDate, endDate),
    getTopProducts(startDate, endDate),
  ])

  const t = summary.trends

  return (
    <div className="space-y-6">

      {/* Başlık + Tarih Filtreleri (Client Component) */}
      <DashboardHeader range={range} />

      {/* 4 Ana KPI Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard title="Toplam Ciro"     value={formatCurrency(summary.totalRevenue)}       trend={t.totalRevenue}       icon={Banknote}   iconBg="#FFF4E8" iconColor="#F27A1A" />
        <MetricCard title="Net Kar"         value={formatCurrency(summary.netProfit)}           trend={t.netProfit}          icon={Wallet}     iconBg="#ECFDF5" iconColor="#059669" />
        <MetricCard title="Sipariş Sayısı"  value={formatNumber(summary.orderCount)}            trend={t.orderCount}         icon={ShoppingBag} iconBg="#EFF6FF" iconColor="#3B82F6" />
        <MetricCard title="Kar / Satış Oranı" value={formatPercent(summary.profitToSalesRatio)} trend={t.profitToSalesRatio} icon={Percent}    iconBg="#F5F3FF" iconColor="#7C3AED" />
      </div>

      {/* Grafik Bölümü */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5">
          <div className="mb-1">
            <h3 className="text-sm font-semibold text-[#1a1c1c]">Kar Performansı</h3>
            <p className="text-xs text-[#574236] mt-0.5">Seçili döneme genel bakış</p>
          </div>
          <ProfitChart data={profitPerformance} />
        </div>

        <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5">
          <div className="mb-1">
            <h3 className="text-sm font-semibold text-[#1a1c1c]">Maliyet Dağılımı</h3>
            <p className="text-xs text-[#574236] mt-0.5">Seçili dönem</p>
          </div>
          <CostDistributionChart data={costDistribution} />
        </div>
      </div>

      {/* En İyi Ürünler */}
      <div className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-[#1a1c1c]">En İyi Performans Gösteren Ürünler</h3>
            <p className="text-xs text-[#574236] mt-0.5">Seçili dönemin en yüksek gelir üreticileri</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-semibold text-[#F27A1A] hover:text-[#984700] transition-colors">
            Tüm Envanteri Görüntüle
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tablo başlığı */}
        <div className="grid grid-cols-[2fr_1fr_80px_90px] gap-4 px-3 pb-2 border-b border-[#F4F4F4]">
          {["ÜRÜN", "KATEGORİ", "SATILAN", "GELİR"].map((h) => (
            <span key={h} className="text-[10px] font-semibold text-[#574236] uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {/* Satırlar */}
        <div className="divide-y divide-[#F4F4F4]">
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#574236] text-center py-8">
              Bu dönemde henüz sipariş verisi yok.
            </p>
          ) : (
            topProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-[2fr_1fr_80px_90px] gap-4 items-center px-3 py-3.5 hover:bg-[#FAFAFA] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#F4F4F4] flex items-center justify-center shrink-0 text-sm font-bold text-[#574236]">
                    {product.name.charAt(0)}
                  </div>
                  <p className="text-sm font-medium text-[#1a1c1c] truncate">{product.name}</p>
                </div>
                <span className="text-sm text-[#574236]">{product.category ?? "—"}</span>
                <span className="text-sm font-semibold text-[#1a1c1c] tabular-nums">{formatNumber(product.unitsSold)}</span>
                <span className="text-sm font-semibold text-[#1a1c1c] tabular-nums">{formatCurrency(product.revenue)}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
