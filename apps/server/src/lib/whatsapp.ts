import type { Order, OrderItem } from '../db/schema';

/**
 * Format order data into WhatsApp message
 */
export function formatOrderMessage(order: Order, items: OrderItem[], storeName?: string): string {
    const store = storeName || 'TokoIndo';
    const itemsList = items
        .map((item, index) => {
            const variant = item.variantInfo ? ` (${item.variantInfo})` : '';
            return `${index + 1}. ${item.productName}${variant}\n   ${item.quantity}x @ Rp ${item.price.toLocaleString('id-ID')} = Rp ${item.subtotal.toLocaleString('id-ID')}`;
        })
        .join('\n');

    const message = `
━━━━━━━━━━━━━━━━━━━━
🧾 *NOTA PESANAN*
*No. Order: ${order.orderNumber}*
━━━━━━━━━━━━━━━━━━━━

🛒 *PESANAN BARU ${store}*

📦 *Detail Produk:*
${itemsList}

👤 *Data Penerima:*
Nama: ${order.recipientName}
No. WhatsApp: ${order.recipientPhone}
Alamat: ${order.address}
Kecamatan: ${order.district}
Kota: ${order.city}
Provinsi: ${order.province}

🚚 *Pengiriman:*
Kurir: ${order.courierName}
Ongkir: Rp ${order.shippingCost.toLocaleString('id-ID')}

💰 *Rincian Pembayaran:*
Subtotal: Rp ${order.subtotal.toLocaleString('id-ID')}
${order.productDiscount ? `Diskon Produk: -Rp ${order.productDiscount.toLocaleString('id-ID')}` : ''}
${order.couponCode ? `Kupon (${order.couponCode}): -Rp ${order.couponDiscount?.toLocaleString('id-ID') || 0}` : ''}
Ongkir: +Rp ${order.shippingCost.toLocaleString('id-ID')}
${order.uniqueCode ? `Kode Unik: +Rp ${order.uniqueCode}` : ''}
━━━━━━━━━━━━━━━━━━━━
*TOTAL BAYAR: Rp ${order.total.toLocaleString('id-ID')}*
━━━━━━━━━━━━━━━━━━━━

📅 Tanggal: ${new Date(order.createdAt || Date.now()).toLocaleString('id-ID')}

💡 *Simpan No. Order ini untuk konfirmasi pembayaran*
`.trim();

    return message;
}

/**
 * Generate WhatsApp URL for order notification
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
    // Remove any non-numeric characters except +
    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    // Ensure phone starts with country code
    const formattedPhone = cleanPhone.startsWith('+')
        ? cleanPhone.substring(1)
        : cleanPhone.startsWith('0')
            ? '62' + cleanPhone.substring(1)
            : cleanPhone;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Get WhatsApp URL for customer service inquiry
 */
export function getCSWhatsAppUrl(csPhone: string, productName?: string, storeName?: string): string {
    const store = storeName || 'TokoIndo';
    const message = productName
        ? `Halo, saya ingin bertanya tentang produk: ${productName}`
        : `Halo, saya ingin bertanya tentang produk di ${store}`;

    return generateWhatsAppUrl(csPhone, message);
}
