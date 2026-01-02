import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
    authMiddleware,
    createSession,
    deleteSession,
    hashPassword,
    verifyPassword
} from '../middleware';

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
const registerSchema = z.object({
    phone: z.string().min(10).max(20),
    password: z.string().min(6),
    name: z.string().min(2).max(100),
});

const loginSchema = z.object({
    phone: z.string().min(10).max(20),
    password: z.string().min(1),
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        const { password, name } = validation.data;
        // Standardize phone number to 62 format
        const phone = standardizePhone(validation.data.phone);

        // Check if phone already exists
        const existingUser = await db.select().from(users).where(eq(users.phone, phone));
        if (existingUser.length > 0) {
            res.status(409).json({ error: 'Phone number already registered' });
            return;
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.insert(users).values({
            phone,
            password: hashedPassword,
            name,
            role: 'customer',
        }).returning({
            id: users.id,
            phone: users.phone,
            name: users.name,
            role: users.role,
        });

        // Create session
        const token = createSession(newUser.id);

        res.status(201).json({
            message: 'Registration successful',
            user: newUser,
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/login
 * Login with phone and password
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        // Standardize phone number to 62 format
        const phone = standardizePhone(validation.data.phone);
        const { password } = validation.data;

        // Find user by phone
        const [user] = await db.select().from(users).where(eq(users.phone, phone));
        if (!user) {
            res.status(401).json({ error: 'Invalid phone number or password' });
            return;
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid phone number or password' });
            return;
        }

        // Create session
        const token = createSession(user.id);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

        if (token) {
            deleteSession(token);
        }

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/auth/session
 * Get current session/user info
 */
router.get('/session', authMiddleware, async (req: Request, res: Response) => {
    try {
        res.json({
            user: req.user,
        });
    } catch (error) {
        console.error('Session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
