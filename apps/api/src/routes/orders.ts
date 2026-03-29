import { Hono } from 'hono';
import { getDb } from '../db';
import { orders, orderItems, products, storeSettings, users, courierDeliveries } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { authMiddleware, optionalAuthMiddleware, hashPassword } from '../middleware/auth';
import { formatOrderMessage, sendWahaMessage, generateWhatsAppUrl, formatCourierNotification, formatDigitalDeliveryMessage, formatStatusChangeNotification } from '../lib/whatsapp';
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
        
        const userIdParam = c.req.query('userId');

        let query;
        if (user.role === 'admin' || user.role === 'superadmin') {
            let whereCond = eq(orders.storeId, store.id);
            if (userIdParam) {
                whereCond = and(whereCond, eq(orders.userId, userIdParam)) as any;
            }
            query = db.select().from(orders).where(whereCond)
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

router.get('/:id/items', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const orderId = c.req.param('id') as string;
        
        if (!orderId) return c.json({ error: 'Order ID is required' }, 400);

        // Verify order belongs to store
        const [order] = await db.select().from(orders).where(
            and(eq(orders.id, orderId), eq(orders.storeId, store.id))
        );
        if (!order) return c.json({ error: 'Order not found' }, 404);

        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        return c.json({ items });
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

        // Fetch products to check for 'digital' and 'preorder' types
        const productIds = body.items.map((item: any) => item.productId);
        const productsInCart = await db.select().from(products).where(inArray(products.id, productIds));
        
        let hasDigitalItems = false;
        let hasPreorderItems = false;
        let maxPreorderDays = 0;

        for (const p of productsInCart) {
            if (p.productType === 'digital') {
                hasDigitalItems = true;
            } else if (p.productType === 'preorder') {
                hasPreorderItems = true;
                if (p.preorderDays && p.preorderDays > maxPreorderDays) {
                    maxPreorderDays = p.preorderDays;
                }
            }
        }

        let orderUserId = user ? user.id : null;
        let generatedPassword = null;
        let orderPhone = body.guestPhone || body.recipientPhone;

        const standardizePhone = (p: string): string => {
            let cleaned = p.replace(/[^\d+]/g, '');
            cleaned = cleaned.replace(/^\+/, '');
            if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
            if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
            return cleaned;
        };

        if (!user && orderPhone) {
            const cleanPhone = standardizePhone(orderPhone);
            const [existingUser] = await db.select().from(users).where(
                and(eq(users.phone, cleanPhone), eq(users.storeId, store.id))
            );
            if (existingUser) {
                orderUserId = existingUser.id;
            } else {
                generatedPassword = Math.floor(1000 + Math.random() * 9000).toString();
                const hashedPwd = await hashPassword(generatedPassword);
                const [newUser] = await db.insert(users).values({
                    storeId: store.id,
                    phone: cleanPhone,
                    password: hashedPwd,
                    name: body.recipientName || 'Pelanggan',
                    role: 'customer',
                    initialPassword: generatedPassword
                }).returning();
                orderUserId = newUser.id;
            }
        }

        // Create Order
        const [insertedOrder] = await db.insert(orders).values({
            storeId: store.id,
            orderNumber,
            userId: orderUserId,
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
            status: 'pending',
            paymentMethod: body.paymentMethod === 'cod' ? 'cod' : 'whatsapp',
            deliverySlot: body.deliverySlot || null,
            hasDigitalItems,
            hasPreorderItems,
            maxPreorderDays,
            digitalDeliveryStatus: hasDigitalItems ? 'pending' : null,
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

        const messageText = formatOrderMessage(
            insertedOrder, 
            itemsToInsert, 
            storeName, 
            body.paymentMethod || 'manual',
            generatedPassword ? { phone: standardizePhone(orderPhone), password: generatedPassword } : undefined
        );

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
    } catch (e: any) {
        console.error('Checkout error:', e);
        if (e.message && e.message.includes('FOREIGN KEY constraint failed')) {
            return c.json({ error: 'Beberapa produk di keranjang Anda sudah dihapus oleh Admin. Silakan bersihkan keranjang Anda dan coba pesan kembali.' }, 400);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
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
        
        let delivery;
        if (existingDelivery) {
            // Update existing delivery
            const updated = await db.update(courierDeliveries).set({
                courierId: courierId,
                status: 'assigned',
                pickedUpAt: null,
                deliveredAt: null,
                notes: null,
                photoUrl: null,
                assignedAt: new Date()
            }).where(eq(courierDeliveries.id, existingDelivery.id)).returning();
            delivery = updated[0];
        } else {
            // Create Delivery Record
            const inserted = await db.insert(courierDeliveries).values({
                storeId: store.id,
                orderId: orderId,
                courierId: courierId,
                status: 'assigned'
            }).returning();
            delivery = inserted[0];
        }

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

/**
 * PATCH /api/s/:slug/orders/:id/deliver-digital (Admin)
 * Sends digital product content to the buyer via WhatsApp/Email
 */
router.patch('/:id/deliver-digital', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user: any = c.get('user');
        const orderId = c.req.param('id') as string;
        
        if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'seller') {
            return c.json({ error: 'Forbidden' }, 403);
        }

        // Get Order
        const [order] = await db.select().from(orders).where(
            and(eq(orders.id, orderId), eq(orders.storeId, store.id))
        );
        if (!order) return c.json({ error: 'Order not found' }, 404);

        if (!order.hasDigitalItems) {
            return c.json({ error: 'Order does not contain digital items' }, 400);
        }

        // Get Order Items and associated products for digital content
        const ordItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        const productIds = ordItems.map(item => item.productId);
        const productsInOrder = await db.select().from(products).where(inArray(products.id, productIds));

        // Get Settings for WAHA
        const allSettings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const getConfig = (key: string) => allSettings.find(s => s.key === key)?.value || '';
        
        const wahaUrl = getConfig('waha_server_url');
        const wahaKey = getConfig('waha_api_key');
        const wahaSession = getConfig('waha_session') || 'default';
        const storeName = getConfig('store_name') || store.name;
        
        // Prepare digital payload
        const digitalContents = productsInOrder
            .filter(p => p.productType === 'digital')
            .map(p => ({ name: p.name, content: p.digitalContent || 'Konten akan dikirimkan secara terpisah/menyusul.' }));

        const messageText = formatDigitalDeliveryMessage(order, digitalContents, storeName);
        
        let whatsappSent = false;
        let whatsappUrl = '';
        
        // Only send if phone exists
        if (order.recipientPhone) {
            if (wahaUrl && wahaUrl.trim() !== '') {
                const success = await sendWahaMessage(wahaUrl, wahaKey, wahaSession, order.recipientPhone, messageText);
                if (success) {
                    whatsappSent = true;
                } else {
                    whatsappUrl = generateWhatsAppUrl(order.recipientPhone, messageText);
                }
            } else {
                whatsappUrl = generateWhatsAppUrl(order.recipientPhone, messageText);
            }
        }

        // Update digital status
        await db.update(orders).set({ digitalDeliveryStatus: 'sent' }).where(eq(orders.id, orderId));

        return c.json({
            message: 'Digital delivery processed',
            whatsappSent,
            whatsappUrl
        });

    } catch (e) {
        console.error('Deliver digital error:', e);
        return c.json({ error: 'Internal Error' }, 500);
    }
});

/**
 * PATCH /api/s/:slug/orders/:id/status (Admin)
 */
router.patch('/:id/status', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user: any = c.get('user');
        const orderId = c.req.param('id') as string;
        const body = await c.req.json();
        const { status } = body;

        if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'seller') {
            return c.json({ error: 'Forbidden' }, 403);
        }

        const [order] = await db.select().from(orders).where(
            and(eq(orders.id, orderId), eq(orders.storeId, store.id))
        );
        if (!order) return c.json({ error: 'Order not found' }, 404);

        await db.update(orders).set({ status }).where(eq(orders.id, orderId));

        // Send WhatsApp notification for status change
        const allSettings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const getConfig = (key: string) => allSettings.find(s => s.key === key)?.value || '';
        const storeName = getConfig('store_name') || store.name;
        
        const wahaUrl = getConfig('waha_server_url');
        const wahaKey = getConfig('waha_api_key');
        const wahaSession = getConfig('waha_session') || 'default';

        let whatsappSent = false;
        let whatsappUrl = '';

        if (order.recipientPhone) {
            const updatedOrder = { ...order, status };
            const message = formatStatusChangeNotification(updatedOrder as any, storeName);
            
            if (wahaUrl && wahaUrl.trim() !== '') {
                whatsappSent = await sendWahaMessage(wahaUrl, wahaKey, wahaSession, order.recipientPhone, message);
            }
            whatsappUrl = generateWhatsAppUrl(order.recipientPhone, message);
        }

        return c.json({ success: true, whatsappSent, whatsappUrl });
    } catch (e) {
        console.error('Update status error:', e);
        return c.json({ error: 'Internal Error' }, 500);
    }
});

/**
 * PATCH /api/s/:slug/orders/:id/approve (Admin)
 */
router.patch('/:id/approve', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user: any = c.get('user');
        const orderId = c.req.param('id') as string;

        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return c.json({ error: 'Forbidden' }, 403);
        }

        await db.update(orders).set({ status: 'approved' }).where(
            and(eq(orders.id, orderId), eq(orders.storeId, store.id))
        );

        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: 'Internal Error' }, 500);
    }
});

/**
 * DELETE /api/s/:slug/orders/:id (Admin)
 */
router.delete('/:id', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user: any = c.get('user');
        const orderId = c.req.param('id') as string;

        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return c.json({ error: 'Forbidden' }, 403);
        }

        // Delete items first
        await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
        // Delete order
        await db.delete(orders).where(
            and(eq(orders.id, orderId), eq(orders.storeId, store.id))
        );

        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: 'Internal Error' }, 500);
    }
});

export default router;
