import { Router, Request, Response } from 'express';
import { db } from '../db';
import { storeSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

const updateSettingSchema = z.object({
    value: z.string(),
});

/**
 * GET /api/settings
 * Get all store settings (Public)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const settings = await db.select().from(storeSettings);

        // Convert to key-value object for easier client usage
        const settingsObject: Record<string, string> = {};
        for (const setting of settings) {
            settingsObject[setting.key] = setting.value;
        }

        res.json(settingsObject);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/settings/:key
 * Get setting by key (Public)
 */
router.get('/:key', async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const [setting] = await db.select().from(storeSettings).where(eq(storeSettings.key, key));

        if (!setting) {
            res.status(404).json({ error: 'Setting not found' });
            return;
        }

        res.json(setting);
    } catch (error) {
        console.error('Get setting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/settings/admin/all
 * Get all settings with descriptions (Admin only)
 */
router.get('/admin/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const settings = await db.select().from(storeSettings);
        res.json(settings);
    } catch (error) {
        console.error('Get admin settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/settings/:key
 * Update setting value (Admin only)
 */
router.put('/:key', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const validation = updateSettingSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        // Check if setting exists
        const [existing] = await db.select().from(storeSettings).where(eq(storeSettings.key, key));

        if (existing) {
            // Update existing
            const [updated] = await db.update(storeSettings)
                .set({ value: validation.data.value, updatedAt: new Date() })
                .where(eq(storeSettings.key, key))
                .returning();

            res.json(updated);
        } else {
            // Create new setting
            const [created] = await db.insert(storeSettings).values({
                key,
                value: validation.data.value,
            }).returning();

            res.status(201).json(created);
        }
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
