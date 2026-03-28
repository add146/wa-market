import {
    sqliteTable,
    text,
    integer,
    unique,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Helper for generating UUIDs
const generateId = () => crypto.randomUUID();
// Helper for timestamps
const now = () => new Date();

// ============================================
// STORES TABLE (SaaS Multi-tenant)
// ============================================
export const stores = sqliteTable('stores', {
    id: text('id').primaryKey().$defaultFn(generateId),
    slug: text('slug').notNull().unique(), // e.g., 'toko-makmur'
    customDomain: text('custom_domain').unique(), // e.g., 'www.tokomakmur.com'
    name: text('name').notNull(),
    plan: text('plan').notNull().default('free'), // 'free' | 'starter' | 'pro'
    ownerPhone: text('owner_phone').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
});

export const storesRelations = relations(stores, ({ many }) => ({
    users: many(users),
    categories: many(categories),
    products: many(products),
    orders: many(orders),
    courierDeliveries: many(courierDeliveries),
}));

// ============================================
// USERS TABLE
// ============================================
export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }), // Nullable for global superadmin
    phone: text('phone').notNull(), // WhatsApp number as login
    password: text('password').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull().default('customer'), // 'superadmin' | 'admin' | 'courier' | 'customer'
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(now),
}, (table) => ({
    // A phone number can only be registered once per store
    unqPhoneStore: unique().on(table.phone, table.storeId),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
    store: one(stores, {
        fields: [users.storeId],
        references: [stores.id],
    }),
    sessions: many(sessions),
    orders: many(orders),
    courierDeliveries: many(courierDeliveries),
    cartItems: many(cartItems),
}));

// ============================================
// SESSIONS TABLE
// ============================================
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey().$defaultFn(generateId),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

// ============================================
// CATEGORIES TABLE
// ============================================
export const categories = sqliteTable('categories', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    slug: text('slug').notNull(), // Needs to be unique per store, not globally
    name: text('name').notNull(),
    icon: text('icon'),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
}, (table) => ({
    unqSlugStore: unique().on(table.slug, table.storeId),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    store: one(stores, {
        fields: [categories.storeId],
        references: [stores.id],
    }),
    products: many(products),
}));

// ============================================
// PRODUCTS TABLE
// ============================================
export const products = sqliteTable('products', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    categoryId: text('category_id').references(() => categories.id),
    price: integer('price').notNull(),
    costPrice: integer('cost_price').default(0),
    originalPrice: integer('original_price'),
    discount: integer('discount'),
    image: text('image'),
    imageAlt: text('image_alt'),
    stock: integer('stock').notNull().default(0),
    weight: integer('weight').default(500),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(now),
}, (table) => ({
    unqSlugStore: unique().on(table.slug, table.storeId),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    store: one(stores, {
        fields: [products.storeId],
        references: [stores.id],
    }),
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    variants: many(productVariants),
    images: many(productImages),
}));

// ============================================
// PRODUCT VARIANTS TABLE
// ============================================
export const productVariants = sqliteTable('product_variants', {
    id: text('id').primaryKey().$defaultFn(generateId),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    type: text('type').notNull(),
    value: text('value').notNull(),
    hexCode: text('hex_code'),
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
export const productImages = sqliteTable('product_images', {
    id: text('id').primaryKey().$defaultFn(generateId),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    url: text('url').notNull(),
    alt: text('alt'),
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
export const cartItems = sqliteTable('cart_items', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    variantId: text('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
});

// ============================================
// SHIPPING OPTIONS TABLE
// ============================================
export const shippingOptions = sqliteTable('shipping_options', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'api' | 'fixed' | 'free'
    courierCode: text('courier_code'),
    serviceCode: text('service_code'),
    fixedCost: integer('fixed_cost').default(0),
    minPurchaseForFree: integer('min_purchase_for_free').default(0),
    estimation: text('estimation'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
});

// ============================================
// ORDERS TABLE
// ============================================
export const orders = sqliteTable('orders', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    orderNumber: text('order_number').notNull(), // Needs to be unique per store
    userId: text('user_id').references(() => users.id),
    guestPhone: text('guest_phone'),
    guestEmail: text('guest_email'),
    recipientName: text('recipient_name').notNull(),
    recipientPhone: text('recipient_phone').notNull(),
    province: text('province').notNull(),
    city: text('city').notNull(),
    district: text('district').notNull(),
    address: text('address').notNull(),
    shippingType: text('shipping_type').default('expedition'), // 'own_courier' | 'expedition'
    latitude: text('latitude'), // GPS lat for own courier
    longitude: text('longitude'), // GPS lng for own courier
    shippingOptionId: text('shipping_option_id').references(() => shippingOptions.id),
    courierName: text('courier_name').notNull(),
    shippingCost: integer('shipping_cost').notNull(),
    subtotal: integer('subtotal').notNull(),
    productDiscount: integer('product_discount').default(0),
    couponCode: text('coupon_code'),
    couponDiscount: integer('coupon_discount').default(0),
    uniqueCode: integer('unique_code').default(0),
    total: integer('total').notNull(),
    status: text('status').notNull().default('pending'), // pending, processing, on_delivery, completed, cancelled
    paymentMethod: text('payment_method').default('whatsapp'), // 'whatsapp' | 'xendit' | 'midtrans'
    paymentStatus: text('payment_status').default('unpaid'), // 'unpaid' | 'paid' | 'expired'
    whatsappSent: integer('whatsapp_sent', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(now),
}, (table) => ({
    unqOrderNumberStore: unique().on(table.orderNumber, table.storeId),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    store: one(stores, {
        fields: [orders.storeId],
        references: [stores.id],
    }),
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    items: many(orderItems),
    courierDelivery: one(courierDeliveries, {
        fields: [orders.id],
        references: [courierDeliveries.orderId],
    }),
}));

// ============================================
// ORDER ITEMS TABLE
// ============================================
export const orderItems = sqliteTable('order_items', {
    id: text('id').primaryKey().$defaultFn(generateId),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    productId: text('product_id').references(() => products.id).notNull(),
    productName: text('product_name').notNull(),
    variantInfo: text('variant_info'),
    price: integer('price').notNull(),
    costPrice: integer('cost_price').default(0),
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
// COURIER DELIVERIES TABLE
// ============================================
export const courierDeliveries = sqliteTable('courier_deliveries', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    courierId: text('courier_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: text('status').notNull().default('assigned'), // 'assigned' | 'picked_up' | 'on_the_way' | 'delivered' | 'failed'
    notes: text('notes'),
    photoUrl: text('photo_url'),
    assignedAt: integer('assigned_at', { mode: 'timestamp' }).$defaultFn(now),
    pickedUpAt: integer('picked_up_at', { mode: 'timestamp' }),
    deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
});

export const courierDeliveriesRelations = relations(courierDeliveries, ({ one }) => ({
    store: one(stores, {
        fields: [courierDeliveries.storeId],
        references: [stores.id],
    }),
    order: one(orders, {
        fields: [courierDeliveries.orderId],
        references: [orders.id],
    }),
    courier: one(users, {
        fields: [courierDeliveries.courierId],
        references: [users.id],
    }),
}));

// ============================================
// STORE SETTINGS TABLE
// ============================================
export const storeSettings = sqliteTable('store_settings', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    key: text('key').notNull(),
    value: text('value').notNull(),
    description: text('description'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(now),
}, (table) => ({
    unqKeyStore: unique().on(table.key, table.storeId),
}));

// ============================================
// PAYMENTS TABLE (Store → Customer)
// ============================================
export const payments = sqliteTable('payments', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    provider: text('provider').notNull(), // 'xendit' | 'midtrans'
    externalId: text('external_id'), // invoice_id or transaction_id from provider
    paymentUrl: text('payment_url'),
    amount: integer('amount').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'paid' | 'expired' | 'failed'
    paidAt: integer('paid_at', { mode: 'timestamp' }),
    rawResponse: text('raw_response'), // JSON string
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
    store: one(stores, {
        fields: [payments.storeId],
        references: [stores.id],
    }),
    order: one(orders, {
        fields: [payments.orderId],
        references: [orders.id],
    }),
}));

// ============================================
// SUBSCRIPTIONS TABLE (Store → Superadmin)
// ============================================
export const subscriptions = sqliteTable('subscriptions', {
    id: text('id').primaryKey().$defaultFn(generateId),
    storeId: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    plan: text('plan').notNull(), // 'starter' | 'pro'
    provider: text('provider').notNull(), // 'xendit' | 'midtrans' | 'manual'
    externalId: text('external_id'),
    paymentUrl: text('payment_url'),
    amount: integer('amount').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'paid' | 'expired'
    periodStart: integer('period_start', { mode: 'timestamp' }),
    periodEnd: integer('period_end', { mode: 'timestamp' }),
    paidAt: integer('paid_at', { mode: 'timestamp' }),
    rawResponse: text('raw_response'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(now),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    store: one(stores, {
        fields: [subscriptions.storeId],
        references: [stores.id],
    }),
}));

export type Store = typeof stores.$inferSelect;
export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type CourierDelivery = typeof courierDeliveries.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
