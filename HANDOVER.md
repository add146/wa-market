# 🤝 Handover Document untuk Agen Berikutnya (WA Market)

Dokumen ini berisi informasi mengenai state Project WA Market saat ini, pencapaian di sesi sebelumnya, arsitektur sistem, dan catatan-catatan penting untuk membantu Anda melanjutkannya.

---

## 🏗️ 1. Arsitektur Projek Saat Ini

WA Market dulunya berbasis *Docker/PostgreSQL* (Single Store), namun **kini sudah berevolusi menjadi platform Multi-Tenant SaaS serverless di ekosistem Cloudflare**.

*   **Frontend**: React (Vite) di-deploy ke **Cloudflare Pages**.
*   **Backend**: Hono REST API di-deploy ke **Cloudflare Workers**.
*   **Database**: **Cloudflare D1** (SQLite / Drizzle ORM).
*   **Storage**: **Cloudflare R2** (Bucket `wa-market-media` untuk aset).

---

## ✅ 2. Fitur-fitur yang Baru Selesai Diimplementasikan (Sesi Terakhir)

1.  **Sistem Superadmin SaaS & Custom Domain**
    *   Terdapat panel *(Superadmin Console)* `/superadmin` untuk melacak seluruh toko terdaftar, langganan aktif, dan validasi Custom Domain toko.
    *   **Kredensial Superadmin Aktif:**
        *   Nomor WA Login: `081111111111` *(DB menyimpannya sebagai `6281111111111`)*
        *   Password: `admin123`
2.  **Sistem Pembayaran Isolate (Tenant) & Platform (Langganan)**
    *   **Pembayaran Pelanggan ke Toko:** Menggunakan *API Key Production* Xendit/Midtrans milik masing-masing toko (disimpan terenkripsi).
    *   **Pembayaran Langganan (Sewa SaaS):** Menggunakan API Key Platform di level `wrangler.toml` dengan harga dipatok *flat* **Rp 300.000 / Tahun**.
3.  **Checkout Pengiriman Jasa Paket vs Kurir Toko (Share GPS)**
    *   **Jasa Paket:** Validasi Kecamatan & Hitung ongkir otomatis via API RajaOngkir.
    *   **Kurir Toko (Baru):** Fitur untuk kurir internal / kelontong lokal. Pelanggan bisa mengklik tombol **"📍 Share Lokasi GPS"** (`navigator.geolocation`). Estimasi Ongkir menjadi Rp 0 dan dinonaktifkan (karena divalidasi via chat WhatsApp oleh toko nantinya).
    *   *Schema D1:* Kolom baru ditambahkan ke tabel `orders`: `shippingType`, `latitude`, `longitude`.
    *   Admin Toko dapat melihat tombol **Buka Lokasi GPS di Google Maps** pada modal Detail Pesanan di halaman *Admin Orders*.

---

## 📌 3. Lokasi File Kunci

*   `apps/api/src/routes/superadmin.ts` & `apps/web/src/pages/saas/SuperAdminPage.jsx`: Logika Superadmin.
*   `apps/api/src/routes/payment.ts` & `subscription.ts`: Logika mutasi & *webhook* payment gateway (Xendit & Midtrans). Menggunakan native `fetch()` tanpa SDK pihak ketiga.
*   `apps/api/src/routes/orders.ts` & `apps/web/src/pages/CheckoutPage.jsx`: Handling Order Creation, WhatsApp Messaging (WAHA), dan UI Share Lokasi Kurir Toko.
*   `apps/api/src/db/schema.ts`: Tempat seluruh struktur Schema SQLite Drizzle.
*   `docs/README_SAAS_PLATFORM.md`: Dokumentasi terbaru untuk SaaS Platform (referensi teknis).

---

## ⚙️ 4. Cara Deploy (Cloudflare)

Jika Anda harus melakukan deploy ulang setelah perubahan kode, jalankan dari terminal (di folder root `c:\Aplikasi\wamarket`) menggunakan command ini:

```bash
# === GENERATE & APPLY MIGRATION ===
cd apps/api
npx drizzle-kit generate
npx wrangler d1 migrations apply wa_market_db --remote

# === DEPLOY WORKERS (Backend) ===
npx wrangler deploy

# === DEPLOY PAGES (Frontend) ===
cd ../web
npm run build
npx wrangler pages deploy dist --project-name=wa-market-web
# (Deployment frontend sudah auto-linked ke worker jika URL di env production)
```

**Semua deploy terakhir telah SUKSES!**

---

## 🚀 5. Langkah Selanjutnya

Silakan berkomunikasi dengan *USER* mengenai prioritas tugas selanjutnya. Beberapa area yang mungkin butuh perhatian:
1.  **Frontend/UI Polish:** Terdapat beberapa halaman yang masih memerlukan desain yang lebih mulus (UI/UX) jika USER menginginkannya.
2.  **Testing Alur Subscription Expired:** Platform belum memiliki mekanisme *Cron Job* otomatis untuk memblokir toko jika `subscriptions` mereka mencapai tanggal jatuh tempo (expired).
3.  **Webhook Gateway Testing:** Untuk *live transactions*, terkadang *signature verification* perlu ekstra teliti.

Selamat bekerja, dan pastikan Anda menggunakan alat bantu pencarian internal (`grep_search`) sebelum menulis kode agar tidak meniban logika yang ada!
