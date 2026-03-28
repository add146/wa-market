import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/templates'
import { ProductCard } from '../components/organisms'
import { Icon } from '../components/atoms'
import { useWishlist, useAuth } from '../context'
import LoadingState from '../components/atoms/LoadingState'

function WishlistPage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { wishlists, isLoading, fetchWishlists } = useWishlist()

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
        } else {
            fetchWishlists()
        }
    }, [isAuthenticated, navigate])

    return (
        <MainLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Wishlist Saya
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Produk favorit yang Anda simpan
                        </p>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <LoadingState text="Memuat wishlist..." />
                ) : wishlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10221c] py-16 px-4 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/20">
                            <Icon name="favorite_border" size={32} />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                            Wishlist Kosong
                        </h3>
                        <p className="mb-6 max-w-sm text-slate-500 dark:text-slate-400">
                            Anda belum menyimpan produk apapun. Yuk temukan produk menarik di toko kami!
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20"
                        >
                            <Icon name="storefront" size={20} />
                            Belanja Sekarang
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {wishlists.map((item) => (
                            <ProductCard key={item.id} product={item.product || { id: item.productId }} />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    )
}

export default WishlistPage
