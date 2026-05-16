"use client"

import { useState, useEffect } from "react"
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw, RotateCcw, Scissors } from "lucide-react"
import {
  FABRIC_PRICE_PER_METER_USD,
  FABRIC_ROLL_WIDTHS_CM,
  DEFAULT_USD_TO_TRY_RATE,
} from "@/lib/constants"

type SettingsForm = {
  trendyol_api_key: string
  trendyol_api_secret: string
  trendyol_seller_id: string
  trendyol_integration_ref: string
  sync_interval: string
}

type CargoForm = {
  cargo_tier_1: string  // 0 - 199.99 TL
  cargo_tier_2: string  // 200 - 349.99 TL
  cargo_tier_3: string  // 350+ TL
}

type FabricForm = {
  usd_to_try_rate: string
}

const DEFAULT_FORM: SettingsForm = {
  trendyol_api_key: "",
  trendyol_api_secret: "",
  trendyol_seller_id: "",
  trendyol_integration_ref: "",
  sync_interval: "30",
}

const DEFAULT_CARGO: CargoForm = {
  cargo_tier_1: "",
  cargo_tier_2: "",
  cargo_tier_3: "",
}

const DEFAULT_FABRIC: FabricForm = {
  usd_to_try_rate: "",
}


export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM)
  const [cargoForm, setCargoForm] = useState<CargoForm>(DEFAULT_CARGO)
  const [fabricForm, setFabricForm] = useState<FabricForm>(DEFAULT_FABRIC)
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCargo, setSavingCargo] = useState(false)
  const [savingFabric, setSavingFabric] = useState(false)
  const [status, setStatus] = useState<"success" | "error" | null>(null)
  const [cargoStatus, setCargoStatus] = useState<"success" | "error" | null>(null)
  const [fabricStatus, setFabricStatus] = useState<"success" | "error" | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null)

  // Sayfa açılınca mevcut ayarları çek ve formu doldur
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings")
        const data = await res.json()
        setForm({
          trendyol_api_key: data.trendyol_api_key ?? "",
          trendyol_api_secret: data.trendyol_api_secret ?? "",
          trendyol_seller_id: data.trendyol_seller_id ?? "",
          trendyol_integration_ref: data.trendyol_integration_ref ?? "",
          sync_interval: data.sync_interval ?? "30",
        })
        setCargoForm({
          cargo_tier_1: data.cargo_tier_1 ?? "",
          cargo_tier_2: data.cargo_tier_2 ?? "",
          cargo_tier_3: data.cargo_tier_3 ?? "",
        })
        setFabricForm({
          usd_to_try_rate: data.usd_to_try_rate ?? "",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setStatus(null)
  }

  function handleCargoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCargoForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setCargoStatus(null)
  }

  async function handleCargoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingCargo(true)
    setCargoStatus(null)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cargoForm),
      })
      setCargoStatus(res.ok ? "success" : "error")
    } catch {
      setCargoStatus("error")
    } finally {
      setSavingCargo(false)
    }
  }

  async function handleFabricSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSavingFabric(true)
    setFabricStatus(null)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fabricForm),
      })
      setFabricStatus(res.ok ? "success" : "error")
    } catch {
      setFabricStatus("error")
    } finally {
      setSavingFabric(false)
    }
  }

  async function handleSync(force: boolean) {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      setSyncResult({ ok: res.ok, message: data.message })
    } catch {
      setSyncResult({ ok: false, message: "Bağlantı hatası." })
    } finally {
      setSyncing(false)
    }
  }

  // Formu kaydet
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[#574236]">
        Yükleniyor...
      </div>
    )
  }

  const inputCls = "w-full rounded-lg border border-[#E2E2E2] px-3 py-2.5 text-sm text-[#1a1c1c] placeholder:text-[#c0bbb7] focus:outline-none focus:border-[#F27A1A] focus:ring-2 focus:ring-[#F27A1A]/10 transition-all bg-white"
  const cardCls  = "bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)]"

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Başlık */}
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1c1c]">Ayarlar</h2>
        <p className="text-sm text-[#574236] mt-1">API bağlantısı, kargo ve veri senkronizasyonu</p>
      </div>

      {/* ── Trendyol API Bilgileri ── */}
      <form onSubmit={handleSubmit} className={cardCls}>
        <div className="px-6 py-5 border-b border-[#F3F3F3]">
          <h3 className="text-sm font-semibold text-[#1a1c1c]">Trendyol API Bilgileri</h3>
          <p className="text-xs text-[#8b7264] mt-0.5">Entegrasyon Servis Yönetimi sayfasından aldığınız bilgiler</p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#574236] uppercase tracking-wide" htmlFor="trendyol_seller_id">Seller ID</label>
              <input id="trendyol_seller_id" name="trendyol_seller_id" type="text" value={form.trendyol_seller_id} onChange={handleChange} placeholder="örn. 942618" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#574236] uppercase tracking-wide" htmlFor="trendyol_integration_ref">Entegrasyon Referans Kodu</label>
              <input id="trendyol_integration_ref" name="trendyol_integration_ref" type="text" value={form.trendyol_integration_ref} onChange={handleChange} placeholder="Entegrasyon panelinden" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#574236] uppercase tracking-wide" htmlFor="trendyol_api_key">API Key</label>
              <input id="trendyol_api_key" name="trendyol_api_key" type="text" value={form.trendyol_api_key} onChange={handleChange} placeholder="API Key" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#574236] uppercase tracking-wide" htmlFor="trendyol_api_secret">API Secret</label>
              <div className="relative">
                <input id="trendyol_api_secret" name="trendyol_api_secret" type={showSecret ? "text" : "password"} value={form.trendyol_api_secret} onChange={handleChange} placeholder="API Secret" className={inputCls + " pr-10"} />
                <button type="button" onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c0bbb7] hover:text-[#F27A1A] transition-colors">
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#574236] uppercase tracking-wide" htmlFor="sync_interval">Otomatik Senkronizasyon Aralığı</label>
            <select id="sync_interval" name="sync_interval" value={form.sync_interval} onChange={handleChange} className={inputCls}>
              <option value="15">Her 15 dakika</option>
              <option value="30">Her 30 dakika</option>
              <option value="60">Her 1 saat</option>
              <option value="120">Her 2 saat</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#F3F3F3] flex items-center justify-between">
          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" /> Kaydedildi.
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" /> Bir hata oluştu.
            </div>
          )}
          {!status && <span />}
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>

      {/* ── Kargo Barem ── */}
      <form onSubmit={handleCargoSubmit} className={cardCls}>
        <div className="px-6 py-5 border-b border-[#F3F3F3]">
          <h3 className="text-sm font-semibold text-[#1a1c1c]">Kargo Barem Fiyatları</h3>
          <p className="text-xs text-[#8b7264] mt-0.5">KDV hariç tutarı girin — sistem %20 KDV ekleyerek kargo maliyetini hesaplar</p>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-3 gap-6">
            {(
              [
                { key: "cargo_tier_1", range: "0 – 199,99 ₺", placeholder: "örn. 65" },
                { key: "cargo_tier_2", range: "200 – 349,99 ₺", placeholder: "örn. 90" },
                { key: "cargo_tier_3", range: "350 ₺ ve üzeri", placeholder: "örn. 120" },
              ] as const
            ).map(({ key, range, placeholder }) => (
              <div key={key} className="space-y-2">
                <div className="text-xs font-semibold text-[#574236] uppercase tracking-wide">{range}</div>
                <div className="relative">
                  <input
                    id={key} name={key} type="number" min="0" step="0.01"
                    value={cargoForm[key]} onChange={handleCargoChange}
                    placeholder={placeholder}
                    className={inputCls + " pr-8"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#c0bbb7]">₺</span>
                </div>
                {cargoForm[key] ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#8b7264]">KDV dahil:</span>
                    <span className="text-xs font-semibold text-[#F27A1A]">{(Number(cargoForm[key]) * 1.20).toFixed(2)} ₺</span>
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#F3F3F3] flex items-center justify-between">
          {cargoStatus === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" /> Kaydedildi — siparişleri yeniden sync'le.
            </div>
          )}
          {cargoStatus === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" /> Bir hata oluştu.
            </div>
          )}
          {!cargoStatus && <span />}
          <button type="submit" disabled={savingCargo} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors disabled:opacity-60">
            <Save className="w-4 h-4" />
            {savingCargo ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>

      {/* ── Kumaş Maliyeti (Top Kumaş) ── */}
      <form onSubmit={handleFabricSubmit} className={cardCls}>
        <div className="px-6 py-5 border-b border-[#F3F3F3] flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 text-[#F27A1A]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#1a1c1c]">Kumaş Maliyeti</h3>
            <p className="text-xs text-[#8b7264] mt-0.5">
              Top kumaş ${FABRIC_PRICE_PER_METER_USD.toFixed(2)}/m, top eni {FABRIC_ROLL_WIDTHS_CM.join(" veya ")} cm.
              Ürün boyutuna göre maliyet otomatik hesaplanır — TL dönüşümü için aşağıdaki kuru girin.
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="bg-[#FAFAFA] rounded-lg px-4 py-3 text-xs text-[#574236] space-y-1.5 leading-relaxed border border-[#F0F0F0]">
            <div className="font-semibold text-[#1a1c1c] mb-1">Hesaplama Mantığı</div>
            <div>
              <span className="font-mono text-[#F27A1A]">Top eni × X</span> (örn. 140×200 cm) →
              <span className="ml-1">${FABRIC_PRICE_PER_METER_USD} × 2.0 m = ${(FABRIC_PRICE_PER_METER_USD * 2).toFixed(2)}</span>
            </div>
            <div>
              <span className="font-mono text-[#F27A1A]">Top eninden küçük</span> (örn. 70×50 cm) →
              <span className="ml-1">${FABRIC_PRICE_PER_METER_USD} × 0.7 × 0.5 = ${(FABRIC_PRICE_PER_METER_USD * 0.7 * 0.5).toFixed(3)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#574236] uppercase tracking-wide" htmlFor="usd_to_try_rate">
                USD / TRY Kuru
              </label>
              <div className="relative">
                <input
                  id="usd_to_try_rate"
                  name="usd_to_try_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fabricForm.usd_to_try_rate}
                  onChange={(e) => { setFabricForm({ usd_to_try_rate: e.target.value }); setFabricStatus(null) }}
                  placeholder={`örn. ${DEFAULT_USD_TO_TRY_RATE}`}
                  className={inputCls + " pr-12"}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#c0bbb7]">₺/$</span>
              </div>
              <p className="text-[11px] text-[#8b7264]">Boş bırakılırsa varsayılan {DEFAULT_USD_TO_TRY_RATE} ₺/$ kullanılır.</p>
            </div>

            {fabricForm.usd_to_try_rate && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#574236] uppercase tracking-wide">Örnek Hesap</div>
                <div className="bg-orange-50/40 rounded-lg px-3 py-2.5 border border-[#F0D5C4] space-y-1">
                  <div className="text-xs text-[#574236]">
                    140×200 cm ürün:
                    <span className="ml-1 font-mono text-[#984700] font-semibold">
                      {(FABRIC_PRICE_PER_METER_USD * 2 * Number(fabricForm.usd_to_try_rate)).toFixed(2)} ₺
                    </span>
                  </div>
                  <div className="text-xs text-[#574236]">
                    70×50 cm ürün:
                    <span className="ml-1 font-mono text-[#984700] font-semibold">
                      {(FABRIC_PRICE_PER_METER_USD * 0.7 * 0.5 * Number(fabricForm.usd_to_try_rate)).toFixed(2)} ₺
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#F3F3F3] flex items-center justify-between">
          {fabricStatus === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" /> Kaydedildi.
            </div>
          )}
          {fabricStatus === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" /> Bir hata oluştu.
            </div>
          )}
          {!fabricStatus && <span />}
          <button type="submit" disabled={savingFabric} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors disabled:opacity-60">
            <Save className="w-4 h-4" />
            {savingFabric ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>

      {/* ── Veri Yönetimi ── */}
      <div className={cardCls}>
        <div className="px-6 py-5 border-b border-[#F3F3F3]">
          <h3 className="text-sm font-semibold text-[#1a1c1c]">Veri Yönetimi</h3>
          <p className="text-xs text-[#8b7264] mt-0.5">Son sync'ten bu yana gelen yeni siparişleri çek veya tüm veriyi baştan yükle</p>
        </div>

        <div className="px-6 py-6 flex flex-col sm:flex-row gap-3">
          <button onClick={() => handleSync(false)} disabled={syncing} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E2E2E2] text-sm font-medium text-[#574236] hover:border-[#F27A1A] hover:text-[#F27A1A] transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Yeni Verileri Çek
          </button>
          <button onClick={() => handleSync(true)} disabled={syncing} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50">
            <RotateCcw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Tüm Veriyi Yeniden Çek (Son 90 Gün)
          </button>
        </div>

        {syncResult && (
          <div className={`mx-6 mb-5 flex items-start gap-2 text-sm rounded-lg px-4 py-3 ${
            syncResult.ok ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
          }`}>
            {syncResult.ok ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            {syncResult.message}
          </div>
        )}
      </div>

    </div>
  )
}
