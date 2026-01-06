# Panduan Deployment WA Market - Untuk Pemula

Panduan lengkap step-by-step untuk deploy WA Market menggunakan Docker di aaPanel dengan Cloudflare Zero Trust.

---

## 📋 Daftar Isi

1. [Persiapan Server](#1-persiapan-server)
2. [Install aaPanel](#2-install-aapanel)
3. [Install Docker di aaPanel](#3-install-docker-di-aapanel)
4. [Upload Project ke Server](#4-upload-project-ke-server)
5. [Build dan Jalankan Docker](#5-build-dan-jalankan-docker)
6. [Setup Database](#6-setup-database)
7. [Setup Cloudflare Zero Trust](#7-setup-cloudflare-zero-trust)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Persiapan Server

### Spesifikasi Minimum
- **RAM**: 2GB (recommended 4GB)
- **Storage**: 20GB
- **OS**: Ubuntu 20.04/22.04 atau CentOS 7/8
- **Akses**: SSH root atau sudo

### Akses SSH ke Server
```bash
# Dari terminal/PowerShell
ssh root@IP_SERVER_ANDA
```

---

## 2. Install aaPanel

> ⚠️ **Skip langkah ini jika aaPanel sudah terinstall**

### Ubuntu/Debian
```bash
wget -O install.sh http://www.aapanel.com/script/install-ubuntu_6.0_en.sh && bash install.sh aapanel
```

### CentOS
```bash
yum install -y wget && wget -O install.sh http://www.aapanel.com/script/install_6.0_en.sh && bash install.sh aapanel
```

Setelah install selesai, akan muncul:
```
==================================================================
aaPanel Internet Address: http://IP_ANDA:7800/xxxxxx
username: xxxxxx
password: xxxxxx
==================================================================
```

**⚡ PENTING**: Simpan informasi login ini!

---

## 3. Install Docker di aaPanel

### Step 3.1: Login ke aaPanel
1. Buka browser
2. Akses `http://IP_SERVER_ANDA:7800/xxxxxx`
3. Login dengan username dan password yang diberikan

### Step 3.2: Install Docker Manager
1. Klik menu **App Store** di sidebar kiri
2. Cari **"Docker Manager"**
3. Klik **Install**
4. Tunggu hingga instalasi selesai (± 5 menit)

![Install Docker Manager](https://i.imgur.com/placeholder.png)

### Step 3.3: Verifikasi Docker
```bash
# Cek via SSH
docker --version
docker-compose --version
```

Harus menampilkan versi Docker dan Docker Compose.

---

## 4. Upload Project ke Server

### Option A: Via Git (Recommended)

```bash
# SSH ke server
ssh root@IP_SERVER_ANDA

# Masuk ke direktori web
cd /www/wwwroot

# Clone repository
git clone https://github.com/add146/wa-market.git

# Masuk ke folder project
cd wa-market
```

### Option B: Via aaPanel File Manager

1. Klik menu **Files** di sidebar
2. Navigate ke `/www/wwwroot/`
3. Upload file ZIP project
4. Extract

### Option C: Via SFTP
Gunakan FileZilla atau WinSCP:
- Host: IP_SERVER_ANDA
- Port: 22
- Username: root
- Password: (password server)
- Upload ke: `/www/wwwroot/wa-market/`

---

## 5. Build dan Jalankan Docker

### Step 5.1: Masuk ke Folder Project
```bash
cd /www/wwwroot/wa-market
```

### Step 5.2: Konfigurasi Environment
```bash
# Copy template environment
cp apps/server/.env.example apps/server/.env

# Edit file environment
nano apps/server/.env
```

Edit isi `.env`:
```env
DATABASE_URL=postgresql://tokoindo:tokoindo123@postgres:5432/tokoindo
PORT=3000
NODE_ENV=production

# Ganti dengan secret key random (bisa generate di: https://generate-secret.vercel.app/)
BETTER_AUTH_SECRET=ganti-dengan-random-string-panjang

# Ganti dengan domain Anda
BETTER_AUTH_URL=https://yourdomain.com

# Nomor WhatsApp admin (format: 628xxx)
ADMIN_WHATSAPP_CS=6281234567890
ADMIN_WHATSAPP_KASIR=6281234567891
```

Simpan: `Ctrl + O`, Enter, `Ctrl + X`

### Step 5.3: Build Docker Images
```bash
docker-compose build
```
⏱️ Proses ini memakan waktu 5-10 menit tergantung kecepatan server.

### Step 5.4: Jalankan Containers
```bash
docker-compose up -d
```

### Step 5.5: Cek Status
```bash
docker-compose ps
```

Output yang diharapkan:
```
NAME                 STATUS              PORTS
wamarket-backend     Up                  0.0.0.0:3000->3000/tcp
wamarket-db          Up (healthy)        0.0.0.0:5432->5432/tcp
wamarket-frontend    Up                  80/tcp
wamarket-nginx       Up                  0.0.0.0:80->80/tcp
```

### Step 5.6: Test Aplikasi
```bash
# Test health endpoint
curl http://localhost/api/health
```

Harus return: `{"status":"ok",...}`

Buka browser: `http://IP_SERVER_ANDA` - aplikasi harus tampil!

---

## 6. Setup Database

### Step 6.1: Push Schema ke Database
```bash
docker-compose exec backend npx drizzle-kit push
```

Ketik `yes` jika diminta konfirmasi.

### Step 6.2: (Optional) Jalankan Seed Data
```bash
docker-compose exec backend npx tsx src/db/seed.ts
```

---

## 7. Setup Cloudflare Zero Trust

### Step 7.1: Persiapan di Cloudflare
1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih domain Anda
3. Klik **Zero Trust** di sidebar
4. Klik **Networks** → **Tunnels**
5. Klik **Create a tunnel**

### Step 7.2: Install cloudflared di Server
```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Pindahkan ke /usr/local/bin
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Beri permission
sudo chmod +x /usr/local/bin/cloudflared

# Verifikasi
cloudflared --version
```

### Step 7.3: Connect Tunnel
Di halaman Cloudflare setelah create tunnel, akan muncul command seperti:
```bash
sudo cloudflared service install eyJhIjoixxxxxxxx...
```

Copy dan jalankan command tersebut di server.

### Step 7.4: Konfigurasi Route
1. Di halaman tunnel Cloudflare, klik **Configure**
2. Di bagian **Public Hostname**, tambahkan:
   - **Subdomain**: (kosongkan untuk root domain, atau isi subdomain)
   - **Domain**: pilih domain Anda
   - **Type**: HTTP
   - **URL**: `localhost:8080`
3. Klik **Save**

### Step 7.5: Verifikasi
Tunggu 1-2 menit, lalu akses:
`https://yourdomain.com`

🎉 Selesai! Aplikasi sudah bisa diakses via HTTPS!

> [!NOTE]
> Kami menggunakan port **8080** untuk Docker agar tidak bentrok dengan Nginx bawaan aaPanel yang menggunakan port 80.

---

## 8. Troubleshooting

### Container tidak mau start
```bash
# Lihat logs
docker-compose logs backend
docker-compose logs frontend

# Restart
docker-compose restart
```

### Database error
```bash
# Cek koneksi database
docker-compose exec postgres psql -U tokoindo -d tokoindo -c "SELECT 1"

# Restart database
docker-compose restart postgres
```

### Port 80 sudah digunakan
```bash
# Cek siapa yang pakai port 80
sudo lsof -i :80

# Jika Nginx bawaan aaPanel, stop dulu
sudo systemctl stop nginx

# Atau edit docker-compose.yml, ganti port 80 ke 8080
# lalu akses via http://IP:8080
```

### Update aplikasi
```bash
cd /www/wwwroot/wa-market
git pull
docker-compose build
docker-compose up -d
```

### Reset semua (HATI-HATI: data akan hilang!)
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx drizzle-kit push
```

---

## 📞 Bantuan

Jika mengalami masalah:
1. Cek logs: `docker-compose logs -f`
2. Pastikan port 80 tidak diblokir firewall
3. Pastikan domain sudah pointing ke IP server

---

## 🔄 Perintah Berguna

| Perintah | Fungsi |
|----------|--------|
| `docker-compose ps` | Lihat status containers |
| `docker-compose logs -f` | Lihat logs realtime |
| `docker-compose restart` | Restart semua services |
| `docker-compose down` | Stop semua services |
| `docker-compose up -d` | Start semua services |
| `docker-compose build` | Build ulang images |
