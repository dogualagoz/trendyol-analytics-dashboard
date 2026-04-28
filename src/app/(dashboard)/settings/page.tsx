"use client"

// Kullanıcı etkileşimi (onChange, onSubmit) olduğu için Client Component

import { useState, useEffect } from "react"
import { Save, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"

// Form alanlarının tipleri
type SettingsForm = {
  trendyol_api_key: string
  trendyol_api_secret: string
  trendyol_seller_id: string
  sync_interval: string
}

const DEFAULT_FORM: SettingsForm = {
  trendyol_api_key: "",
  trendyol_api_secret: "",
  trendyol_seller_id: "",
  sync_interval: "30",
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM)
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // null: henüz işlem yok | "success" | "error"
  const [status, setStatus] = useState<"success" | "error" | null>(null)

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
          sync_interval: data.sync_interval ?? "30",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // Input değişince ilgili alanı güncelle
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setStatus(null)
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

  return (
    <div className="max-w-2xl space-y-6">

      {/* Başlık */}
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1c1c]">Ayarlar</h2>
        <p className="text-sm text-[#574236] mt-0.5">
          Trendyol API bağlantı bilgilerinizi buradan yönetin
        </p>
      </div>

      {/* Form Kartı */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-5"
      >
        <h3 className="text-sm font-semibold text-[#1a1c1c]">Trendyol API Bilgileri</h3>

        {/* Seller ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#574236]" htmlFor="trendyol_seller_id">
            Seller ID
          </label>
          <input
            id="trendyol_seller_id"
            name="trendyol_seller_id"
            type="text"
            value={form.trendyol_seller_id}
            onChange={handleChange}
            placeholder="örn. 123456"
            className="w-full rounded-lg border border-[#E2E2E2] px-3 py-2 text-sm text-[#1a1c1c] placeholder:text-[#aaa] focus:outline-none focus:border-[#F27A1A] transition-colors"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#574236]" htmlFor="trendyol_api_key">
            API Key
          </label>
          <input
            id="trendyol_api_key"
            name="trendyol_api_key"
            type="text"
            value={form.trendyol_api_key}
            onChange={handleChange}
            placeholder="API Key'inizi girin"
            className="w-full rounded-lg border border-[#E2E2E2] px-3 py-2 text-sm text-[#1a1c1c] placeholder:text-[#aaa] focus:outline-none focus:border-[#F27A1A] transition-colors"
          />
        </div>

        {/* API Secret — göster/gizle butonu ile */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#574236]" htmlFor="trendyol_api_secret">
            API Secret
          </label>
          <div className="relative">
            <input
              id="trendyol_api_secret"
              name="trendyol_api_secret"
              type={showSecret ? "text" : "password"}
              value={form.trendyol_api_secret}
              onChange={handleChange}
              placeholder="API Secret'ınızı girin"
              className="w-full rounded-lg border border-[#E2E2E2] px-3 py-2 pr-10 text-sm text-[#1a1c1c] placeholder:text-[#aaa] focus:outline-none focus:border-[#F27A1A] transition-colors"
            />
            {/* Göster/gizle butonu */}
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#574236] hover:text-[#F27A1A] transition-colors"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sync Aralığı */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#574236]" htmlFor="sync_interval">
            Senkronizasyon Aralığı
          </label>
          <select
            id="sync_interval"
            name="sync_interval"
            value={form.sync_interval}
            onChange={handleChange}
            className="w-full rounded-lg border border-[#E2E2E2] px-3 py-2 text-sm text-[#1a1c1c] focus:outline-none focus:border-[#F27A1A] transition-colors bg-white"
          >
            <option value="15">15 dakika</option>
            <option value="30">30 dakika</option>
            <option value="60">1 saat</option>
            <option value="120">2 saat</option>
          </select>
        </div>

        {/* Durum mesajı */}
        {status === "success" && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Ayarlar başarıyla kaydedildi.
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Kaydedilirken bir hata oluştu.
          </div>
        )}

        {/* Kaydet Butonu */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>

    </div>
  )
}
