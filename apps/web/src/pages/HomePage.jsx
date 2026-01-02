import { useState } from 'react'
import { HeroBanner, CategoryChips, ProductGrid, Footer } from '../components/organisms'
import { useProducts, useCategories } from '../hooks'
import { useSearch } from '../context'
import LoadingState from '../components/atoms/LoadingState'

/**
 * HomePage - Main landing page with all sections
 */
function HomePage() {
    const { data: productsData, isLoading, isError, error } = useProducts()
    const { data: categories } = useCategories()
    const { searchQuery } = useSearch()
    const [selectedCategory, setSelectedCategory] = useState(null)

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId === 'all' ? null : categoryId)
    }

    if (isLoading) {
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
    })) || []

    // Filter by search query
    let products = searchQuery
        ? allProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allProducts

    // Filter by selected category
    if (selectedCategory) {
        products = products.filter(p => p.categoryId === selectedCategory)
    }

    return (
        <>
            <HeroBanner />
            <CategoryChips
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
            />
            <ProductGrid products={products} />
            <Footer />
        </>
    )
}

export default HomePage
