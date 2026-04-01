# Changelog - SEO & Optimasi Performa 3G (Maret 2026)

Dokumen ini merangkum pembaruan fitur pada sistem **SEO Social Sharing** dan **Optimasi Kinerja Jaringan Seluler 3G** untuk platform WaMarket.

## 1. SEO & Social Media Sharing (Edge SSR)
Fitur ini memastikan tautan (link) yang dibagikan ke WhatsApp, Telegram, atau Facebook tampil profesional dengan pratinjau (preview) yang akurat.

- **Dynamic Open Graph (OG) Tags**: Injeksi otomatis `og:title`, `og:description`, dan `og:image` menggunakan Cloudflare Edge Functions (`HTMLRewriter`).
- **Pratinjau Produk**: Menampilkan gambar produk, nama produk, dan harga langsung di gelembung chat sosial media.
- **Pratinjau Toko (Homepage)**: Memperbaiki pengambilan logo toko (`logo_url`) dari pengaturan database agar tampil sebagai thumbnail saat link utama toko dibagikan.
- **SEO-Friendly Slugs**: Produk baru kini menggunakan format ID `p-[hash]-[slug]` (Contoh: `p-a1b2-sepatu-lari-keren`) untuk meningkatkan visibilitas di mesin pencari.

## 2. Optimasi Kinerja 3G (Lightweight Mobile)
Serangkaian optimasi teknis untuk memastikan website tetap ringan, cepat, dan hemat kuota saat dibuka di HP dengan koneksi internet tidak stabil (3G).

- **Code Splitting (Vite)**: Memecah file JavaScript besar menjadi potongan kecil (chunks). Pengunjung hanya mengunduh kode yang diperlukan saja (Lazy Loading Modules).
- **Native Image Lazy Loading**: Mengganti teknik CSS `background-image` dengan tag HTML `<img>` + atribut `loading="lazy"`. Gambar hanya akan diunduh jika pengguna men-scroll ke area tersebut.
- **Paginasi HomePage (Load More)**: Laman depan tidak lagi memuat puluhan produk sekaligus. Sistem kini memuat 12 produk awal dan menyediakan tombol **"Tampilkan Lebih Banyak"** untuk menghemat bandwidth awal.
- **Advanced Minification**: Menggunakan `Terser` untuk kompresi kode JavaScript maksimal, menghapus log konsol dan komentar yang tidak perlu di tahap produksi.

## 3. Perubahan Teknis (Developer Notes)
- **Edge Function**: Pemutakhiran `apps/web/functions/[[path]].js` untuk mendukung pemetaan `logo_url` dan pembersihan path gambar `/uploads/`.
- **Vite Config**: Penambahan `manualChunks` di `vite.config.js` untuk memisahkan library pihak ketiga (React, Leaflet, Query).
- **Backend API**: 
    - Penambahan logika `totalCount` pada endpoint `GET /api/s/:slug/products` untuk sinkronisasi tombol "Load More".
    - Logika pembuatan ID produk baru yang SEO-friendly di `products.ts`.
- **Dependency**: Instalasi `terser` sebagai dev-dependency untuk optimalisasi build.

---
*Update terakhir: 29 Maret 2026*
