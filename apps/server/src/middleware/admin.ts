import { Request, Response, NextFunction } from 'express';

/**
 * Admin-only middleware - ensures user has admin role
 * Must be used after authMiddleware
 */
export function adminMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized - Authentication required' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden - Admin access required' });
        return;
    }

    next();
}
