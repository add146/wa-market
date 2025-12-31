import { Router, Request, Response } from 'express';
import { db } from '../db';
import { products, productVariants } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

const updateStockSchema = z.object({
    stock: z.number().int().min(0),
});

/**
 * GET /api/inventory
 * Get all products with stock info (Admin only)
 */
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const productsWithStock = await db.select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            image: products.image,
            price: products.price,
            stock: products.stock,
            isActive: products.isActive,
            updatedAt: products.updatedAt,
        })
            .from(products)
            .orderBy(products.stock, desc(products.updatedAt));

        // Get variants for each product
        const result = await Promise.all(
            productsWithStock.map(async (product) => {
                const variants = await db.select()
                    .from(productVariants)
                    .where(eq(productVariants.productId, product.id));

                return {
                    ...product,
                    variants,
                    totalVariantStock: variants.reduce((sum, v) => sum + v.stock, 0),
                };
            })
        );

        res.json(result);
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/inventory/:productId
 * Update product stock (Admin only)
 */
router.patch('/:productId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const validation = updateStockSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [updated] = await db.update(products)
            .set({ stock: validation.data.stock, updatedAt: new Date() })
            .where(eq(products.id, productId))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/inventory/variants/:variantId
 * Update variant stock (Admin only)
 */
router.patch('/variants/:variantId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { variantId } = req.params;
        const validation = updateStockSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [updated] = await db.update(productVariants)
            .set({ stock: validation.data.stock })
            .where(eq(productVariants.id, variantId))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Variant not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Update variant stock error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
