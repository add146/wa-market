import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../atoms'
import { CartDropdown } from '../organisms'
import { useCart } from '../../context'

/**
 * ProductDetailHeader - Navbar for product detail with back button
 * Mobile: cart navigates to cart page
 * Desktop: cart shows dropdown on hover
 */
function ProductDetailHeader({ brandName = 'BrandName' }) {
    const navigate = useNavigate()
    const { itemCount } = useCart()
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleBack = () => {
        navigate(-1)
    }

    const CartIcon = (
        <>
            <Icon name="shopping_cart" size={24} />
            {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white border-2 border-white dark:border-surface-dark">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </>
    )

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-surface-dark/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="group flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        <Icon name="arrow_back" size={24} />
                    </button>
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded bg-primary/10 text-primary">
                            <Icon name="storefront" size={20} />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                            {brandName}
                        </h2>
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    {/* Cart - Mobile: Link, Desktop: Dropdown */}
                    {isMobile ? (
                        <Link
                            to="/cart"
                            className="relative flex size-10 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                        >
                            {CartIcon}
                        </Link>
                    ) : (
                        <div
                            className="relative"
                            onMouseEnter={() => setIsCartOpen(true)}
                            onMouseLeave={() => setIsCartOpen(false)}
                        >
                            <button className="relative flex size-10 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
                                {CartIcon}
                            </button>

                            {/* Dropdown - Desktop only */}
                            {isCartOpen && (
                                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
                                    <CartDropdown />
                                </div>
                            )}
                        </div>
                    )}

                    <button className="flex size-10 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
                        <Icon name="account_circle" size={24} />
                    </button>
                </div>
            </div>
        </header>
    )
}

export default ProductDetailHeader



