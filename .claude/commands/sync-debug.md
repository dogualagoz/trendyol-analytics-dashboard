Trendyol API senkronizasyon sorununu debug et.

Şunları sırayla kontrol et:

1. `settings` tablosunda API credentials var mı? (TRENDYOL_API_KEY, TRENDYOL_API_SECRET, TRENDYOL_SELLER_ID)
2. `sync_logs` tablosundaki son 5 kaydı göster — status ve error_message'a bak
3. `src/lib/trendyol.ts` içindeki API client'ı incele — auth header doğru mu?
4. Rate limit aşılıyor mu? (50 istek / 10 saniye)
5. Delta sync mantığı: son sync tarihinden itibaren doğru filtre uygulanıyor mu?

Sorun bulunursa: hangi dosya, hangi satır, ne değişmeli — net şekilde belirt.
Sorun bulunamazsa test için curl komutu oluştur (API key'leri placeholder ile).
