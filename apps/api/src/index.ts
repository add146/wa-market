import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { storeMiddleware } from './middleware/store';

import storesRouter from './routes/stores';
import superadminRouter from './routes/superadmin';
import resolverRouter from './routes/resolver';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import settingsRouter from './routes/settings';
import ordersRouter from './routes/orders';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import courierDeliveriesRouter from './routes/couriers';
import paymentRouter from './routes/payment';
import subscriptionRouter from './routes/subscription';
import wishlistsRouter from './routes/wishlists';
import shippingRouter from './routes/shipping';
import shippingOptionsRouter from './routes/shipping-options';
import customersRouter from './routes/customers';

export type Env = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
};

type Variables = {
  store: any;
  user: any;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS — izinkan semua origin yang relevan
app.use('*', cors({
    origin: (origin) => {
        return origin || '*';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
}));

// Global / Platform Routes
app.route('/api/stores', storesRouter);
app.route('/api/superadmin', superadminRouter);
app.route('/api/resolver', resolverRouter);
app.route('/api/subscription', subscriptionRouter);

// Global Upload Route
app.route('/api/upload', uploadRouter);

// Store-Scoped Routes
app.use('/api/s/:slug/*', storeMiddleware);

app.route('/api/s/:slug/auth', authRouter);
app.route('/api/s/:slug/settings', settingsRouter);
app.route('/api/s/:slug/orders', ordersRouter);
app.route('/api/s/:slug/products', productsRouter);
app.route('/api/s/:slug/categories', categoriesRouter);
app.route('/api/s/:slug/couriers', courierDeliveriesRouter);
app.route('/api/s/:slug/payment', paymentRouter);
app.route('/api/s/:slug/wishlists', wishlistsRouter);
app.route('/api/s/:slug/shipping', shippingRouter);
app.route('/api/s/:slug/shipping-options', shippingOptionsRouter);
app.route('/api/s/:slug/customers', customersRouter);

// Serve R2 files
app.get('/uploads/:filename', async (c) => {
    try {
        const filename = c.req.param('filename');
        const object = await c.env.MEDIA_BUCKET.get(filename);
        if (!object) return new Response('Not found', { status: 404 });
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('cache-control', 'public, max-age=31536000');
        return new Response(object.body, { headers });
    } catch {
        return new Response('Error', { status: 500 });
    }
});

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', worker: true, architecture: 'multitenant' }));

// 404
app.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default app;
