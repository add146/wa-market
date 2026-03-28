-- Seed categories for khibroh-studio
INSERT INTO categories (id, store_id, slug, name, icon, description) VALUES
('cat-makanan', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'makanan', 'Makanan', 'lunch_dining', 'Aneka makanan ringan dan berat'),
('cat-minuman', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'minuman', 'Minuman', 'local_cafe', 'Minuman segar dan kemasan'),
('cat-bumbu', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'bumbu-dapur', 'Bumbu Dapur', 'soup_kitchen', 'Bumbu masak dan rempah'),
('cat-kebersihan', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'kebersihan', 'Kebersihan', 'cleaning_services', 'Produk kebersihan rumah tangga');

-- Seed products for khibroh-studio
INSERT INTO products (id, store_id, name, slug, description, category_id, price, original_price, discount, stock, weight, is_active) VALUES
('prod-001', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Indomie Goreng Original', 'indomie-goreng-original', 'Mi goreng instant rasa original yang legendaris. Cocok untuk semua suasana!', 'cat-makanan', 3500, 4000, 12, 150, 85, 1),
('prod-002', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Teh Botol Sosro 450ml', 'teh-botol-sosro-450ml', 'Teh manis dalam kemasan botol plastik, segar dan nikmat.', 'cat-minuman', 5000, NULL, NULL, 80, 500, 1),
('prod-003', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Beras Premium 5kg', 'beras-premium-5kg', 'Beras pulen kualitas premium, cocok untuk nasi sehari-hari.', 'cat-makanan', 68000, 75000, 9, 30, 5000, 1),
('prod-004', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Kecap Manis ABC 600ml', 'kecap-manis-abc-600ml', 'Kecap manis khas Indonesia untuk masakan lezat.', 'cat-bumbu', 18500, 20000, 7, 45, 650, 1),
('prod-005', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Minyak Goreng Bimoli 2L', 'minyak-goreng-bimoli-2l', 'Minyak goreng sawit berkualitas untuk menggoreng sempurna.', 'cat-bumbu', 32000, 35000, 8, 25, 2000, 1),
('prod-006', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Sabun Cuci Rinso 800gr', 'sabun-cuci-rinso-800gr', 'Detergen bubuk anti noda untuk cucian bersih dan wangi.', 'cat-kebersihan', 22000, 25000, 12, 40, 850, 1),
('prod-007', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Aqua Botol 600ml (Pack 6)', 'aqua-botol-600ml-pack-6', 'Air mineral berkualitas dalam kemasan botol, isi 6 botol.', 'cat-minuman', 15000, NULL, NULL, 60, 3800, 1),
('prod-008', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Gula Pasir 1kg', 'gula-pasir-1kg', 'Gula pasir putih berkualitas untuk kebutuhan dapur.', 'cat-bumbu', 16000, 18000, 11, 50, 1050, 1),
('prod-009', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Susu Ultra Milk 1L Coklat', 'susu-ultra-milk-1l-coklat', 'Susu UHT rasa coklat, kaya nutrisi untuk keluarga.', 'cat-minuman', 18000, 20000, 10, 35, 1100, 1),
('prod-010', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Sunlight Pencuci Piring 800ml', 'sunlight-pencuci-piring-800ml', 'Sabun cuci piring dengan formula anti lemak yang powerful.', 'cat-kebersihan', 14000, 16000, 12, 55, 850, 1),
('prod-011', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Telur Ayam 1kg', 'telur-ayam-1kg', 'Telur ayam negeri segar, kualitas terjamin.', 'cat-makanan', 28000, 30000, 6, 20, 1100, 1),
('prod-012', '49de4d0f-8c9c-4050-b2fe-2943a16d2f7a', 'Chitato Sapi Panggang 68gr', 'chitato-sapi-panggang-68gr', 'Keripik kentang renyah rasa sapi panggang.', 'cat-makanan', 12000, NULL, NULL, 70, 80, 1);
