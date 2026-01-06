import { Link, useNavigate } from 'react-router-dom'
import { Icon, Button } from '../components/atoms'
import { useCart } from '../context'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

/**
 * CartPage - Halaman keranjang belanja (Full Page)
 */
function CartPage() {
    const navigate = useNavigate()
    const { items, itemCount, subtotal, totalDiscount, updateQuantity, removeItem, clearCart } = useCart()

    const handleCheckout = () => {
        navigate('/checkout')
    }

    // Format currency
    const formatPrice = (price) => `Rp ${price.toLocaleString('id-ID')}`

    // Get full image URL (handle local uploads)
    const getImageUrl = (image) => {
        if (!image) return '/placeholder-product.png'
        if (image.startsWith('/uploads')) return `${API_BASE}${image}`
        if (image.startsWith('http')) return image
        return image
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-color dark:border-surface-dark px-4 sm:px-8 lg:px-40 py-4">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="group flex items-center gap-2 text-text-main-light dark:text-white hover:text-primary transition-colors"
                        >
                            <Icon name="arrow_back" size={24} />
                            <span className="text-sm font-bold tracking-wide">BERANDA</span>
                        </Link>
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight text-text-main-light dark:text-white uppercase">
                        Keranjang ({itemCount})
                    </h1>
                    <div className="w-20" />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {items.length === 0 ? (
                    /* Empty Cart */
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🛒</div>
                        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Keranjang Kosong
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Belum ada produk di keranjang Anda
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            <Icon name="shopping_bag" size={20} />
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Cart Items */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark overflow-hidden">
                            {items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`flex gap-4 p-4 ${index > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}
                                >
                                    {/* Image */}
                                    <Link to={`/product/${item.productId}`} className="flex-shrink-0">
                                        <div
                                            className="w-24 h-24 rounded-xl bg-cover bg-center bg-gray-100 dark:bg-gray-700"
                                            style={{ backgroundImage: `url('${getImageUrl(item.image)}')` }}
                                        />
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={`/product/${item.productId}`}
                                            className="font-semibold text-gray-900 dark:text-white hover:text-primary line-clamp-2"
                                        >
                                            {item.name}
                                        </Link>
                                        {item.variantInfo && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {item.variantInfo}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-lg font-bold text-primary">
                                                {formatPrice(item.price)}
                                            </span>
                                            {item.originalPrice && item.originalPrice > item.price && (
                                                <span className="text-sm text-gray-400 line-through">
                                                    {formatPrice(item.originalPrice)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    <Icon name="remove" size={18} />
                                                </button>
                                                <span className="w-8 text-center font-bold text-gray-900 dark:text-white">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    <Icon name="add" size={18} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Icon name="delete" size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Clear Cart Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={clearCart}
                                className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                            >
                                <Icon name="delete_sweep" size={18} />
                                Kosongkan Keranjang
                            </button>
                        </div>

                        {/* Summary */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Ringkasan Belanja
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Total Harga ({itemCount} item)
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatPrice(subtotal)}
                                    </span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Diskon Produk</span>
                                        <span>-{formatPrice(totalDiscount)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-4" />

                            <div className="flex justify-between items-end mb-6">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                <span className="text-2xl font-extrabold text-primary">
                                    {formatPrice(subtotal)}
                                </span>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleCheckout}
                                className="w-full py-4 text-lg font-bold rounded-xl"
                            >
                                <Icon name="shopping_cart_checkout" size={24} />
                                Lanjut ke Checkout
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default CartPage


