import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                phone: string;
                name: string;
                role: string;
            };
        }
    }
}

/**
 * Simple session storage (in production, use Redis or database sessions)
 */
const sessions = new Map<string, { userId: string; expiresAt: Date }>();

/**
 * Generate a simple session token
 */
export function generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Create a session for a user
 */
export function createSession(userId: string): string {
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    sessions.set(token, { userId, expiresAt });
    return token;
}

/**
 * Get session by token
 */
export function getSession(token: string): { userId: string } | null {
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
        sessions.delete(token);
        return null;
    }
    return { userId: session.userId };
}

/**
 * Delete session
 */
export function deleteSession(token: string): void {
    sessions.delete(token);
}

/**
 * Authentication middleware - validates session and attaches user to request
 */
export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Get token from Authorization header or cookie
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.cookies?.session;

        if (!token) {
            res.status(401).json({ error: 'Unauthorized - No token provided' });
            return;
        }

        // Validate session
        const session = getSession(token);
        if (!session) {
            res.status(401).json({ error: 'Unauthorized - Invalid or expired session' });
            return;
        }

        // Get user from database
        const [user] = await db.select({
            id: users.id,
            phone: users.phone,
            name: users.name,
            role: users.role,
        }).from(users).where(eq(users.id, session.userId));

        if (!user) {
            res.status(401).json({ error: 'Unauthorized - User not found' });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Optional auth middleware - attaches user if authenticated, continues otherwise
 */
export async function optionalAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.cookies?.session;

        if (token) {
            const session = getSession(token);
            if (session) {
                const [user] = await db.select({
                    id: users.id,
                    phone: users.phone,
                    name: users.name,
                    role: users.role,
                }).from(users).where(eq(users.id, session.userId));

                if (user) {
                    req.user = user;
                }
            }
        }
        next();
    } catch (error) {
        // Continue without user even if there's an error
        next();
    }
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}
