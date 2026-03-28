import { Hono } from 'hono';
import { getDb } from '../db';
import { orders, orderItems, products, storeSettings, users, courierDeliveries } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { formatOrderMessage, sendWahaMessage, generateWhatsAppUrl, formatCourierNotification } from '../lib/whatsapp';
import type { Env } from '../index';

type Variables = { store: any, user: any };
const router = new Hono<{ Bindings: Env; Variables: Variables }>();

async function generateOrderNumber(db: any, storeId: string): Promise<string> {
    const [lastOrder] = await db.select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(eq(orders.storeId, storeId))
        .orderBy(desc(orders.createdAt))
        .limit(1);
        
    let nextNum = 1;
    if (lastOrder?.orderNumber) {
        const numPart = lastOrder.orderNumber.replace(/\D/g, '');
        if (numPart) nextNum = parseInt(numPart, 10) + 1;
    }
    return `WM${nextNum.toString().padStart(5, '0')}`;
}

router.get('/', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user: any = c.get('user');
        
        let query;
        if (user.role === 'admin' || user.role === 'superadmin') {
            query = db.select().from(orders).where(eq(orders.storeId, store.id))
                .orderBy(desc(orders.createdAt)).limit(20);
        } else {
            query = db.select().from(orders).where(
                and(eq(orders.userId, user.id), eq(orders.storeId, store.id))
            ).orderBy(desc(orders.createdAt)).limit(20);
        }
        
        const result = await query;
        return c.json({ orders: result });
    } catch (e) {
        return c.json({ error: 'Internal Error' }, 500);
    }
});

router.post('/', optionalAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();
        const user: any = c.get('user');
        
        if (!body.items || body.items.length === 0) {
            return c.json({ error: 'Cart is empty' }, 400);
        }
        
        const orderNumber = await generateOrderNumber(db, store.id);
        
        const subtotal = body.shippingCost + body.items.reduce((acc: number, item: any) => acc + (item.quantity * item.price), 0);
        const total = subtotal;

        // Create Order
        const [insertedOrder] = await db.insert(orders).values({
            storeId: store.id,
            orderNumber,
            userId: user ? user.id : null,
            guestPhone: body.guestPhone || null,
            recipientName: body.recipientName,
            recipientPhone: body.recipientPhone,
            province: body.province || '',
            city: body.city || '',
            district: body.district || '',
            address: body.address,
            shippingType: body.shippingType || 'expedition',
            latitude: body.latitude || null,
            longitude: body.longitude || null,
            courierName: body.courierName || 'Manual',
            shippingCost: body.shippingCost || 0,
            subtotal,
            total,
            status: 'pending'
        }).returning();

        // Insert Items
        const itemsToInsert = body.items.map((item: any) => ({
            orderId: insertedOrder.id,
            productId: item.productId,
            productName: item.productName || 'Unknown',
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
        }));
        await db.insert(orderItems).values(itemsToInsert);

        // Fetch Store Settings for WhatsApp processing
        const allSettings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const getConfig = (key: string) => allSettings.find(s => s.key === key)?.value || '';
        
        const wahaUrl = getConfig('waha_server_url');
        const wahaKey = getConfig('waha_api_key');
        const wahaSession = getConfig('waha_session') || 'default';
        const kasirPhone = getConfig('whatsapp_kasir');
        const storeName = getConfig('store_name') || store.name;

        let whatsappUrl = '';
        let whatsappSent = false;

        const messageText = formatOrderMessage(insertedOrder, itemsToInsert, storeName, body.paymentMethod || 'manual');

        if (kasirPhone) {
            if (wahaUrl && wahaUrl.trim() !== '') {
                // Gunakan WAHA gateway
                const success = await sendWahaMessage(wahaUrl, wahaKey, wahaSession, kasirPhone, messageText);
                if (success) {
                    whatsappSent = true;
                    await db.update(orders).set({ whatsappSent: true }).where(eq(orders.id, insertedOrder.id));
                } else {
                    // Fallback URL jika gateway gagal
                    whatsappUrl = generateWhatsAppUrl(kasirPhone, messageText);
                }
            } else {
                // Tidak ada WAHA, fallback URL
                whatsappUrl = generateWhatsAppUrl(kasirPhone, messageText);
            }
        }

        return c.json({
            success: true,
            order: insertedOrder,
            whatsappUrl,
            whatsappSent
        }, 201);
    } catch (e) {
        console.error('Checkout error:', e);
        return c.json({ error: 'Internal Error' }, 500);
    }
});

/**
 * POST /api/s/:slug/orders/:id/assign-courier (Admin)
 * Assigns a courier to an order and sends WAHA notification or returns fallback WA URL
 */
router.post('/:id/assign-courier', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user: any = c.get('user');
        const orderId = c.req.param('id') as string;
        
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return c.json({ error: 'Forbidden' }, 403);
        }

        const body = await c.req.json();
        const { courierId } = body;
        
        if (!courierId) return c.json({ error: 'courierId required' }, 400);

        // Get Order
        const [order] = await db.select().from(orders).where(
            and(eq(orders.id, orderId), eq(orders.storeId, store.id))
        );
        if (!order) return c.json({ error: 'Order not found' }, 404);

        // Get Courier
        const [courier] = await db.select().from(users).where(
            and(eq(users.id, courierId), eq(users.storeId, store.id), eq(users.role, 'courier'))
        );
        if (!courier) return c.json({ error: 'Courier not found' }, 404);

        // Check if already assigned
        const [existingDelivery] = await db.select().from(courierDeliveries).where(
            and(eq(courierDeliveries.orderId, orderId))
        );
        if (existingDelivery) {
            return c.json({ error: 'Order already has a courier assigned' }, 400);
        }

        // Create Delivery Record
        const [delivery] = await db.insert(courierDeliveries).values({
            storeId: store.id,
            orderId: orderId,
            courierId: courierId,
            status: 'assigned'
        }).returning();

        // Update order status
        await db.update(orders).set({ status: 'on_delivery' }).where(eq(orders.id, orderId));

        // Get Settings for WAHA
        const allSettings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const getConfig = (key: string) => allSettings.find(s => s.key === key)?.value || '';
        
        const wahaUrl = getConfig('waha_server_url');
        const wahaKey = getConfig('waha_api_key');
        const wahaSession = getConfig('waha_session') || 'default';
        const storeName = getConfig('store_name') || store.name;

        // Get Order Items for notification
        const ordItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

        const messageText = formatCourierNotification(order, ordItems, storeName, store.slug);
        
        let whatsappSent = false;
        let whatsappUrl = '';

        if (wahaUrl && wahaUrl.trim() !== '') {
            const success = await sendWahaMessage(wahaUrl, wahaKey, wahaSession, courier.phone, messageText);
            if (success) {
                whatsappSent = true;
            } else {
                whatsappUrl = generateWhatsAppUrl(courier.phone, messageText);
            }
        } else {
            // Manual fallback
            whatsappUrl = generateWhatsAppUrl(courier.phone, messageText);
        }

        return c.json({
            message: 'Courier assigned successfully',
            delivery,
            whatsappSent,
            whatsappUrl
        });

    } catch (e) {
        console.error('Assign courier error:', e);
        return c.json({ error: 'Internal Error' }, 500);
    }
});

export default router;
