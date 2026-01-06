import { Router, Request, Response } from 'express';
import { db } from '../db';
import {
    orders,
    orderItems,
    cartItems,
    products,
    storeSettings,
    shippingOptions,
    coupons
} from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware';
import { formatOrderMessage, generateWhatsAppUrl } from '../lib/whatsapp';

const router = Router();

/**
 * Standardize phone number to Indonesian format (62)
 * Removes leading 0 and adds 62 prefix if not present
 */
function standardizePhone(phone: string): string {
    // Remove non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Remove + prefix if present
    cleaned = cleaned.replace(/^\+/, '');
    // If starts with 0, replace with 62
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    // If doesn't start with 62, add it
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

// Validation schemas
const createOrderSchema = z.object({
    // Recipient info
    recipientName: z.string().min(2).max(100),
    recipientPhone: z.string().min(10).max(20),
    province: z.string().max(100).optional().default(''),
    city: z.string().max(100).optional().default(''),
    district: z.string().max(100).optional().default(''),
    address: z.string().min(5),

    // Shipping
    shippingOptionId: z.string().optional(), // Can be UUID or courier code like "jne-REG"
    courierName: z.string().min(2).max(100),
    shippingCost: z.number().int().min(0),

    // Coupon
    couponCode: z.string().max(50).optional().nullable(),

    // Guest info (for non-logged in users)
    guestPhone: z.string().min(10).max(20).optional(),
    guestEmail: z.string().email().optional(),

    // Items for guest checkout
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        variantInfo: z.string().optional(),
    })).optional(),
});

/**
 * Generate unique order number (short & simple: WA + 5 chars)
 * Example: WA4K7M2, WA9X3L8
 */
function generateOrderNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    let rand = '';
    for (let i = 0; i < 5; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `WA${rand}`;
}

/**
 * GET /api/orders
 * Get orders - user's own or all for admin
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { status, limit = '20', offset = '0' } = req.query;

        let query;

        if (user.role === 'admin') {
            // Admin sees all orders
            query = db.select().from(orders)
                .orderBy(desc(orders.createdAt))
                .limit(Number(limit))
                .offset(Number(offset));
        } else {
            // Customer sees only their orders
            query = db.select().from(orders)
                .where(eq(orders.userId, user.id))
                .orderBy(desc(orders.createdAt))
                .limit(Number(limit))
                .offset(Number(offset));
        }

        const result = await query;

        res.json({
            orders: result,
            pagination: {
                limit: Number(limit),
                offset: Number(offset),
                total: result.length,
            },
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/orders/:id
 * Get order details with items
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { id } = req.params;

        const [order] = await db.select().from(orders).where(eq(orders.id, id));

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Check authorization
        if (user.role !== 'admin' && order.userId !== user.id) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // Get order items
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

        res.json({
            ...order,
            items,
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/orders
 * Create order (checkout) - supports guest checkout
 */
router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const validation = createOrderSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const data = validation.data;
        const userId = req.user?.id;

        let orderItemsData: Array<{
            productId: string;
            productName: string;
            variantInfo?: string;
            price: number;
            costPrice: number;
            quantity: number;
            subtotal: number;
        }> = [];

        // Get items from cart (logged in user) or from request body (guest)
        if (userId) {
            // Get cart items for logged in user
            const cartItemsResult = await db.select({
                productId: cartItems.productId,
                quantity: cartItems.quantity,
                product: products,
            })
                .from(cartItems)
                .leftJoin(products, eq(cartItems.productId, products.id))
                .where(eq(cartItems.userId, userId));

            if (cartItemsResult.length === 0) {
                res.status(400).json({ error: 'Cart is empty' });
                return;
            }

            orderItemsData = cartItemsResult.map(item => ({
                productId: item.productId,
                productName: item.product?.name || 'Unknown Product',
                price: item.product?.price || 0,
                costPrice: item.product?.costPrice || 0,
                quantity: item.quantity,
                subtotal: (item.product?.price || 0) * item.quantity,
            }));
        } else {
            // Guest checkout - items from request
            if (!data.items || data.items.length === 0) {
                res.status(400).json({ error: 'Items required for guest checkout' });
                return;
            }

            if (!data.guestPhone) {
                res.status(400).json({ error: 'Guest phone required for guest checkout' });
                return;
            }

            // Get product details
            for (const item of data.items) {
                const [product] = await db.select().from(products).where(eq(products.id, item.productId));
                if (product) {
                    orderItemsData.push({
                        productId: item.productId,
                        productName: product.name,
                        variantInfo: item.variantInfo,
                        price: product.price,
                        costPrice: product.costPrice || 0,
                        quantity: item.quantity,
                        subtotal: product.price * item.quantity,
                    });
                }
            }
        }

        // Calculate totals
        const subtotal = orderItemsData.reduce((sum, item) => sum + item.subtotal, 0);
        const productDiscount = 0; // Calculate based on product discounts if needed
        let couponDiscount = 0;

        // Validate coupon if provided
        if (data.couponCode) {
            const [coupon] = await db.select().from(coupons)
                .where(and(eq(coupons.code, data.couponCode), eq(coupons.isActive, true)));

            if (coupon && subtotal >= (coupon.minPurchase || 0)) {
                if (coupon.discountType === 'percentage') {
                    couponDiscount = Math.floor(subtotal * coupon.discountValue / 100);
                    if (coupon.maxDiscount) {
                        couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
                    }
                } else {
                    couponDiscount = coupon.discountValue;
                }
            }
        }

        // Generate unique code (last 3 digits for transfer)
        const uniqueCode = Math.floor(Math.random() * 900) + 100;

        // Calculate total
        const total = subtotal - productDiscount - couponDiscount + data.shippingCost + uniqueCode;

        // Create order
        const [newOrder] = await db.insert(orders).values({
            orderNumber: generateOrderNumber(),
            userId: userId || null,
            guestPhone: data.guestPhone ? standardizePhone(data.guestPhone) : undefined,
            guestEmail: data.guestEmail,
            recipientName: data.recipientName,
            recipientPhone: standardizePhone(data.recipientPhone),
            province: data.province,
            city: data.city,
            district: data.district,
            address: data.address,
            // Note: shippingOptionId removed as we now use RajaOngkir courier codes dynamically
            courierName: data.courierName,
            shippingCost: data.shippingCost,
            subtotal,
            productDiscount,
            couponCode: data.couponCode || null,
            couponDiscount,
            uniqueCode,
            total,
            status: 'pending',
        }).returning();

        // Create order items
        const insertedItems = await db.insert(orderItems).values(
            orderItemsData.map(item => ({
                orderId: newOrder.id,
                ...item,
            }))
        ).returning();

        // Clear cart for logged in user
        if (userId) {
            await db.delete(cartItems).where(eq(cartItems.userId, userId));
        }

        // Get WhatsApp Kasir number
        const [kasirSetting] = await db.select()
            .from(storeSettings)
            .where(eq(storeSettings.key, 'whatsapp_kasir'));

        const kasirPhone = kasirSetting?.value || process.env.ADMIN_WHATSAPP_KASIR || '6281234567890';

        // Get store name for WhatsApp message
        const [storeNameSetting] = await db.select()
            .from(storeSettings)
            .where(eq(storeSettings.key, 'store_name'));

        const storeName = storeNameSetting?.value || 'TokoIndo';

        // Generate WhatsApp message
        const message = formatOrderMessage(newOrder, insertedItems, storeName);
        const whatsappUrl = generateWhatsAppUrl(kasirPhone, message);

        res.status(201).json({
            order: newOrder,
            items: insertedItems,
            whatsappUrl,
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/orders/:id/approve
 * Approve order (Admin only)
 */
router.patch('/:id/approve', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [updated] = await db.update(orders)
            .set({ status: 'approved', updatedAt: new Date() })
            .where(eq(orders.id, id))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json({ message: 'Order approved', order: updated });
    } catch (error) {
        console.error('Approve order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status (Admin only)
 */
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'approved', 'shipped', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: 'Invalid status. Must be: pending, approved, shipped, completed, cancelled' });
            return;
        }

        const [updated] = await db.update(orders)
            .set({ status, updatedAt: new Date() })
            .where(eq(orders.id, id))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json({ message: 'Order status updated', order: updated });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/orders/:id
 * Cancel/Delete order (Admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [deleted] = await db.delete(orders).where(eq(orders.id, id)).returning();

        if (!deleted) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
