import { Hono } from 'hono';
import { getDb } from '../db';
import { stores } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env }>();

/**
 * GET /api/resolver/domain/:hostname
 * Resolves a hostname to a store slug/id.
 * Used by the frontend to determine which tenant is being accessed via custom domain.
 */
router.get('/domain/:hostname', async (c) => {
    try {
        const db = getDb(c.env);
        const hostname = c.req.param('hostname').toLowerCase();

        // 1. Try to find by exact customDomain match
        const [storeByDomain] = await db.select().from(stores).where(eq(stores.customDomain, hostname));
        
        if (storeByDomain) {
            return c.json({
                found: true,
                storeId: storeByDomain.id,
                slug: storeByDomain.slug,
                name: storeByDomain.name,
                isActive: storeByDomain.isActive
            });
        }

        return c.json({ found: false }, 404);
    } catch (e) {
        console.error('Domain Resolver Error:', e);
        return c.json({ error: 'Failed to resolve domain' }, 500);
    }
});

export default router;
