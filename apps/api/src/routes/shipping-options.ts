import { Hono } from 'hono';
import { getDb } from '../db';
import { shippingOptions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any } }>();

/**
 * GET /api/s/:slug/shipping-options
 * Public config - Get active shipping options for the store
 */
router.get('/', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        
        // Return all options for this store 
        // We return only active ones usually but the frontend checks isActive = 1
        // Usually, the /shipping-options route in admin fetches all, while in checkout it only fetches active.
        // Let's return all and let the frontend filter, or we can just fetch all since it's used by both admin and checkout?
        // Wait, Admin calls GET /shipping-options, Checkout calls GET /shipping-options. Both call the same.
        const options = await db.select().from(shippingOptions).where(
            eq(shippingOptions.storeId, store.id)
        );
        
        // If empty, return a default "Pilih Kurir" empty list
        return c.json(options || []);
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * POST /api/s/:slug/shipping-options
 * Admin - Create new shipping option
 */
router.post('/', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();
        
        const [result] = await db.insert(shippingOptions).values({
            storeId: store.id,
            name: body.name,
            type: body.type, // 'api' | 'fixed' | 'free'
            courierCode: body.courierCode || null,
            serviceCode: body.serviceCode || null,
            fixedCost: body.fixedCost || 0,
            minPurchaseForFree: body.minPurchaseForFree || 0,
            estimation: body.estimation || '',
            isActive: body.isActive !== undefined ? body.isActive : true,
            sortOrder: body.sortOrder || 0
        }).returning();
        
        return c.json(result);
    } catch (error) {
        return c.json({ error: 'Failed to create shipping option' }, 500);
    }
});

/**
 * PUT /api/s/:slug/shipping-options/:id
 * Admin - Update shipping option
 */
router.put('/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;
        const body = await c.req.json();
        
        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.courierCode !== undefined) updateData.courierCode = body.courierCode;
        if (body.serviceCode !== undefined) updateData.serviceCode = body.serviceCode;
        if (body.fixedCost !== undefined) updateData.fixedCost = body.fixedCost;
        if (body.minPurchaseForFree !== undefined) updateData.minPurchaseForFree = body.minPurchaseForFree;
        if (body.estimation !== undefined) updateData.estimation = body.estimation;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

        const [result] = await db.update(shippingOptions)
            .set(updateData)
            .where(and(eq(shippingOptions.id, id), eq(shippingOptions.storeId, store.id)))
            .returning();
            
        if (!result) return c.json({ error: 'Not found' }, 404);
        
        return c.json(result);
    } catch (error) {
        return c.json({ error: 'Failed to update shipping option' }, 500);
    }
});

/**
 * DELETE /api/s/:slug/shipping-options/:id
 * Admin - Delete shipping option
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;
        
        const [result] = await db.delete(shippingOptions)
            .where(and(eq(shippingOptions.id, id), eq(shippingOptions.storeId, store.id)))
            .returning();
            
        if (!result) return c.json({ error: 'Not found' }, 404);
        
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete shipping option' }, 500);
    }
});

export default router;
