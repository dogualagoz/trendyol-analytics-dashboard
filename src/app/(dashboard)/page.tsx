// Server Component — veri çekme işlemleri burada olacak (ilerleyen aşamalarda)
// Şimdilik layout'un çalıştığını doğrulamak için placeholder

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1c1c]">Genel Bakış</h2>
        <p className="text-sm text-[#574236] mt-1">
          Tüm satış ve karlılık metrikleriniz
        </p>
      </div>

      {/* Metrik kartları buraya gelecek — şimdilik boş placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {["Toplam Ciro", "Net Kar", "Sipariş Sayısı", "Kar Oranı"].map((title) => (
          <div
            key={title}
            className="bg-white rounded-xl border border-[#E2E2E2] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#574236]">
              {title}
            </p>
            <p className="text-2xl font-bold text-[#1a1c1c] mt-2">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
