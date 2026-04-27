"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Kullanıcı adı veya şifre hatalı.")
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#F27A1A] rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h1 className="text-[#1a1c1c] text-2xl font-semibold tracking-tight">
            Trendyol Analytics
          </h1>
          <p className="text-[#574236] text-sm mt-1">
            Seller Dashboard
          </p>
        </div>

        {/* Kart */}
        <div
          className="bg-white rounded-2xl border border-[#E2E2E2] p-8"
          style={{ boxShadow: "0px 4px 20px rgba(0,0,0,0.04)" }}
        >
          <h2 className="text-[#1a1c1c] text-lg font-semibold mb-6">
            Giriş Yap
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="text-sm font-medium text-[#1a1c1c]"
              >
                Kullanıcı Adı
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-[#E2E2E2] bg-white text-sm text-[#1a1c1c] placeholder:text-[#9e9e9e] outline-none transition-colors focus:border-[#F27A1A] focus:ring-2 focus:ring-[#F27A1A]/20"
                placeholder="Kullanıcı adınız"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#1a1c1c]"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-[#E2E2E2] bg-white text-sm text-[#1a1c1c] placeholder:text-[#9e9e9e] outline-none transition-colors focus:border-[#F27A1A] focus:ring-2 focus:ring-[#F27A1A]/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#F27A1A] hover:bg-[#d96a10] text-white font-medium rounded-lg transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Giriş yapılıyor…
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#9e9e9e] mt-6">
          Trendyol Seller Analytics &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
