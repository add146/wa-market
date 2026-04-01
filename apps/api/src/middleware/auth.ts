import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export const createSession = async (db: any, userId: string) => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const [session] = await db.insert(sessions).values({
        userId,
        expiresAt,
    }).returning();
    return session.id;
};

export const deleteSession = async (db: any, sessionId: string) => {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
};

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    let token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : getCookie(c, 'session');

    if (!token && c.req.query('token')) {
        token = c.req.query('token');
    }

    if (!token) {
        return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const db = getDb(c.env as any);
    
    // Check session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, token));
    
    if (!session || new Date(session.expiresAt) < new Date()) {
        if (session) await deleteSession(db, token); // Cleanup expired
        return c.json({ error: 'Unauthorized - Invalid or expired session' }, 401);
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!user) {
        return c.json({ error: 'Unauthorized - User not found' }, 401);
    }

    // Context check: If this is a store-scoped route, ensure user belongs to this store
    // Superadmins can access any store
    const store = c.get('store');
    if (store && user.role !== 'superadmin' && user.storeId !== store.id) {
        return c.json({ error: 'Forbidden - User does not belong to this store' }, 403);
    }

    c.set('user', user);
    await next();
};

export const adminMiddleware = async (c: Context, next: Next) => {
    const user = c.get('user');
    // Superadmin inherently has admin rights over all stores
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return c.json({ error: 'Forbidden - Requires admin role' }, 403);
    }
    await next();
};

export const courierMiddleware = async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user || user.role !== 'courier') {
        return c.json({ error: 'Forbidden - Requires courier role' }, 403);
    }
    await next();
};

export const superadminMiddleware = async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user || user.role !== 'superadmin') {
        return c.json({ error: 'Forbidden - Requires superadmin role' }, 403);
    }
    await next();
};

export const optionalAuthMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    let token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : getCookie(c, 'session');

    if (!token && c.req.query('token')) {
        token = c.req.query('token');
    }

    if (token) {
        const db = getDb(c.env as any);
        const [session] = await db.select().from(sessions).where(eq(sessions.id, token));
        
        if (session && new Date(session.expiresAt) > new Date()) {
            const [user] = await db.select().from(users).where(eq(users.id, session.userId));
            const store = c.get('store');
            
            // Allow if global route OR if user belongs to store OR if superadmin
            if (user && (!store || user.role === 'superadmin' || user.storeId === store.id)) {
                c.set('user', user);
            }
        }
    }
    await next();
};

export const hashPassword = async (password: string) => {
    return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
};
