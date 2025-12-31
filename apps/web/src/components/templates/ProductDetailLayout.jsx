import { ProductDetailHeader, ProductDetailFooter } from '../organisms'

/**
 * ProductDetailLayout - Layout for product detail page with specific header and footer
 */
function ProductDetailLayout({ children, brandName = 'BrandName' }) {
    return (
        <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
            <ProductDetailHeader brandName={brandName} />

            <main className="flex-1 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            <ProductDetailFooter />
        </div>
    )
}

export default ProductDetailLayout
