import { Link } from 'react-router-dom'
import { Icon } from '../atoms'

/**
 * CheckoutHeader - Sticky header for checkout page
 */
function CheckoutHeader({ onBack }) {
    return (
        <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-color dark:border-surface-dark px-4 sm:px-8 lg:px-40 py-4">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/cart"
                        className="group flex items-center gap-2 text-text-main-light dark:text-white hover:text-primary transition-colors"
                    >
                        <Icon name="arrow_back" size={24} />
                        <span className="text-sm font-bold tracking-wide">KERANJANG</span>
                    </Link>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-text-main-light dark:text-white uppercase">
                    Checkout
                </h1>
                <div className="w-20" /> {/* Spacer for centering */}
            </div>
        </header>
    )
}

export default CheckoutHeader
