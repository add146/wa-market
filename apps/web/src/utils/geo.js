/**
 * Calculate distance between two GPS coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(deg) {
    return deg * (Math.PI / 180)
}

/**
 * Simplify an address by progressively removing specific parts
 * e.g. "Taman Pondok Jati CM 08, Sidoarjo Jawa Timur"
 *   -> "Taman Pondok Jati, Sidoarjo Jawa Timur"
 *   -> "Pondok Jati Sidoarjo"
 */
function simplifyAddress(address) {
    const variants = []

    // 1) Remove house/block numbers: No XX, Blok XX, RT XX, RW XX, etc.
    let simplified = address
        .replace(/\b(no|nomor|blok|rt|rw|gang|gg|kav)[.\s]*\d+[a-z]?\b/gi, '')
        .replace(/\b[A-Z]{1,3}\s*\d{1,4}[a-z]?\b/g, '') // "CM 08", "A12", etc.
        .replace(/\b\d{1,4}\s*(km|meter|m)\b/gi, '')
        .replace(/\bkode\s*pos\s*\d+/gi, '')
        .replace(/\b\d{5}\b/g, '') // zip codes
        .replace(/[,.\-/]+\s*/g, ', ')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[,\s]+|[,\s]+$/g, '')
        .trim()
    if (simplified !== address && simplified.length >= 5) {
        variants.push(simplified)
    }

    // 2) Keep only meaningful words (3+ chars), skip numbers
    const words = simplified.split(/[\s,]+/).filter(w => w.length >= 3 && !/^\d+$/.test(w))
    if (words.length > 2) {
        variants.push(words.join(' '))
    }
    // 3) Last 2-3 words (usually kecamatan/kota)
    if (words.length > 3) {
        variants.push(words.slice(-3).join(' '))
    }

    return variants
}

/**
 * Fetch from Nominatim with rate-limit compliance
 */
async function nominatimSearch(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=id`
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'WaMarket/1.0 (https://unikasik.com)'
        }
    })
    const data = await response.json()
    return data.map(item => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
    }))
}

/**
 * Geocode an address using Nominatim (OpenStreetMap) with progressive fallback.
 * Tries the full address first, then progressively simplified versions.
 * Returns array of { lat, lng, displayName }
 */
export async function geocodeAddress(address) {
    // 1) Try full address first
    let results = await nominatimSearch(address)
    if (results.length > 0) return results

    // 2) Try simplified variants
    const variants = simplifyAddress(address)
    for (const variant of variants) {
        // Nominatim rate limit: 1 req/s
        await new Promise(r => setTimeout(r, 1100))
        results = await nominatimSearch(variant)
        if (results.length > 0) return results
    }

    return []
}
