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

    let baseUrl = 'https://api.rajaongkir.com/starter';
    if (tier === 'basic') baseUrl = 'https://api.rajaongkir.com/basic';
    if (tier === 'pro') baseUrl = 'https://pro.rajaongkir.com/api';

    let origin = '';
    let originType = 'city';
    
    // Find origin from settings prioritized by tier
    const subId = settings.find(s => s.key === 'rajaongkir_origin_subdistrict')?.value;
    const cityId = settings.find(s => s.key === 'rajaongkir_origin_city')?.value;
    
    if (tier !== 'starter' && subId) {
        origin = subId;
        originType = 'subdistrict';
    } else if (cityId) {
        origin = cityId;
        originType = 'city';
    }

    return { apiKey, baseUrl, tier, origin, originType };
};

// 1. GET /provinces -> Fetch Provinces
router.get('/provinces', async (c) => {
    try {
        const { apiKey, baseUrl } = await getRajaOngkirConfig(c);
        const response = await fetch(`${baseUrl}/province`, {
            headers: { 'key': apiKey }
        });
        const data: any = await response.json();
        
        if (data.rajaongkir.status.code !== 200) {
            return c.json({ error: data.rajaongkir.status.description }, 400);
        }
        return c.json({ data: data.rajaongkir.results });
    } catch (e: any) {
        return c.json({ error: e.message || 'Server error' }, 500);
    }
});

// 2. GET /cities/:provinceId -> Fetch Cities by Province
router.get('/cities/:provinceId', async (c) => {
    try {
        const provinceId = c.req.param('provinceId');
        const { apiKey, baseUrl } = await getRajaOngkirConfig(c);
        const response = await fetch(`${baseUrl}/city?province=${provinceId}`, {
            headers: { 'key': apiKey }
        });
        const data: any = await response.json();
        
        if (data.rajaongkir.status.code !== 200) {
            return c.json({ error: data.rajaongkir.status.description }, 400);
        }
        return c.json({ data: data.rajaongkir.results });
    } catch (e: any) {
        return c.json({ error: e.message || 'Server error' }, 500);
    }
});

// 3. GET /subdistricts/:cityId -> Fetch Subdistricts by City (Only Basic/Pro)
router.get('/subdistricts/:cityId', async (c) => {
    try {
        const cityId = c.req.param('cityId');
        const { apiKey, baseUrl, tier } = await getRajaOngkirConfig(c);
        
        if (tier === 'starter') {
            return c.json({ error: 'Subdistrict tidak didukung oleh tipe akun Starter.' }, 400);
        }

        const response = await fetch(`${baseUrl}/subdistrict?city=${cityId}`, {
            headers: { 'key': apiKey }
        });
        const data: any = await response.json();
        
        if (data.rajaongkir.status.code !== 200) {
            return c.json({ error: data.rajaongkir.status.description }, 400);
        }
        return c.json({ data: data.rajaongkir.results });
    } catch (e: any) {
        return c.json({ error: e.message || 'Server error' }, 500);
    }
});

// 4. POST /calculate -> Calculate Cost
// body expects: { origin, originType, destination, destinationType, weight, courier }
router.post('/calculate', async (c) => {
    try {
        const body = await c.req.json();
        const { apiKey, baseUrl, origin, originType, tier } = await getRajaOngkirConfig(c);
        
        if (!origin) {
            return c.json({ error: 'Lokasi asal pengiriman (Origin) belum dikonfigurasi oleh admin.' }, 400);
        }

        // For starter, originType and destinationType are ignored, but for Pro/Basic it requires them.
        const payload: any = {
            origin: origin,
            destination: body.destination,
            weight: body.weight,
        };
        
        // Add couriers if specified (frontend will normally send courier name, but rajaongkir v2 wants string like "jne:pos:tiki")
        // But wait! frontend calls /calculate to get all couriers, so we might want to query all enabled ones.
        // Let's get couriers from db:
        const db = getDb(c.env);
        const store = c.get('store');
        const settings = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
        const activeCouriers = settings.find(s => s.key === 'rajaongkir_couriers')?.value || 'jne:sicepat:jnt';
        
        payload.courier = activeCouriers;
        
        if (tier !== 'starter') {
            payload.originType = originType;
            if (body.destinationType) payload.destinationType = body.destinationType;
        }

        const response = await fetch(`${baseUrl}/cost`, {
            method: 'POST',
            headers: {
                'key': apiKey,
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(payload).toString()
        });

        const data: any = await response.json();
        
        if (data.rajaongkir.status.code !== 200) {
            return c.json({ error: data.rajaongkir.status.description }, 400);
        }
        return c.json({ data: data.rajaongkir.results[0]?.costs || [] });
    } catch (e: any) {
        return c.json({ error: e.message || 'Server error' }, 500);
    }
});

export default router;
