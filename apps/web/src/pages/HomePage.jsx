import { useState, useEffect } from 'react'
import { HeroBanner, CategoryChips, ProductGrid, Footer } from '../components/organisms'
import { useProducts, useCategories } from '../hooks'
import { useSearch } from '../context'
import LoadingState from '../components/atoms/LoadingState'

/**
 * HomePage - Main landing page with all sections
 */
function HomePage() {
    const { searchQuery } = useSearch()
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [limit, setLimit] = useState(12)

    // Reset limit when searching or changing category
    useEffect(() => {
        setLimit(12)
    }, [searchQuery, selectedCategory])

    const { data: productsData, isLoading, isError, error, isFetching } = useProducts({
        limit,
        search: searchQuery || undefined,
        category: selectedCategory || undefined
    })
    
    const { data: categories } = useCategories()

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId === 'all' ? null : categoryId)
    }

    if (isLoading && limit === 12) {
        return <LoadingState />
    }

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

    // Transform API data
    const allProducts = productsData?.products?.map(p => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        category: categories?.find(c => c.id === p.categoryId)?.name || 'Lainnya',
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        image: p.image,
        imageAlt: p.imageAlt || p.name,
        productType: p.productType,
        preorderDays: p.preorderDays
    })) || []

    const totalAvailable = productsData?.pagination?.total || 0
    const hasMore = allProducts.length < totalAvailable

    return (
        <>
            <HeroBanner />
            <CategoryChips
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
            />
            
            <ProductGrid products={allProducts} />

            {/* Load More Area */}
            {hasMore ? (
                <div className="py-8 flex justify-center">
                    <button
                        onClick={() => setLimit(prev => prev + 12)}
                        disabled={isFetching}
                        className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-primary/20 text-primary font-semibold rounded-xl hover:bg-primary/5 hover:border-primary transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isFetching && <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {isFetching ? 'Memuat...' : 'Tampilkan Lebih Banyak'}
                    </button>
                </div>
            ) : (
                allProducts.length > 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm">
                        Menampilkan semua {allProducts.length} produk
                    </div>
                )
            )}

            <Footer />
        </>
    )
}

export default HomePage
