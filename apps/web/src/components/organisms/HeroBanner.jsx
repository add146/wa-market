import { Badge, Button } from '../atoms'
import { useSettings } from '../../hooks/useSettings'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

const getImageUrl = (url, fallback) => {
    if (!url) return fallback
    if (url.startsWith('/uploads')) return `${API_BASE}${url}`
    return url
}

// Default values
const DEFAULTS = {
    banner1_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC79SghljH8x3YwylWZu72JlgJo52Bo2zZ6QACP_QqLM6Hit_Qhjhf5b6j4cu3zZgy-jZXASglJRolEB2OgcTL5P8FP7mB7hvnl0RrkeKn5JNJJ0-3mZ5uwNad18ifZJ5Fpg-sRjrMNmbi6qv3mQpyJb0iTbieRyIrX4cV1jQM5WyBIveRkks6aujsp6KEEQ20wNhPyRWaq8mWURzfimLULqW-i7HuWta8kgYAuDxb2RmpvLgsvjrCInhPs3jttFSJw2ejtSgTTSvTJ',
    banner1_badge: 'Flash Sale',
    banner1_title: 'Pesta Belanja Akhir Tahun',
    banner1_desc: 'Diskon hingga 70% untuk produk elektronik pilihan.',
    banner2_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChBkeXpdzI5r3jarUidlXO5F9KIatN2NNJk8sLwKfmeOT8ug9bTY1vJJHtleVmb4aqXumWK8aMmON3P3RWdyL1tJqyzYfjqZajS_EF5A0bdnyIL1qsMegn7LA4isQ1UuatAXnu-mRhrS7JG4qeGcUKJIkfGDpubiypwzfZQeSZMpLXNK9lYzwSKTgkxAF_jqIJcETFVLh6HVX1qTlOeBagxbbbkhvW8PbhbYvJFkZflPi428oY2P3TZfcrA0uO6ijG85iZXEQ5eh0t',
    banner2_label: 'Audio Premium',
    banner2_promo: 'Mulai Rp 50rb',
    banner3_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPV_yWYI41SPllIZFbkf0gXwOt4jA8pZKpdOL4ZfGYCx_lZrrBcp6VKuqfxOn5z2hCLzsNt60FMqtbXJxUDNHql3ca5rGWJ5HHnvOnpBanT5WPt_xfueTuxicXMyQFZ3U-wk-c3HYZMbLTI1kps9T0ZMDbhEv2FIDGjyZRA6-9hSrTApNWFBdfegJ600fboLhGA_beTA2Cbi_ERYc4JeFpM9SVbwkCTd8X244poYhXtaZGORQZ2FG6luBfHDeeOfsgSur_ZTVsPVOb',
    banner3_label: 'Sepatu Sport',
    banner3_promo: 'Cashback 20%',
}

/**
 * HeroBanner - Hero section with main and side banners (dynamic from settings)
 */
function HeroBanner() {
    const { data: settings, isLoading } = useSettings()

    // Get value from settings or default
    const get = (key) => settings?.[key] || DEFAULTS[key]

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                <div className="col-span-1 h-48 md:col-span-2 md:h-80 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                <div className="hidden md:flex flex-col gap-4 h-80">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {/* Main Banner */}
            <div className="relative col-span-1 h-48 overflow-hidden rounded-xl bg-gray-200 md:col-span-2 md:h-80 group cursor-pointer">
                <img
                    src={getImageUrl(get('banner1_image'), DEFAULTS.banner1_image)}
                    alt={get('banner1_title')}
                    fetchPriority="high"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10">
                    <Badge variant="sale" className="mb-2">{get('banner1_badge')}</Badge>
                    <h2 className="mb-2 text-2xl font-bold text-white md:text-4xl">
                        {get('banner1_title')}
                    </h2>
                    <p className="mb-4 text-sm text-gray-200 md:text-base">
                        {get('banner1_desc')}
                    </p>
                    <Button variant="primary" size="lg">
                        Cek Sekarang
                    </Button>
                </div>
            </div>

            {/* Side Banners - Grid on mobile, flex column on desktop */}
            <div className="grid grid-cols-2 gap-3 md:flex md:flex-col md:gap-4 md:h-80">
                {/* Banner 2 */}
                <div className="relative h-32 md:h-auto md:flex-1 overflow-hidden rounded-xl bg-primary/10 group cursor-pointer">
                    <img
                        src={getImageUrl(get('banner2_image'), DEFAULTS.banner2_image)}
                        alt={get('banner2_label')}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-full p-3 md:p-4">
                        <p className="text-xs md:text-sm font-medium text-gray-200">{get('banner2_label')}</p>
                        <p className="text-sm md:text-lg font-bold text-white">{get('banner2_promo')}</p>
                    </div>
                </div>

                {/* Banner 3 */}
                <div className="relative h-32 md:h-auto md:flex-1 overflow-hidden rounded-xl bg-primary/10 group cursor-pointer">
                    <img
                        src={getImageUrl(get('banner3_image'), DEFAULTS.banner3_image)}
                        alt={get('banner3_label')}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-full p-3 md:p-4">
                        <p className="text-xs md:text-sm font-medium text-gray-200">{get('banner3_label')}</p>
                        <p className="text-sm md:text-lg font-bold text-white">{get('banner3_promo')}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeroBanner
