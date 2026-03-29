# Changelog - Manajemen Customer & Kurir (Maret 2026)

Dokumen ini merangkum pembaruan fitur pada sistem **Manajemen Kurir** dan **Sistem Customer** terintegrasi.

## 1. Manajemen Kurir (Courier Reassignment)
- **Fitur Ganti Kurir**: Admin sekarang dapat mengubah penugasan kurir untuk pesanan yang sudah berstatus `on_delivery`.
- **Logika Update**: Backend kini memperbarui record pengiriman yang ada daripada menolak penugasan baru, memastikan riwayat pengiriman tetap konsisten.

## 2. Sistem Customer Terintegrasi
Fitur ini mengubah cara Admin mengelola data pembeli yang melakukan checkout.

### A. Otomatisasi Akun Guest
- **Auto-Generate Password**: Setiap pembeli yang melakukan checkout tanpa login (guest) akan otomatis dibuatkan akun dengan **password 4-digit angka**.
- **Penyimpanan Data**: Kolom baru `initial_password` ditambahkan pada tabel `users` untuk menyimpan password awal tersebut agar Admin bisa menginformasikannya ke pelanggan.

### B. Daftar Customer Interaktif
- **Statistik Belanja**: Menampilkan total pesanan, total nominal belanja, dan tanggal terakhir order untuk setiap pelanggan.
- **Query Agregasi**: Menggunakan SQL agregasi (count, sum, max) untuk performa data yang cepat.

### C. Pop-up Riwayat Alamat (Address History)
- **Trigger**: Klik pada **Nama Customer**.
- **Fitur**: Menampilkan daftar unik alamat pengiriman yang pernah digunakan.
- **Integrasi Google Maps**: Menyediakan tombol **"Gmaps"** jika data koordinat tersedia, langsung membuka lokasi di peta.

### D. Pop-up Riwayat Pesanan (Order History)
- **Trigger**: Klik pada jumlah pesanan di kolom **"History Order"**.
- **Fitur**: Menampilkan rincian pesanan (Order Number, Status, Total).
- **Detail Item**: Dapat diklik untuk melihat daftar barang spesifik (nama produk, quantity, harga) yang dibeli dalam pesanan tersebut.

## 3. Pembersihan Interface (UI/UX)
- **Sidebar Admin**: Menghapus menu **"Kelola Pengguna"** dan **"Pesanan Saya"** untuk menyederhanakan navigasi dan fokus pada fitur penjualan.
- **Responsive Table**: Penyesuaian layout tabel customer agar tetap nyaman dibaca di berbagai resolusi layar.

## 4. Perubahan Teknis (Developer Notes)
- **DB Migration**: Penambahan kolom `initial_password` pada tabel `users`.
- **API Endpoints Baru**:
    - `GET /api/s/:slug/customers`: Daftar pelanggan teragregasi.
    - `GET /api/s/:slug/customers/:id/addresses`: Riwayat alamat unik.
    - `GET /api/s/:slug/orders/:id/items`: Rincian item per pesanan.
- **Frontend**: Penambahan komponen `HistoryModal` dan `AddressModal` di `AdminCustomersPage.jsx`.

---
*Update terakhir: 29 Maret 2026*
