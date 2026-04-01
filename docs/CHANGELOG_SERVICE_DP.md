# Ringkasan Fitur Jasa & Skema DP (Down Payment) di WA Market

Dokumen ini berisi rangkuman fitur, alur kerja, dan penyesuaian sistem terkait produk bertipe **Jasa** dengan pembayaran DP yang telah diimplementasikan ke dalam platform WA Market.

## 1. Konsep Utama
Produk "Jasa" (contoh: Jasa Pembuatan Website, Fotografi, Konsultasi) memiliki siklus transaksi yang berbeda dari produk fisik atau digital konvensional:
1. Pembeli melihat Scope of Work (Cakupan Layanan) dan wajib membayar Uang Muka (DP) sebelum pekerjaan dimulai.
2. Penjual (Admin) mengerjakan layanan, lalu menekan tombol secara manual jika pekerjaan telah selesai.
3. Pembeli menerima tagihan pelunasan sisa biaya dan diarahkan untuk membayar guna melunasi order (Completed).

## 2. Struktur Data & Database (`wa_market_db`)
Untuk mendukung alur jasa dan DP, beberapa skema baru diterapkan:
* **`products`**: Penambahan field `dpType` (percentage/fixed), `dpValue` (nilai DP), `serviceDuration` (estimasi lama pekerjaan), dan `serviceDescription` (Scope of Work).
* **`orders`**: Penambahan sistem pelacakan (tracking) pekerjaan. Atribut baru seperti `hasServiceItems`, `serviceStatus`, `dpAmount`, `settlementAmount` dimasukkan guna melacak sisa tagihan.
* **`payments`**: Modifikasi riwayat dan generator invoice *payment gateway* agar bisa menerbitkan tagihan secara parsial (uang DP terlebih dahulu, baru _settlement_ belakangan).

## 3. Fitur-Fitur Storefront (Untuk Pelanggan)
* **Informasi Pembayaran Bertahap**: Di halaman Detail Produk, pelanggan akan diperlihatkan *Badge Layanan Jasa* serta panel penjelasan tentang berapa besar DP yang harus dibayar saat ini dan sisa yang dibayar belakangan.
* **Validasi Checkout**: Platform menerapkan proteksi yang mencegah keranjang belanja (*cart*) produk Jasa dicampur dengan Produk Fisik/Digital. Jika tercampur, sistem akan memunculkan *error* dan meminta konsumen memisahkannya. Ongkir/pengiriman produk fisik tidak berlaku (gratis) untuk jasa.
* **Portal Status Pekerjaan**: Halaman `Pesanan Saya` yang tadinya statis kini berisi informasi real-time mengenai progres jasa (contoh: *Menunggu DP*, *Dikerjakan*, *Menunggu Pelunasan*, *Selesai*).
* **Faktur Pelunasan Otomatis**: Saat pekerjaan tuntas, akan muncul tombol `Bayar Pelunasan Sekarang`. Sistem akan otomatis men-generate URL _payment gateway_ (Midtrans/Xendit) untuk nominal akhir tanpa perlu admin membuat QR Code/link _midtrans_ secara manual, sehingga menghindarkan kemungkinan tertolaknya link pembayaran karena batas _expired_ payment API yang umumnya 24 jam.

## 4. Fitur Admin Panel (Untuk Penjual)
* **Konfigurasi Produk Fleksibel**: Admin bisa menentukan DP berbasis persentase (misal: 50%) atau nominal _Fixed_ (misal: Rp 1.000.000) pada form pembuatan / _edit_ produk baru.
* **Tombol "Mulai Kerjakan"**: Pada halaman Detail Pesanan di riwayat transaksi, admin memiliki kontrol penuh untuk memulai progres pekerjaan jasa. Hal ini mencegah kesalahpahaman timing pengerjaan.
* **Tombol "Minta Pelunasan"**: Saat ditekan, status berubah menjadi "Menunggu Pelunasan" dan mengirim notifikasi WhatsApp kepada pelanggan.
* **Terintegrasi Notifikasi WA Auto-Send**: API Notifikasi telah disesuaikan agar mengirim *template* pesan baru setiap kali status DP / Proses Pengerjaan Jasa berubah.

## 5. Deployment Info
* Update *build* terkini di: `apps/web` (React + Vite)
* Worker script terkini: `apps/api` (Hono, CF Worker)
* Migrasi DB: `0012_dizzy_sphinx.sql`
