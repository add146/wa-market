#!/bin/bash

# ==========================================
# Script Setup Toko Baru - WA Market
# ==========================================
# Jalankan: sudo bash setup-toko.sh
# ==========================================

set -e

echo ""
echo "🏪 === SETUP TOKO BARU WA MARKET ==="
echo ""

# Input dari user
read -p "📛 Nama Toko (contoh: Toko Berkah): " STORE_NAME
read -p "🌐 Domain (contoh: tokoberkah.com): " DOMAIN
read -p "📁 Nama folder (contoh: tokoberkah): " FOLDER_NAME
read -p "🔢 Port Backend (contoh: 3001): " BACKEND_PORT
read -p "🔢 Port Frontend (contoh: 8081): " FRONTEND_PORT
read -p "🔢 Port Database (contoh: 5433): " DB_PORT
read -p "📱 WhatsApp Admin (contoh: 628123456789): " WHATSAPP
read -p "📧 Email Admin (contoh: admin@tokoberkah.com): " ADMIN_EMAIL
read -sp "🔑 Password Admin: " ADMIN_PASSWORD
echo ""

# Generate random secrets
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 48)
DB_NAME="${FOLDER_NAME}_db"

echo ""
echo "📋 Konfigurasi:"
echo "   Nama Toko    : $STORE_NAME"
echo "   Domain       : $DOMAIN"
echo "   Folder       : /var/www/$FOLDER_NAME"
echo "   Backend Port : $BACKEND_PORT"
echo "   Frontend Port: $FRONTEND_PORT"
echo "   Database     : $DB_NAME (port $DB_PORT)"
echo ""
read -p "Lanjutkan? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Dibatalkan."
    exit 0
fi

echo ""
echo "🚀 Memulai setup..."

# 1. Clone repository
echo ""
echo "📥 [1/7] Clone repository..."
cd /var/www
if [ -d "$FOLDER_NAME" ]; then
    echo "   ⚠️  Folder sudah ada, skip clone"
else
    git clone https://github.com/nicofraternali/wa-market.git "$FOLDER_NAME"
fi
cd "$FOLDER_NAME"

# 2. Buat file .env backend
echo "⚙️  [2/7] Membuat konfigurasi backend..."
cat > apps/server/.env << EOF
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
PORT=3000
NODE_ENV=production
EOF

# 3. Buat file .env frontend
echo "⚙️  [3/7] Membuat konfigurasi frontend..."
cat > apps/web/.env << EOF
VITE_API_URL=https://${DOMAIN}/api
EOF

# 4. Update docker-compose.yml
echo "🐳 [4/7] Membuat docker-compose.yml..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: ${FOLDER_NAME}-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - ${FOLDER_NAME}_pgdata:/var/lib/postgresql/data
    ports:
      - "${DB_PORT}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: ${FOLDER_NAME}-backend
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "${BACKEND_PORT}:3000"
    volumes:
      - ${FOLDER_NAME}_uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        VITE_API_URL: https://${DOMAIN}/api
    container_name: ${FOLDER_NAME}-frontend
    ports:
      - "${FRONTEND_PORT}:80"
    restart: unless-stopped

volumes:
  ${FOLDER_NAME}_pgdata:
  ${FOLDER_NAME}_uploads:
EOF

# 5. Build dan jalankan Docker
echo "🏗️  [5/7] Build dan jalankan Docker containers..."
docker compose up -d --build

# Wait for database
echo "   ⏳ Menunggu database siap..."
sleep 10

# 6. Setup database dan admin
echo "👤 [6/7] Setup database dan admin user..."

# Run migration
docker compose exec -T backend npx drizzle-kit push --force 2>/dev/null || echo "   Migration mungkin sudah ada"

# Hash password dengan bcrypt (menggunakan node di container)
HASHED_PASSWORD=$(docker compose exec -T backend node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('${ADMIN_PASSWORD}', 10).then(hash => console.log(hash));
" 2>/dev/null)

# Insert admin user dan store settings
docker compose exec -T db psql -U postgres -d "${DB_NAME}" << EOSQL
-- Insert admin user
INSERT INTO users (id, name, email, password, phone, role, is_verified, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Admin',
    '${ADMIN_EMAIL}',
    '${HASHED_PASSWORD}',
    '${WHATSAPP}',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert store settings
INSERT INTO store_settings (id, key, value, description, updated_at)
VALUES 
    (gen_random_uuid(), 'store_name', '${STORE_NAME}', 'Nama toko', NOW()),
    (gen_random_uuid(), 'whatsapp_kasir', '${WHATSAPP}', 'WhatsApp kasir', NOW()),
    (gen_random_uuid(), 'whatsapp_cs', '${WHATSAPP}', 'WhatsApp CS', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
EOSQL

# 7. Buat konfigurasi Nginx
echo "🌐 [7/7] Membuat konfigurasi Nginx..."
cat > /etc/nginx/sites-available/${DOMAIN} << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL akan diisi oleh certbot
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/uploads;
    }
}
EOF

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "✅ =========================================="
echo "   SETUP TOKO SELESAI!"
echo "============================================"
echo ""
echo "📋 Informasi Toko:"
echo "   Nama      : $STORE_NAME"
echo "   Domain    : https://${DOMAIN}"
echo "   Admin     : $ADMIN_EMAIL"
echo "   Folder    : /var/www/$FOLDER_NAME"
echo ""
echo "📌 Langkah selanjutnya:"
echo "   1. Pastikan domain sudah pointing ke server"
echo "   2. Jalankan SSL: sudo certbot --nginx -d ${DOMAIN}"
echo "   3. Buka https://${DOMAIN}/admin dan login"
echo ""
echo "🔧 Perintah berguna:"
echo "   cd /var/www/${FOLDER_NAME}"
echo "   docker compose logs -f"
echo "   docker compose restart"
echo ""
