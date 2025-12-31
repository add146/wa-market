import { Link } from 'react-router-dom'
import { Icon } from '../atoms'
import { useCart } from '../../context'

/**
 * CartDropdown - Mini cart dropdown on hover
 */
function CartDropdown() {
    const { items, itemCount, subtotal, removeItem } = useCart()

    if (itemCount === 0) {
        return (
            <div className="p-6 text-center">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-gray-500 dark:text-gray-400">Keranjang kosong</p>
                <Link
                    to="/"
                    className="mt-3 inline-block text-primary hover:underline text-sm font-medium"
                >
                    Mulai Belanja
                </Link>
            </div>
        )
    }

    return (
        <div className="w-80">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">
                    Keranjang ({itemCount})
                </h3>
            </div>

            {/* Items List */}
            <div className="max-h-64 overflow-y-auto">
                {items.slice(0, 5).map(item => (
                    <div key={item.id} className="flex gap-3 p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {/* Image */}
                        <div
                            className="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url('${item.image}')` }}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                            </p>
                            {item.variantInfo && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.variantInfo}
                                </p>
                            )}
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-sm font-bold text-primary">
                                    Rp {item.price.toLocaleString('id-ID')}
                                </span>
                                <span className="text-xs text-gray-500">
                                    x{item.quantity}
                                </span>
                            </div>
                        </div>

                        {/* Remove Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                removeItem(item.id)
                            }}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Icon name="close" size={16} />
                        </button>
                    </div>
                ))}

                {items.length > 5 && (
                    <p className="text-center text-xs text-gray-500 py-2">
                        +{items.length - 5} item lainnya
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                </div>

                <div className="flex gap-2">
                    <Link
                        to="/cart"
                        className="flex-1 py-2 px-3 text-center text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                    >
                        Lihat Keranjang
                    </Link>
                    <Link
                        to="/checkout"
                        className="flex-1 py-2 px-3 text-center text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Checkout
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default CartDropdown
