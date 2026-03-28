# WA Market SaaS Platform Documentation

Dokumentasi ini mencakup fitur-fitur dan arsitektur terbaru dari WA Market, yang telah berevolusi dari platform single-store (Docker/PostgreSQL) menjadi platform **SaaS Multi-Tenant** menggunakan infrastruktur Cloudflare (Workers, Pages, D1).

---

## 1. Arsitektur Infrastruktur (Cloudflare)

Platform ini sekarang didesain untuk berjalan sepenuhnya di ekosistem Cloudflare dengan arsitektur serverless.

- **Frontend**: Cloudflare Pages (React / Vite)
- **Backend API**: Cloudflare Workers (Hono REST API)
- **Database**: Cloudflare D1 (SQLite Serverless)
- **Object Storage**: Cloudflare R2 (untuk gambar produk, logo, banner)

**Keuntungan:**

- **Zero Configuration Scaling**: Tidak perlu pusing mengatur Docker container atau instance EC2.
- **Global Edge Network**: API dan aset dilayani dari edge location terdekat dengan pengguna.
- **Cost Effective**: Skema harga Cloudflare Workers & D1 sangat murah dibandingkan VPS tradisional.

---

## 2. Fitur Superadmin & Dashboard Platform

Kami telah menambahkan dukungan level _Superadmin_ untuk mengelola seluruh ekosistem SAAS WA Market.

### Cara Login Superadmin

- **Subdomain Console**: Akses `/superadmin` dari domain utama aplikasi (atau via routing khusus frontend).
- **Kredensial Login**: Login menggunakan **nomor WhatsApp terenkripsi** dan password (bcrypt).
  _(Nomor default superadmin yang telah disetel: `081111111111` dengan password `admin123`)_

### Fitur Utama Superadmin:

1. **Dasbor Ringkasan**: Melihat total toko yang terdaftar, total pengguna, langganan aktif, dan GMV (Gross Merchandise Value) platform.
2. **Manajemen Toko**: Daftar semua toko (_tenant_).
3. **Konfigurasi Custom Domain**: Superadmin dapat mendaftarkan/menyetujui _slug_ (Custom Subdomain/Domain) untuk toko tertentu agar DNS Cloudflare bisa divalidasi.
4. **Manajemen Langganan (SaaS)**: Memantau pembayaran langganan (subscription) tahunan dari para pemilik toko. Toko yang memiliki langganan aktif dapat mengakses fitur premium.

---

## 3. Sistem Pembayaran & Gateway (Toko & Platform)

Sistem pembayaran telah diperbarui untuk mendukung Payment Gateways kelas atas di Indonesia. Pembayaran dipisahkan dalam dua aliran dana:

### A. Pembayaran Pelanggan ke Toko (B2C)

Pemilik toko (tenant) dapat mengatur Gateway mereka sendiri. Server platform _hanya perantara_. Dana masuk langsung ke rekening pemilik toko.

- **Konfigurasi API Key (Isolate)**: Di panel Admin Toko, pemilik bisa memasukkan _Production Key_ Xendit dan Midtrans. Key ini disimpan dan dienkripsi di `store_settings` database D1.
- **Checkout Experience**:
  - Pelanggan toko memilih metode bayar: **Manual WhatsApp**, **Midtrans (Gopay/Virtual Account)**, atau **Xendit**.
  - Sistem menggunakan _API key spesifik milik toko_ tersebut saat menembak API gateway.

### B. Pembayaran Langganan Toko ke Superadmin / Platform (B2B)

Pemilik toko membayar biaya lisensi (SaaS fee) ke pembuat platform.

- **Harga Langganan**: Flat Rp 300.000,- / tahun.
- **Gateway Terpusat**: Menggunakan API Key Platform (diset pada level `wrangler.toml` via `MIDTRANS_PLATFORM_SERVER_KEY` / `XENDIT_PLATFORM_SECRET_KEY`).
- Alur: Store Admin klik tombol "Upgrade / Perpanjang" $\rightarrow$ Bayar via Invoicing Gateway platform $\rightarrow$ Status toko menjadi VIP/Active.

---

## 4. Opsi Pengiriman: Kurir Toko & Berbagi GPS

Pengalaman _Checkout_ telah ditingkatkan dengan pemisahan tipe kurir yang jelas, yang sangat membantu toko kelontong atau F&B lokal.

### Kurir Toko (Own Courier)

- Pelanggan yang dalam satu area dengan toko dapat memilih **"Kurir Toko"**.
- Terdapat integrasi **Geolokasi HTML5 (Share Location)**: Pelanggan membagikan koordinat GPS presisi kepada admin toko tanpa harus pusing mengetik alamat lengkap kecamatan/kode pos.
- Ongkos kirim pada saat checkout tercatat `Rp 0`, agar admin toko bisa memberikan angka final via negosiasi langsung di chat WhatsApp.
- Di Dasbor Admin Toko, fitur ini memunculkan tombol **"📍 Buka Lokasi GPS di Google Maps"**.

### Jasa Paket (Expedition Courier)

- Menggunakan integrasi **API RajaOngkir**.
- Pelanggan diwajibkan melakukan auto-complete alamat (Provinsi $\rightarrow$ Kota $\rightarrow$ Kecamatan).
- Tampil daftar harga dan estimasi hari pengiriman (JNE, SiCepat, dll), di mana ongkir akan otomatis dijumlah dengan total belanja.

---

## 5. Ringkasan Migrasi D1 Terakhir

Pada fase terbaru, skema database (`schema.ts`) telah menggunakan Drizzle ORM yang dijalankan ke remote Cloudflare D1.

Tabel Penting yang Ditambahkan/Diubah:

- `subscriptions`: Menyimpan riwayat tagihan langganan SaaS (Sewa Platform).
- `payments`: Menyimpan ID Transaksi dan Webhook events dari Xendit/Midtrans.
- `orders`:
  - Penambahan `paymentMethod` (`whatsapp`, `xendit`, `midtrans`), `paymentStatus` (`unpaid`, `paid`, `expired`).
  - Penambahan `shippingType` (`own_courier`, `expedition`).
  - Penambahan koordinat geospasial `latitude` dan `longitude` untuk Kurir Toko.

## 6. Deployment Command Refresher

Untuk mendeploy seluruh stack platform, pastikan telah terautentikasi di Cloudflare (`npx wrangler login`):

```bash
# -- Backend API Deploy (Hono & D1) --
cd apps/api
npx drizzle-kit generate
npx wrangler d1 migrations apply wa_market_db --remote
npx wrangler deploy

# -- Frontend Pages Deploy (React & Vite) --
cd apps/web
npm run build
npx wrangler pages deploy dist --project-name=wa-market-web
```
