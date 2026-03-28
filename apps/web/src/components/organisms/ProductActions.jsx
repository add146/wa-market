import { Icon, Button, QuantityInput } from '../atoms'

/**
 * ProductActions - Quantity selector, stock display, add to cart, chat WhatsApp
 */
function ProductActions({
    stock = 0,
    quantity = 1,
    onQuantityChange,
    onAddToCart,
    onChatWhatsApp,
    isWishlisted = false,
    onWishlistToggle
}) {
    return (
        <>
            {/* Quantity & Stock */}
            <div className="mt-8 flex items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Jumlah</span>
                    <QuantityInput
                        value={quantity}
                        onChange={onQuantityChange}
                        min={1}
                        max={stock}
                    />
                </div>
                <div className="mb-2">
                    <span className="text-sm font-medium text-primary">{stock} tersedia</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                    onClick={onAddToCart}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                    <Icon name="shopping_cart" size={20} />
                    Tambah
                </button>
                <button
                    onClick={onWishlistToggle}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3.5 text-base font-bold transition-all sm:flex-none ${
                        isWishlisted 
                            ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-500/10' 
                            : 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-500 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-900/50'
                    }`}
                >
                    <Icon name={isWishlisted ? "favorite" : "favorite_border"} size={20} />
                </button>
                <button
                    onClick={onChatWhatsApp}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-transparent px-6 py-3.5 text-base font-bold text-primary hover:bg-primary/5 transition-colors"
                >
                    <Icon name="chat" size={20} />
                    Chat
                </button>
            </div>

            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                Respon cepat dalam jam kerja (09:00 - 17:00)
            </p>
        </>
    )
}

export default ProductActions
