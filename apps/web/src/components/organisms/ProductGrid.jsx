import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

/**
 * ProductGrid - Grid of product cards with header
 */
function ProductGrid({ products, title = 'Rekomendasi Untukmu', showViewAll = true }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                    {title}
                </h3>
                {showViewAll && (
                    <Link
                        to="/"
                        className="text-sm font-bold text-primary hover:text-primary-dark"
                    >
                        Lihat Semua
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}

export default ProductGrid
