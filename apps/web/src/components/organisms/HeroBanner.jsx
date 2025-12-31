import { Badge, Button } from '../atoms'

/**
 * HeroBanner - Hero section with main and side banners
 */
function HeroBanner() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {/* Main Banner */}
            <div className="relative col-span-1 h-48 overflow-hidden rounded-xl bg-gray-200 md:col-span-2 md:h-80 group cursor-pointer">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC79SghljH8x3YwylWZu72JlgJo52Bo2zZ6QACP_QqLM6Hit_Qhjhf5b6j4cu3zZgy-jZXASglJRolEB2OgcTL5P8FP7mB7hvnl0RrkeKn5JNJJ0-3mZ5uwNad18ifZJ5Fpg-sRjrMNmbi6qv3mQpyJb0iTbieRyIrX4cV1jQM5WyBIveRkks6aujsp6KEEQ20wNhPyRWaq8mWURzfimLULqW-i7HuWta8kgYAuDxb2RmpvLgsvjrCInhPs3jttFSJw2ejtSgTTSvTJ')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10">
                    <Badge variant="sale" className="mb-2">Flash Sale</Badge>
                    <h2 className="mb-2 text-2xl font-bold text-white md:text-4xl">
                        Pesta Belanja <br />Akhir Tahun
                    </h2>
                    <p className="mb-4 text-sm text-gray-200 md:text-base">
                        Diskon hingga 70% untuk produk elektronik pilihan.
                    </p>
                    <Button variant="primary" size="lg">
                        Cek Sekarang
                    </Button>
                </div>
            </div>

            {/* Side Banners */}
            <div className="hidden flex-col gap-4 md:flex md:h-80">
                {/* Audio Premium Banner */}
                <div className="relative flex-1 overflow-hidden rounded-xl bg-primary/10 group cursor-pointer">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuChBkeXpdzI5r3jarUidlXO5F9KIatN2NNJk8sLwKfmeOT8ug9bTY1vJJHtleVmb4aqXumWK8aMmON3P3RWdyL1tJqyzYfjqZajS_EF5A0bdnyIL1qsMegn7LA4isQ1UuatAXnu-mRhrS7JG4qeGcUKJIkfGDpubiypwzfZQeSZMpLXNK9lYzwSKTgkxAF_jqIJcETFVLh6HVX1qTlOeBagxbbbkhvW8PbhbYvJFkZflPi428oY2P3TZfcrA0uO6ijG85iZXEQ5eh0t')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-4">
                        <p className="text-sm font-medium text-gray-200">Audio Premium</p>
                        <p className="text-lg font-bold text-white">Mulai Rp 50rb</p>
                    </div>
                </div>

                {/* Sepatu Sport Banner */}
                <div className="relative flex-1 overflow-hidden rounded-xl bg-primary/10 group cursor-pointer">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBPV_yWYI41SPllIZFbkf0gXwOt4jA8pZKpdOL4ZfGYCx_lZrrBcp6VKuqfxOn5z2hCLzsNt60FMqtbXJxUDNHql3ca5rGWJ5HHnvOnpBanT5WPt_xfueTuxicXMyQFZ3U-wk-c3HYZMbLTI1kps9T0ZMDbhEv2FIDGjyZRA6-9hSrTApNWFBdfegJ600fboLhGA_beTA2Cbi_ERYc4JeFpM9SVbwkCTd8X244poYhXtaZGORQZ2FG6luBfHDeeOfsgSur_ZTVsPVOb')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-4">
                        <p className="text-sm font-medium text-gray-200">Sepatu Sport</p>
                        <p className="text-lg font-bold text-white">Cashback 20%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeroBanner
