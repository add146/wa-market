import { Link } from 'react-router-dom'
import { Icon, Button } from '../components/atoms'

/**
 * NotFoundPage - 404 error page
 */
function NotFoundPage() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
            {/* Illustration */}
            <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                    <Icon name="search_off" size={64} className="text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                    <span className="text-2xl font-bold text-accent">?</span>
                </div>
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main-dark md:text-5xl">
                    404
                </h1>
                <h2 className="text-xl font-semibold text-text-main-light dark:text-text-main-dark">
                    Halaman Tidak Ditemukan
                </h2>
                <p className="max-w-md text-sm text-text-muted-light dark:text-text-muted-dark">
                    Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
                    Silakan kembali ke beranda untuk melanjutkan belanja.
                </p>
            </div>

            {/* Action Button */}
            <Link to="/">
                <Button
                    variant="primary"
                    size="lg"
                    icon={<Icon name="home" size={18} />}
                >
                    Kembali ke Beranda
                </Button>
            </Link>

            {/* Suggestions */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                    Coba juga:
                </span>
                <Link to="/" className="text-xs font-medium text-primary hover:text-primary-dark">
                    Promo Terbaru
                </Link>
                <span className="text-xs text-text-muted-light">•</span>
                <Link to="/" className="text-xs font-medium text-primary hover:text-primary-dark">
                    Produk Populer
                </Link>
                <span className="text-xs text-text-muted-light">•</span>
                <Link to="/" className="text-xs font-medium text-primary hover:text-primary-dark">
                    Kategori
                </Link>
            </div>
        </div>
    )
}

export default NotFoundPage
