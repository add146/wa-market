import { Hono } from 'hono';
import { getDb } from '../db';
import { stores, users, storeSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, superadminMiddleware, authMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// GET /api/stores/:slug
// Public store info
router.get('/:slug', async (c) => {
    try {
        const db = getDb(c.env);
        const slug = c.req.param('slug');
        const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
        
        if (!store) return c.json({ error: 'Store not found' }, 404);
        
        // Also get some public settings like name, logo, theme
        const settings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const settingsObj: Record<string, string> = {};
        for (const s of settings) {
            settingsObj[s.key] = s.value;
        }

        return c.json({
            id: store.id,
            slug: store.slug,
            name: store.name,
            createdAt: store.createdAt,
            settings: settingsObj
        });
    } catch (e) {
        return c.json({ error: 'Failed to fetch store' }, 500);
    }
});

// GET /api/stores/:slug/check
// Check if slug is available
router.get('/:slug/check', async (c) => {
    try {
        const db = getDb(c.env);
        const slug = c.req.param('slug');
        
        // basic format check
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
            return c.json({ available: false, error: 'Invalid slug format' });
        }
        
        const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
        return c.json({ available: !store });
    } catch (e) {
        return c.json({ error: 'Failed to check slug' }, 500);
    }
});

// POST /api/stores/register
// Register new store (Public)
router.post('/register', async (c) => {
    try {
        const db = getDb(c.env);
        const body = await c.req.json();
        const { storeName, slug, adminName, adminPhone, adminPassword } = body;

        if (!storeName || !slug || !adminName || !adminPhone || !adminPassword) {
            return c.json({ error: 'All fields are required' }, 400);
        }

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return c.json({ error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' }, 400);
        }

        // Check if slug exists
        const [existingStore] = await db.select().from(stores).where(eq(stores.slug, slug));
        if (existingStore) {
            return c.json({ error: 'Slug is already taken' }, 400);
        }

        // Create store
        const [newStore] = await db.insert(stores).values({
            name: storeName,
            slug: slug,
            ownerPhone: adminPhone,
            plan: 'free',
            isActive: 1
        }).returning();

        // Check if phone available globally for superadmin? No, just globally inside the same store
        // We know it's a new store so the phone is available in this store
        
        // Create Admin user
        const hashedPassword = await hashPassword(adminPassword);
        const [adminUser] = await db.insert(users).values({
            storeId: newStore.id,
            phone: adminPhone,
            name: adminName,
            password: hashedPassword,
            role: 'admin'
        }).returning();

        // Setup default store settings
        const defaultSettings = [
            { storeId: newStore.id, key: 'store_name', value: storeName, description: 'Nama Toko' },
            { storeId: newStore.id, key: 'store_tagline', value: 'Toko Online WhatsApp', description: 'Tagline' },
            { storeId: newStore.id, key: 'whatsapp_cs', value: adminPhone, description: 'WA CS' },
            { storeId: newStore.id, key: 'whatsapp_kasir', value: adminPhone, description: 'WA Kasir' },
            { storeId: newStore.id, key: 'theme_primary', value: '#10b981', description: 'Warna utama' },
            { storeId: newStore.id, key: 'theme_accent', value: '#f97316', description: 'Warna aksen' },
        ];
        
        await db.insert(storeSettings).values(defaultSettings);

        return c.json({ 
            message: 'Store registered successfully', 
            store: newStore 
        }, 201);
    } catch (e) {
        console.error('Registration error:', e);
        return c.json({ error: 'Failed to register store' }, 500);
    }
});

// GET /api/stores (Superadmin)
router.get('/', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const allStores = await db.select().from(stores);
        return c.json(allStores);
    } catch (e) {
        return c.json({ error: 'Failed' }, 500);
    }
});

export default router;
