import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, orders } from '../db/schema';
import { eq, desc, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

/**
 * GET /api/users
 * Get all users + guest customers (Admin only)
 */
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        // Get registered users
        const registeredUsers = await db.select({
            id: users.id,
            phone: users.phone,
            name: users.name,
            role: users.role,
            createdAt: users.createdAt,
        })
            .from(users)
            .orderBy(desc(users.createdAt));

        // Get unique guest customers from orders (those without userId)
        const guestOrders = await db.select({
            guestPhone: orders.guestPhone,
            recipientName: orders.recipientName,
            createdAt: orders.createdAt,
        })
            .from(orders)
            .where(isNotNull(orders.guestPhone))
            .orderBy(desc(orders.createdAt));

        // Deduplicate guests by phone number
        const guestMap = new Map<string, { phone: string; name: string; createdAt: Date }>();
        for (const order of guestOrders) {
            if (order.guestPhone && !guestMap.has(order.guestPhone)) {
                guestMap.set(order.guestPhone, {
                    phone: order.guestPhone,
                    name: order.recipientName,
                    createdAt: order.createdAt || new Date(),
                });
            }
        }

        // Convert guests to user-like format
        const guestCustomers = Array.from(guestMap.values()).map((guest, idx) => ({
            id: `guest-${idx}`,
            phone: guest.phone,
            name: guest.name,
            role: 'guest' as const,
            createdAt: guest.createdAt,
        }));

        // Combine and sort by createdAt
        const allCustomers = [...registeredUsers, ...guestCustomers]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        res.json({ users: allCustomers });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/users/:id/name
 * Update user name (Admin only)
 */
router.patch('/:id/name', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || name.length < 2) {
            res.status(400).json({ error: 'Name must be at least 2 characters' });
            return;
        }

        const [updated] = await db.update(users)
            .set({ name, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                phone: users.phone,
                role: users.role,
            });

        if (!updated) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: 'Name updated successfully', user: updated });
    } catch (error) {
        console.error('Update name error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/users/:id/role
 * Update user role (Admin only)
 */
router.patch('/:id/role', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        if (!['customer', 'admin'].includes(role)) {
            res.status(400).json({ error: 'Invalid role. Must be "customer" or "admin"' });
            return;
        }

        const [updated] = await db.update(users)
            .set({ role, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                phone: users.phone,
                role: users.role,
            });

        if (!updated) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: 'Role updated successfully', user: updated });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/users/:id/password
 * Reset user password (Admin only)
 */
router.patch('/:id/password', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        // Validate password
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [updated] = await db.update(users)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
            });

        if (!updated) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = req.user!;

        // Prevent self-deletion
        if (currentUser.id === id) {
            res.status(400).json({ error: 'Cannot delete yourself' });
            return;
        }

        const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();

        if (!deleted) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
