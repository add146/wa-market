import { Router, Request, Response } from 'express';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

// Validation schemas
const categorySchema = z.object({
    slug: z.string().min(2).max(50),
    name: z.string().min(2).max(100),
    icon: z.string().max(50).optional(),
});

/**
 * GET /api/categories
 * Get all categories
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await db.select().from(categories);
        res.json(result);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/categories/:id
 * Get category by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [category] = await db.select().from(categories).where(eq(categories.id, id));

        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        res.json(category);
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/categories
 * Create a new category (Admin only)
 */
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const validation = categorySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [newCategory] = await db.insert(categories).values(validation.data).returning();
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/categories/:id
 * Update a category (Admin only)
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = categorySchema.partial().safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const [updated] = await db.update(categories)
            .set(validation.data)
            .where(eq(categories.id, id))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/categories/:id
 * Delete a category (Admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();

        if (!deleted) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
