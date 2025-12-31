import { Link } from 'react-router-dom'
import { Icon, Button } from '../atoms'
import { CartSummary } from '../molecules'

/**
 * CartFooter - Footer keranjang dengan summary dan action buttons
 */
function CartFooter({
    totalItems,
    totalPrice,
    discount,
    subtotal,
    onCheckout,
    onContinueShopping
}) {
    return (
        <footer className="border-t border-gray-200 dark:border-white/10 p-6 bg-white dark:bg-background-dark shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20">
            {/* Summary */}
            <CartSummary
                totalItems={totalItems}
                totalPrice={totalPrice}
                discount={discount}
                subtotal={subtotal}
            />

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={onCheckout}
                    className="group w-full flex items-center justify-center gap-2 rounded-xl h-12 bg-primary text-white text-base font-bold tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20"
                >
                    <span>CHECKOUT SEKARANG</span>
                    <Icon name="arrow_forward" className="text-xl group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={onContinueShopping}
                    className="w-full flex items-center justify-center rounded-xl h-12 bg-transparent border border-gray-200 dark:border-white/10 text-text-main-light dark:text-white text-base font-bold hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-200"
                >
                    Lanjut Belanja
                </button>
            </div>

            {/* Trust Badge */}
            <div className="mt-4 flex items-center justify-center gap-1 text-slate-400 text-xs">
                <Icon name="lock" className="text-base" />
                <span>Pembayaran Aman & Terpercaya</span>
            </div>
        </footer>
    )
}

export default CartFooter
