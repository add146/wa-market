import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { getDb } from '../db';
import { users } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';
import { authMiddleware, createSession, deleteSession, hashPassword, verifyPassword } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any, user: any } }>();

const standardizePhone = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    cleaned = cleaned.replace(/^\+/, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
    return cleaned;
};

/**
 * POST /api/s/:slug/auth/register
 */
router.post('/register', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();
        const { phone, password, name } = body;
        
        if (!phone || !password || !name) {
            return c.json({ error: 'Missing fields' }, 400);
        }
        
        const cleanPhone = standardizePhone(phone);
        const [existing] = await db.select().from(users).where(
            and(eq(users.phone, cleanPhone), eq(users.storeId, store.id))
        );
        
        if (existing) {
            return c.json({ error: 'Phone already registered in this store' }, 409);
        }
        
        const hashedPassword = await hashPassword(password);
        const [user] = await db.insert(users).values({
            storeId: store.id,
            phone: cleanPhone,
            password: hashedPassword,
            name,
            role: 'customer'
        }).returning();
        
        const token = await createSession(db, user.id);
        
        setCookie(c, 'session', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60
        });
        
        return c.json({ message: 'Registration successful', user, token }, 201);
    } catch (e) {
        console.error('Register error:', e);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * POST /api/s/:slug/auth/login
 */
router.post('/login', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();
        const { phone, password } = body;
        
        const cleanPhone = standardizePhone(phone);
        // Allow login if user belongs to this store, OR if they are superadmin
        // Superadmins might have storeId = null or belong to no specific store.
        const [user] = await db.select().from(users).where(
            and(
                eq(users.phone, cleanPhone), 
                or(eq(users.storeId, store.id), eq(users.role, 'superadmin'))
            )
        );
        
        if (!user || !(await verifyPassword(password, user.password))) {
            return c.json({ error: 'Invalid phone or password' }, 401);
        }
        
        const token = await createSession(db, user.id);
        
        setCookie(c, 'session', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60
        });
        
        return c.json({ message: 'Login successful', user, token });
    } catch (e) {
        console.error('Login error:', e);
        return c.json({ error: 'Internal error' }, 500);
    }
});

/**
 * POST /api/s/:slug/auth/logout
 */
router.post('/logout', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const authHeader = c.req.header('Authorization');
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : getCookie(c, 'session');
            
        if (token) await deleteSession(db, token);
        
        deleteCookie(c, 'session');
        return c.json({ message: 'Success' });
    } catch (e) {
        return c.json({ error: 'Error' }, 500);
    }
});

/**
 * GET /api/s/:slug/auth/session
 */
router.get('/session', authMiddleware, async (c) => {
    return c.json({ user: c.get('user') });
});

export default router;
