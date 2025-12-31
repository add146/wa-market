import { HeroBanner, CategoryChips, ProductGrid, Footer } from '../components/organisms'
import { useProducts, useCategories } from '../hooks'
import LoadingState from '../components/atoms/LoadingState'

/**
 * HomePage - Main landing page with all sections
 */
function HomePage() {
    // Fetch products from API
    const { data: productsData, isLoading, isError, error } = useProducts()
    const { data: categories } = useCategories()

    const handleCategoryChange = (categoryId) => {
        console.log('Category changed:', categoryId)
        // Future: Filter products by category
    }

    // Show loading state
    if (isLoading) {
        return <LoadingState />
    }

    // Show error state
    if (isError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                        Gagal Memuat Data
                    </h2>
                    <p className="text-red-600 dark:text-red-300">
                        {error?.message || 'Terjadi kesalahan saat mengambil data produk'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        )
    }

    // Transform API data to match component props
    const products = productsData?.products?.map(p => ({
        id: p.id,
        name: p.name,
        category: categories?.find(c => c.id === p.categoryId)?.name || 'Lainnya',
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        image: p.image,
        imageAlt: p.imageAlt || p.name,
    })) || []

    return (
        <>
            {/* Hero Banner Section */}
            <HeroBanner />

            {/* Category Chips */}
            <CategoryChips onCategoryChange={handleCategoryChange} />

            {/* Product Grid */}
            <ProductGrid products={products} />

            {/* Footer */}
            <Footer />
        </>
    )
}

export default HomePage
