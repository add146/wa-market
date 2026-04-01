import { Hono } from 'hono';
import { getDb } from '../db';
import { products, ebookPurchases, ebookBookmarks } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any, user: any } }>();

/**
 * GET /api/s/:slug/ebooks/my-library
 * Get list of purchased ebooks for the authenticated user
 */
router.get('/my-library', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user = c.get('user');

        const library = await db.select({
            id: ebookPurchases.id,
            productId: products.id,
            productName: products.name,
            productImage: products.image,
            productSlug: products.slug,
            digitalType: products.digitalType,
            digitalContent: products.digitalContent,
            lastPage: ebookPurchases.lastPage,
            lastCfi: ebookPurchases.lastCfi,
            totalPages: ebookPurchases.totalPages,
            purchasedAt: ebookPurchases.purchasedAt,
            lastReadAt: ebookPurchases.lastReadAt,
        })
        .from(ebookPurchases)
        .innerJoin(products, eq(ebookPurchases.productId, products.id))
        .where(
            and(
                eq(ebookPurchases.userId, user.id),
                eq(ebookPurchases.storeId, store.id)
            )
        )
        .orderBy(desc(ebookPurchases.lastReadAt));

        return c.json({ library });
    } catch (error) {
        console.error('Get library error:', error);
        return c.json({ error: 'Failed to fetch library' }, 500);
    }
});

/**
 * GET /api/s/:slug/ebooks/:productId/check-access
 * Check if user has access to this ebook
 */
router.get('/:productId/check-access', optionalAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;

        if (!user) {
            return c.json({ hasAccess: false });
        }

        const [purchase] = await db.select()
            .from(ebookPurchases)
            .where(
                and(
                    eq(ebookPurchases.userId, user.id),
                    eq(ebookPurchases.productId, productId)
                )
            );

        if (purchase) {
            return c.json({ hasAccess: true, purchase });
        }

        return c.json({ hasAccess: false });
    } catch (error) {
        console.error('Check access error:', error);
        return c.json({ error: 'Failed to check access' }, 500);
    }
});

/**
 * GET /api/s/:slug/ebooks/:productId/read
 * Serve PDF file stream (protected)
 */
router.get('/:productId/read', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;

        // 1. Check ownership
        const [purchase] = await db.select()
            .from(ebookPurchases)
            .where(
                and(
                    eq(ebookPurchases.userId, user.id),
                    eq(ebookPurchases.productId, productId)
                )
            );

        if (!purchase) {
            return c.json({ error: 'Forbidden - You have not purchased this ebook' }, 403);
        }

        // 2. Get product file key
        const [product] = await db.select()
            .from(products)
            .where(eq(products.id, productId));

        if (!product?.ebookFileKey) {
            return c.json({ error: 'Not Found - Ebook file not assigned' }, 404);
        }

        // 3. Stream from R2
        const object = await c.env.MEDIA_BUCKET.get(product.ebookFileKey);
        
        if (!object) {
            return c.json({ error: 'Not Found - Ebook file missing in storage' }, 404);
        }

        const isEpub = product.ebookFileKey.endsWith('.epub');
        const contentType = isEpub ? 'application/epub+zip' : 'application/pdf';
        const fileExt = isEpub ? '.epub' : '.pdf';

        const headers = new Headers();
        headers.set('content-type', contentType);
        headers.set('cache-control', 'private, no-store'); // Do not cache for public
        headers.set('content-disposition', `inline; filename="${product.slug}${fileExt}"`);

        return new Response(object.body as any, { headers });
    } catch (error) {
        console.error('Stream ebook error:', error);
        return c.json({ error: 'Failed to load ebook stream' }, 500);
    }
});

/**
 * PATCH /api/s/:slug/ebooks/:productId/progress
 * Update reading progress
 */
router.patch('/:productId/progress', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;
        const body = await c.req.json();
        
        const { page, lastCfi, totalPages } = body;

        if (page === undefined && !lastCfi) {
            return c.json({ error: 'Page number or CFI is required' }, 400);
        }

        const [purchase] = await db.select()
            .from(ebookPurchases)
            .where(
                and(
                    eq(ebookPurchases.userId, user.id),
                    eq(ebookPurchases.productId, productId)
                )
            );

        if (!purchase) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        const updateData: any = {
            lastPage: page !== undefined ? page : purchase.lastPage,
            lastCfi: lastCfi || purchase.lastCfi,
            lastReadAt: new Date()
        };
        
        if (totalPages) {
            updateData.totalPages = totalPages;
        }

        await db.update(ebookPurchases)
            .set(updateData)
            .where(eq(ebookPurchases.id, purchase.id));

        return c.json({ success: true, progress: updateData });
    } catch (error) {
        console.error('Update progress error:', error);
        return c.json({ error: 'Failed to update progress' }, 500);
    }
});

/**
 * GET /api/s/:slug/ebooks/:productId/bookmarks
 * Get bookmarks for an ebook
 */
router.get('/:productId/bookmarks', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;

        const bookmarks = await db.select()
            .from(ebookBookmarks)
            .where(
                and(
                    eq(ebookBookmarks.userId, user.id),
                    eq(ebookBookmarks.productId, productId)
                )
            )
            .orderBy(desc(ebookBookmarks.createdAt));

        return c.json({ bookmarks });
    } catch (error) {
        console.error('Get bookmarks error:', error);
        return c.json({ error: 'Failed to fetch bookmarks' }, 500);
    }
});

/**
 * POST /api/s/:slug/ebooks/:productId/bookmarks
 * Create a new bookmark
 */
router.post('/:productId/bookmarks', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;
        const { page, cfi, title } = await c.req.json();

        if ((page === undefined && !cfi) || !title) {
            return c.json({ error: 'Page/CFI and title are required' }, 400);
        }

        const [bookmark] = await db.insert(ebookBookmarks)
            .values({
                userId: user.id,
                productId,
                page: page !== undefined ? page : 0,
                cfi: cfi || null,
                title
            })
            .returning();

        return c.json({ bookmark });
    } catch (error) {
        console.error('Create bookmark error:', error);
        return c.json({ error: 'Failed to create bookmark' }, 500);
    }
});

/**
 * PUT /api/s/:slug/ebooks/bookmarks/:id
 * Update a bookmark
 */
router.put('/bookmarks/:id', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const id = c.req.param('id') as string;
        const { title } = await c.req.json();

        if (!title) {
            return c.json({ error: 'Title is required' }, 400);
        }

        // Verify ownership
        const [existing] = await db.select()
            .from(ebookBookmarks)
            .where(
                and(
                    eq(ebookBookmarks.id, id),
                    eq(ebookBookmarks.userId, user.id)
                )
            );

        if (!existing) {
            return c.json({ error: 'Bookmark not found or forbidden' }, 404);
        }

        const [bookmark] = await db.update(ebookBookmarks)
            .set({ title })
            .where(eq(ebookBookmarks.id, id))
            .returning();

        return c.json({ bookmark });
    } catch (error) {
        console.error('Update bookmark error:', error);
        return c.json({ error: 'Failed to update bookmark' }, 500);
    }
});

/**
 * DELETE /api/s/:slug/ebooks/bookmarks/:id
 * Delete a bookmark
 */
router.delete('/bookmarks/:id', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const id = c.req.param('id') as string;

        // Verify ownership
        const [existing] = await db.select()
            .from(ebookBookmarks)
            .where(
                and(
                    eq(ebookBookmarks.id, id),
                    eq(ebookBookmarks.userId, user.id)
                )
            );

        if (!existing) {
            return c.json({ error: 'Bookmark not found or forbidden' }, 404);
        }

        await db.delete(ebookBookmarks)
            .where(eq(ebookBookmarks.id, id));

        return c.json({ success: true });
    } catch (error) {
        console.error('Delete bookmark error:', error);
        return c.json({ error: 'Failed to delete bookmark' }, 500);
    }
});

export default router;
