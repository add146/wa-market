import { Hono } from 'hono';
import { getDb } from '../db';
import { storeSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '../index';

const router = new Hono<{ Bindings: Env; Variables: { store: any } }>();

// Helper to check API Key and determine base URL
const getRajaOngkirConfig = async (c: any) => {
    const db = getDb(c.env);
    const store = c.get('store');
    const settings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
    
    let apiKey = '';
    let tier = 'starter';
    
    for (const s of settings) {
        if (s.key === 'rajaongkir_api_key') apiKey = s.value;
        if (s.key === 'rajaongkir_tier') tier = s.value;
    }

    if (!apiKey) {
        throw new Error('API Key RajaOngkir belum dikonfigurasi.');
    }

    // RajaOngkir has migrated to Komerce
    const baseUrl = 'https://rajaongkir.komerce.id/api/v1';

    let origin = '';
    
    // Find origin from settings prioritized by tier
    const savedOrigin = settings.find(s => s.key === 'rajaongkir_origin')?.value;
    
    if (savedOrigin) {
        origin = savedOrigin;
    }

    return { apiKey, baseUrl, tier, origin };
};

// GET /search?q=... -> Proxy to Komerce search
router.get('/search', async (c) => {
    try {
        const q = c.req.query('q');
        if (!q || q.length < 3) return c.json({ data: [] });
        
        const { apiKey, baseUrl } = await getRajaOngkirConfig(c);
        
        const response = await fetch(`${baseUrl}/destination/domestic-destination?search=${encodeURIComponent(q)}`, {
            headers: { 'key': apiKey }
        });
        const data: any = await response.json();
        
        if (data.meta?.code !== 200) {
            return c.json({ error: data.meta?.message || 'Gagal mencari lokasi' }, 400);
        }

        return c.json({ data: data.data || [] });
    } catch (e: any) {
        return c.json({ error: e.message || 'Server error' }, 500);
    }
});

// 4. POST /calculate -> Calculate Cost
router.post('/calculate', async (c) => {
    try {
        const body = await c.req.json();
        const { apiKey, baseUrl, origin } = await getRajaOngkirConfig(c);
        
        if (!origin) {
            return c.json({ error: 'Lokasi asal pengiriman (Origin) belum dikonfigurasi oleh admin.' }, 400);
        }

        // Get active couriers from db
        const db = getDb(c.env);
        const store = c.get('store');
        const settings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const activeCouriers = settings.find(s => s.key === 'rajaongkir_couriers')?.value || 'jne:sicepat:jnt';

        // Komerce API uses separate request per courier
        const courierList = activeCouriers.split(':');
        let allResults: any[] = [];

        for (const courierName of courierList) {
            try {
                const params = new URLSearchParams();
                params.append('origin', String(origin));
                params.append('destination', String(body.destination));
                params.append('weight', String(body.weight || 1000));
                params.append('courier', courierName);

                const response = await fetch(`${baseUrl}/calculate/domestic-cost`, {
                    method: 'POST',
                    headers: {
                        'key': apiKey,
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: params
                });

                const data: any = await response.json();
                if (data.meta?.code === 200 && data.data) {
                    // Komerce response fields: name, code, service, description, cost, etd
                    const formatted = data.data.map((res: any) => ({
                        code: res.code,
                        name: res.name,
                        service: res.service,
                        description: res.description,
                        cost: Number(res.cost),
                        etd: res.etd
                    }));
                    allResults = [...allResults, ...formatted];
                }
            } catch (err) {
                console.error(`Error fetching ${courierName}:`, err);
            }
        }

        return c.json({ data: allResults });
    } catch (e: any) {
        return c.json({ error: e.message || 'Server error' }, 500);
    }
});

export default router;
