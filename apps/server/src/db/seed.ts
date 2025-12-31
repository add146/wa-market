import { db } from './index';
import {
    users,
    categories,
    products,
    shippingOptions,
    storeSettings,
    coupons
} from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Starting database seed...');

    // ============================================
    // 1. Create Admin User
    // ============================================
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const [adminUser] = await db.insert(users).values({
        phone: '6281234567890',
        password: hashedPassword,
        name: 'Admin TokoIndo',
        role: 'admin',
    }).onConflictDoNothing().returning();

    console.log('✅ Admin user created:', adminUser?.phone || 'already exists');

    // ============================================
    // 2. Create Store Settings
    // ============================================
    console.log('Creating store settings...');

    const settingsData = [
        // WhatsApp Contacts
        { key: 'whatsapp_cs', value: '6281234567890', description: 'No. WhatsApp Customer Service (untuk tanya produk)' },
        { key: 'whatsapp_kasir', value: '6281234567891', description: 'No. WhatsApp Kasir (untuk pembelian/order)' },
        { key: 'store_name', value: 'TokoIndo', description: 'Nama toko' },

        // Logo & Branding
        { key: 'logo_url', value: '/images/logo.png', description: 'URL Logo Toko' },
        { key: 'favicon_url', value: '/images/favicon.ico', description: 'URL Favicon' },

        // Theme Colors
        { key: 'theme_primary', value: '#3b82f6', description: 'Warna Primer (tombol utama, link)' },
        { key: 'theme_secondary', value: '#64748b', description: 'Warna Sekunder' },
        { key: 'theme_accent', value: '#f59e0b', description: 'Warna Aksen (badge, highlight)' },
        { key: 'theme_background', value: '#ffffff', description: 'Warna Background' },
        { key: 'theme_text', value: '#1e293b', description: 'Warna Teks Utama' },
    ];

    for (const setting of settingsData) {
        await db.insert(storeSettings).values(setting).onConflictDoNothing();
    }
    console.log('✅ Store settings created');

    // ============================================
    // 3. Create Categories
    // ============================================
    console.log('Creating categories...');

    const categoriesData = [
        { slug: 'electronics', name: 'Elektronik', icon: 'devices' },
        { slug: 'fashion-pria', name: 'Fashion Pria', icon: 'styler' },
        { slug: 'fashion-wanita', name: 'Fashion Wanita', icon: 'woman' },
        { slug: 'makanan', name: 'Makanan & Minuman', icon: 'restaurant' },
        { slug: 'hobi', name: 'Hobi & Mainan', icon: 'sports_esports' },
        { slug: 'rumah-tangga', name: 'Rumah Tangga', icon: 'home' },
        { slug: 'jam-tangan', name: 'Jam Tangan', icon: 'watch' },
        { slug: 'tas-travel', name: 'Tas & Travel', icon: 'luggage' },
        { slug: 'gadget', name: 'Gadget', icon: 'smartphone' },
        { slug: 'aksesoris-komputer', name: 'Aksesoris Komputer', icon: 'keyboard' },
    ];

    for (const category of categoriesData) {
        await db.insert(categories).values(category).onConflictDoNothing();
    }
    console.log('✅ Categories created');

    // ============================================
    // 4. Create Shipping Options
    // ============================================
    console.log('Creating shipping options...');

    const shippingData = [
        {
            name: 'JNE REG',
            type: 'api',
            courierCode: 'jne',
            serviceCode: 'REG',
            estimation: '2-3 hari',
            sortOrder: 1
        },
        {
            name: 'SiCepat REG',
            type: 'api',
            courierCode: 'sicepat',
            serviceCode: 'REG',
            estimation: '1-2 hari',
            sortOrder: 2
        },
        {
            name: 'Ongkir Flat Jawa',
            type: 'fixed',
            fixedCost: 15000,
            estimation: '3-5 hari',
            sortOrder: 3
        },
        {
            name: 'Ongkir Flat Luar Jawa',
            type: 'fixed',
            fixedCost: 25000,
            estimation: '5-7 hari',
            sortOrder: 4
        },
        {
            name: 'Gratis Ongkir (Min. Rp 500.000)',
            type: 'free',
            minPurchaseForFree: 500000,
            estimation: '5-7 hari',
            sortOrder: 5
        },
    ];

    for (const shipping of shippingData) {
        await db.insert(shippingOptions).values(shipping).onConflictDoNothing();
    }
    console.log('✅ Shipping options created');

    // ============================================
    // 5. Create Sample Coupons
    // ============================================
    console.log('Creating sample coupons...');

    const couponsData = [
        {
            code: 'DISKON10',
            discountType: 'percentage',
            discountValue: 10,
            minPurchase: 100000,
            maxDiscount: 50000,
            usageLimit: 100,
        },
        {
            code: 'DISKON50',
            discountType: 'fixed',
            discountValue: 50000,
            minPurchase: 300000,
        },
        {
            code: 'NEWYEAR2025',
            discountType: 'percentage',
            discountValue: 25,
            minPurchase: 200000,
            maxDiscount: 100000,
            usageLimit: 50,
        },
    ];

    for (const coupon of couponsData) {
        await db.insert(coupons).values(coupon).onConflictDoNothing();
    }
    console.log('✅ Sample coupons created');

    // ============================================
    // 6. Create Sample Products
    // ============================================
    console.log('Creating sample products...');

    // Get category IDs
    const allCategories = await db.select().from(categories);
    const getCategoryId = (slug: string) => allCategories.find(c => c.slug === slug)?.id;

    const productsData = [
        {
            name: 'Kemeja Batik Modern Slim Fit Lengan Panjang',
            slug: 'kemeja-batik-modern-slim-fit',
            description: 'Kemeja batik modern dengan potongan slim fit yang elegan.',
            categoryId: getCategoryId('fashion-pria'),
            price: 112500,
            originalPrice: 150000,
            discount: 25,
            stock: 50,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3_1jZ8XkC9---tzNRTFpVoWQQWsdi2x3vENZLYb6QMqe74mz3RSTVO2q8l39tEK6d0dAMRv_FtZ_EXhvJj_hoBVj1nwuAtA5fIU384_8wPD3OF38VIpTHx63GrKoPG6Aipnmc8OKtLNC6qbV8optUlMN2yKUrkJk7_qrhsCEPGa9rt0VTPhVG0Wk4bJQ-ApEQ0SKxop8nl2Uv3uzRNqHzLoyPeJLrkqx3uQjPfTyaL43uXigmyDfONe2e5yb3WTRCAZdNBTmKWRGZ',
            imageAlt: 'Modern Batik shirt for men',
        },
        {
            name: 'Headphone Wireless Noise Cancelling Bass Boost',
            slug: 'headphone-wireless-noise-cancelling',
            description: 'Headphone wireless dengan fitur noise cancelling dan bass boost.',
            categoryId: getCategoryId('electronics'),
            price: 450000,
            originalPrice: 520000,
            discount: 15,
            stock: 30,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6UYH2H33i_j_PVcWRCtl8aihzR5yW940zmBjUZHb_uUCekRTCXa55X8vAlSQfCPN1cdyqHbXzmWk60GAHKOmD-0vkHf_bjbvnpjFy0DRcPqKsnB-Zk2-1KScUjJtCbtu3iLcDlorFAzIro6k93fb2swQJeHPOaK6Dq7lZnW-niLjRxzBPSeNa9Iv2cl_jkq-8TXZjsrLYfYsEBEsVDVlGmt7pYhXyh-vLaB3-AN3T3HKa9fiujkhclI_0tT7RZZPom2Tdpd1y_ASu',
            imageAlt: 'Wireless noise cancelling headphones',
        },
        {
            name: 'Mechanical Keyboard RGB Blue Switch 60% Layout',
            slug: 'mechanical-keyboard-rgb-blue-switch',
            description: 'Keyboard mechanical dengan switch blue dan RGB lighting.',
            categoryId: getCategoryId('aksesoris-komputer'),
            price: 350000,
            stock: 25,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyQAuo9Eu8MV2_op0DA1MhB-B_-R8grygovSQYt9M2Ze1HjpJ5EeGtmexxcEeysgvwJ4LEk_CVAfXTxpigY9KvKI0Uoj_JfZ6dgeo0IQtYOhtP3gAbUGLi_yLxbUybUcNSULH_-SoMhOchMaoY2R6A7wFJTKCkvE_ov7ipwzkHSd4oPvUt13vA9t3koLlHxTECVn2dHOBehz7rs5HLihzajTYs5TgAJRPkKvSFOUh7pq2qmPZ-s0-4gJe1hxyT3DdsBq6cXPxKYbDl',
            imageAlt: 'Mechanical keyboard on desk',
        },
        {
            name: 'Jam Tangan Pria Kulit Asli Waterproof',
            slug: 'jam-tangan-pria-kulit-asli',
            description: 'Jam tangan pria dengan tali kulit asli, waterproof.',
            categoryId: getCategoryId('jam-tangan'),
            price: 199000,
            originalPrice: 400000,
            discount: 50,
            stock: 15,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkaf0jY2AxcQ8SkZNZ7TmnxXma7jWQwTK-ePgJ1sMhSUy9PTUgZEzZvGlGuXafZVLbk2MbmeVsZexdh09NiduMfkasGIAQWXpUIh_xSkMFTSDhwN1YzZhlFf-xMK43RdxcmGi1R_zxAU4Ml6l6_xSskImKo31d9I8F9ArazRAIR0ycRh5nFrjzJcwjOJvk-g5fNU7HZODCjHi5LJG2ZEbgAHWsLe_EJsDZGfCe-7KUbXooPAmBSGhpuY3obGL65OOt333zAXuD5CqN',
            imageAlt: 'Analog watch on wrist',
        },
        {
            name: 'Sneaker Sport Running Casual Light Grey',
            slug: 'sneaker-sport-running-casual',
            description: 'Sneaker sport untuk running dengan desain casual.',
            categoryId: getCategoryId('fashion-pria'),
            price: 280000,
            stock: 40,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqsDh6p_Y0G4aNctPw2eOzuB4F3mkp7vAuQmlm0STYSI54Exh9Y53sKh51TIkkS45oqda9C4OjL4jIu6VaqFcc_fR_RXyv3WseyAkqKn-axnurAm7a78zW2agggoncrO7pbKCH3MeoD_Lz3z5LznvnQoJhuJ9DQPipaTVfY5oTcYIsmZ7S-T2TSMcZX-DRUr5qn9Y9A9O-SXTGI81HMZEEiaH0iW5Ru1LD6-6o8EF1oQMuldyboGWeIwSWNjHtP0KCvdsREHL8v1vZ',
            imageAlt: 'Modern sneaker shoe floating',
        },
    ];

    for (const product of productsData) {
        await db.insert(products).values(product).onConflictDoNothing();
    }
    console.log('✅ Sample products created');

    console.log('');
    console.log('🎉 Database seeding completed!');
    console.log('');
    console.log('📝 Admin Login:');
    console.log('   Phone: 6281234567890');
    console.log('   Password: admin123');
    console.log('');

    process.exit(0);
}

seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
