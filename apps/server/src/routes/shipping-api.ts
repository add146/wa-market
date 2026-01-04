import express, { Request, Response } from 'express';
import { db } from '../db';
import { storeSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// RajaOngkir API V2 base URL
const RAJAONGKIR_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

// Type for RajaOngkir response
interface RajaOngkirResponse {
    data?: Array<{ subdistrict_id?: string;[key: string]: unknown }>;
    [key: string]: unknown;
}

// Helper to get RajaOngkir API key from settings
async function getApiKey(): Promise<string | null> {
    const [setting] = await db.select().from(storeSettings).where(eq(storeSettings.key, 'rajaongkir_api_key'));
    return setting?.value || null;
}

// Helper to get origin city from settings
async function getOriginCity(): Promise<string | null> {
    const [setting] = await db.select().from(storeSettings).where(eq(storeSettings.key, 'rajaongkir_origin_city'));
    return setting?.value || null;
}

// Helper to get enabled couriers from settings
async function getCouriers(): Promise<string> {
    const [setting] = await db.select().from(storeSettings).where(eq(storeSettings.key, 'rajaongkir_couriers'));
    return setting?.value || 'jne:sicepat:jnt';
}

/**
 * GET /api/shipping/search-destination
 * Search destination for shipping (Direct Search Method)
 */
router.get('/search-destination', async (req: Request, res: Response) => {
    try {
        const { keyword } = req.query;
        const apiKey = await getApiKey();

        if (!apiKey) {
            res.status(400).json({ error: 'RajaOngkir API key not configured' });
            return;
        }

        if (!keyword) {
            res.status(400).json({ error: 'Keyword is required' });
            return;
        }

        const response = await fetch(`${RAJAONGKIR_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(keyword as string)}`, {
            headers: {
                'key': apiKey
            }
        });

        const data = await response.json() as RajaOngkirResponse;

        // Normalize response to ensure 'id' and 'label' fields exist for frontend compatibility
        // RajaOngkir search doesn't return subdistrict_id, so we use zip_code as the identifier
        if (data?.data && Array.isArray(data.data)) {
            data.data = data.data.map((item: { zip_code?: string; subdistrict_id?: string; subdistrict_name?: string; district_name?: string; city_name?: string; province_name?: string;[key: string]: unknown }) => ({
                ...item,
                // Use zip_code as the ID for cost calculation (RajaOngkir accepts zip_code as destination)
                id: item.zip_code || item.subdistrict_id,
                // Create a full label for display
                label: `${item.subdistrict_name}, ${item.district_name}, ${item.city_name}, ${item.province_name}`
            }));
        }

        res.json(data);
    } catch (error) {
        console.error('RajaOngkir search error:', error);
        res.status(500).json({ error: 'Failed to search destination' });
    }
});

/**
 * GET /api/shipping/provinces
 * Get list of provinces (Step-by-Step Method)
 */
router.get('/provinces', async (req: Request, res: Response) => {
    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            res.status(400).json({ error: 'RajaOngkir API key not configured' });
            return;
        }

        const response = await fetch(`${RAJAONGKIR_BASE_URL}/destination/province`, {
            headers: { 'key': apiKey }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('RajaOngkir provinces error:', error);
        res.status(500).json({ error: 'Failed to get provinces' });
    }
});

/**
 * GET /api/shipping/cities/:provinceId
 * Get cities by province ID (Step-by-Step Method)
 */
router.get('/cities/:provinceId', async (req: Request, res: Response) => {
    try {
        const { provinceId } = req.params;
        const apiKey = await getApiKey();
        if (!apiKey) {
            res.status(400).json({ error: 'RajaOngkir API key not configured' });
            return;
        }

        const response = await fetch(`${RAJAONGKIR_BASE_URL}/destination/city?province=${provinceId}`, {
            headers: { 'key': apiKey }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('RajaOngkir cities error:', error);
        res.status(500).json({ error: 'Failed to get cities' });
    }
});

/**
 * GET /api/shipping/districts/:cityId
 * Get districts by city ID (Step-by-Step Method)
 */
router.get('/districts/:cityId', async (req: Request, res: Response) => {
    try {
        const { cityId } = req.params;
        const apiKey = await getApiKey();
        if (!apiKey) {
            res.status(400).json({ error: 'RajaOngkir API key not configured' });
            return;
        }

        const response = await fetch(`${RAJAONGKIR_BASE_URL}/destination/subdistrict?city=${cityId}`, {
            headers: { 'key': apiKey }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('RajaOngkir districts error:', error);
        res.status(500).json({ error: 'Failed to get districts' });
    }
});

/**
 * POST /api/shipping/calculate
 * Calculate shipping cost using zip_code to lookup subdistrict_id first
 */
router.post('/calculate', async (req: Request, res: Response) => {
    try {
        const { destination, weight = 1000 } = req.body;
        const apiKey = await getApiKey();
        const originCityId = await getOriginCity();
        const enabledCouriers = await getCouriers(); // Get from settings

        if (!apiKey) {
            res.status(400).json({ error: 'RajaOngkir API key not configured' });
            return;
        }

        if (!originCityId) {
            res.status(400).json({ error: 'Origin city not configured. Please set it in Settings.' });
            return;
        }

        if (!destination) {
            res.status(400).json({ error: 'Destination is required' });
            return;
        }

        // First, try to get subdistrict_id by searching with the zip_code
        let destinationId = destination;

        // If destination looks like a zip_code (5 digits), search for the subdistrict_id
        if (/^\d{5}$/.test(destination)) {
            try {
                const searchResponse = await fetch(`${RAJAONGKIR_BASE_URL}/destination/domestic-destination?search=${destination}`, {
                    headers: { 'key': apiKey }
                });
                const searchData = await searchResponse.json() as { data?: Array<{ zip_code?: string; subdistrict_id?: string }> };

                // Try to find a matching subdistrict_id from the search results
                if (searchData?.data && Array.isArray(searchData.data) && searchData.data.length > 0) {
                    // Find the exact match by zip_code
                    const exactMatch = searchData.data.find((item: { zip_code?: string; subdistrict_id?: string }) =>
                        item.zip_code === destination
                    );
                    if (exactMatch?.subdistrict_id) {
                        destinationId = exactMatch.subdistrict_id;
                    }
                }
            } catch (lookupError) {
                console.log('Zip code lookup failed, using destination as-is:', lookupError);
            }
        }

        // Calculate shipping cost using form-urlencoded format
        const formData = new URLSearchParams();
        formData.append('origin', originCityId);
        formData.append('destination', destinationId);
        formData.append('weight', String(weight));
        formData.append('courier', enabledCouriers);

        console.log('RajaOngkir calculate request:', {
            origin: originCityId,
            destination: destinationId,
            weight: String(weight),
            courier: enabledCouriers
        });

        const costResponse = await fetch(`${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`, {
            method: 'POST',
            headers: {
                'key': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        const costData = await costResponse.json();
        console.log('RajaOngkir calculate response:', JSON.stringify(costData).substring(0, 500));

        res.json(costData);
    } catch (error) {
        console.error('RajaOngkir calculate error:', error);
        res.status(500).json({ error: 'Failed to calculate shipping cost' });
    }
});

/**
 * GET /api/shipping/couriers
 * Get available couriers
 */
router.get('/couriers', async (req: Request, res: Response) => {
    // Popular couriers in Indonesia
    const couriers = [
        { code: 'jne', name: 'JNE' },
        { code: 'sicepat', name: 'SiCepat' },
        { code: 'jnt', name: 'J&T Express' },
        { code: 'pos', name: 'POS Indonesia' },
        { code: 'tiki', name: 'TIKI' },
        { code: 'anteraja', name: 'AnterAja' },
        { code: 'ninja', name: 'Ninja Express' },
        { code: 'lion', name: 'Lion Parcel' }
    ];
    res.json({ data: couriers });
});

export default router;
