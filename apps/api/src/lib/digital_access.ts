import { eq, inArray } from 'drizzle-orm';
import { orderItems, products, ebookPurchases, courseEnrollments } from '../db/schema';

/**
 * Grants access to digital items (ebooks, courses) in an order.
 * Safe to be called multiple times (returns if already granted).
 */
export async function grantDigitalAccess(db: any, storeId: string, orderId: string, userId: string) {
    if (!userId) return;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    if (items.length === 0) return;

    const productIds = items.map((item: any) => item.productId);
    const orderProds = await db.select().from(products).where(inArray(products.id, productIds));

    for (const p of orderProds) {
        if (p.productType === 'digital') {
            if (p.digitalType === 'ebook' || p.digitalType === 'link') {
                await db.insert(ebookPurchases).values({
                    storeId,
                    userId,
                    productId: p.id,
                    orderId
                }).onConflictDoNothing();
            } else if (p.digitalType === 'course') {
                await db.insert(courseEnrollments).values({
                    storeId,
                    userId,
                    productId: p.id,
                    orderId
                }).onConflictDoNothing();
            }
        }
    }
}
