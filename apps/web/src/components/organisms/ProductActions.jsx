import { Icon, Button, QuantityInput } from '../atoms'

/**
 * ProductActions - Quantity selector, stock display, add to cart, chat WhatsApp
 */
function ProductActions({
    stock = 0,
    quantity = 1,
    onQuantityChange,
    onAddToCart,
    onChatWhatsApp
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
                    Tambah Keranjang
                </button>
                <button
                    onClick={onChatWhatsApp}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-transparent px-8 py-3.5 text-base font-bold text-primary hover:bg-primary/5 transition-colors"
                >
                    <Icon name="chat" size={20} />
                    Chat WhatsApp
                </button>
            </div>

            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                Respon cepat dalam jam kerja (09:00 - 17:00)
            </p>
        </>
    )
}

export default ProductActions
