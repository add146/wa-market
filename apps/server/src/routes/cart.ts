import { Router, Request, Response } from 'express';
import { db } from '../db';
import { cartItems, products, productVariants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware';

const router = Router();

// Validation schemas
const addToCartSchema = z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().positive().default(1),
});

const updateCartSchema = z.object({
    quantity: z.number().int().positive(),
});

/**
 * GET /api/cart
 * Get user's cart items
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const items = await db.select({
            id: cartItems.id,
            productId: cartItems.productId,
            variantId: cartItems.variantId,
            quantity: cartItems.quantity,
            product: {
                id: products.id,
                name: products.name,
                price: products.price,
                originalPrice: products.originalPrice,
                discount: products.discount,
                image: products.image,
                stock: products.stock,
            },
        })
            .from(cartItems)
            .leftJoin(products, eq(cartItems.productId, products.id))
            .where(eq(cartItems.userId, userId));

        // Calculate totals
        let subtotal = 0;
        let totalDiscount = 0;

        for (const item of items) {
            if (item.product) {
                const itemTotal = item.product.price * item.quantity;
                subtotal += itemTotal;
                if (item.product.originalPrice) {
                    totalDiscount += (item.product.originalPrice - item.product.price) * item.quantity;
                }
            }
        }

        res.json({
            items,
            summary: {
                itemCount: items.length,
                subtotal,
                totalDiscount,
                total: subtotal,
            },
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/cart
 * Add item to cart
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const validation = addToCartSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const { productId, variantId, quantity } = validation.data;

        // Check if product exists
        const [product] = await db.select().from(products).where(eq(products.id, productId));
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Check if item already in cart
        const existingConditions = [
            eq(cartItems.userId, userId),
            eq(cartItems.productId, productId),
        ];

        const [existingItem] = await db.select()
            .from(cartItems)
            .where(and(...existingConditions));

        if (existingItem) {
            // Update quantity
            const [updated] = await db.update(cartItems)
                .set({ quantity: existingItem.quantity + quantity })
                .where(eq(cartItems.id, existingItem.id))
                .returning();

            res.json(updated);
        } else {
            // Add new item
            const [newItem] = await db.insert(cartItems).values({
                userId,
                productId,
                variantId,
                quantity,
            }).returning();

            res.status(201).json(newItem);
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/cart/:id
 * Update cart item quantity
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        const validation = updateCartSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [updated] = await db.update(cartItems)
            .set({ quantity: validation.data.quantity })
            .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Cart item not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/cart/:id
 * Remove item from cart
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const [deleted] = await db.delete(cartItems)
            .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
            .returning();

        if (!deleted) {
            res.status(404).json({ error: 'Cart item not found' });
            return;
        }

        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Delete cart item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        await db.delete(cartItems).where(eq(cartItems.userId, userId));

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
