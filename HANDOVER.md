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

## ✅ 2. Fitur-fitur yang Baru Selesai Diimplementasikan (Sesi Terakhir - Mar 2026)

1.  **Sistem Manajemen Kurir (Reassign)**
    *   Admin Toko sekarang dapat melakukan **Ganti Kurir** pada pesanan yang sudah berstatus `on_delivery`. Berguna jika kurir sebelumnya mengalami kendala.
2.  **Sistem Customer Terintegrasi & Guest Checkout**
    *   **Auto-Account:** Setiap pembeli yang checkout tanpa login otomatis dibuatkan akun dengan **password 4-digit angka** (`initial_password`).
    *   **Daftar Customer Interaktif:** Halaman `/admin/customers` kini menampilkan statistik total belanja, jumlah order, dan password akun mereka.
    *   **Pop-up Riwayat Alamat & Gmaps:** Mengklik nama customer akan membuka modal berisi seluruh alamat yang pernah mereka gunakan, lengkap dengan tombol **"Gmaps"** jika ada koordinat GPS.
    *   **Pop-up Riwayat Pesanan:** Mengklik jumlah "Orders" akan menampilkan rincian barang apa saja yang pernah dibeli oleh customer tersebut.
3.  **Interface Cleanup**
    *   Sidebar Admin telah disederhanakan dengan menghapus menu "Kelola Pengguna" dan "Pesanan Saya" (fokus pada fitur penjualan).

---

## 📌 3. Lokasi File Kunci

*   `apps/api/src/routes/customers.ts`: Endpoint agregasi data statistik customer dan riwayat alamat.
*   `apps/web/src/pages/AdminCustomersPage.jsx`: UI utama untuk manajemen customer (termasuk modal history & alamat).
*   `apps/api/src/routes/orders.ts`: Logika pembuatan order, pembuatan user guest otomatis, dan ganti kurir.
*   `apps/api/src/db/schema.ts`: Perubahan skema terbaru (kolom `initialPassword` pada tabel `users`).
*   `docs/CHANGELOG_CUSTOMERS_COURIER.md`: Rincian mendalam pembaruan fitur Maret 2026.

---

## ⚙️ 4. Cara Deploy (Cloudflare)

Jika Anda harus melakukan deploy ulang setelah perubahan kode, jalankan dari terminal (di folder root `c:\Aplikasi\wamarket`) menggunakan command ini:

```bash
# === GENERATE & APPLY MIGRATION ===
cd apps/api
npx drizzle-kit generate
npm run db:migrate:prod

# === DEPLOY WORKERS (Backend) ===
npm run deploy

# === DEPLOY PAGES (Frontend) ===
cd ../web
npm run build
npm run deploy
```

---

## 🚀 5. Langkah Selanjutnya

Silakan berkomunikasi dengan *USER* mengenai prioritas tugas selanjutnya:
1.  **Testing Gmaps Flow:** Pastikan tombol "Gmaps" di riwayat alamat berfungsi dengan data koordinat riil dari pelanggan.
2.  **Order Detail Enhancement:** Jika USER meminta, detail item di modal history customer bisa ditambahkan foto produk.
3.  **Cron Job Subscription:** Implementasikan pengecekan otomatis untuk expired `subscriptions`.

Selamat bekerja! Pastikan cek `docs/CHANGELOG_CUSTOMERS_COURIER.md` untuk rincian fitur teranyar.
