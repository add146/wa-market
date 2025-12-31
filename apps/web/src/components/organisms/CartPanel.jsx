import { Icon } from '../atoms'
import { ShippingBanner } from '../molecules'
import CartItemList from './CartItemList'
import CartFooter from './CartFooter'

/**
 * CartPanel - Panel utama keranjang belanja
 * Slide-out panel dari kanan dengan header, list items, dan footer
 */
function CartPanel({
    items = [],
    onClose,
    onQuantityChange,
    onRemove,
    onCheckout,
    onContinueShopping
}) {
    // Calculate totals
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = items.reduce((sum, item) => {
        const price = item.originalPrice || item.price
        return sum + (price * item.quantity)
    }, 0)
    const discount = items.reduce((sum, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
            return sum + ((item.originalPrice - item.price) * item.quantity)
        }
        return sum
    }, 0)
    const subtotal = totalPrice - discount

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full md:max-w-[480px] bg-white dark:bg-background-dark shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out h-full border-l border-white/10">
            {/* Header */}
            <header className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-white dark:bg-background-dark relative z-10">
                <div>
                    <h2 className="text-text-main-light dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                        Keranjang Belanja
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
                        {totalItems} Item dalam keranjang
                    </p>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Tutup keranjang"
                    className="group p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                >
                    <Icon name="close" className="text-2xl" />
                </button>
            </header>

            {/* Shipping Banner */}
            <ShippingBanner />

            {/* Cart Items List */}
            <CartItemList
                items={items}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
            />

            {/* Footer */}
            <CartFooter
                totalItems={totalItems}
                totalPrice={totalPrice}
                discount={discount}
                subtotal={subtotal}
                onCheckout={onCheckout}
                onContinueShopping={onContinueShopping}
            />
        </div>
    )
}

export default CartPanel
