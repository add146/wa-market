/**
 * ProductPrice - Price with optional discount display
 */
function ProductPrice({ price, originalPrice, currency = 'Rp' }) {
    const formatPrice = (amount) => {
        return `${currency} ${amount.toLocaleString('id-ID')}`
    }

    const hasDiscount = originalPrice && originalPrice > price

    return (
        <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-primary">
                {formatPrice(price)}
            </span>
            {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                    {formatPrice(originalPrice)}
                </span>
            )}
        </div>
    )
}

export default ProductPrice
