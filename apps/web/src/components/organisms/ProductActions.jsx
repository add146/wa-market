import { Icon, Button, QuantityInput } from '../atoms'
import { useNavigate } from 'react-router-dom'

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
    onWishlistToggle,
    onShare,
    product = {},
    hasDigitalAccess = false,
    isCheckingAccess = false
}) {
    const navigate = useNavigate()

    const isDigital = product.productType === 'digital'
    return (
        <>
            {/* Quantity & Stock (Hide for digital/purchased products) */}
            {!hasDigitalAccess && !isDigital && (
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
            )}

            {hasDigitalAccess && (
                <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-900/20 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-800/50 dark:text-emerald-400">
                            <Icon name="check_circle" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Anda sudah memiliki produk ini</h4>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">Silakan akses langsung melalui tombol di bawah.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {isCheckingAccess ? (
                    <button disabled className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-200 px-8 py-3.5 text-base font-bold text-slate-500">
                        Memeriksa Akses...
                    </button>
                ) : hasDigitalAccess ? (
                    product.digitalType === 'ebook' ? (
                        <button
                            onClick={() => navigate(`/member/ebooks/${product.id}`)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                        >
                            <Icon name="menu_book" size={20} />
                            Buka E-book
                        </button>
                    ) : product.digitalType === 'course' ? (
                        <button
                            onClick={() => navigate(`/member/classes/${product.id}`)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                        >
                            <Icon name="play_circle" size={20} />
                            Mulai Belajar
                        </button>
                    ) : (
                        <button
                            disabled
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-8 py-3.5 text-base font-bold text-emerald-600 border border-emerald-200"
                        >
                            <Icon name="info" size={20} />
                            Cek WhatsApp / Email
                        </button>
                    )
                ) : (
                    <button
                        onClick={onAddToCart}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/20"
                    >
                        <Icon name="shopping_cart" size={20} />
                        Beli Sekarang
                    </button>
                )}
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={onWishlistToggle}
                        title="Simpan ke Wishlist"
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 transition-all ${
                            isWishlisted 
                                ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-500/10' 
                                : 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-500 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-900/50'
                        }`}
                    >
                        <Icon name={isWishlisted ? "favorite" : "favorite_border"} size={20} />
                    </button>
                    <button
                        onClick={onShare}
                        title="Bagikan Produk"
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-slate-600 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-900/50 transition-all font-bold"
                    >
                        <Icon name="share" size={20} />
                    </button>
                </div>
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
