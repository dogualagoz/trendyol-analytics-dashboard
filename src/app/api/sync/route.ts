// Sync tetikleyici endpoint.
// Dashboard'daki "Güncelle" butonu bu route'a POST atar.
// Gerçek iş lib/sync.ts'de yapılır — bu dosya sadece HTTP katmanıdır.

import { NextResponse } from "next/server"
import { runSync } from "@/lib/sync"

// Sadece POST kabul ediyoruz — sync bir okuma değil, yazma işlemidir
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const force = body?.force === true
    const result = await runSync(force)

    if (!result.success) {
      console.error("[sync] Hata:", result.message)
      return NextResponse.json({ message: result.message }, { status: 500 })
    }

    return NextResponse.json({ message: result.message })
  } catch (err) {
    // runSync içindeki catch'ten kaçan beklenmedik hatalar için
    const message = err instanceof Error ? err.message : "Beklenmedik hata"
    console.error("[sync] Beklenmedik hata:", message)
    return NextResponse.json({ message }, { status: 500 })
  }
}
