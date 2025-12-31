import { Router, Request, Response } from 'express';
import { db } from '../db';
import { wishlists, products } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware';

const router = Router();

const addWishlistSchema = z.object({
    productId: z.string().uuid(),
});

/**
 * GET /api/wishlists
 * Get user's wishlist
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const items = await db.select({
            id: wishlists.id,
            productId: wishlists.productId,
            createdAt: wishlists.createdAt,
            product: products,
        })
            .from(wishlists)
            .leftJoin(products, eq(wishlists.productId, products.id))
            .where(eq(wishlists.userId, userId));

        res.json(items);
    } catch (error) {
        console.error('Get wishlists error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/wishlists
 * Add product to wishlist
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const validation = addWishlistSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const { productId } = validation.data;

        // Check if already in wishlist
        const [existing] = await db.select()
            .from(wishlists)
            .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));

        if (existing) {
            res.status(409).json({ error: 'Product already in wishlist' });
            return;
        }

        const [newItem] = await db.insert(wishlists).values({
            userId,
            productId,
        }).returning();

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/wishlists/:productId
 * Remove product from wishlist
 */
router.delete('/:productId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { productId } = req.params;

        const [deleted] = await db.delete(wishlists)
            .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
            .returning();

        if (!deleted) {
            res.status(404).json({ error: 'Item not found in wishlist' });
            return;
        }

        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
