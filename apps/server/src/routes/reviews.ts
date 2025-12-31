import { Router, Request, Response } from 'express';
import { db } from '../db';
import { productReviews, products } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

const reviewSchema = z.object({
    productId: z.string().uuid(),
    reviewerName: z.string().min(2).max(100),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

/**
 * GET /api/products/:productId/reviews
 * Get reviews for a product (Public)
 */
router.get('/product/:productId', async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;

        const reviews = await db.select()
            .from(productReviews)
            .where(eq(productReviews.productId, productId))
            .orderBy(desc(productReviews.createdAt));

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        res.json({
            reviews,
            summary: {
                count: reviews.length,
                averageRating: Math.round(avgRating * 10) / 10,
            },
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/reviews
 * Get all reviews (Admin only)
 */
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const reviews = await db.select({
            id: productReviews.id,
            productId: productReviews.productId,
            reviewerName: productReviews.reviewerName,
            rating: productReviews.rating,
            comment: productReviews.comment,
            createdAt: productReviews.createdAt,
            product: {
                id: products.id,
                name: products.name,
            },
        })
            .from(productReviews)
            .leftJoin(products, eq(productReviews.productId, products.id))
            .orderBy(desc(productReviews.createdAt));

        res.json(reviews);
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/reviews
 * Create a review (Admin only - for inputting customer reviews)
 */
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const validation = reviewSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [newReview] = await db.insert(productReviews).values({
            ...validation.data,
            createdBy: req.user!.id,
        }).returning();

        res.status(201).json(newReview);
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/reviews/:id
 * Update a review (Admin only)
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = reviewSchema.partial().safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [updated] = await db.update(productReviews)
            .set(validation.data)
            .where(eq(productReviews.id, id))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review (Admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [deleted] = await db.delete(productReviews).where(eq(productReviews.id, id)).returning();

        if (!deleted) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
