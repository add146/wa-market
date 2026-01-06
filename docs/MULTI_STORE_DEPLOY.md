# Panduan Deploy Toko Baru

Dokumentasi untuk membuat instance toko baru dengan domain, user, dan database terpisah.

---

## 1. Persiapan Server

### Requirement:
- Server Linux (Ubuntu 20.04+)
- Docker & Docker Compose V2
- Nginx (untuk reverse proxy)
- Domain yang sudah pointing ke server

---

## 2. Clone Repository

```bash
cd /var/www
git clone https://github.com/USERNAME/wa-market.git tokobaru
cd tokobaru
```

---

## 3. Konfigurasi Environment

### 3.1 Backend (.env)

Buat file `apps/server/.env`:

```bash
nano apps/server/.env
```

```env
# Database - GANTI NAMA DATABASE
DATABASE_URL=postgresql://postgres:PASSWORD@db:5432/tokobaru_db

# JWT Secret - GANTI DENGAN RANDOM STRING
JWT_SECRET=random_secret_key_untuk_tokobaru_123456

# Port
PORT=3000

# RajaOngkir (opsional)
RAJAONGKIR_API_KEY=your_api_key
RAJAONGKIR_TYPE=starter
```

### 3.2 Frontend (.env)

Buat file `apps/web/.env`:

```bash
nano apps/web/.env
```

```env
# API URL - sesuaikan dengan domain
VITE_API_URL=https://tokobaru.com/api
```

---

## 4. Konfigurasi Docker Compose

Edit `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: tokobaru-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: PASSWORD_AMAN
      POSTGRES_DB: tokobaru_db
    volumes:
      - tokobaru_pgdata:/var/lib/postgresql/data
    ports:
      - "5433:5432"  # Port berbeda untuk setiap toko
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: tokobaru-backend
    environment:
      DATABASE_URL: postgresql://postgres:PASSWORD_AMAN@db:5432/tokobaru_db
      JWT_SECRET: random_secret_untuk_tokobaru
      NODE_ENV: production
    ports:
      - "3001:3000"  # Port berbeda untuk setiap toko
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: tokobaru-frontend
    ports:
      - "8081:80"  # Port berbeda untuk setiap toko

volumes:
  tokobaru_pgdata:
```

### Port Mapping (Contoh untuk multi-toko):

| Toko | DB Port | Backend Port | Frontend Port |
|------|---------|--------------|---------------|
| Toko A | 5432 | 3000 | 8080 |
| Toko B | 5433 | 3001 | 8081 |
| Toko C | 5434 | 3002 | 8082 |

---

## 5. Build dan Jalankan

```bash
# Build dan jalankan semua service
sudo docker compose up -d --build

# Cek status
sudo docker compose ps

# Lihat logs
sudo docker compose logs -f backend
```

---

## 6. Konfigurasi Nginx (Reverse Proxy)

### 6.1 Buat Konfigurasi Nginx

```bash
sudo nano /etc/nginx/sites-available/tokobaru.com
```

```nginx
server {
    listen 80;
    server_name tokobaru.com www.tokobaru.com;

    # Redirect ke HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tokobaru.com www.tokobaru.com;

    # SSL Certificate (gunakan aaPanel atau Certbot)
    ssl_certificate /etc/letsencrypt/live/tokobaru.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tokobaru.com/privkey.pem;

    # Upload size limit
    client_max_body_size 50M;

    # Frontend (port sesuai docker-compose)
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://127.0.0.1:3001/uploads;
    }
}
```

### 6.2 Aktifkan Site

```bash
sudo ln -s /etc/nginx/sites-available/tokobaru.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.3 SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d tokobaru.com -d www.tokobaru.com
```

---

## 7. Setup Database & Admin User

### 7.1 Migrasi Database

```bash
# Masuk ke container backend
sudo docker compose exec backend sh

# Jalankan migrasi
npx drizzle-kit push

# Keluar
exit
```

### 7.2 Buat Admin User

Gunakan API atau masuk langsung ke database:

```bash
# Masuk ke container database
sudo docker compose exec db psql -U postgres -d tokobaru_db

# Insert admin user (password di-hash dengan bcrypt)
INSERT INTO users (id, name, email, password, phone, role)
VALUES (
  gen_random_uuid(),
  'Admin Toko',
  'admin@tokobaru.com',
  '$2b$10$hashedpassword...',  -- Hash password dengan bcrypt
  '628123456789',
  'admin'
);

# Keluar
\q
```

**Atau** daftar via website lalu update role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@tokobaru.com';
```

---

## 8. Konfigurasi Toko

Setelah login sebagai admin:

1. Buka **Admin → Pengaturan**
2. Isi:
   - **Nama Toko**: Toko Baru
   - **Tagline**: Belanja mudah dan murah
   - **WhatsApp Kasir**: 628123456789
   - **Logo** dan **Banner**

---

## 9. Checklist Deploy

- [ ] Clone repository ke folder baru
- [ ] Buat file `.env` untuk backend dan frontend
- [ ] Update `docker-compose.yml` dengan port berbeda
- [ ] Build dan jalankan Docker containers
- [ ] Konfigurasi Nginx reverse proxy
- [ ] Setup SSL certificate
- [ ] Jalankan migrasi database
- [ ] Buat user admin
- [ ] Login dan setup pengaturan toko

---

## 10. Maintenance

### Backup Database

```bash
sudo docker compose exec db pg_dump -U postgres tokobaru_db > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup.sql | sudo docker compose exec -T db psql -U postgres tokobaru_db
```

### Update Kode

```bash
git pull
sudo docker compose up -d --build
```

---

## 11. Troubleshooting

### Error 502 Bad Gateway
```bash
# Cek backend running
sudo docker compose ps
sudo docker compose logs backend --tail 50
```

### Error Database Connection
```bash
# Cek database running
sudo docker compose logs db
# Pastikan DATABASE_URL benar
```

### Error ContainerConfig
```bash
# Cleanup dan rebuild
sudo docker compose down
sudo docker system prune -af
sudo docker compose up -d --build
```

---

## Struktur Multi-Toko

```
/var/www/
├── tokoa/           # Domain: tokoa.com
│   ├── docker-compose.yml (port 3000, 8080)
│   └── ...
├── tokob/           # Domain: tokob.com
│   ├── docker-compose.yml (port 3001, 8081)
│   └── ...
└── tokoc/           # Domain: tokoc.com
    ├── docker-compose.yml (port 3002, 8082)
    └── ...
```

Setiap toko memiliki:
- Database sendiri
- Container Docker sendiri
- Port terpisah
- Domain terpisah

---

**Selesai!** 🎉

Dokumentasi ini memungkinkan Anda membuat toko baru dengan konfigurasi terpisah.
