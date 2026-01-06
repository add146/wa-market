import { Router, Request, Response } from 'express';
import { db } from '../db';
import { products, productVariants, productImages, categories } from '../db/schema';
import { eq, desc, ilike, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

// Validation schemas
const variantSchema = z.object({
    id: z.string().uuid().optional(),
    type: z.string().min(1).max(20), // 'color' | 'size' | 'model'
    value: z.string().min(1).max(50),
    hexCode: z.string().max(7).optional().nullable(),
    stock: z.number().int().min(0).default(0),
    priceAdjustment: z.number().int().default(0),
});

const createProductSchema = z.object({
    name: z.string().min(2).max(255),
    slug: z.string().min(2).max(255).optional(),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    price: z.number().nonnegative(),
    costPrice: z.number().nonnegative().optional().nullable(), // HPP/harga kulak
    originalPrice: z.number().nonnegative().optional().nullable(),
    discount: z.number().min(0).max(100).optional(),
    image: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
    imageAlt: z.string().optional(),
    stock: z.number().int().min(0).default(0),
    weight: z.number().int().min(0).default(500), // in grams
    isActive: z.boolean().default(true),
    variants: z.array(variantSchema).optional(),
});

const updateProductSchema = createProductSchema.partial();

/**
 * GET /api/products
 * Get all products with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { category, search, limit = '20', offset = '0' } = req.query;

        let query = db.select({
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
            .where(eq(products.isActive, true))
            .orderBy(desc(products.createdAt))
            .limit(Number(limit))
            .offset(Number(offset));

        const result = await query;

        res.json({
            products: result,
            pagination: {
                limit: Number(limit),
                offset: Number(offset),
                total: result.length,
            },
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/products/:id
 * Get product by ID with variants and images
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Get product
        const [product] = await db.select().from(products).where(eq(products.id, id));

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Get variants
        const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));

        // Get images
        const images = await db.select().from(productImages)
            .where(eq(productImages.productId, id))
            .orderBy(productImages.sortOrder);

        // Get category
        let category = null;
        if (product.categoryId) {
            const [cat] = await db.select().from(categories).where(eq(categories.id, product.categoryId));
            category = cat;
        }

        res.json({
            ...product,
            category,
            variants,
            images,
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/products
 * Create a new product (Admin only)
 */
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const validation = createProductSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        // Auto-generate slug from name if not provided
        const slug = validation.data.slug || validation.data.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        // Use first image from images array if image is not provided
        const image = validation.data.image || (validation.data.images?.[0] || null);

        const [newProduct] = await db.insert(products).values({
            ...validation.data,
            slug,
            image,
        }).returning();

        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/products/:id
 * Update a product (Admin only)
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = updateProductSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
            return;
        }

        // Extract variants and images from request (handle separately)
        const { variants: variantsData, images: imagesData, ...productData } = validation.data;

        // Debug log for costPrice
        console.log('Product update - costPrice:', productData.costPrice, 'Full data:', JSON.stringify(productData));

        // Auto-generate slug from name if name is provided but slug is not
        let updateData: any = { ...productData, updatedAt: new Date() };

        if (productData.name && !productData.slug) {
            updateData.slug = productData.name.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
        }

        // Use first image from images array if image is not provided
        if (imagesData?.length && !productData.image) {
            updateData.image = imagesData[0];
        }

        const [updated] = await db.update(products)
            .set(updateData)
            .where(eq(products.id, id))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Sync variants if provided
        if (variantsData !== undefined) {
            // Delete existing variants
            await db.delete(productVariants).where(eq(productVariants.productId, id));

            // Insert new variants
            if (variantsData && variantsData.length > 0) {
                const variantsToInsert = variantsData.map(v => ({
                    productId: id,
                    type: v.type,
                    value: v.value,
                    hexCode: v.hexCode || null,
                    stock: v.stock || 0,
                    priceAdjustment: v.priceAdjustment || 0,
                }));
                await db.insert(productVariants).values(variantsToInsert);
            }
        }

        // Sync images to productImages table if provided
        if (imagesData && imagesData.length > 0) {
            // Delete existing product images
            await db.delete(productImages).where(eq(productImages.productId, id));

            // Insert new images
            const imagesToInsert = imagesData.map((url: string, index: number) => ({
                productId: id,
                url: url,
                alt: `${productData.name || 'Product'} image ${index + 1}`,
                sortOrder: index,
            }));
            await db.insert(productImages).values(imagesToInsert);
        }

        // Fetch updated product with variants and images
        const updatedVariants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
        const updatedImages = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.sortOrder);

        res.json({ ...updated, variants: updatedVariants, images: updatedImages });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/products/:id
 * Delete a product (Admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();

        if (!deleted) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
