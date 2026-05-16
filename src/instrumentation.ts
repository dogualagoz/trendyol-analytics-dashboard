// Next.js instrumentation hook — sunucu başlayınca bir kez çalışır.
// Node.js runtime'da otomatik sync zamanlayıcısını başlatır.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { runSync }               = await import("@/lib/sync")
  const { AUTO_SYNC_INTERVAL_MIN } = await import("@/lib/constants")

  const intervalMs = AUTO_SYNC_INTERVAL_MIN * 60 * 1000

  // İlk sync: sunucu başlayınca hemen çalıştır (DB'yi taze tut)
  runSync().catch((err: unknown) =>
    console.error("[auto-sync] İlk sync hatası:", err)
  )

  // Sonraki sync'ler: her AUTO_SYNC_INTERVAL_MIN dakikada bir
  setInterval(() => {
    runSync().catch((err: unknown) =>
      console.error("[auto-sync] Periyodik sync hatası:", err)
    )
  }, intervalMs)

  console.log(`[auto-sync] Zamanlayıcı başlatıldı — her ${AUTO_SYNC_INTERVAL_MIN} dakikada bir sync yapılacak`)
}
