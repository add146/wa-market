import { Hono } from 'hono';
import { getDb } from '../db';
import { 
    products, 
    courseSections, 
    courseLessons, 
    courseEnrollments, 
    lessonCompletions 
} from '../db/schema';
import { eq, and, asc, sql, inArray } from 'drizzle-orm';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any, user: any } }>();

// ============================================
// PUBLIC & STUDENT ROUTES
// ============================================

/**
 * GET /api/s/:slug/courses/:productId/check-access
 * Check if user is enrolled
 */
router.get('/:productId/check-access', optionalAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;

        if (!user) {
            return c.json({ hasAccess: false });
        }

        const [enrollment] = await db.select()
            .from(courseEnrollments)
            .where(
                and(
                    eq(courseEnrollments.userId, user.id),
                    eq(courseEnrollments.productId, productId)
                )
            );

        return c.json({ hasAccess: !!enrollment, enrollment });
    } catch (error) {
        return c.json({ error: 'Failed to check access' }, 500);
    }
});

/**
 * GET /api/s/:slug/courses/my-courses
 * Get list of enrolled courses for user
 */
router.get('/my-courses', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const user = c.get('user');

        const enrollments = await db.select({
            id: courseEnrollments.id,
            productId: products.id,
            productName: products.name,
            productImage: products.image,
            productSlug: products.slug,
            enrolledAt: courseEnrollments.enrolledAt,
        })
        .from(courseEnrollments)
        .innerJoin(products, eq(courseEnrollments.productId, products.id))
        .where(
            and(
                eq(courseEnrollments.userId, user.id),
                eq(courseEnrollments.storeId, store.id)
            )
        );

        // Fetch progress for each
        const results = await Promise.all(enrollments.map(async (enr) => {
            // Count total visible lessons
            const [totalRes] = await db.select({ count: sql<number>`count(*)` })
                .from(courseLessons)
                .innerJoin(courseSections, eq(courseLessons.sectionId, courseSections.id))
                .where(and(
                    eq(courseSections.productId, enr.productId),
                    eq(courseLessons.isVisible, true)
                ));
            
            // Count completed
            const [compRes] = await db.select({ count: sql<number>`count(*)` })
                .from(lessonCompletions)
                .where(eq(lessonCompletions.enrollmentId, enr.id));
            
            const total = totalRes.count || 0;
            const completed = compRes.count || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
                ...enr,
                progressTotal: total,
                progressCompleted: completed,
                progressPercentage: progress
            };
        }));

        return c.json({ courses: results });
    } catch (error) {
        return c.json({ error: 'Failed to list courses' }, 500);
    }
});

/**
 * GET /api/s/:slug/courses/:productId/player
 * Get curriculum for player, including completion status
 */
router.get('/:productId/player', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;

        // Verify enrollment
        const [enrollment] = await db.select()
            .from(courseEnrollments)
            .where(
                and(
                    eq(courseEnrollments.userId, user.id),
                    eq(courseEnrollments.productId, productId)
                )
            );

        if (!enrollment && user.role !== 'admin' && user.role !== 'superadmin') {
            return c.json({ error: 'Requires enrollment' }, 403);
        }

        // Fetch sections
        const sections = await db.select()
            .from(courseSections)
            .where(eq(courseSections.productId, productId))
            .orderBy(asc(courseSections.sortOrder));

        // Fetch all lessons
        const sectionIds = sections.map(s => s.id);
        let lessons: typeof courseLessons.$inferSelect[] = [];
        if (sectionIds.length > 0) {
            lessons = await db.select()
                .from(courseLessons)
                .where(inArray(courseLessons.sectionId, sectionIds))
                .orderBy(asc(courseLessons.sortOrder));
        }

        // Fetch completions if enrolled
        let completions = new Set();
        if (enrollment) {
            const compData = await db.select({ lessonId: lessonCompletions.lessonId })
                .from(lessonCompletions)
                .where(eq(lessonCompletions.enrollmentId, enrollment.id));
            compData.forEach(c => completions.add(c.lessonId));
        }

        // Group
        const curriculum = sections.filter(s => s.isVisible || user.role === 'admin' || user.role === 'superadmin').map(s => {
            const secLessons = lessons.filter(l => l.sectionId === s.id)
                .filter(l => l.isVisible || user.role === 'admin' || user.role === 'superadmin')
                .map(l => ({
                    id: l.id,
                    title: l.title,
                    type: l.type,
                    duration: l.duration,
                    videoUrl: l.videoUrl,
                    audioUrl: l.audioUrl,
                    content: l.content,
                    isFreePreview: !!l.isFreePreview,
                    isCompleted: completions.has(l.id)
                }));
            
            return {
                id: s.id,
                title: s.title,
                lessons: secLessons
            };
        });

        // Calculate progress stats
        const [totalRes] = await db.select({ count: sql<number>`count(*)` })
            .from(courseLessons)
            .innerJoin(courseSections, eq(courseLessons.sectionId, courseSections.id))
            .where(and(
                eq(courseSections.productId, productId),
                eq(courseLessons.isVisible, true)
            ));
        
        // Count completed
        let compCount = 0;
        if (enrollment) {
            const [compRes] = await db.select({ count: sql<number>`count(*)` })
                .from(lessonCompletions)
                .where(eq(lessonCompletions.enrollmentId, enrollment.id));
            compCount = compRes.count || 0;
        }

        const stats = {
            total: totalRes.count || 0,
            completed: compCount,
            progress: totalRes.count ? Math.round((compCount / totalRes.count) * 100) : 0
        };

        return c.json({ curriculum, stats, enrollmentObj: enrollment });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * POST /api/s/:slug/courses/:productId/lessons/:lessonId/complete
 * Mark lesson as complete
 */
router.post('/:productId/lessons/:lessonId/complete', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;
        const lessonId = c.req.param('lessonId') as string;

        const [enrollment] = await db.select()
            .from(courseEnrollments)
            .where(
                and(
                    eq(courseEnrollments.userId, user.id),
                    eq(courseEnrollments.productId, productId)
                )
            );

        if (!enrollment) return c.json({ error: 'Forbidden' }, 403);

        await db.insert(lessonCompletions)
            .values({ enrollmentId: enrollment.id, lessonId })
            .onConflictDoNothing();

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * DELETE /api/s/:slug/courses/:productId/lessons/:lessonId/complete
 */
router.delete('/:productId/lessons/:lessonId/complete', authMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const user = c.get('user');
        const productId = c.req.param('productId') as string;
        const lessonId = c.req.param('lessonId') as string;

        const [enrollment] = await db.select()
            .from(courseEnrollments)
            .where(
                and(
                    eq(courseEnrollments.userId, user.id),
                    eq(courseEnrollments.productId, productId)
                )
            );

        if (!enrollment) return c.json({ error: 'Forbidden' }, 403);

        await db.delete(lessonCompletions)
            .where(and(
                eq(lessonCompletions.enrollmentId, enrollment.id),
                eq(lessonCompletions.lessonId, lessonId)
            ));

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});


// ============================================
// ADMIN ROUTES
// ============================================

const adminOnly = [authMiddleware, adminMiddleware];

router.get('/:productId/curriculum', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const productId = c.req.param('productId') as string;

        const sections = await db.select()
            .from(courseSections)
            .where(eq(courseSections.productId, productId))
            .orderBy(asc(courseSections.sortOrder));

        const sectionIds = sections.map(s => s.id);
        let lessons: typeof courseLessons.$inferSelect[] = [];
        if (sectionIds.length > 0) {
            lessons = await db.select()
                .from(courseLessons)
                .where(inArray(courseLessons.sectionId, sectionIds))
                .orderBy(asc(courseLessons.sortOrder));
        }

        const curriculum = sections.map(s => ({
            ...s,
            lessons: lessons.filter(l => l.sectionId === s.id).map(l => ({
                id: l.id,
                title: l.title,
                type: l.type,
                videoUrl: l.videoUrl,
                audioUrl: l.audioUrl,
                content: l.content,
                duration: l.duration,
                sortOrder: l.sortOrder,
                isVisible: !!l.isVisible,
                isFreePreview: !!l.isFreePreview,
            }))
        }));

        return c.json({ curriculum });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.post('/:productId/sections', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const productId = c.req.param('productId') as string;
        const { title } = await c.req.json();

        // Get max sort_order
        const [max] = await db.select({ maxSort: sql<number>`MAX(sort_order)` })
            .from(courseSections)
            .where(eq(courseSections.productId, productId));
        const sortOrder = (max?.maxSort || 0) + 10;

        const [section] = await db.insert(courseSections)
            .values({ productId, title, sortOrder })
            .returning();
        
        return c.json({ section: { ...section, lessons: [] } });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.put('/sections/:sectionId', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const sectionId = c.req.param('sectionId') as string;
        const body = await c.req.json();

        await db.update(courseSections)
            .set(body)
            .where(eq(courseSections.id, sectionId));
        
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.delete('/sections/:sectionId', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const sectionId = c.req.param('sectionId') as string;
        
        await db.delete(courseSections)
            .where(eq(courseSections.id, sectionId));
        
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.put('/:productId/sections/reorder', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const { order } = await c.req.json(); // Array of { id, sortOrder }
        
        for (const item of order) {
            await db.update(courseSections)
                .set({ sortOrder: item.sortOrder })
                .where(eq(courseSections.id, item.id));
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.post('/sections/:sectionId/lessons', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const sectionId = c.req.param('sectionId') as string;
        const body = await c.req.json();

        const [max] = await db.select({ maxSort: sql<number>`MAX(sort_order)` })
            .from(courseLessons)
            .where(eq(courseLessons.sectionId, sectionId));
        const sortOrder = (max?.maxSort || 0) + 10;

        const [lesson] = await db.insert(courseLessons)
            .values({ ...body, sectionId, sortOrder })
            .returning();
        
        return c.json({ lesson });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.put('/lessons/:lessonId', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const lessonId = c.req.param('lessonId') as string;
        const body = await c.req.json();

        // Strip properties not in DB
        const updateData: any = {
            title: body.title,
            type: body.type,
            videoUrl: body.videoUrl,
            audioUrl: body.audioUrl,
            content: body.content,
            duration: body.duration,
            isVisible: body.isVisible,
            isFreePreview: body.isFreePreview
        };
        // Remove undefined keys
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

        await db.update(courseLessons)
            .set(updateData)
            .where(eq(courseLessons.id, lessonId));
        
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.delete('/lessons/:lessonId', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const lessonId = c.req.param('lessonId') as string;
        
        await db.delete(courseLessons)
            .where(eq(courseLessons.id, lessonId));
        
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

router.put('/sections/:sectionId/lessons/reorder', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const { order } = await c.req.json(); // Array of { id, sortOrder }
        
        for (const item of order) {
            await db.update(courseLessons)
                .set({ sortOrder: item.sortOrder })
                .where(eq(courseLessons.id, item.id));
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed' }, 500);
    }
});

export default router;
