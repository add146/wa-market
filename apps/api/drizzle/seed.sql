-- Seed initial test store
INSERT OR IGNORE INTO stores (id, slug, name, plan, owner_phone, is_active, created_at) VALUES
  ('store-test-1', 'tokoindo', 'Toko Indo', 'pro', '628000000000', 1, unixepoch());

-- Seed admin user (password: admin123)
-- bcrypt hash of 'admin123' with 10 rounds
INSERT OR IGNORE INTO users (id, store_id, phone, password, name, role, created_at, updated_at) VALUES
  ('admin-1', 'store-test-1', '628000000000', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Admin Toko Indo', 'admin', unixepoch(), unixepoch());

-- Seed initial store settings for 'tokoindo'
INSERT OR IGNORE INTO store_settings (id, store_id, key, value, description, updated_at) VALUES
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'store-test-1', 'store_name', 'Toko Indo', 'Nama toko', unixepoch()),
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'store-test-1', 'store_tagline', 'Belanja aman via WhatsApp', 'Tagline toko', unixepoch()),
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'store-test-1', 'whatsapp_cs', '628000000000', 'Nomor WhatsApp CS', unixepoch()),
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'store-test-1', 'whatsapp_kasir', '628000000000', 'Nomor WhatsApp Kasir', unixepoch()),
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'store-test-1', 'theme_primary', '#10b981', 'Warna utama', unixepoch()),
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'store-test-1', 'theme_accent', '#f97316', 'Warna aksen', unixepoch());
