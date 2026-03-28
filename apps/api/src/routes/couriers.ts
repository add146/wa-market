import { Hono } from 'hono';
import { getDb } from '../db';
import { users, courierDeliveries, orders, orderItems, storeSettings } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, adminMiddleware, courierMiddleware, hashPassword } from '../middleware/auth';
import { sendWahaMessage, formatDeliveryCompleteNotification, generateWhatsAppUrl } from '../lib/whatsapp';
import type { Env } from '../index';

type Variables = { store: any, user: any };
const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

/**
 * GET /api/s/:slug/admin/couriers
 * List all couriers for the store
 */
router.get('/admin', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        
        const storeCouriers = await db.select({
            id: users.id,
            name: users.name,
            phone: users.phone,
            createdAt: users.createdAt,
        }).from(users).where(
            and(eq(users.storeId, store.id), eq(users.role, 'courier'))
        );
        
        return c.json(storeCouriers);
    } catch (e) {
        return c.json({ error: 'Failed to fetch couriers' }, 500);
    }
});

/**
 * POST /api/s/:slug/admin/couriers
 * Register a new courier
 */
router.post('/admin', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();
        const { phone, name } = body;
        
        if (!phone || !name) {
            return c.json({ error: 'Name and phone required' }, 400);
        }

        // Clean phone
        let cleanPhone = phone.replace(/[^\d+]/g, '');
        cleanPhone = cleanPhone.replace(/^\+/, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
        if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;

        const [existing] = await db.select().from(users).where(
            and(eq(users.phone, cleanPhone), eq(users.storeId, store.id))
        );
        
        if (existing) {
            return c.json({ error: 'Phone already registered in this store' }, 409);
        }

        // Generate dummy password since couriers don't login
        const dummyPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(dummyPassword);
        const [courier] = await db.insert(users).values({
            storeId: store.id,
            phone: cleanPhone,
            password: hashedPassword,
            name,
            role: 'courier'
        }).returning();

        // Omit password from output
        const out = { id: courier.id, name: courier.name, phone: courier.phone };
        
        return c.json(out, 201);
    } catch (e) {
        return c.json({ error: 'Failed to create courier' }, 500);
    }
});

/**
 * DELETE /api/s/:slug/admin/couriers/:id
 * Delete a courier
 */
router.delete('/admin/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;
        
        // Cannot delete if they have pending deliveries
        // Leaving it simple for now: we just delete. ON DELETE cascade handles courierDeliveries.
        const [deleted] = await db.delete(users).where(
             and(eq(users.id, id), eq(users.storeId, store.id), eq(users.role, 'courier'))
        ).returning();
        
        if (!deleted) return c.json({ error: 'Courier not found' }, 404);
        return c.json({ message: 'Courier deleted' });
    } catch (e) {
        return c.json({ error: 'Failed to delete' }, 500);
    }
});

/**
 * GET /api/s/:slug/admin/couriers/:id/deliveries
 * List all deliveries for a specific courier (admin view for reporting)
 */
router.get('/admin/:id/deliveries', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const courierId = c.req.param('id') as string;

        const deliveries = await db.select({
            delivery: courierDeliveries,
            order: orders
        })
        .from(courierDeliveries)
        .leftJoin(orders, eq(courierDeliveries.orderId, orders.id))
        .where(and(
            eq(courierDeliveries.courierId, courierId),
            eq(courierDeliveries.storeId, store.id)
        ))
        .orderBy(desc(courierDeliveries.assignedAt));

        const result = deliveries.map(d => ({
            ...d.delivery,
            orderData: d.order
        }));

        return c.json(result);
    } catch (e) {
        return c.json({ error: 'Failed to fetch courier deliveries' }, 500);
    }
});

// ----------------------------------------------------
// COURIER ENDPOINTS (MOBILE-FIRST DASHBOARD)
// ----------------------------------------------------

/**
 * GET /api/s/:slug/courier/deliveries
 * List my active / recent deliveries
 */
router.get('/deliveries', authMiddleware, courierMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user = c.get('user');

        const { status } = c.req.query(); // optional filter

        let conds = [eq(courierDeliveries.courierId, user.id), eq(courierDeliveries.storeId, store.id)];
        if (status) {
            conds.push(eq(courierDeliveries.status, status));
        }

        // Left join order info
        const deliveries = await db.select({
            delivery: courierDeliveries,
            order: orders
        })
        .from(courierDeliveries)
        .leftJoin(orders, eq(courierDeliveries.orderId, orders.id))
        .where(and(...conds))
        .orderBy(desc(courierDeliveries.assignedAt));

        // Flatten somewhat
        const result = deliveries.map(d => ({
            ...d.delivery,
            orderData: d.order
        }));

        return c.json(result);
    } catch (e) {
        return c.json({ error: 'Failed to get deliveries' }, 500);
    }
});

/**
 * GET /api/s/:slug/courier/deliveries/:id
 * Get delivery details including items
 */
router.get('/deliveries/:id', authMiddleware, courierMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user = c.get('user');
        const id = c.req.param('id') as string;

        const [delivery] = await db.select().from(courierDeliveries).where(
            and(eq(courierDeliveries.id, id), eq(courierDeliveries.courierId, user.id))
        );

        if (!delivery) return c.json({ error: 'Delivery record not found' }, 404);

        const [order] = await db.select().from(orders).where(eq(orders.id, delivery.orderId));
        if (!order) return c.json({ error: 'Related order not found' }, 404);

        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

        return c.json({
            ...delivery,
            orderData: order,
            items: items
        });
    } catch (e) {
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * PATCH /api/s/:slug/courier/deliveries/:id
 * Update status ('picked_up', 'on_the_way', 'delivered', 'failed')
 */
router.patch('/deliveries/:id', authMiddleware, courierMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user = c.get('user');
        const id = c.req.param('id') as string;
        const body = await c.req.json();
        const { status, notes, photoUrl } = body;

        const allowedObj: any = {};
        if (status) allowedObj.status = status;
        if (notes !== undefined) allowedObj.notes = notes;
        if (photoUrl) allowedObj.photoUrl = photoUrl;

        if (status === 'picked_up') allowedObj.pickedUpAt = new Date();
        if (status === 'delivered') allowedObj.deliveredAt = new Date();

        const [updated] = await db.update(courierDeliveries)
            .set(allowedObj)
            .where(and(eq(courierDeliveries.id, id), eq(courierDeliveries.courierId, user.id)))
            .returning();

        if (!updated) return c.json({ error: 'Not found or permission denied' }, 404);

        // Additionally, if status="delivered", update order status and send notification to admin/kasir WA
        if (status === 'delivered') {
            await db.update(orders).set({ status: 'completed' }).where(eq(orders.id, updated.orderId));
            
            const [order] = await db.select().from(orders).where(eq(orders.id, updated.orderId));

            const allSettings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
            const getConfig = (key: string) => allSettings.find(s => s.key === key)?.value || '';

            const kasirPhone = getConfig('whatsapp_kasir');
            const wahaUrl = getConfig('waha_server_url');
            const wahaKey = getConfig('waha_api_key');
            const wahaSession = getConfig('waha_session') || 'default';

            if (kasirPhone && wahaUrl) {
                const messageText = formatDeliveryCompleteNotification(order, user);
                // Fire and forget
                sendWahaMessage(wahaUrl, wahaKey, wahaSession, kasirPhone, messageText).catch(e => console.error(e));
            }
        }

        return c.json(updated);
    } catch (e) {
        return c.json({ error: 'Failed to update delivery' }, 500);
    }
});

export default router;
