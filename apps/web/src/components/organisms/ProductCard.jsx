import { Link } from 'react-router-dom'
import { Icon, Badge } from '../atoms'
import { ProductPrice } from '../molecules'
import { useCart } from '../../context'
import { useSetting } from '../../hooks/useSettings'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

/**
 * ProductCard - Individual product card
 */
function ProductCard({ product }) {
    const { addToCart } = useCart()
    const { data: whatsappKasir } = useSetting('whatsapp_kasir')

    const {
        id,
        name,
        category,
        price,
        originalPrice,
        image,
        imageAlt,
    } = product

    // Calculate discount percentage from originalPrice and price
    const discountPercent = originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : null

    // Get full image URL (handle local uploads)
    const getImageUrl = () => {
        if (image?.startsWith('/uploads')) {
            return `${API_BASE}${image}`
        }
        return image || ''
    }

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(product, 1)
    }

    const handleBuyClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        // Add to cart and go to checkout
        addToCart(product, 1)
        window.location.href = '/checkout'
    }

    return (
        <Link
            to={`/product/${id}`}
            className="group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-card-dark shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border border-transparent dark:border-[#2a4a3e]"
        >
            {/* Product Image */}
            <div className="relative aspect-[4/4] w-full overflow-hidden bg-gray-100">
                <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${getImageUrl()}')` }}
                    role="img"
                    aria-label={imageAlt || name}
                />

                {discountPercent && (
                    <Badge
                        variant="discount"
                        className="absolute right-2 top-2"
                    >
                        -{discountPercent}%
                    </Badge>
                )}
            </div>

            {/* Product Info */}
            <div className="flex flex-1 flex-col p-3">
                <div className="mb-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                    {category}
                </div>
                <h4 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-text-main-light dark:text-white group-hover:text-primary">
                    {name}
                </h4>

                <div className="mt-auto flex flex-col gap-3">
                    <ProductPrice price={price} originalPrice={originalPrice} />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddToCart}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                            title="Tambah ke keranjang"
                        >
                            <Icon name="shopping_cart" size={20} />
                        </button>
                        <button
                            onClick={handleBuyClick}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                        >
                            <Icon name="chat" size={18} />
                            Beli
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default ProductCard


