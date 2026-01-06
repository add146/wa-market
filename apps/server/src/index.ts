import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';

// Import routes
import {
    authRoutes,
    productsRoutes,
    categoriesRoutes,
    cartRoutes,
    ordersRoutes,
    wishlistsRoutes,
    reviewsRoutes,
    inventoryRoutes,
    settingsRoutes,
    shippingRoutes,
    couponsRoutes,
    uploadRoutes,
    shippingApiRoutes,
    usersRoutes,
} from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS origins from env or defaults for development
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost'];

// Middleware
app.use(cors({
    origin: corsOrigins,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/wishlists', wishlistsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/shipping-options', shippingRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shipping', shippingApiRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 TokoIndo Backend Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('📚 API Endpoints:');
    console.log(`   Auth:       /api/auth`);
    console.log(`   Products:   /api/products`);
    console.log(`   Categories: /api/categories`);
    console.log(`   Cart:       /api/cart`);
    console.log(`   Orders:     /api/orders`);
    console.log(`   Wishlists:  /api/wishlists`);
    console.log(`   Reviews:    /api/reviews`);
    console.log(`   Inventory:  /api/inventory`);
    console.log(`   Settings:   /api/settings`);
    console.log(`   Shipping:   /api/shipping-options`);
    console.log(`   Coupons:    /api/coupons`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
});

export default app;
