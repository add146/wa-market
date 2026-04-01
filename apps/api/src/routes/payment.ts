import { Hono } from 'hono';
import { getDb } from '../db';
import { orders, payments, storeSettings } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createXenditInvoice, verifyXenditWebhook } from '../lib/xendit';
import { createMidtransTransaction, verifyMidtransSignature } from '../lib/midtrans';
import { grantDigitalAccess } from '../lib/digital_access';
import type { Env } from '../index';

type Variables = { store: any; user: any };
const router = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * POST /api/s/:slug/payment/create
 * Create a payment invoice for an order via Xendit or Midtrans.
 * Reads API keys from store_settings.
 */
router.post('/create', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const { orderId, provider, paymentType = 'full' } = await c.req.json();

        if (!orderId || !provider) {
            return c.json({ error: 'orderId and provider are required' }, 400);
        }
        if (!['xendit', 'midtrans'].includes(provider)) {
            return c.json({ error: 'Provider must be xendit or midtrans' }, 400);
        }

        // Fetch the order
        const [order] = await db.select().from(orders).where(
            and(eq(orders.id, orderId), eq(orders.storeId, store.id))
        );
        if (!order) return c.json({ error: 'Order not found' }, 404);

        // Fetch store settings for API keys
        const allSettings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const getConfig = (key: string) => allSettings.find((s: any) => s.key === key)?.value || '';

        const storeName = getConfig('store_name') || store.name;

        // Determine base URL for redirects
        const origin = c.req.header('origin') || c.req.header('referer')?.replace(/\/[^/]*$/, '') || '';

        let amountToPay = order.total;
        if (paymentType === 'dp') amountToPay = order.dpAmount || 0;
        if (paymentType === 'settlement') amountToPay = order.settlementAmount || 0;

        let paymentUrl = '';
        let externalId = '';

        if (provider === 'xendit') {
            const secretKey = getConfig('xendit_secret_key');
            if (!secretKey) return c.json({ error: 'Xendit API key not configured' }, 400);

            const result = await createXenditInvoice(secretKey, {
                externalId: `${store.slug}-${order.orderNumber}-${paymentType}`,
                amount: amountToPay,
                description: `Pesanan ${order.orderNumber} ${paymentType === 'dp' ? '(DP)' : paymentType === 'settlement' ? '(Pelunasan)' : ''} di ${storeName}`,
                successRedirectUrl: `${origin}/payment-status/${order.id}`,
                failureRedirectUrl: `${origin}/payment-status/${order.id}`,
            });

            if (!result.success || !result.data) {
                return c.json({ error: result.error || 'Failed to create Xendit invoice' }, 500);
            }
            paymentUrl = result.data.invoice_url;
            externalId = result.data.id;

        } else if (provider === 'midtrans') {
            const serverKey = getConfig('midtrans_server_key');
            if (!serverKey) return c.json({ error: 'Midtrans Server Key not configured' }, 400);

            const result = await createMidtransTransaction(serverKey, {
                orderId: `${store.slug}-${order.orderNumber}-${paymentType}`,
                grossAmount: amountToPay,
                customerFirstName: order.recipientName,
                customerPhone: order.recipientPhone,
                callbacks: {
                    finish: `${origin}/payment-status/${order.id}`,
                },
            });

            if (!result.success || !result.data) {
                return c.json({ error: result.error || 'Failed to create Midtrans transaction' }, 500);
            }
            paymentUrl = result.data.redirect_url;
            externalId = result.data.token;
        }

        // Save payment record
        const [payment] = await db.insert(payments).values({
            storeId: store.id,
            orderId: order.id,
            provider,
            externalId,
            paymentUrl,
            amount: amountToPay,
            status: 'pending',
        }).returning();

        // Update order payment method
        await db.update(orders).set({
            paymentMethod: provider,
            paymentStatus: 'unpaid',
        }).where(eq(orders.id, order.id));

        return c.json({ success: true, paymentUrl, paymentId: payment.id });
    } catch (e: any) {
        console.error('Payment create error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

/**
 * POST /api/s/:slug/payment/webhook/xendit
 * Xendit callback — public, no auth needed
 */
router.post('/webhook/xendit', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();

        // Optional: verify callback token
        const callbackToken = c.req.header('x-callback-token') || '';
        const allSettings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const expectedToken = allSettings.find((s: any) => s.key === 'xendit_webhook_token')?.value || '';
        if (expectedToken && !verifyXenditWebhook(callbackToken, expectedToken)) {
            return c.json({ error: 'Invalid callback token' }, 401);
        }

        const xenditExternalId = body.external_id;
        const xenditStatus = body.status; // PAID, EXPIRED, etc.

        // Find payment record
        const [payment] = await db.select().from(payments).where(
            and(eq(payments.externalId, body.id), eq(payments.storeId, store.id))
        );

        if (!payment) {
            // Try by external_id pattern match
            console.warn('Payment not found by externalId:', body.id);
            return c.json({ message: 'Payment not found, ignored' });
        }

        let newStatus: string = 'pending';
        if (xenditStatus === 'PAID' || xenditStatus === 'SETTLED') {
            newStatus = 'paid';
        } else if (xenditStatus === 'EXPIRED') {
            newStatus = 'expired';
        }

        // Update payment
        await db.update(payments).set({
            status: newStatus,
            paidAt: newStatus === 'paid' ? new Date() : null,
            rawResponse: JSON.stringify(body),
        }).where(eq(payments.id, payment.id));

        // Update order
        if (newStatus === 'paid') {
            const [orderObj] = await db.select().from(orders).where(eq(orders.id, payment.orderId));
            if (orderObj) {
                if (orderObj.hasServiceItems) {
                    if (payment.amount === orderObj.dpAmount) {
                        await db.update(orders).set({
                            serviceStatus: 'dp_paid',
                            dpPaidAt: new Date() as any,
                            paymentStatus: 'dp_paid',
                        }).where(eq(orders.id, payment.orderId));
                    } else if (payment.amount === orderObj.settlementAmount) {
                        await db.update(orders).set({
                            serviceStatus: 'settled',
                            settlementPaidAt: new Date() as any,
                            paymentStatus: 'paid',
                            status: 'completed'
                        }).where(eq(orders.id, payment.orderId));
                        if (orderObj.userId) await grantDigitalAccess(db, store.id, orderObj.id, orderObj.userId);
                    }
                } else {
                    await db.update(orders).set({
                        paymentStatus: 'paid',
                        status: 'processing',
                    }).where(eq(orders.id, payment.orderId));
                    if (orderObj.userId) await grantDigitalAccess(db, store.id, orderObj.id, orderObj.userId);
                }
            }
        } else if (newStatus === 'expired') {
            await db.update(orders).set({
                paymentStatus: 'expired',
            }).where(eq(orders.id, payment.orderId));
        }

        return c.json({ message: 'Webhook processed' });
    } catch (e: any) {
        console.error('Xendit webhook error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

/**
 * POST /api/s/:slug/payment/webhook/midtrans
 * Midtrans notification handler — public, no auth needed
 */
router.post('/webhook/midtrans', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();

        const allSettings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const serverKey = allSettings.find((s: any) => s.key === 'midtrans_server_key')?.value || '';

        // Verify signature
        if (serverKey && body.signature_key) {
            const valid = await verifyMidtransSignature(
                body.order_id, body.status_code, body.gross_amount, serverKey, body.signature_key
            );
            if (!valid) {
                return c.json({ error: 'Invalid signature' }, 401);
            }
        }

        // Find payment by externalId (token) — we stored the Snap token
        // Midtrans sends order_id which is our external pattern
        const allPayments = await db.select().from(payments).where(eq(payments.storeId, store.id));
        const payment = allPayments.find(
            (p: any) => body.order_id && body.order_id.includes(store.slug)
        );

        if (!payment) {
            console.warn('Midtrans payment not found for order_id:', body.order_id);
            return c.json({ message: 'Payment not found, ignored' });
        }

        let newStatus: string = 'pending';
        const txStatus = body.transaction_status;
        if (txStatus === 'capture' || txStatus === 'settlement') {
            newStatus = 'paid';
        } else if (txStatus === 'expire') {
            newStatus = 'expired';
        } else if (txStatus === 'deny' || txStatus === 'cancel') {
            newStatus = 'failed';
        }

        await db.update(payments).set({
            status: newStatus,
            paidAt: newStatus === 'paid' ? new Date() : null,
            rawResponse: JSON.stringify(body),
        }).where(eq(payments.id, payment.id));

        if (newStatus === 'paid') {
            const [orderObj] = await db.select().from(orders).where(eq(orders.id, payment.orderId));
            if (orderObj) {
                if (orderObj.hasServiceItems) {
                    if (payment.amount === orderObj.dpAmount) {
                        await db.update(orders).set({
                            serviceStatus: 'dp_paid',
                            dpPaidAt: new Date() as any,
                            paymentStatus: 'dp_paid',
                        }).where(eq(orders.id, payment.orderId));
                    } else if (payment.amount === orderObj.settlementAmount) {
                        await db.update(orders).set({
                            serviceStatus: 'settled',
                            settlementPaidAt: new Date() as any,
                            paymentStatus: 'paid',
                            status: 'completed'
                        }).where(eq(orders.id, payment.orderId));
                        if (orderObj.userId) await grantDigitalAccess(db, store.id, orderObj.id, orderObj.userId);
                    }
                } else {
                    await db.update(orders).set({
                        paymentStatus: 'paid',
                        status: 'processing',
                    }).where(eq(orders.id, payment.orderId));
                    if (orderObj.userId) await grantDigitalAccess(db, store.id, orderObj.id, orderObj.userId);
                }
            }
        } else if (newStatus === 'expired') {
            await db.update(orders).set({
                paymentStatus: 'expired',
            }).where(eq(orders.id, payment.orderId));
        }

        return c.json({ message: 'Webhook processed' });
    } catch (e: any) {
        console.error('Midtrans webhook error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

/**
 * GET /api/s/:slug/payment/status/:orderId
 * Check payment status for an order
 */
router.get('/status/:orderId', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const orderId = c.req.param('orderId') as string;

        const [order] = await db.select().from(orders).where(
            and(eq(orders.id, orderId), eq(orders.storeId, store.id))
        );
        if (!order) return c.json({ error: 'Order not found' }, 404);

        const [payment] = await db.select().from(payments)
            .where(and(eq(payments.orderId, orderId), eq(payments.storeId, store.id)))
            .orderBy(desc(payments.createdAt));

        return c.json({
            orderNumber: order.orderNumber,
            total: order.total,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.status,
            hasServiceItems: order.hasServiceItems,
            serviceStatus: order.serviceStatus,
            dpAmount: order.dpAmount,
            settlementAmount: order.settlementAmount,
            payment: payment ? {
                provider: payment.provider,
                status: payment.status,
                paymentUrl: payment.paymentUrl,
                paidAt: payment.paidAt,
            } : null,
        });
    } catch (e: any) {
        console.error('Payment status error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

export default router;
