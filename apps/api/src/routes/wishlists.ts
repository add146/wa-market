import { Hono } from 'hono';
import { getDb } from '../db';
import { wishlists, products } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any, user: any } }>();

// All wishlist routes require authentication
router.use('/*', authMiddleware);

/**
 * GET /api/s/:slug/wishlists
 * Get all wishlisted products for current user
 */
router.get('/', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user = c.get('user');

        const userWishlists = await db.select({
            id: wishlists.id,
            productId: wishlists.productId,
            createdAt: wishlists.createdAt,
            product: {
                id: products.id,
                name: products.name,
                slug: products.slug,
                description: products.description,
                price: products.price,
                originalPrice: products.originalPrice,
                discount: products.discount,
                image: products.image,
                isActive: products.isActive,
                stock: products.stock,
                weight: products.weight,
                categoryId: products.categoryId,
                productType: products.productType,
                preorderDays: products.preorderDays,
                digitalContent: products.digitalContent,
            }
        })
        .from(wishlists)
        .leftJoin(products, eq(wishlists.productId, products.id))
        .where(
            and(
                eq(wishlists.storeId, store.id),
                eq(wishlists.userId, user.id)
            )
        )
        .orderBy(desc(wishlists.createdAt));

        return c.json({ wishlists: userWishlists });
    } catch (e) {
        console.error('Fetch wishlists error:', e);
        return c.json({ error: 'Failed to fetch wishlists' }, 500);
    }
});

/**
 * POST /api/s/:slug/wishlists
 * Toggle wishlist status for a product (add if not exists, remove if exists)
 */
router.post('/', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user = c.get('user');
        const body = await c.req.json();
        
        if (!body.productId) {
            return c.json({ error: 'ProductId is required' }, 400);
        }

        // Check if product exists
        const [product] = await db.select().from(products).where(
            and(eq(products.id, body.productId), eq(products.storeId, store.id))
        );
        if (!product) {
            return c.json({ error: 'Product not found' }, 404);
        }

        // Check if already in wishlist
        const [existing] = await db.select().from(wishlists).where(
            and(
                eq(wishlists.storeId, store.id),
                eq(wishlists.userId, user.id),
                eq(wishlists.productId, body.productId)
            )
        );

        if (existing) {
            // Remove from wishlist
            await db.delete(wishlists).where(eq(wishlists.id, existing.id));
            return c.json({ message: 'Removed from wishlist', isWishlisted: false });
        } else {
            // Add to wishlist
            await db.insert(wishlists).values({
                storeId: store.id,
                userId: user.id,
                productId: body.productId,
            });
            return c.json({ message: 'Added to wishlist', isWishlisted: true }, 201);
        }
    } catch (e) {
        console.error('Toggle wishlist error:', e);
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * GET /api/s/:slug/wishlists/check/:productId
 * Check if a specific product is in user's wishlist
 */
router.get('/check/:productId', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user = c.get('user');
        const productId = c.req.param('productId');

        const [existing] = await db.select().from(wishlists).where(
            and(
                eq(wishlists.storeId, store.id),
                eq(wishlists.userId, user.id),
                eq(wishlists.productId, productId)
            )
        );

        return c.json({ isWishlisted: !!existing });
    } catch (e) {
        console.error('Check wishlist error:', e);
        return c.json({ isWishlisted: false });
    }
});

export default router;
