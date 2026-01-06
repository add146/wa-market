# Panduan Deployment Multi-Toko - WA Market

Panduan untuk deploy **beberapa toko berbeda** di satu server dengan domain berbeda menggunakan Docker + aaPanel + Cloudflare Zero Trust.

---

## 📋 Arsitektur Multi-Toko

```
Server (1 IP)
├── wamarket.khibroh.com    → /www/wwwroot/wamarket.khibroh.com     → Port 8080
├── toko2.khibroh.com       → /www/wwwroot/toko2.khibroh.com        → Port 8081
└── toko3.khibroh.com       → /www/wwwroot/toko3.khibroh.com        → Port 8082
```

Setiap toko memiliki:
- **Database PostgreSQL sendiri** (container terpisah)
- **Backend sendiri** (container terpisah)
- **Frontend sendiri** (container terpisah)
- **Port berbeda** (8080, 8081, 8082, dst)

---

## 🚀 Langkah Instalasi Toko Baru

### 1. Clone Repository

```bash
cd /www/wwwroot
git clone https://github.com/add146/wa-market.git nama-toko-baru
cd nama-toko-baru
```

### 2. Ubah Konfigurasi Port & Container Name

Edit `docker-compose.yml` dan ubah:

| Yang diubah | Toko 1 | Toko 2 | Toko 3 |
|-------------|--------|--------|--------|
| Container prefix | `wamarket-` | `toko2-` | `toko3-` |
| Nginx port | `8080:80` | `8081:80` | `8082:80` |
| Backend port | `3000:3000` | `3001:3000` | `3002:3000` |
| Postgres port | `5432:5432` | `5433:5432` | `5434:5432` |
| Network name | `wamarket-network` | `toko2-network` | `toko3-network` |
| Volume prefix | `wamarket_` | `toko2_` | `toko3_` |

**Contoh docker-compose.yml untuk Toko 2:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: toko2-db          # Ubah nama container
    restart: unless-stopped
    environment:
      POSTGRES_USER: tokoindo
      POSTGRES_PASSWORD: passwordbaru123   # Ubah password!
      POSTGRES_DB: toko2
    ports:
      - "5433:5432"                    # Ubah port host
    volumes:
      - toko2_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tokoindo -d toko2"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - toko2-network

  backend:
    build:
      context: ./apps/server
      dockerfile: Dockerfile
    container_name: toko2-backend      # Ubah nama container
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://tokoindo:passwordbaru123@postgres:5432/toko2
      PORT: 3000
      NODE_ENV: production
    ports:
      - "3001:3000"                    # Ubah port host
    volumes:
      - toko2_uploads_data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - toko2-network

  frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: toko2-frontend     # Ubah nama container
    restart: unless-stopped
    networks:
      - toko2-network

  nginx:
    image: nginx:alpine
    container_name: toko2-nginx        # Ubah nama container
    restart: unless-stopped
    ports:
      - "8081:80"                      # Ubah port host
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - frontend
      - backend
    networks:
      - toko2-network

volumes:
  toko2_postgres_data:                 # Ubah nama volume
  toko2_uploads_data:                  # Ubah nama volume

networks:
  toko2-network:                        # Ubah nama network
    driver: bridge
```

### 3. Build & Jalankan

```bash
sudo docker-compose build
sudo docker-compose up -d
```

### 4. Setup Database

```bash
sudo docker-compose exec backend npx drizzle-kit push
```

### 5. Verifikasi

```bash
# Cek semua container running
docker ps

# Test API
curl http://localhost:8081/api/health
```

---

## 🌐 Setup Cloudflare Zero Trust (Multi-Domain)

### Opsi A: Satu Tunnel, Multiple Hostnames

```yaml
# ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: wamarket.khibroh.com
    service: http://localhost:8080
  - hostname: toko2.khibroh.com
    service: http://localhost:8081
  - hostname: toko3.khibroh.com
    service: http://localhost:8082
  - service: http_status:404
```

Lalu restart cloudflared:
```bash
sudo systemctl restart cloudflared
```

### Opsi B: Via Cloudflare Dashboard

1. Buka **Zero Trust → Networks → Tunnels**
2. Klik tunnel Anda → **Configure**
3. Di bagian **Public Hostnames**, tambah hostname baru:
   - Hostname: `toko2.khibroh.com`
   - Type: HTTP
   - URL: `localhost:8081`
4. Klik **Save**

---

## 📦 Ringkasan Port

| Toko | Domain | Nginx | Backend | PostgreSQL |
|------|--------|-------|---------|------------|
| 1 | wamarket.khibroh.com | 8080 | 3000 | 5432 |
| 2 | toko2.khibroh.com | 8081 | 3001 | 5433 |
| 3 | toko3.khibroh.com | 8082 | 3002 | 5434 |
| N | tokoN.domain.com | 8079+N | 2999+N | 5431+N |

---

## 🔧 Perintah Berguna

```bash
# Lihat semua container running
docker ps

# Lihat logs toko tertentu
cd /www/wwwroot/toko2.khibroh.com
sudo docker-compose logs -f

# Restart toko tertentu
cd /www/wwwroot/toko2.khibroh.com
sudo docker-compose restart

# Update toko tertentu
cd /www/wwwroot/toko2.khibroh.com
git pull
sudo docker-compose up -d --build
```

---

## ⚠️ Tips Penting

1. **Gunakan password database berbeda** untuk setiap toko
2. **Backup database** secara berkala untuk setiap toko
3. **Monitor resource server** jika menjalankan banyak toko (RAM & CPU)
4. **Jangan lupa update** semua toko saat ada security patch
