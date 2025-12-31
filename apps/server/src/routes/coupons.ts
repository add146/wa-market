import { Router, Request, Response } from 'express';
import { db } from '../db';
import { coupons } from '../db/schema';
import { eq, and, gt, or, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

const couponSchema = z.object({
    code: z.string().min(2).max(50).toUpperCase(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minPurchase: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
    expiresAt: z.string().datetime().optional(),
});

const validateCouponSchema = z.object({
    code: z.string().min(1),
    subtotal: z.number().positive(),
});

/**
 * GET /api/coupons
 * Get all coupons (Admin only)
 */
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await db.select().from(coupons);
        res.json(result);
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/coupons/validate
 * Validate coupon code and calculate discount
 */
router.post('/validate', async (req: Request, res: Response) => {
    try {
        const validation = validateCouponSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const { code, subtotal } = validation.data;

        const [coupon] = await db.select()
            .from(coupons)
            .where(and(
                eq(coupons.code, code.toUpperCase()),
                eq(coupons.isActive, true)
            ));

        if (!coupon) {
            res.status(404).json({ error: 'Coupon not found or inactive', valid: false });
            return;
        }

        // Check if expired
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            res.status(400).json({ error: 'Coupon has expired', valid: false });
            return;
        }

        // Check minimum purchase
        if (coupon.minPurchase && subtotal < coupon.minPurchase) {
            res.status(400).json({
                error: `Minimum purchase of Rp ${coupon.minPurchase.toLocaleString('id-ID')} required`,
                valid: false
            });
            return;
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
            res.status(400).json({ error: 'Coupon usage limit reached', valid: false });
            return;
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = Math.floor(subtotal * coupon.discountValue / 100);
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.discountValue;
        }

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
            },
            discount,
            message: `Coupon applied! You save Rp ${discount.toLocaleString('id-ID')}`,
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/coupons
 * Create coupon (Admin only)
 */
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const validation = couponSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const data = {
            ...validation.data,
            expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined,
        };

        const [newCoupon] = await db.insert(coupons).values(data).returning();
        res.status(201).json(newCoupon);
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/coupons/:id
 * Update coupon (Admin only)
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = couponSchema.partial().safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const data = {
            ...validation.data,
            expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined,
        };

        const [updated] = await db.update(coupons)
            .set(data)
            .where(eq(coupons.id, id))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Coupon not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/coupons/:id
 * Delete coupon (Admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [deleted] = await db.delete(coupons).where(eq(coupons.id, id)).returning();

        if (!deleted) {
            res.status(404).json({ error: 'Coupon not found' });
            return;
        }

        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
