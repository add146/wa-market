import { Hono } from 'hono';
import { getDb } from '../db';
import { storeSettings } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any } }>();

/**
 * GET /api/s/:slug/settings
 * Public config
 */
router.get('/', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const settings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        
        // Hide sensitive keys from public endpoint
        const publicKeys = [
            'store_name', 'store_tagline', 'whatsapp_cs', 'whatsapp_kasir', 
            'logo_url', 'favicon_url', 'theme_primary', 
            'theme_secondary', 'theme_accent', 'theme_background', 'theme_text',
            // Banner keys
            'banner1_image', 'banner1_badge', 'banner1_title', 'banner1_desc',
            'banner2_image', 'banner2_label', 'banner2_promo',
            'banner3_image', 'banner3_label', 'banner3_promo',
            // Store GPS & Delivery Radius & Cost
            'store_lat', 'store_lng', 'store_delivery_radius', 'store_delivery_cost',
            // Delivery Schedule
            'delivery_schedule', 'delivery_hours_after_payment',
            // RajaOngkir / Komerce Settings (Public)
            'rajaongkir_enabled', 'rajaongkir_tier',
            // Checkout-visible settings
            'unique_code_enabled', 'payment_gateway_enabled', 'payment_provider'
        ];
        
        const settingsObject: Record<string, string> = {};
        for (const setting of settings) {
            if (publicKeys.includes(setting.key)) {
                settingsObject[setting.key] = setting.value;
            }
        }
        
        return c.json(settingsObject);
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * GET /api/s/:slug/settings/admin/all
 * Admin config
 */
router.get('/admin/all', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const settings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        return c.json(settings);
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * PUT /api/s/:slug/settings/:key
 * Update setting
 */
router.put('/:key', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const key = c.req.param('key') as string;
        const { value, description } = await c.req.json();
        
        const [existing] = await db.select().from(storeSettings).where(
            and(eq(storeSettings.key, key), eq(storeSettings.storeId, store.id))
        );
        
        let result;
        if (existing) {
            [result] = await db.update(storeSettings)
                .set({ value, description: description || existing.description, updatedAt: new Date() })
                .where(and(eq(storeSettings.key, key), eq(storeSettings.storeId, store.id)))
                .returning();
        } else {
            [result] = await db.insert(storeSettings).values({
                storeId: store.id,
                key, 
                value, 
                description: description || ''
            }).returning();
        }
        return c.json(result);
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

export default router;
