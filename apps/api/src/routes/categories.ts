import { Hono } from 'hono';
import { getDb } from '../db';
import { categories } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any } }>();

/**
 * GET /api/s/:slug/categories
 */
router.get('/', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const result = await db.select().from(categories).where(eq(categories.storeId, store.id));
        return c.json(result); 
    } catch (e) {
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});

router.get('/:id', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;
        const [category] = await db.select().from(categories).where(
            and(eq(categories.id, id), eq(categories.storeId, store.id))
        );
        if (!category) return c.json({ error: 'Category not found' }, 404);
        return c.json(category);
    } catch (e) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.post('/', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();
        const { slug, name, icon, description } = body;
        if (!slug || !name) return c.json({ error: 'slug and name required' }, 400);
        
        const [newCat] = await db.insert(categories).values({ 
            storeId: store.id,
            slug, 
            name, 
            icon, 
            description 
        }).returning();
        
        return c.json(newCat, 201);
    } catch (e) {
        return c.json({ error: 'Failed to create' }, 500);
    }
});

router.put('/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;
        const body = await c.req.json();
        
        const [updated] = await db.update(categories)
            .set(body)
            .where(and(eq(categories.id, id), eq(categories.storeId, store.id)))
            .returning();
            
        if (!updated) return c.json({ error: 'Not found' }, 404);
        return c.json(updated);
    } catch (e) {
        return c.json({ error: 'Failed to update' }, 500);
    }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;
        
        const [deleted] = await db.delete(categories).where(
            and(eq(categories.id, id), eq(categories.storeId, store.id))
        ).returning();
        
        if (!deleted) return c.json({ error: 'Not found' }, 404);
        return c.json({ message: 'Deleted' });
    } catch (e) {
        return c.json({ error: 'Tidak dapat menghapus, masih ada produk yang menggunakan kategori ini' }, 400);
    }
});

export default router;
