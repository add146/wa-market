import { Hono } from 'hono';
import { getDb } from '../db';
import { users, orders } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any, user: any } }>();

/**
 * GET /api/s/:slug/customers
 * Returns all customers (members & guests who ordered) with their order summary
 */
router.get('/', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user: any = c.get('user');

        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return c.json({ error: 'Forbidden' }, 403);
        }

        // Aggregate order stats per user
        const customerList = await db.select({
            id: users.id,
            name: users.name,
            phone: users.phone,
            role: users.role,
            initialPassword: users.initialPassword,
            createdAt: users.createdAt,
            totalOrders: sql<number>`CAST(count(${orders.id}) AS INTEGER)`,
            totalSpent: sql<number>`COALESCE(sum(${orders.total}), 0)`,
            lastOrderDate: sql<string>`max(${orders.createdAt})`
        })
        .from(users)
        .innerJoin(orders, and(eq(orders.userId, users.id), eq(orders.storeId, store.id)))
        .where(eq(users.storeId, store.id))
        .groupBy(users.id)
        .orderBy(sql`max(${orders.createdAt}) desc`);

        return c.json({ customers: customerList });
    } catch (e) {
        console.error('Fetch customers error:', e);
        return c.json({ error: 'Internal Error' }, 500);
    }
});

/**
 * GET /api/s/:slug/customers/:id/addresses
 * Returns unique addresses used by a specific customer
 */
router.get('/:id/addresses', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const userId = c.req.param('id') as string;
        const user: any = c.get('user');

        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return c.json({ error: 'Forbidden' }, 403);
        }

        const addressList = await db.select({
            address: orders.address,
            district: orders.district,
            city: orders.city,
            province: orders.province,
            latitude: orders.latitude,
            longitude: orders.longitude,
            lastUsed: sql<string>`max(${orders.createdAt})`
        })
        .from(orders)
        .where(
            and(
                eq(orders.userId, userId),
                eq(orders.storeId, store.id)
            )
        )
        .groupBy(orders.address, orders.district, orders.city, orders.province)
        .orderBy(sql`max(${orders.createdAt}) desc`);

        return c.json({ addresses: addressList });
    } catch (e) {
        console.error('Fetch customer addresses error:', e);
        return c.json({ error: 'Internal Error' }, 500);
    }
});

export default router;
