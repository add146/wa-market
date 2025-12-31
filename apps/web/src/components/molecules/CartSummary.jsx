/**
 * CartSummary - Summary harga di footer keranjang
 * Menampilkan total harga, diskon, dan subtotal
 */
function CartSummary({ totalItems, totalPrice, discount, subtotal }) {
    const formatPrice = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value).replace('IDR', 'Rp')
    }

    return (
        <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
                <p className="text-slate-500 dark:text-slate-400">
                    Total Harga ({totalItems} Barang)
                </p>
                <p className="text-text-main-light dark:text-white font-medium">
                    {formatPrice(totalPrice)}
                </p>
            </div>
            {discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                    <p className="text-slate-500 dark:text-slate-400">Diskon Total</p>
                    <p className="text-accent font-medium">- {formatPrice(discount)}</p>
                </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
                <p className="text-text-main-light dark:text-white text-base font-bold">Subtotal</p>
                <p className="text-primary text-xl font-bold">{formatPrice(subtotal)}</p>
            </div>
        </div>
    )
}

export default CartSummary
