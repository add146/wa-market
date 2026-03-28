import { Hono } from 'hono';
import { getDb } from '../db';
import { products, productVariants, productImages, categories } from '../db/schema';
import { eq, desc, like, and } from 'drizzle-orm';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any } }>();

function generateSlug(name: string): string {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * GET /api/s/:slug/products
 * Returns {products: [...], pagination: {...}}
 */
router.get('/', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const { category, search, limit = '50', offset = '0' } = c.req.query();

        let conditions: any[] = [
            eq(products.storeId, store.id),
            eq(products.isActive, 1 as any)
        ];

        if (category) {
            conditions.push(eq(products.categoryId, category as string));
        }
        if (search) {
            conditions.push(like(products.name, `%${search}%`));
        }

        const result = await db.select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
            categoryId: products.categoryId,
            price: products.price,
            costPrice: products.costPrice,
            originalPrice: products.originalPrice,
            discount: products.discount,
            image: products.image,
            imageAlt: products.imageAlt,
            stock: products.stock,
            weight: products.weight,
            isActive: products.isActive,
            createdAt: products.createdAt,
        }).from(products)
            .where(and(...conditions))
            .orderBy(desc(products.createdAt))
            .limit(Number(limit))
            .offset(Number(offset));

        return c.json({
            products: result,
            pagination: {
                limit: Number(limit),
                offset: Number(offset),
                total: result.length, // not exact total, but fine for now
            }
        });
    } catch (e) {
        console.error('Get products error:', e);
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * GET /api/s/:slug/products/:id
 * Get product by ID with variants and images
 */
router.get('/:id', async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;

        // Try by ID first, then by slug
        let product = (await db.select().from(products).where(
            and(eq(products.id, id), eq(products.storeId, store.id))
        ))[0];
        
        if (!product) {
            product = (await db.select().from(products).where(
                and(eq(products.slug, id), eq(products.storeId, store.id))
            ))[0];
        }
        if (!product) return c.json({ error: 'Product not found' }, 404);

        const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));
        const images = await db.select().from(productImages)
            .where(eq(productImages.productId, product.id))
            .orderBy(productImages.sortOrder);

        let category = null;
        if (product.categoryId) {
            const catRes = await db.select().from(categories).where(eq(categories.id, product.categoryId));
            category = catRes[0] || null;
        }

        return c.json({ ...product, category, variants, images });
    } catch (e) {
        return c.json({ error: 'Failed' }, 500);
    }
});

/**
 * POST /api/s/:slug/products (Admin)
 */
router.post('/', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const body = await c.req.json();

        const slug = body.slug || generateSlug(body.name || '');
        const image = body.image || (body.images?.[0] || null);

        const { variants: variantsData, images: imagesData, ...productData } = body;

        const [newProduct] = await db.insert(products).values({
            ...productData,
            storeId: store.id,
            slug,
            image,
            isActive: productData.isActive !== false ? 1 : 0,
        }).returning();

        if (variantsData?.length > 0) {
            await db.insert(productVariants).values(
                variantsData.map((v: any) => ({ ...v, productId: newProduct.id }))
            );
        }

        if (imagesData?.length > 0) {
            await db.insert(productImages).values(
                imagesData.map((url: string, i: number) => ({
                    productId: newProduct.id,
                    url,
                    alt: `${newProduct.name} image ${i + 1}`,
                    sortOrder: i,
                }))
            );
        }

        return c.json(newProduct, 201);
    } catch (e) {
        console.error('Create product error:', e);
        return c.json({ error: 'Failed to create product' }, 500);
    }
});

/**
 * PUT /api/s/:slug/products/:id (Admin)
 */
router.put('/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;
        const body = await c.req.json();

        const { variants: variantsData, images: imagesData, ...productData } = body;

        let updateData: any = { ...productData, updatedAt: new Date() };

        if (productData.name && !productData.slug) {
            updateData.slug = generateSlug(productData.name);
        }
        if (imagesData?.length && !productData.image) {
            updateData.image = imagesData[0];
        }
        if (typeof productData.isActive === 'boolean') {
            updateData.isActive = productData.isActive ? 1 : 0;
        }

        const [updated] = await db.update(products).set(updateData).where(
            and(eq(products.id, id), eq(products.storeId, store.id))
        ).returning();
        
        if (!updated) return c.json({ error: 'Not found' }, 404);

        // Sync variants
        if (variantsData !== undefined) {
            await db.delete(productVariants).where(eq(productVariants.productId, id));
            if (variantsData.length > 0) {
                await db.insert(productVariants).values(
                    variantsData.map((v: any) => ({ ...v, productId: id }))
                );
            }
        }

        // Sync images
        if (imagesData?.length > 0) {
            await db.delete(productImages).where(eq(productImages.productId, id));
            await db.insert(productImages).values(
                imagesData.map((url: string, i: number) => ({
                    productId: id,
                    url,
                    alt: `${updated.name} image ${i + 1}`,
                    sortOrder: i,
                }))
            );
        }

        const updatedVariants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
        const updatedImages = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.sortOrder);

        return c.json({ ...updated, variants: updatedVariants, images: updatedImages });
    } catch (e) {
        console.error('Update product error:', e);
        return c.json({ error: 'Failed to update' }, 500);
    }
});

/**
 * DELETE /api/s/:slug/products/:id (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const store = c.get('store');
        const id = c.req.param('id') as string;
        
        const [deleted] = await db.delete(products).where(
             and(eq(products.id, id), eq(products.storeId, store.id))
        ).returning();
        
        if (!deleted) return c.json({ error: 'Not found' }, 404);
        return c.json({ message: 'Product deleted' });
    } catch (e) {
        return c.json({ error: 'Failed to delete' }, 500);
    }
});

export default router;
