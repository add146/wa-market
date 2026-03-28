import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { getDb } from '../db';
import { stores, users, orders, products, sessions, courierDeliveries, subscriptions, platformSettings } from '../db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { authMiddleware, superadminMiddleware, createSession, deleteSession, verifyPassword } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// ─────────────────────────────────────
// AUTH (Global, no store scope)
// ─────────────────────────────────────

const standardizePhone = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    cleaned = cleaned.replace(/^\+/, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
    return cleaned;
};

/**
 * POST /api/superadmin/auth/login
 * Global login for superadmin — no store scope needed
 */
router.post('/auth/login', async (c) => {
    try {
        const db = getDb(c.env);
        const body = await c.req.json();
        const { phone, password } = body;

        if (!phone || !password) {
            return c.json({ error: 'Phone and password required' }, 400);
        }

        const cleanPhone = standardizePhone(phone);
        const [user] = await db.select().from(users).where(
            and(eq(users.phone, cleanPhone), eq(users.role, 'superadmin'))
        );

        if (!user || !(await verifyPassword(password, user.password))) {
            return c.json({ error: 'Invalid credentials or not a superadmin' }, 401);
        }

        const token = await createSession(db, user.id);

        setCookie(c, 'session', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60
        });

        return c.json({ message: 'Login successful', user: { id: user.id, phone: user.phone, name: user.name, role: user.role }, token });
    } catch (e) {
        console.error('Superadmin login error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

/**
 * GET /api/superadmin/auth/session
 */
router.get('/auth/session', authMiddleware, superadminMiddleware, async (c) => {
    const user = c.get('user');
    return c.json({ user: { id: user.id, phone: user.phone, name: user.name, role: user.role } });
});

/**
 * POST /api/superadmin/auth/logout
 */
router.post('/auth/logout', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const authHeader = c.req.header('Authorization');
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : getCookie(c, 'session');
        if (token) await deleteSession(db, token);
        deleteCookie(c, 'session');
        return c.json({ message: 'Logged out' });
    } catch (e) {
        return c.json({ error: 'Error' }, 500);
    }
});

// ─────────────────────────────────────
// PLATFORM SETTINGS
// ─────────────────────────────────────

/**
 * GET /api/superadmin/settings
 */
router.get('/settings', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const settingsRaw = await db.select().from(platformSettings);
        const settingsObj: Record<string, string> = {};
        for (const s of settingsRaw) {
            settingsObj[s.key] = s.value;
        }
        return c.json(settingsObj);
    } catch (e) {
        return c.json({ error: 'Failed to fetch settings' }, 500);
    }
});

/**
 * PUT /api/superadmin/settings
 */
router.put('/settings', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const body = await c.req.json();

        // Convert key-value pairs
        for (const [key, value] of Object.entries(body)) {
            if (typeof value === 'string') {
                // Upsert logic (since SQLite on D1 doesn't have an exact ON CONFLICT DO UPDATE built into drizzle without conflict target)
                // Let's do a simple delete then insert or an update fallback
                const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
                if (existing.length > 0) {
                    await db.update(platformSettings).set({ value }).where(eq(platformSettings.key, key));
                } else {
                    await db.insert(platformSettings).values({ key, value });
                }
            }
        }
        return c.json({ message: 'Platform settings updated' });
    } catch (e) {
        return c.json({ error: 'Failed to update settings' }, 500);
    }
});

// ─────────────────────────────────────
// PLATFORM STATS
// ─────────────────────────────────────

/**
 * GET /api/superadmin/stats
 * Platform-wide statistics
 */
router.get('/stats', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);

        const [storeCount] = await db.select({ count: count() }).from(stores);
        const [activeStoreCount] = await db.select({ count: count() }).from(stores).where(eq(stores.isActive, true));
        const [userCount] = await db.select({ count: count() }).from(users).where(
            sql`${users.role} != 'superadmin'`
        );
        const [orderCount] = await db.select({ count: count() }).from(orders);
        const [revenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(${orders.total}), 0)` }).from(orders);

        // New stores this month
        const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
        const [newStoresThisMonth] = await db.select({ count: count() }).from(stores).where(
            sql`${stores.createdAt} > ${thirtyDaysAgo}`
        );

        return c.json({
            totalStores: storeCount.count,
            activeStores: activeStoreCount.count,
            totalUsers: userCount.count,
            totalOrders: orderCount.count,
            totalRevenue: revenueResult.total,
            newStoresThisMonth: newStoresThisMonth.count,
        });
    } catch (e) {
        console.error('Stats error:', e);
        return c.json({ error: 'Failed to fetch stats' }, 500);
    }
});

// ─────────────────────────────────────
// STORE MANAGEMENT
// ─────────────────────────────────────

/**
 * GET /api/superadmin/stores
 * List all stores with enriched data
 */
router.get('/stores', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const allStores = await db.select().from(stores);

        // Enrich each store with counts
        const enriched = await Promise.all(allStores.map(async (store) => {
            const [productCount] = await db.select({ count: count() }).from(products).where(eq(products.storeId, store.id));
            const [orderCountResult] = await db.select({ count: count() }).from(orders).where(eq(orders.storeId, store.id));
            const [userCountResult] = await db.select({ count: count() }).from(users).where(eq(users.storeId, store.id));
            const [revenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(${orders.total}), 0)` }).from(orders).where(eq(orders.storeId, store.id));

            return {
                ...store,
                _stats: {
                    products: productCount.count,
                    orders: orderCountResult.count,
                    users: userCountResult.count,
                    revenue: revenueResult.total,
                }
            };
        }));

        return c.json(enriched);
    } catch (e) {
        console.error('List stores error:', e);
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * PATCH /api/superadmin/stores/:id/plan
 * Update store plan
 */
router.patch('/stores/:id/plan', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const storeId = c.req.param('id');
        const { plan } = await c.req.json();

        const validPlans = ['free', 'starter', 'pro'];
        if (!validPlans.includes(plan)) {
            return c.json({ error: 'Invalid plan. Must be: free, starter, or pro' }, 400);
        }

        const [updated] = await db.update(stores)
            .set({ plan })
            .where(eq(stores.id, storeId as string))
            .returning();

        if (!updated) return c.json({ error: 'Store not found' }, 404);

        return c.json({ message: `Plan updated to ${plan}`, store: updated });
    } catch (e) {
        console.error('Update plan error:', e);
        return c.json({ error: 'Failed to update plan' }, 500);
    }
});

/**
 * PATCH /api/superadmin/stores/:id/domain
 * Update store custom domain
 */
router.patch('/stores/:id/domain', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const storeId = c.req.param('id');
        const { customDomain } = await c.req.json();

        // format domain (e.g. strip http/s)
        let cleanDomain = customDomain ? customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') : null;
        if (cleanDomain === '') cleanDomain = null;

        if (cleanDomain) {
            // Check if domain is already in use by another store
            const [existing] = await db.select().from(stores).where(eq(stores.customDomain, cleanDomain as string));
            if (existing && existing.id !== storeId) {
                return c.json({ error: 'Domain already in use by another store' }, 400);
            }
        }

        const [updated] = await db.update(stores)
            .set({ customDomain: cleanDomain })
            .where(eq(stores.id, storeId as string))
            .returning();

        if (!updated) return c.json({ error: 'Store not found' }, 404);

        return c.json({ message: `Custom domain updated`, store: updated });
    } catch (e) {
        console.error('Update domain error:', e);
        return c.json({ error: 'Failed to update custom domain' }, 500);
    }
});

/**
 * PATCH /api/superadmin/stores/:id/toggle
 * Toggle store active/inactive
 */
router.patch('/stores/:id/toggle', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const storeId = c.req.param('id');

        const [store] = await db.select().from(stores).where(eq(stores.id, storeId as string));
        if (!store) return c.json({ error: 'Store not found' }, 404);

        const newStatus = store.isActive ? 0 : 1;
        const [updated] = await db.update(stores)
            .set({ isActive: newStatus ? true : false })
            .where(eq(stores.id, storeId as string))
            .returning();

        return c.json({ message: `Store ${newStatus ? 'activated' : 'deactivated'}`, store: updated });
    } catch (e) {
        console.error('Toggle store error:', e);
        return c.json({ error: 'Failed to toggle store' }, 500);
    }
});

/**
 * DELETE /api/superadmin/stores/:id
 * Delete store and all its data (cascade)
 */
router.delete('/stores/:id', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const storeId = c.req.param('id');

        const [store] = await db.select().from(stores).where(eq(stores.id, storeId as string));
        if (!store) return c.json({ error: 'Store not found' }, 404);

        // CASCADE delete is handled by DB foreign keys
        await db.delete(stores).where(eq(stores.id, storeId as string));

        return c.json({ message: `Store "${store.name}" deleted successfully` });
    } catch (e) {
        console.error('Delete store error:', e);
        return c.json({ error: 'Failed to delete store' }, 500);
    }
});

// ─────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────

/**
 * GET /api/superadmin/subscriptions
 * List all subscriptions with store info
 */
router.get('/subscriptions', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const allSubs = await db.select().from(subscriptions).orderBy(sql`${subscriptions.createdAt} DESC`);
        
        // Enrich with store name
        const enriched = await Promise.all(allSubs.map(async (sub) => {
            const [store] = await db.select({ name: stores.name, slug: stores.slug }).from(stores).where(eq(stores.id, sub.storeId));
            return {
                ...sub,
                storeName: store?.name || 'Unknown',
                storeSlug: store?.slug || '',
            };
        }));
        
        return c.json(enriched);
    } catch (e) {
        console.error('List subscriptions error:', e);
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * PATCH /api/superadmin/subscriptions/:id/approve
 * Manually approve a subscription (for manual payment)
 */
router.patch('/subscriptions/:id/approve', authMiddleware, superadminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const subId = c.req.param('id') as string;

        const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subId));
        if (!sub) return c.json({ error: 'Subscription not found' }, 404);

        const now = new Date();
        const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        await db.update(subscriptions).set({
            status: 'paid',
            paidAt: now,
            periodStart: now,
            periodEnd: oneYearLater,
        }).where(eq(subscriptions.id, subId));

        // Upgrade store plan
        await db.update(stores).set({ plan: sub.plan }).where(eq(stores.id, sub.storeId));

        return c.json({ message: 'Subscription approved and store plan upgraded' });
    } catch (e) {
        console.error('Approve subscription error:', e);
        return c.json({ error: 'Failed' }, 500);
    }
});

export default router;
