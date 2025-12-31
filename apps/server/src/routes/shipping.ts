import { Router, Request, Response } from 'express';
import { db } from '../db';
import { shippingOptions } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

const shippingOptionSchema = z.object({
    name: z.string().min(2).max(100),
    type: z.enum(['api', 'fixed', 'free']),
    courierCode: z.string().max(20).optional(),
    serviceCode: z.string().max(20).optional(),
    fixedCost: z.number().int().min(0).optional(),
    minPurchaseForFree: z.number().int().min(0).optional(),
    estimation: z.string().max(50).optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
});

/**
 * GET /api/shipping-options
 * Get all active shipping options (Public)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const options = await db.select()
            .from(shippingOptions)
            .where(eq(shippingOptions.isActive, true))
            .orderBy(asc(shippingOptions.sortOrder));

        res.json(options);
    } catch (error) {
        console.error('Get shipping options error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/shipping-options/all
 * Get all shipping options including inactive (Admin only)
 */
router.get('/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const options = await db.select()
            .from(shippingOptions)
            .orderBy(asc(shippingOptions.sortOrder));

        res.json(options);
    } catch (error) {
        console.error('Get all shipping options error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/shipping-options/:id
 * Get shipping option by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [option] = await db.select().from(shippingOptions).where(eq(shippingOptions.id, id));

        if (!option) {
            res.status(404).json({ error: 'Shipping option not found' });
            return;
        }

        res.json(option);
    } catch (error) {
        console.error('Get shipping option error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/shipping-options
 * Create shipping option (Admin only)
 */
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const validation = shippingOptionSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [newOption] = await db.insert(shippingOptions).values(validation.data).returning();
        res.status(201).json(newOption);
    } catch (error) {
        console.error('Create shipping option error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/shipping-options/:id
 * Update shipping option (Admin only)
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = shippingOptionSchema.partial().safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [updated] = await db.update(shippingOptions)
            .set(validation.data)
            .where(eq(shippingOptions.id, id))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Shipping option not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Update shipping option error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/shipping-options/:id
 * Delete shipping option (Admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [deleted] = await db.delete(shippingOptions).where(eq(shippingOptions.id, id)).returning();

        if (!deleted) {
            res.status(404).json({ error: 'Shipping option not found' });
            return;
        }

        res.json({ message: 'Shipping option deleted successfully' });
    } catch (error) {
        console.error('Delete shipping option error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/shipping-options/calculate
 * Calculate shipping cost (for RajaOngkir integration)
 */
router.post('/calculate', async (req: Request, res: Response) => {
    try {
        const { shippingOptionId, origin, destination, weight } = req.body;

        const [option] = await db.select().from(shippingOptions).where(eq(shippingOptions.id, shippingOptionId));

        if (!option) {
            res.status(404).json({ error: 'Shipping option not found' });
            return;
        }

        let cost = 0;

        switch (option.type) {
            case 'free':
                cost = 0;
                break;
            case 'fixed':
                cost = option.fixedCost || 0;
                break;
            case 'api':
                // TODO: Integrate with RajaOngkir API
                // For now, return a placeholder cost
                cost = 15000;
                break;
        }

        res.json({
            shippingOptionId: option.id,
            name: option.name,
            type: option.type,
            cost,
            estimation: option.estimation,
        });
    } catch (error) {
        console.error('Calculate shipping error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
