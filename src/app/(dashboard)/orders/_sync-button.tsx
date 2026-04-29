"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export function SyncButton() {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSync() {
    setStatus("syncing")
    setMessage("")

    try {
      const res  = await fetch("/api/sync", { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        setStatus("success")
        setMessage(data.message)
        router.refresh()  // sayfayı yeniden yükle
      } else {
        setStatus("error")
        setMessage(data.message ?? "Bilinmeyen hata")
      }
    } catch {
      setStatus("error")
      setMessage("Sunucuya ulaşılamadı")
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={status === "syncing"}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F27A1A] text-white text-sm font-medium hover:bg-[#984700] transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${status === "syncing" ? "animate-spin" : ""}`} />
        {status === "syncing" ? "Çekiliyor..." : "Trendyol'dan Çek"}
      </button>

      {/* Sonuç mesajı */}
      {status === "success" && (
        <p className="text-xs text-emerald-600">{message}</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-500">{message}</p>
      )}
    </div>
  )
}
