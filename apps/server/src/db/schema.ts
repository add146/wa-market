import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    boolean,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS TABLE
// ============================================
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    phone: varchar('phone', { length: 20 }).notNull().unique(), // WhatsApp number as login
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    role: varchar('role', { length: 20 }).notNull().default('customer'), // 'customer' | 'admin'
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
    cartItems: many(cartItems),
    orders: many(orders),
    wishlists: many(wishlists),
    createdReviews: many(productReviews),
}));

// ============================================
// CATEGORIES TABLE
// ============================================
export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    icon: varchar('icon', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
    products: many(products),
}));

// ============================================
// PRODUCTS TABLE
// ============================================
export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => categories.id),
    price: integer('price').notNull(), // in Rupiah
    originalPrice: integer('original_price'),
    discount: integer('discount'), // percentage
    image: text('image'),
    imageAlt: varchar('image_alt', { length: 255 }),
    stock: integer('stock').notNull().default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    variants: many(productVariants),
    images: many(productImages),
    reviews: many(productReviews),
    cartItems: many(cartItems),
    wishlists: many(wishlists),
}));

// ============================================
// PRODUCT VARIANTS TABLE
// ============================================
export const productVariants = pgTable('product_variants', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'color' | 'size'
    value: varchar('value', { length: 50 }).notNull(),
    hexCode: varchar('hex_code', { length: 7 }), // for colors
    stock: integer('stock').notNull().default(0),
    priceAdjustment: integer('price_adjustment').default(0),
});

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
    product: one(products, {
        fields: [productVariants.productId],
        references: [products.id],
    }),
}));

// ============================================
// PRODUCT IMAGES TABLE
// ============================================
export const productImages = pgTable('product_images', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    url: text('url').notNull(),
    alt: varchar('alt', { length: 255 }),
    sortOrder: integer('sort_order').default(0),
});

export const productImagesRelations = relations(productImages, ({ one }) => ({
    product: one(products, {
        fields: [productImages.productId],
        references: [products.id],
    }),
}));

// ============================================
// CART ITEMS TABLE
// ============================================
export const cartItems = pgTable('cart_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    variantId: uuid('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow(),
});

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    user: one(users, {
        fields: [cartItems.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [cartItems.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [cartItems.variantId],
        references: [productVariants.id],
    }),
}));

// ============================================
// SHIPPING OPTIONS TABLE
// ============================================
export const shippingOptions = pgTable('shipping_options', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'api' | 'fixed' | 'free'

    // For 'api' type - RajaOngkir integration
    courierCode: varchar('courier_code', { length: 20 }),
    serviceCode: varchar('service_code', { length: 20 }),

    // For 'fixed' type
    fixedCost: integer('fixed_cost').default(0),

    // For 'free' type
    minPurchaseForFree: integer('min_purchase_for_free').default(0),

    estimation: varchar('estimation', { length: 50 }),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ORDERS TABLE (Guest Checkout Supported)
// ============================================
export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),

    // User reference (nullable for guest checkout)
    userId: uuid('user_id').references(() => users.id),

    // Guest info (used when userId is null)
    guestPhone: varchar('guest_phone', { length: 20 }),
    guestEmail: varchar('guest_email', { length: 100 }),

    // Recipient info
    recipientName: varchar('recipient_name', { length: 100 }).notNull(),
    recipientPhone: varchar('recipient_phone', { length: 20 }).notNull(),
    province: varchar('province', { length: 100 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    district: varchar('district', { length: 100 }).notNull(),
    address: text('address').notNull(),

    // Shipping
    shippingOptionId: uuid('shipping_option_id').references(() => shippingOptions.id),
    courierName: varchar('courier_name', { length: 50 }).notNull(),
    shippingCost: integer('shipping_cost').notNull(),

    // Pricing
    subtotal: integer('subtotal').notNull(),
    productDiscount: integer('product_discount').default(0),
    couponCode: varchar('coupon_code', { length: 50 }),
    couponDiscount: integer('coupon_discount').default(0),
    uniqueCode: integer('unique_code').default(0),
    total: integer('total').notNull(),

    // Status
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    // 'pending' | 'approved' | 'shipped' | 'completed' | 'cancelled'

    whatsappSent: boolean('whatsapp_sent').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    shippingOption: one(shippingOptions, {
        fields: [orders.shippingOptionId],
        references: [shippingOptions.id],
    }),
    items: many(orderItems),
}));

// ============================================
// ORDER ITEMS TABLE
// ============================================
export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    productName: varchar('product_name', { length: 255 }).notNull(),
    variantInfo: varchar('variant_info', { length: 100 }),
    price: integer('price').notNull(),
    quantity: integer('quantity').notNull(),
    subtotal: integer('subtotal').notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));

// ============================================
// WISHLISTS TABLE
// ============================================
export const wishlists = pgTable('wishlists', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    uniqueUserProduct: unique().on(table.userId, table.productId),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
    user: one(users, {
        fields: [wishlists.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [wishlists.productId],
        references: [products.id],
    }),
}));

// ============================================
// PRODUCT REVIEWS TABLE (Admin Input)
// ============================================
export const productReviews = pgTable('product_reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),

    // Review content (input by admin)
    reviewerName: varchar('reviewer_name', { length: 100 }).notNull(),
    rating: integer('rating').notNull(), // 1-5 stars
    comment: text('comment'),

    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
});

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
    product: one(products, {
        fields: [productReviews.productId],
        references: [products.id],
    }),
    admin: one(users, {
        fields: [productReviews.createdBy],
        references: [users.id],
    }),
}));

// ============================================
// COUPONS TABLE
// ============================================
export const coupons = pgTable('coupons', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    discountType: varchar('discount_type', { length: 20 }).notNull(), // 'percentage' | 'fixed'
    discountValue: integer('discount_value').notNull(),
    minPurchase: integer('min_purchase').default(0),
    maxDiscount: integer('max_discount'),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').default(0),
    isActive: boolean('is_active').default(true),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// STORE SETTINGS TABLE
// ============================================
export const storeSettings = pgTable('store_settings', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 50 }).notNull().unique(),
    value: text('value').notNull(),
    description: varchar('description', { length: 255 }),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TYPE EXPORTS
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

export type ShippingOption = typeof shippingOptions.$inferSelect;
export type NewShippingOption = typeof shippingOptions.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;

export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;

export type StoreSetting = typeof storeSettings.$inferSelect;
export type NewStoreSetting = typeof storeSettings.$inferInsert;
