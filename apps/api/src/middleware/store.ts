import { createMiddleware } from 'hono/factory';
import { getDb } from '../db';
import { stores } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '../index';

export const storeMiddleware = createMiddleware<{ Bindings: Env, Variables: { store: any } }>(async (c, next) => {
    try {
        const slug = c.req.param('slug');
        if (!slug) {
            return c.json({ error: 'Store slug is required' }, 400);
        }

        const db = getDb(c.env);
        const [store] = await db.select().from(stores).where(eq(stores.slug, slug));

        if (!store) {
            return c.json({ error: 'Store not found' }, 404);
        }

        if (!store.isActive) {
            return c.json({ error: 'Store is temporarily inactive' }, 403);
        }

        // Add the store object to Hono context variables to be accessible in all routes
        c.set('store', store);
        await next();
    } catch (e) {
        console.error('Store middleware error:', e);
        return c.json({ error: 'Internal server error resolving store' }, 500);
    }
});
