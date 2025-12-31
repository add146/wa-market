import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../atoms'
import { CartDropdown } from '../organisms'
import { useCart } from '../../context'

/**
 * NavActions - Cart & profile action buttons with responsive dropdown
 * Mobile: navigates to cart page
 * Desktop: shows dropdown on hover
 */
function NavActions({ cartCount = 0 }) {
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const { itemCount } = useCart()
    const count = itemCount || cartCount

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const CartIcon = (
        <>
            <Icon name="shopping_cart" className="text-text-main-light dark:text-white" />
            {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white border-2 border-background-light dark:border-background-dark">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </>
    )

    return (
        <div className="flex items-center gap-2 md:gap-4">
            {/* Cart - Mobile: Link, Desktop: Dropdown */}
            {isMobile ? (
                <Link
                    to="/cart"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                >
                    {CartIcon}
                </Link>
            ) : (
                <div
                    className="relative"
                    onMouseEnter={() => setIsCartOpen(true)}
                    onMouseLeave={() => setIsCartOpen(false)}
                >
                    <button
                        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                    >
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

            {/* Profile */}
            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                <Icon name="account_circle" className="text-text-main-light dark:text-white" />
            </button>
        </div>
    )
}

export default NavActions



