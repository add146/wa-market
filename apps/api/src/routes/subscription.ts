import { Hono } from 'hono';
import { getDb } from '../db';
import { stores, subscriptions, platformSettings } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { createXenditInvoice } from '../lib/xendit';
import { createMidtransTransaction } from '../lib/midtrans';
import type { Env } from '../index';

type Variables = { user: any };
const router = new Hono<{ Bindings: Env; Variables: Variables }>();

const SUBSCRIPTION_PRICE = 300000; // Rp 300.000/tahun

/**
 * POST /api/subscription/create
 * Store owner creates a subscription payment.
 * Body: { storeId, plan, provider }
 */
router.post('/create', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user: any = c.get('user');
        const { storeId, plan, provider } = await c.req.json();

        if (!storeId || !plan || !provider) {
            return c.json({ error: 'storeId, plan, and provider required' }, 400);
        }
        if (!['starter', 'pro'].includes(plan)) {
            return c.json({ error: 'Plan must be starter or pro' }, 400);
        }
        if (!['xendit', 'midtrans', 'manual'].includes(provider)) {
            return c.json({ error: 'Provider must be xendit, midtrans, or manual' }, 400);
        }

        // Verify store ownership
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
        if (!store) return c.json({ error: 'Store not found' }, 404);

        // For manual payment, just create a pending subscription record
        if (provider === 'manual') {
            const [sub] = await db.insert(subscriptions).values({
                storeId,
                plan,
                provider: 'manual',
                amount: SUBSCRIPTION_PRICE,
                status: 'pending',
            }).returning();

            return c.json({
                success: true,
                subscription: sub,
                message: 'Silakan transfer Rp 300.000 dan kirim bukti pembayaran ke admin via WhatsApp.',
            });
        }

        const origin = c.req.header('origin') || c.req.header('referer')?.replace(/\/[^/]*$/, '') || '';
        let paymentUrl = '';
        let externalId = '';

        if (provider === 'xendit') {
            const settingsRaw = await db.select().from(platformSettings);
            const pSet = settingsRaw.find(s => s.key === 'xendit_platform_secret_key');
            const secretKey = pSet?.value || (c.env as any).XENDIT_PLATFORM_SECRET_KEY;
            
            if (!secretKey) return c.json({ error: 'Platform Xendit key not configured' }, 500);

            const result = await createXenditInvoice(secretKey, {
                externalId: `sub-${store.slug}-${Date.now()}`,
                amount: SUBSCRIPTION_PRICE,
                description: `Langganan ${plan.toUpperCase()} WA Market — ${store.name} (1 tahun)`,
                successRedirectUrl: `${origin}/subscription?status=success`,
                failureRedirectUrl: `${origin}/subscription?status=failed`,
            });

            if (!result.success || !result.data) {
                return c.json({ error: result.error || 'Failed to create invoice' }, 500);
            }
            paymentUrl = result.data.invoice_url;
            externalId = result.data.id;

        } else if (provider === 'midtrans') {
            const settingsRaw = await db.select().from(platformSettings);
            const pSet = settingsRaw.find(s => s.key === 'midtrans_platform_server_key');
            const serverKey = pSet?.value || (c.env as any).MIDTRANS_PLATFORM_SERVER_KEY;
            
            if (!serverKey) return c.json({ error: 'Platform Midtrans key not configured' }, 500);

            const result = await createMidtransTransaction(serverKey, {
                orderId: `sub-${store.slug}-${Date.now()}`,
                grossAmount: SUBSCRIPTION_PRICE,
                customerFirstName: user.name || store.name,
                customerPhone: user.phone,
                callbacks: {
                    finish: `${origin}/subscription?status=success`,
                },
            });

            if (!result.success || !result.data) {
                return c.json({ error: result.error || 'Failed to create transaction' }, 500);
            }
            paymentUrl = result.data.redirect_url;
            externalId = result.data.token;
        }

        // Save subscription record
        const [sub] = await db.insert(subscriptions).values({
            storeId,
            plan,
            provider,
            externalId,
            paymentUrl,
            amount: SUBSCRIPTION_PRICE,
            status: 'pending',
        }).returning();

        return c.json({ success: true, paymentUrl, subscriptionId: sub.id });
    } catch (e: any) {
        console.error('Subscription create error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

/**
 * POST /api/subscription/webhook/xendit
 * Platform-level Xendit webhook for subscription payments
 */
router.post('/webhook/xendit', async (c) => {
    try {
        const db = getDb(c.env);
        const body = await c.req.json();

        const xenditId = body.id;
        const xenditStatus = body.status;

        const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.externalId, xenditId));
        if (!sub) {
            console.warn('Subscription not found for Xendit id:', xenditId);
            return c.json({ message: 'Not found, ignored' });
        }

        if (xenditStatus === 'PAID' || xenditStatus === 'SETTLED') {
            const now = new Date();
            const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

            await db.update(subscriptions).set({
                status: 'paid',
                paidAt: now,
                periodStart: now,
                periodEnd: oneYearLater,
                rawResponse: JSON.stringify(body),
            }).where(eq(subscriptions.id, sub.id));

            // Upgrade store plan
            await db.update(stores).set({ plan: sub.plan }).where(eq(stores.id, sub.storeId));
        } else if (xenditStatus === 'EXPIRED') {
            await db.update(subscriptions).set({
                status: 'expired',
                rawResponse: JSON.stringify(body),
            }).where(eq(subscriptions.id, sub.id));
        }

        return c.json({ message: 'Webhook processed' });
    } catch (e: any) {
        console.error('Subscription xendit webhook error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

/**
 * POST /api/subscription/webhook/midtrans
 * Platform-level Midtrans webhook for subscription payments
 */
router.post('/webhook/midtrans', async (c) => {
    try {
        const db = getDb(c.env);
        const body = await c.req.json();

        // Find subscription by matching order_id pattern
        const allSubs = await db.select().from(subscriptions).where(eq(subscriptions.provider, 'midtrans'));
        const sub = allSubs.find((s: any) => body.order_id && body.order_id.includes('sub-'));
        if (!sub) {
            console.warn('Subscription not found for Midtrans order_id:', body.order_id);
            return c.json({ message: 'Not found, ignored' });
        }

        const txStatus = body.transaction_status;
        if (txStatus === 'capture' || txStatus === 'settlement') {
            const now = new Date();
            const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

            await db.update(subscriptions).set({
                status: 'paid',
                paidAt: now,
                periodStart: now,
                periodEnd: oneYearLater,
                rawResponse: JSON.stringify(body),
            }).where(eq(subscriptions.id, sub.id));

            await db.update(stores).set({ plan: sub.plan }).where(eq(stores.id, sub.storeId));
        } else if (txStatus === 'expire') {
            await db.update(subscriptions).set({
                status: 'expired',
                rawResponse: JSON.stringify(body),
            }).where(eq(subscriptions.id, sub.id));
        }

        return c.json({ message: 'Webhook processed' });
    } catch (e: any) {
        console.error('Subscription midtrans webhook error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

/**
 * GET /api/subscription/status/:storeId
 * Check subscription status for a store
 */
router.get('/status/:storeId', async (c) => {
    try {
        const db = getDb(c.env);
        const storeId = c.req.param('storeId') as string;

        const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
        if (!store) return c.json({ error: 'Store not found' }, 404);

        // Get most recent subscription
        const subs = await db.select().from(subscriptions)
            .where(eq(subscriptions.storeId, storeId))
            .orderBy(desc(subscriptions.createdAt))
            .limit(5);

        const activeSub = subs.find((s: any) => s.status === 'paid' && s.periodEnd && new Date(s.periodEnd) > new Date());

        return c.json({
            storeName: store.name,
            currentPlan: store.plan,
            activeSubscription: activeSub || null,
            recentSubscriptions: subs,
            price: SUBSCRIPTION_PRICE,
        });
    } catch (e: any) {
        console.error('Subscription status error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

export default router;
