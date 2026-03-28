import { Order, User, Store } from '../db/schema';
import { orderItems } from '../db/schema';

export type OrderItem = typeof orderItems.$inferSelect;

// Format order data into WhatsApp message
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

📅 Tanggal: ${order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '-'}

💡 *Simpan No. Order ini untuk konfirmasi pembayaran*
`.trim();

    return message;
}

export function formatCourierNotification(order: Order, items: OrderItem[], storeName: string, storeSlug: string): string {
    const itemsList = items
        .map((item, index) => `${index + 1}. ${item.productName} × ${item.quantity}`)
        .join('\n');

    const message = `
🚚 *TUGAS PENGIRIMAN BARU*
Dari: ${storeName}

📦 *Order: ${order.orderNumber}*
📅 ${order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '-'}

👤 *Pemesan:*
Nama: ${order.recipientName}
No. HP: ${order.recipientPhone}

📍 *Tujuan:*
${order.address}
${order.district}, ${order.city}
${order.province}

🛍️ *Isi Paket (${items.length} jenis items):*
${itemsList}

💰 Ongkir: Rp ${order.shippingCost.toLocaleString('id-ID')}

🔗 Buka dashboard kurir:
https://wa-market.pages.dev/s/${storeSlug}/kurir

_Balas pesan ini jika ada kendala_
`.trim();

    return message;
}

export function formatDeliveryCompleteNotification(order: Order, courier: User): string {
    return `
✅ *ORDER SELESAI DIANTAR*
No. Order: ${order.orderNumber}
Kurir: ${courier.name}
Selesai: ${new Date().toLocaleString('id-ID')}
`.trim();
}

// Format number to e.g. 62812345678@c.us
export function formatChatId(phone: string): string {
    let cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
    
    if (!cleanPhone.includes('@')) {
        cleanPhone += '@c.us';
    }
    return cleanPhone;
}

// Generate fallback wa.me URL
export function generateWhatsAppUrl(phone: string, message: string): string {
    let cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// Get WA URL for cs
export function getCSWhatsAppUrl(csPhone: string, productName?: string, storeName?: string): string {
    const store = storeName || 'TokoIndo';
    const message = productName
        ? `Halo, saya ingin bertanya tentang produk: ${productName}`
        : `Halo, saya ingin bertanya tentang produk di ${store}`;
        
    return generateWhatsAppUrl(csPhone, message);
}

// Call WAHA API to send message
export async function sendWahaMessage(
    serverUrl: string | undefined | null, 
    apiKey: string | undefined | null, 
    sessionName: string | undefined | null, 
    targetPhone: string, 
    messageText: string
): Promise<boolean> {
    if (!serverUrl || serverUrl.trim() === '') return false;

    try {
        const payload = {
            session: sessionName || 'default',
            chatId: formatChatId(targetPhone),
            text: messageText
        };
        
        // Remove trailing slash if any
        const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Only append Api key header if provided
        if (apiKey && apiKey.trim() !== '') {
            headers['X-Api-Key'] = apiKey;
        }

        const res = await fetch(`${baseUrl}/api/sendText`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
            // Add a timeout to prevent hanging if WAHA is down
        });
        
        if (!res.ok) {
            const errBody = await res.text();
            console.error('WAHA API Error:', res.status, errBody);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Failed to send WAHA message:', error);
        return false;
    }
}
