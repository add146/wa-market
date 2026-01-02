import { Icon, CartQuantityStepper } from '../atoms'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'

// Get full image URL (handle local uploads)
const getImageUrl = (image) => {
    if (!image) return '/placeholder-product.png'
    if (image.startsWith('/uploads')) return `${API_BASE}${image}`
    if (image.startsWith('http')) return image
    return image
}

/**
 * CartItemCard - Kartu item keranjang
 * Menampilkan gambar produk, info, harga, tombol hapus, dan stepper quantity
 */
function CartItemCard({
    item,
    onQuantityChange,
    onRemove
}) {
    const { id, name, variant, price, originalPrice, image, quantity } = item

    const formatPrice = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value).replace('IDR', 'Rp')
    }

    return (
        <div className="group flex gap-4 bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 relative hover:border-primary/30 transition-all duration-200">
            {/* Image */}
            <div className="shrink-0">
                <div
                    className="bg-center bg-no-repeat bg-cover rounded-lg size-[88px] border border-gray-100 dark:border-white/5 shadow-inner bg-gray-100 dark:bg-gray-700"
                    style={{ backgroundImage: `url("${getImageUrl(image)}")` }}
                    role="img"
                    aria-label={name}
                />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="text-text-main-light dark:text-white text-base font-bold leading-tight truncate pr-6">
                            {name}
                        </h3>
                        {/* Trash Icon Absolute Top Right */}
                        <button
                            onClick={() => onRemove(id)}
                            aria-label="Hapus item"
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                            <Icon name="delete" className="text-[20px]" />
                        </button>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                        Variant: {variant || '-'}
                    </p>
                </div>
                <div className="flex items-end justify-between mt-3">
                    <div className="flex flex-col">
                        {originalPrice && originalPrice > price && (
                            <p className="text-xs line-through text-slate-400">
                                {formatPrice(originalPrice)}
                            </p>
                        )}
                        <p className="text-primary text-base font-bold">
                            {formatPrice(price)}
                        </p>
                    </div>
                    {/* Stepper */}
                    <CartQuantityStepper
                        value={quantity}
                        onChange={(newQty) => onQuantityChange(id, newQty)}
                        min={1}
                        max={99}
                    />
                </div>
            </div>
        </div>
    )
}

export default CartItemCard
