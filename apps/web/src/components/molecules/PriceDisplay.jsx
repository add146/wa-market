/**
 * PriceDisplay - Original price, discounted price, and discount badge
 */
function PriceDisplay({ originalPrice, discountedPrice, discountPercent }) {
    const formatPrice = (price) => {
        if (!price || price === 0) return 'Gratis'
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price)
    }

    return (
        <div className="mb-8">
            {originalPrice && discountPercent > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-through">
                    {formatPrice(originalPrice)}
                </p>
            )}
            <div className="flex items-baseline gap-3 flex-wrap">
                <p className="text-3xl font-extrabold text-primary">
                    {formatPrice(discountedPrice)}
                </p>
                {discountPercent > 0 && (
                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Hemat {discountPercent}%
                    </span>
                )}
            </div>
        </div>
    )
}

export default PriceDisplay
