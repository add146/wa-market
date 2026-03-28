import { useEffect, useRef, useState } from 'react'

/**
 * StoreLocationMap - Interactive Leaflet map for picking store location
 * Dynamically loads Leaflet to avoid SSR/build issues
 */
function StoreLocationMap({ lat, lng, radius, onLocationChange }) {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const markerRef = useRef(null)
    const circleRef = useRef(null)
    const [leafletLoaded, setLeafletLoaded] = useState(false)
    const LRef = useRef(null)

    // Default center: Indonesia (Jakarta)
    const defaultLat = -6.2088
    const defaultLng = 106.8456
    const currentLat = lat || defaultLat
    const currentLng = lng || defaultLng

    // Load Leaflet dynamically
    useEffect(() => {
        let cancelled = false

        const loadLeaflet = async () => {
            try {
                // Import CSS
                await import('leaflet/dist/leaflet.css')
                // Import Leaflet
                const L = await import('leaflet')
                if (!cancelled) {
                    LRef.current = L.default || L
                    // Fix default marker icon issue
                    delete LRef.current.Icon.Default.prototype._getIconUrl
                    LRef.current.Icon.Default.mergeOptions({
                        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    })
                    setLeafletLoaded(true)
                }
            } catch (err) {
                console.error('Failed to load Leaflet:', err)
            }
        }

        loadLeaflet()
        return () => { cancelled = true }
    }, [])

    // Initialize map
    useEffect(() => {
        if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return
        const L = LRef.current

        const map = L.map(mapRef.current).setView([currentLat, currentLng], lat ? 15 : 5)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map)

        // Add marker if location exists
        if (lat && lng) {
            const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
            marker.on('dragend', () => {
                const pos = marker.getLatLng()
                onLocationChange(pos.lat, pos.lng)
            })
            markerRef.current = marker

            // Add radius circle
            const circle = L.circle([lat, lng], {
                radius: (radius || 5) * 1000,
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.1,
                weight: 2,
            }).addTo(map)
            circleRef.current = circle
        }

        // Click to set location
        map.on('click', (e) => {
            const { lat: clickLat, lng: clickLng } = e.latlng
            onLocationChange(clickLat, clickLng)
        })

        mapInstanceRef.current = map

        // Cleanup
        return () => {
            map.remove()
            mapInstanceRef.current = null
            markerRef.current = null
            circleRef.current = null
        }
    }, [leafletLoaded])

    // Update marker and circle when lat/lng/radius changes
    useEffect(() => {
        if (!mapInstanceRef.current || !leafletLoaded) return
        const L = LRef.current
        const map = mapInstanceRef.current

        // Remove old marker and circle
        if (markerRef.current) {
            map.removeLayer(markerRef.current)
            markerRef.current = null
        }
        if (circleRef.current) {
            map.removeLayer(circleRef.current)
            circleRef.current = null
        }

        if (lat && lng) {
            // Add new marker
            const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
            marker.on('dragend', () => {
                const pos = marker.getLatLng()
                onLocationChange(pos.lat, pos.lng)
            })
            markerRef.current = marker

            // Add radius circle
            const circle = L.circle([lat, lng], {
                radius: (radius || 5) * 1000,
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.1,
                weight: 2,
            }).addTo(map)
            circleRef.current = circle

            map.setView([lat, lng], Math.max(map.getZoom(), 13))
        }
    }, [lat, lng, radius, leafletLoaded])

    if (!leafletLoaded) {
        return (
            <div className="w-full h-[300px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-slate-400 text-sm">Memuat peta...</span>
            </div>
        )
    }

    return (
        <div className="relative">
            <div
                ref={mapRef}
                className="w-full h-[300px] rounded-xl border border-slate-200 dark:border-slate-700 z-0"
                style={{ zIndex: 0 }}
            />
            <p className="text-xs text-slate-400 mt-2">
                💡 Klik pada peta atau geser marker untuk menentukan posisi toko
            </p>
        </div>
    )
}

export default StoreLocationMap
